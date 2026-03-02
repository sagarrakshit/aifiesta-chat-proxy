export function extractUserMessage(messages) {
  if (!Array.isArray(messages)) return "Hello";
  const userMessage = messages.find((msg) => msg.role === "user");
  return userMessage?.content?.trim() || "Hello";
}

