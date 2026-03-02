const DEFAULT_MODEL = "claude-sonnet-4";

export function buildCompletionResponse(content, chatId = "") {
  const response = {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: DEFAULT_MODEL,
    usage: {
      prompt_tokens: 10,
      completion_tokens: 50,
      total_tokens: 60,
    },
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: "stop",
      },
    ],
  };

  if (chatId) {
    response.chatId = chatId;
  }

  return response;
}

export function buildExtractionFallbackResponse(streamText, chatId = "") {
  const response = {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: DEFAULT_MODEL,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content:
            "I received your message but could not extract the content properly. " +
            `Raw response preview: ${streamText.substring(0, 200)}...`,
        },
        finish_reason: "stop",
      },
    ],
  };

  if (chatId) {
    response.chatId = chatId;
  }

  return response;
}
