import dotenv from "dotenv";
import path from "path";

// 테스트에서도 .env만 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
