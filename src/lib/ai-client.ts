/**
 * DeepSeek AI 客户端 — OpenAI 兼容 API
 * 用于 AI 对话、投资委员会、Deep Research 等 SSE 流式调用
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || "";
const DEEPSEEK_BASE_URL = process.env.AI_API_BASE || "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = process.env.AI_MODEL || "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

/**
 * 流式调用 DeepSeek Chat API (SSE)
 */
export async function streamChat(
  messages: ChatMessage[],
  options: StreamOptions = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 4096, onToken, onComplete, onError } = options;

  if (!DEEPSEEK_API_KEY) {
    const err = new Error("AI_API_KEY 未配置");
    onError?.(err);
    throw err;
  }

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = new Error(`DeepSeek API error: ${res.status} ${await res.text()}`);
    onError?.(err);
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const err = new Error("No response body");
    onError?.(err);
    throw err;
  }

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data: "));

    for (const line of lines) {
      const data = line.replace("data: ", "").trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content ?? "";
        if (content) {
          fullText += content;
          onToken?.(content);
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  onComplete?.(fullText);
  return fullText;
}

/**
 * 生成 SSE 事件流的 ReadableStream
 * 用于 Next.js Route Handler 返回
 */
export function createSSEStream(
  generator: (send: (event: string, data: any) => void) => Promise<void>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data, null, 0)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        await generator(send);
        send("done", {});
      } catch (err: any) {
        send("error", { message: err.message || "未知错误" });
      } finally {
        controller.close();
      }
    },
  });
}

export { DEEPSEEK_MODEL };
