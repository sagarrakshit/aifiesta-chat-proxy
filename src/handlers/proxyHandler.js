import { AIFIESTA_ENDPOINT, httpsAgent } from "../config.js";
import { parseStreamingResult } from "../parsers/streamParser.js";
import {
  buildCompletionResponse,
  buildExtractionFallbackResponse,
} from "../responses/openai.js";
import { createHeaders } from "../utils/headers.js";
import { extractUserMessage } from "../utils/messages.js";

function normalizeChatId(value) {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed || "";
}

function normalizePrompt(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed || "";
}

function resolveIncomingChatId(req) {
  return (
    normalizeChatId(req.body?.chatId) ||
    normalizeChatId(req.body?.metadata?.chatId) ||
    normalizeChatId(req.query?.chatId) ||
    normalizeChatId(req.headers["x-chat-id"]) ||
    ""
  );
}

function buildAIFiestaPayload(userPrompt, chatId) {
  const payload = {
    models: [{ model: "claude", version: "claude-sonnet-4" }],
    assetIds: [],
    type: "text",
    prompt: userPrompt,
    tools: [],
  };

  if (chatId) {
    payload.chatId = chatId;
  }

  return payload;
}

function buildAIFiestaErrorResponse(status, message) {
  return {
    error: {
      type: "aifiesta_error",
      status,
      message,
    },
  };
}

export async function proxyToAIFiesta(req, res) {
  try {
    console.log("\n=== AI FIESTA PROXY REQUEST ===");
    console.log("Target:", AIFIESTA_ENDPOINT);

    const userPrompt =
      normalizePrompt(req.body?.prompt) || extractUserMessage(req.body?.messages);
    const incomingChatId = resolveIncomingChatId(req);

    console.log("User prompt:", userPrompt);
    if (incomingChatId) {
      console.log("Mode: continuation");
      console.log("Incoming chatId:", incomingChatId);
    } else {
      console.log("Mode: new chat");
    }

    const payload = buildAIFiestaPayload(userPrompt, incomingChatId);
    console.log("Sending request to AI Fiesta...");

    const response = await fetch(AIFIESTA_ENDPOINT, {
      method: "POST",
      headers: createHeaders(process.env.AIFIESTA_TOKEN),
      body: JSON.stringify(payload),
      agent: httpsAgent,
      timeout: 30000,
    });

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return res
        .status(response.status)
        .json(buildAIFiestaErrorResponse(response.status, errorText));
    }

    const streamText = await response.text();
    console.log("Raw response length:", streamText.length);
    console.log("First 200 chars:", streamText.substring(0, 200));

    const result = parseStreamingResult(streamText);
    const aiContent = result.content;
    const resolvedChatId = result.chatId || incomingChatId;

    if (resolvedChatId) {
      res.setHeader("x-chat-id", resolvedChatId);
      console.log("Resolved chatId:", resolvedChatId);
    }

    if (!aiContent) {
      console.log("No content extracted, returning fallback response");
      return res.json(
        buildExtractionFallbackResponse(streamText, resolvedChatId),
      );
    }

    console.log(
      "Successfully extracted content:",
      `${aiContent.substring(0, 100)}...`,
    );
    return res.json(buildCompletionResponse(aiContent, resolvedChatId));
  } catch (error) {
    console.error("Proxy error:", error.message);
    return res.status(500).json({
      error: error.message,
      code: error.code,
    });
  }
}
