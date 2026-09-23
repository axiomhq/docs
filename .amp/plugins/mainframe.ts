import type { PluginAPI, StatusItem } from "@ampcode/plugin";

export const description =
  "Registers pull requests with Mainframe and requests or observes immutable Actions release candidates without approving publication.";

/**
 * In-orb half of Mainframe. The Worker at MAINFRAME_URL owns the state; this
 * plugin exposes PR controls and candidate request/status tools. Candidate status
 * remains visible after the coding session closes and never starts another turn.
 *
 * Copy this file to `.amp/plugins/mainframe.ts` in a product repository and
 * set MAINFRAME_URL and MAINFRAME_TOKEN as project environment/secret.
 *
 *   pr_register  -> stamps `Amp-Thread-ID:` on the PR body (GitHub is the
 *                   source of truth for PR -> thread) and tells Mainframe
 *   pr_pause     -> Mainframe holds GitHub events for this thread
 *   pr_resume    -> Mainframe replays what happened and resumes
 */

interface CandidateSnapshot {
  repository: string;
  request_id: string;
  source_sha: string;
  companion_sha: string;
  workflow_sha: string;
  state: string;
  conclusion?: string;
  certified?: boolean;
  artifact_available?: boolean;
  reusable?: boolean;
  run_id?: number;
  run_url?: string;
  error?: string;
  observation_error?: string;
}

const CANDIDATE_REPOS = ["axiomhq/splunk-app", "axiomhq/splunk-portal"];

const THREAD_MARKER = /Amp-Thread-ID:\s*(https:\/\/ampcode\.com\/threads\/)?(T-[0-9a-f-]+)/i;

interface Snapshot {
  message?: string;
  identifier: string;
  issueUrl: string;
  paused: boolean;
  prs: Record<string, string>;
  closed?: string;
}

