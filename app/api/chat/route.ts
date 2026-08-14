import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
  type ModelMessage,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { normalizeDocsUrl } from '@/lib/docs-paths';
import { readDocsPage, searchDocs } from '@/lib/docs-search';
import { limitRequest } from '@/lib/request-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'z-ai/glm-5.2';
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_HISTORY_CHARS = 24_000;

const requestSchema = z.object({
  messages: z.unknown(),
  currentPath: z.string().max(320).regex(/^\/docs(?:\/|$)/).optional(),
});

const searchDocsTool = tool({
  description: 'Search Axiom documentation. Use this before answering product, API, APL, configuration, or troubleshooting questions.',
  inputSchema: z.object({
    query: z.string().min(2).max(240),
    limit: z.number().int().min(1).max(12).default(8),
  }),
  execute: ({ query, limit }) => searchDocs(query, limit),
});

const readDocsPageTool = tool({
  description: 'Read the processed Markdown for an Axiom documentation page returned by search_docs.',
  inputSchema: z.object({
    url: z.string().max(500),
  }),
  execute: async ({ url }) => {
    const path = normalizeDocsUrl(url);
    if (!path) return { error: `“${url}” is not an Axiom documentation path. Use a /docs URL returned by search_docs.` };
    const page = await readDocsPage(path);
    return page ?? { error: `The documentation page ${path} was not found. Try search_docs for a valid URL.` };
  },
});

const systemPrompt = `You are the Axiom documentation assistant.

Answer questions using only information retrieved from the Axiom documentation tools. For any factual question about Axiom, first call search_docs. Use read_docs_page when search excerpts are insufficient. You may reformulate and search more than once.

Give direct, concise, technically accurate answers. Preserve exact field names, APL syntax, API paths, and commands. Cite supporting documentation as Markdown links using only URLs returned by the tools. Never invent a URL, product behavior, limit, or configuration value. If the documentation does not support an answer, say that clearly and suggest relevant search terms or support.

Do not request, repeat, or infer API tokens, credentials, request bodies, response bodies, or other secrets. Do not use general web knowledge to fill documentation gaps.

Only ever invoke a tool through the tool-calling interface. Never write tool calls, tool names, or tags such as <tool_call> into your reply. When tools are unavailable to you, answer from what you have already retrieved.`;

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  );
}

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return jsonError('The documentation assistant is not configured.', 503);
  }

  const rateLimit = await limitRequest('chat', request);
  if (!rateLimit.allowed) {
    if (rateLimit.unavailable) {
      return jsonError('The documentation assistant is temporarily unavailable.', 503);
    }
    return jsonError('Too many assistant requests. Try again shortly.', 429, {
      'Retry-After': String(rateLimit.retryAfterSeconds),
    });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError('The request body could not be read.', 400);
  }
  if (rawBody.length > MAX_REQUEST_BYTES) return jsonError('The assistant request is too large.', 413);

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return jsonError('The request body must be valid JSON.', 400);
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return jsonError('The assistant request is invalid.', 400);

  const validated = await safeValidateUIMessages<UIMessage>({ messages: parsed.data.messages });
  if (!validated.success) return jsonError('The assistant messages are invalid.', 400);

  const recentMessages = validated.data
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-MAX_MESSAGES)
    .map((message) => ({ role: message.role, content: messageText(message) }))
    .filter((message) => message.content.length > 0);

  const latest = recentMessages.at(-1);
  if (!latest || latest.role !== 'user') return jsonError('A user question is required.', 400);
  if (recentMessages.some((message) => message.content.length > MAX_MESSAGE_CHARS)) {
    return jsonError('An assistant message is too long.', 413);
  }
  if (recentMessages.reduce((total, message) => total + message.content.length, 0) > MAX_HISTORY_CHARS) {
    return jsonError('The assistant conversation is too long. Start a new conversation.', 413);
  }

  const currentPage = parsed.data.currentPath
    ? `\nThe user is currently viewing ${parsed.data.currentPath}. Treat this only as navigation context and still search before answering.`
    : '';
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    compatibility: 'strict',
    appName: 'Axiom Docs',
    appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://axiom.co/docs',
  });

  const result = streamText({
    model: openrouter.chat(MODEL),
    system: `${systemPrompt}${currentPage}`,
    messages: recentMessages as ModelMessage[],
    tools: {
      search_docs: searchDocsTool,
      read_docs_page: readDocsPageTool,
    },
    toolChoice: 'auto',
    // Measured against z-ai/glm-5.2 on the query "explain me logging and setup
    // guide", 3-4 runs per configuration:
    //   toolChoice 'none' from step 3  -> 3/3 emitted tool calls as prose, no answer
    //   tools kept, 6-step cap         -> 2/3 spent every step retrieving, no answer
    //   tools kept, 8-step cap + nudge -> 4/4 complete answers
    // Withdrawing the tools is what triggers the prose tool calls, so the budget
    // is bounded by stopWhen and the model is nudged to conclude instead.
    stopWhen: stepCountIs(8),
    prepareStep: ({ stepNumber }) => stepNumber >= 3 ? {
      instructions: `${systemPrompt}${currentPage}\n\nYou have already retrieved substantial documentation. Write the final answer now from the excerpts you have. Only call another tool if a specific fact is still genuinely missing.`,
    } : {},
    temperature: 0.2,
    maxOutputTokens: 1_200,
    // Retrieval-heavy answers measured at 28-33s end to end; the previous 25s
    // cut them off mid-sentence. Must stay under maxDuration.
    timeout: 50_000,
  });

  return createUIMessageStreamResponse({
    headers: { 'Cache-Control': 'no-store' },
    stream: toUIMessageStream({
      stream: result.stream,
      tools: { search_docs: searchDocsTool, read_docs_page: readDocsPageTool },
      sendReasoning: false,
      onError: (error) => {
        // Without this the real cause never reaches the server console and the
        // client only ever sees the generic string below.
        console.error('[docs-assistant] stream error', error);
        // Running out of time mid-answer is by far the most common failure here
        // (multi-step tool use against the 25s budget), and it is recoverable by
        // asking something narrower — so say that rather than a flat failure.
        const name = error instanceof Error ? error.name : '';
        if (name === 'TimeoutError' || name === 'AbortError') {
          return 'The assistant ran out of time putting this answer together. Try a more specific question.';
        }
        return 'The documentation assistant could not complete this answer.';
      },
    }),
  });
}
