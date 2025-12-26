import admin from "firebase-admin";
import { ApiError } from "../middleware/error";

let inited = false;

export function initFirebaseAdmin() {
  if (inited) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    // Firebase 로그인 기능을 켜지 않는 환경(로컬)도 있을 수 있으므로 throw 대신 무시할 수도 있다.
    // 과제 제출에서는 반드시 설정하는 것을 권장.
    throw new ApiError({
      status: 500,
      code: "MISSING_ENV",
      message: "Missing env: FIREBASE_SERVICE_ACCOUNT_JSON",
    });
  }

  const credential = admin.credential.cert(JSON.parse(raw));
  admin.initializeApp({ credential });
  inited = true;
}

export async function verifyFirebaseIdToken(idToken: string) {
  if (!inited) initFirebaseAdmin();

  const decoded = await admin.auth().verifyIdToken(idToken);
  return {
    firebase_uid: String(decoded.uid),
    email: decoded.email ? String(decoded.email) : null,
    name: decoded.name ? String(decoded.name) : null,
  };
}
