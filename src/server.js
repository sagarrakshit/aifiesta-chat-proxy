import { createApp } from "./app.js";
import { AIFIESTA_ENDPOINT, SERVER_PORT } from "./config.js";

export function startServer() {
  const app = createApp();
  app.listen(SERVER_PORT, () => {
    console.log("\nAI Fiesta Proxy Server Running");
    console.log(`Local: http://localhost:${SERVER_PORT}`);
    console.log(`Target: ${AIFIESTA_ENDPOINT}`);
    console.log("Available routes:");
    console.log("   POST /v1/chat/completions");
    console.log("   GET  /health");
    console.log("   GET  /debug");
  });

  return app;
}
