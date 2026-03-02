import { AIFIESTA_ENDPOINT } from "./config.js";
import { proxyToAIFiesta } from "./handlers/proxyHandler.js";

const AVAILABLE_ROUTES = [
  "POST /v1/chat/completions",
  "GET /health",
  "GET /debug",
];

export function registerRoutes(app) {
  app.post("/v1/chat/completions", proxyToAIFiesta);

  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      endpoint: AIFIESTA_ENDPOINT,
      token_configured: !!process.env.AIFIESTA_TOKEN,
      ready: true,
    });
  });

  app.get("/debug", (req, res) => {
    res.json({
      aifiesta_base_url: process.env.AIFIESTA_API_URL,
      full_endpoint: AIFIESTA_ENDPOINT,
      token_configured: !!process.env.AIFIESTA_TOKEN,
      available_routes: AVAILABLE_ROUTES,
    });
  });

  app.use("*", (req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: "Route not found",
      method: req.method,
      path: req.originalUrl,
      available_routes: AVAILABLE_ROUTES,
    });
  });
}