export default function (amp: PluginAPI) {
  const base = process.env.MAINFRAME_URL;
  const token = process.env.MAINFRAME_TOKEN;
  if (!base || !token) {
    amp.logger.log("[mainframe] MAINFRAME_URL and MAINFRAME_TOKEN are not set; tools disabled");
    return;
  }

  const api = async (threadId: string, op: "register" | "watch" | "", body?: unknown): Promise<Snapshot | null> => {
    const res = await fetch(`${base}/threads/${threadId}/${op || "watch"}`, {
      method: body ? "POST" : "GET",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`mainframe ${res.status}: ${await res.text()}`);
    return (await res.json()) as Snapshot;
  };

  const candidateApi = async (path: string, body?: unknown) => {
    const res = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`mainframe ${res.status}: ${await res.text()}`);
    return (await res.json()) as { candidate?: CandidateSnapshot; candidates?: CandidateSnapshot[]; reused?: boolean };
  };

  let candidateChip: StatusItem | undefined;
  const renderCandidates = (candidates: CandidateSnapshot[]) => {
    const latest = candidates[0];
    if (!latest) {
      candidateChip?.update({ text: "" });
      return;
    }
    candidateChip ??= amp.experimental?.createStatusItem();
    candidateChip?.update({
      text: `Candidate: ${latest.state.replaceAll("_", " ")}${latest.conclusion ? ` (${latest.conclusion})` : ""}`,
      url: latest.run_url,
    });
  };

  let chip: StatusItem | undefined;
  const render = (s: Snapshot | null) => {
    if (!s) {
      chip?.update({ text: "" });
      return;
    }
    const prs = Object.keys(s.prs);
    const what = prs.length ? prs.join(", ") : s.identifier;
    const text = s.closed ? `Mainframe: done ${what}` : s.paused ? `Mainframe: paused ${what}` : `Mainframe: watching ${what}`;
    const url = prs.length ? s.prs[prs[0]] : s.issueUrl;
    chip ??= amp.experimental?.createStatusItem();
    chip?.update({ text, url });
  };
  const refresh = (threadId: string) => Promise.all([
    api(threadId, "").then(render),
    candidateApi(`/threads/${threadId}/candidates`).then((result) => renderCandidates(result.candidates ?? [])),
  ]).catch((e) => amp.logger.log(`[mainframe] ${e}`));

  amp.on("session.start", (e) => void refresh(e.thread.id));
  amp.on("agent.end", (e) => void refresh(e.thread.id));

  amp.registerTool({
    name: "pr_register",
    title: "Register pull request",
    description:
      "Record that this thread owns a pull request so GitHub events for it come back to this thread. Call it right after gh pr create.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "owner/name" },
        number: { type: "number", description: "pull request number" },
      },
      required: ["repo", "number"],
    },
    async execute(input, ctx) {
      const repo = String(input.repo);
      const number = Number(input.number);
      const marker = `Amp-Thread-ID: https://ampcode.com/threads/${ctx.thread.id}`;
      const view = await amp.$`gh pr view ${number} --repo ${repo} --json body,url --jq '[.body,.url]|@tsv'`;
      const [body = "", url = `https://github.com/${repo}/pull/${number}`] = view.stdout.trimEnd().split("\t");
      if (!THREAD_MARKER.test(body)) {
        await amp.$`gh pr edit ${number} --repo ${repo} --body ${body + "\n\n" + marker}`;
      }
      const s = await api(ctx.thread.id, "register", { repo, number, url });
      render(s);
      return s
        ? `Registered ${repo}#${number} -> ${ctx.thread.id}; Mainframe is watching it for ${s.identifier}.`
        : `Registered ${repo}#${number} -> ${ctx.thread.id} on GitHub. This thread is not managed by Mainframe, so events will not be relayed.`;
    },
  });

  for (const [name, paused, title, description] of [
    ["pr_pause", true, "Pause Mainframe", "Stop Mainframe relaying GitHub events for this thread's pull request. Use when the user says to stop watching, babysitting or monitoring the PR."],
    ["pr_resume", false, "Resume Mainframe", "Resume Mainframe relaying GitHub events for this thread's pull request; anything that happened while paused is summarised."],
  ] as const) {
    amp.registerTool({
      name,
      title,
      description,
      inputSchema: { type: "object", properties: {} },
      async execute(_input, ctx) {
        const s = await api(ctx.thread.id, "watch", { paused });
        render(s);
        return s?.message ?? "This thread is not managed by Mainframe.";
      },
    });
  }

  amp.registerTool({
    name: "candidate_request",
    title: "Request release candidate",
    description: "Find or request one immutable main-reachable Splunk Actions candidate, from either a managed Linear thread or a standalone product Orb. Standalone requests are not linked to Linear. Mainframe pins the companion and deduplicates requests; it never runs the matrix itself or approves/publishes. Requires human intent to select this release candidate, not merely a merged PR. Save request_id and use candidate_status with repo and request_id rather than requesting again to poll.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", enum: CANDIDATE_REPOS },
        source_sha: { type: "string", description: "Selected full lowercase 40-character commit SHA, reachable from main" },
        companion_sha: { type: "string", description: "Optional pinned companion SHA; omitted resolves companion main once" },
        version: { type: "string", description: "Optional App metadata version assertion or Portal annotated release tag version (v prefix accepted); omitted Portal versions use the source SHA" },
        request_id: { type: "string", description: "Optional prior request UUID, required when retrying an ambiguous request" },
      },
      required: ["repo", "source_sha"],
    },
    async execute(input, ctx) {
      const requestId = input.request_id ? String(input.request_id) : crypto.randomUUID();
      const repo = String(input.repo);
      const managed = await api(ctx.thread.id, "");
      const body = {
        request_id: requestId,
        source_sha: String(input.source_sha),
        ...(input.companion_sha ? { companion_sha: String(input.companion_sha) } : {}),
        ...(input.version ? { version: String(input.version) } : {}),
      };
      try {
        const path = managed ? `/threads/${ctx.thread.id}/candidates/${repo}` : `/candidates/${repo}`;
        const result = await candidateApi(path, body);
        if (result.candidate) renderCandidates([result.candidate]);
        return JSON.stringify({ ...result, linear: managed ? `Linked to ${managed.identifier}` : "not linked to Linear", notice: "Observe this request with candidate_status using repo and request_id; do not approve or publish. A failed/ambiguous request is not automatically dispatched again." });
      } catch (error) {
        throw new Error(`${String(error)}. Delivery may be ambiguous. Keep request_id ${requestId}; check candidate_status or retry only this SAME request_id and inputs.`);
      }
    },
  });

  amp.registerTool({
    name: "candidate_status",
    title: "Observe release candidate",
    description: "List this thread's durable candidate results, including after PR closure, or reconcile one request with GitHub Actions. Never approves publication or resumes a coding turn.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", enum: CANDIDATE_REPOS },
        request_id: { type: "string", description: "Candidate request UUID; provide repo with this value to refresh from GitHub" },
      },
    },
    async execute(input, ctx) {
      if (input.request_id && !input.repo) throw new Error("repo is required with request_id");
      const path = input.request_id
        ? `/candidates/${String(input.repo)}/${String(input.request_id)}`
        : `/threads/${ctx.thread.id}/candidates${input.repo ? `/${String(input.repo)}` : ""}`;
      const result = await candidateApi(path);
      renderCandidates(result.candidate ? [result.candidate] : result.candidates ?? []);
      return JSON.stringify(result);
    },
  });
}
