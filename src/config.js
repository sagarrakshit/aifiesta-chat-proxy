import dotenv from "dotenv";
import https from "https";

dotenv.config();

export const SERVER_PORT = process.env.PORT || 3000;
export const AIFIESTA_ENDPOINT = `${process.env.AIFIESTA_API_URL}/api/chats/v3/completions`;

export const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: 30000,
});

