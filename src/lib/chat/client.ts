import OpenAI from "openai";
import {
  GROQ_BASE_URL,
  GROQ_CHAT_MODEL,
  GROQ_MAX_OUTPUT_TOKENS,
  GROQ_TEMPERATURE,
  GROQ_TIMEOUT_MS,
  getGroqApiKey,
} from "./config";

export type GroqChatClient = {
  complete: (input: {
    system: string;
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  }) => Promise<string>;
};

export function createGroqClient(): GroqChatClient | null {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;
  const openai = new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
    timeout: GROQ_TIMEOUT_MS,
    maxRetries: 0,
  });

  return {
    async complete({ system, messages }) {
      const payload = {
        model: GROQ_CHAT_MODEL,
        temperature: GROQ_TEMPERATURE,
        max_tokens: GROQ_MAX_OUTPUT_TOKENS,
        messages: [{ role: "system" as const, content: system }, ...messages],
      };
      try {
        const completion = await openai.chat.completions.create({
          ...payload,
          stream: false,
          // Keep reasoning cheap on the free-tier token budget.
          reasoning_effort: "low",
        } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
        return readContent(completion);
      } catch (err) {
        const status =
          typeof err === "object" && err && "status" in err
            ? Number((err as { status?: number }).status)
            : 0;
        if (status !== 400) throw err;
        const completion = await openai.chat.completions.create({
          ...payload,
          stream: false,
        });
        return readContent(completion);
      }
    },
  };
}

function readContent(completion: OpenAI.Chat.ChatCompletion): string {
  const message = completion.choices[0]?.message;
  const content = message?.content?.trim();
  if (content) return content;
  throw new Error("empty_completion");
}
