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
import { takeAiRequest } from '@/lib/ai-rate-limit';
import { readDocsPage, searchDocs } from '@/lib/docs-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
    url: z.string().max(500).regex(/^\/docs(?:\/|$)/),
  }),
  execute: async ({ url }) => {
    const page = await readDocsPage(url);
    return page ?? { error: 'The documentation page was not found.' };
  },
});

const systemPrompt = `You are the Axiom documentation assistant.

Answer questions using only information retrieved from the Axiom documentation tools. For any factual question about Axiom, first call search_docs. Use read_docs_page when search excerpts are insufficient. You may reformulate and search more than once.

Give direct, concise, technically accurate answers. Preserve exact field names, APL syntax, API paths, and commands. Cite supporting documentation as Markdown links using only URLs returned by the tools. Never invent a URL, product behavior, limit, or configuration value. If the documentation does not support an answer, say that clearly and suggest relevant search terms or support.

Do not request, repeat, or infer API tokens, credentials, request bodies, response bodies, or other secrets. Do not use general web knowledge to fill documentation gaps.`;

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  );
}

function clientId(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (forwarded || request.headers.get('x-real-ip') || 'local').slice(0, 128);
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

  const rateLimit = takeAiRequest(clientId(request));
  if (!rateLimit.allowed) {
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
    stopWhen: stepCountIs(6),
    prepareStep: ({ stepNumber }) => stepNumber >= 3 ? {
      toolChoice: 'none',
      instructions: `${systemPrompt}${currentPage}\n\nYou have enough retrieved context. Answer the user now without calling another tool.`,
    } : {},
    temperature: 0.2,
    maxOutputTokens: 1_200,
    timeout: 25_000,
  });

  return createUIMessageStreamResponse({
    headers: { 'Cache-Control': 'no-store' },
    stream: toUIMessageStream({
      stream: result.stream,
      tools: { search_docs: searchDocsTool, read_docs_page: readDocsPageTool },
      sendReasoning: false,
      onError: () => 'The documentation assistant could not complete this answer.',
    }),
  });
}
