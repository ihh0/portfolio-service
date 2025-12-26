import bcrypt from "bcrypt";

/**
 * bcrypt 기반 비밀번호 해시/검증
 * - 해시/검증 유틸만 제공한다.
 */
const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
