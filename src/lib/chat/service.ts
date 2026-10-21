import { CHAT_SYSTEM_PROMPT } from "./systemPrompt";
import { createGroqClient, type GroqChatClient } from "./client";
import { isChatConfigured } from "./config";
import { chatErrorResponse, mapProviderError } from "./errors";
import {
  cannedUnverifiedAnswer,
  formatRecordsForPrompt,
  retrieveChatContext,
  type RetrieveDeps,
} from "./retrieve";
import { validateChatRequest } from "./validation";
import type { ChatRequestBody, ChatResponseBody } from "./types";

export type ChatServiceDeps = {
  client?: GroqChatClient | null;
  retrieve?: typeof retrieveChatContext;
  retrieveDeps?: RetrieveDeps;
  configured?: boolean;
};

const USER_PROMPT = `Answer the user's question using only the retrieved Politeia records when the question is about current political facts. If the records are missing or incomplete, say so. Do not invent sources.`;

export async function answerChat(
  rawBody: unknown,
  deps: ChatServiceDeps = {}
): Promise<{ status: number; body: ChatResponseBody }> {
  const parsed = validateChatRequest(rawBody);
  if (!parsed.value) {
    return {
      status: 400,
      body: chatErrorResponse("invalid", parsed.error || "Invalid request."),
    };
  }

  const configured = deps.configured ?? isChatConfigured();
  if (!configured) {
    return {
      status: 503,
      body: chatErrorResponse(
        "unconfigured",
        "The research assistant is not configured on this deployment."
      ),
    };
  }

  const request = parsed.value;
  return generateChatAnswer(request, deps);
}

export async function generateChatAnswer(
  request: ChatRequestBody,
  deps: ChatServiceDeps = {}
): Promise<{ status: number; body: ChatResponseBody }> {
  const retrieve = deps.retrieve || retrieveChatContext;
  const bundle = await retrieve(
    request.message,
    { bioguideId: request.bioguideId, state: request.state },
    deps.retrieveDeps
  );

  if (bundle.intent.injection) {
    return {
      status: 200,
      body: {
        answer: cannedUnverifiedAnswer(bundle),
        sources: bundle.sources.length ? bundle.sources : undefined,
        unverified: true,
      },
    };
  }

  if (bundle.retrievalStatus === "query_error") {
    console.error(
      "[chat] retrieval query_error",
      bundle.queryError || "query failed"
    );
    return {
      status: 503,
      body: chatErrorResponse(
        "retrieval",
        cannedUnverifiedAnswer(bundle),
        true
      ),
    };
  }

  const skipModel =
    bundle.intent.requiresRecords &&
    bundle.retrievalStatus !== "ok" &&
    bundle.coverage === "none" &&
    !bundle.intent.general;

  if (skipModel) {
    console.info("[chat] skip_model", {
      retrievalStatus: bundle.retrievalStatus,
      coverage: bundle.coverage,
      trades: bundle.intent.trades,
      tradeCount: bundle.trades.length,
    });
    return {
      status: 200,
      body: {
        answer: cannedUnverifiedAnswer(bundle),
        sources: bundle.sources.length ? bundle.sources : undefined,
        unverified: true,
      },
    };
  }

  const client = deps.client === undefined ? createGroqClient() : deps.client;
  if (!client) {
    return {
      status: 503,
      body: chatErrorResponse(
        "unconfigured",
        "The research assistant is not configured on this deployment."
      ),
    };
  }

  const records = formatRecordsForPrompt(bundle);
  const history = (request.history || []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  try {
    const answer = await client.complete({
      system: CHAT_SYSTEM_PROMPT,
      messages: [
        ...history,
        {
          role: "user",
          content: `${USER_PROMPT}\n\nUser question:\n${request.message}\n\n${records}`,
        },
      ],
    });
    return {
      status: 200,
      body: {
        answer,
        sources: bundle.sources.length ? bundle.sources : undefined,
        unverified: bundle.coverage !== "records",
      },
    };
  } catch (err) {
    const mapped = mapProviderError(err);
    if (
      typeof err === "object" &&
      err &&
      "message" in err &&
      String((err as { message?: string }).message) === "empty_completion"
    ) {
      return {
        status: 502,
        body: chatErrorResponse(
          "unavailable",
          "The research assistant returned an empty response. Please try again.",
          true
        ),
      };
    }
    return { status: mapped.error === "rate_limited" || mapped.error === "quota" ? 429 : 502, body: mapped };
  }
}
