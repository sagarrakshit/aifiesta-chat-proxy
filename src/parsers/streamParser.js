function parseJsonLine(value) {
  const cleaned = value.replace(/-E$/, "").trim();
  if (!cleaned || cleaned === "[DONE]") return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function normalizeEvents(rawText) {
  const normalized = String(rawText || "").replace(/\r/g, "");
  const lines = normalized.split("\n");
  const events = [];
  let pendingEventName = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      pendingEventName = "";
      continue;
    }

    if (line.startsWith("event:")) {
      pendingEventName = line.slice(6).trim();
      continue;
    }

    let parsed = null;
    if (line.startsWith("data:")) {
      parsed = parseJsonLine(line.slice(5));
    } else if (line.startsWith("{")) {
      parsed = parseJsonLine(line);
    }

    if (!parsed) continue;

    if (parsed.event && parsed.payload !== undefined) {
      events.push(parsed);
      continue;
    }

    if (pendingEventName) {
      events.push({ event: pendingEventName, payload: parsed });
      continue;
    }

    events.push({ event: "unknown", payload: parsed });
  }

  return events;
}

function extractText(value, depth = 0) {
  if (value == null || depth > 6) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractText(item, depth + 1)).join("");
  }
  if (typeof value !== "object") return "";

  const keys = [
    "text",
    "content",
    "delta",
    "value",
    "message",
    "data",
    "parts",
    "part",
  ];

  for (const key of keys) {
    if (!(key in value)) continue;
    const extracted = extractText(value[key], depth + 1);
    if (extracted) return extracted;
  }

  return "";
}

function appendWithDedup(current, fragment) {
  if (!fragment) return current;
  if (!current) return fragment;
  if (fragment === current) return current;
  if (current.includes(fragment)) return current;
  if (fragment.includes(current)) return fragment;
  if (fragment.startsWith(current)) return fragment;
  if (current.endsWith(fragment)) return current;

  const maxOverlap = Math.min(current.length, fragment.length);
  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    if (current.endsWith(fragment.slice(0, overlap))) {
      return current + fragment.slice(overlap);
    }
  }

  return current + fragment;
}

function extractChatId(payload) {
  if (!payload || typeof payload !== "object") return "";

  if (typeof payload.chatId === "string" && payload.chatId.trim()) {
    return payload.chatId.trim();
  }

  if (
    payload.chat &&
    typeof payload.chat === "object" &&
    typeof payload.chat.id === "string" &&
    payload.chat.id.trim()
  ) {
    return payload.chat.id.trim();
  }

  if (
    payload.message &&
    typeof payload.message === "object" &&
    typeof payload.message.chatId === "string" &&
    payload.message.chatId.trim()
  ) {
    return payload.message.chatId.trim();
  }

  return "";
}

export function parseStreamingResult(rawText) {
  console.log("Parsing streaming response...");

  const events = normalizeEvents(rawText);
  const messages = new Map();
  const messageOrder = [];
  let fallbackText = "";
  let chatId = "";

  for (const event of events) {
    const eventName = event.event || "unknown";
    const payload = event.payload;
    const payloadKeys =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? Object.keys(payload)
        : [];

    console.log(
      `Event: ${eventName} | Keys: ${payloadKeys.length ? payloadKeys.join(",") : "n/a"}`,
    );

    if (!chatId) {
      chatId = extractChatId(payload);
    }

    if (eventName === "chat:error") {
      console.error("Chat error:", payload);
      continue;
    }

    if (
      eventName === "chat:stream" ||
      eventName === "chat:delta" ||
      eventName === "chat:content" ||
      eventName === "chat:message"
    ) {
      const messageId =
        (payload && payload.messageId) || (payload && payload.id) || "default";

      if (!messages.has(messageId)) {
        messages.set(messageId, "");
        messageOrder.push(messageId);
      }

      const fragment =
        extractText(payload && payload.content) ||
        extractText(payload && payload.delta) ||
        extractText(payload && payload.message) ||
        extractText(payload && payload.data) ||
        extractText(payload);

      if (fragment) {
        const current = messages.get(messageId) || "";
        messages.set(messageId, appendWithDedup(current, fragment));
        fallbackText = appendWithDedup(fallbackText, fragment);
      }

      continue;
    }

    if (eventName === "chat:done") {
      continue;
    }

    if (
      eventName === "chat:finish" ||
      eventName === "chat:complete" ||
      eventName === "chat:end"
    ) {
      console.log("Chat completed");
    }
  }

  const finalContent = messageOrder
    .map((messageId) => messages.get(messageId) || "")
    .join("")
    .trim();
  const output = finalContent || fallbackText.trim();

  console.log(`Final extracted content length: ${output.length}`);
  if (output) {
    console.log(`Content preview: ${output.substring(0, 100)}...`);
  } else {
    console.log("No content could be extracted from stream events");
  }

  if (chatId) {
    console.log(`Extracted chatId: ${chatId}`);
  }

  return {
    content: output,
    chatId,
  };
}

export function parseStreamingResponse(rawText) {
  return parseStreamingResult(rawText).content;
}
