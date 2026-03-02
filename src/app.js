import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: "*", methods: ["*"], allowedHeaders: ["*"] }));
  app.use(express.json({ limit: "10mb" }));

  registerRoutes(app);
  return app;
}

