import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { connectDB } from "./config/data-source";
import { connectRedis } from "./config/redis";
import { initFirebaseAdmin } from "./config/firebase-admin";

const port = Number(process.env.PORT ?? 8080);

async function main() {
  await connectDB();
  await connectRedis();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on :${port}`);
  });

  // Firebase 소셜 로그인 사용 시 초기화
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    initFirebaseAdmin();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] fatal", err);
  process.exit(1);
});
