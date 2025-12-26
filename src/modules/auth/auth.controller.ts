import { Request, Response } from "express";
import { AuthService } from "./auth.service";

/**
 * AuthController
 * - 로컬/소셜 로그인과 토큰 처리 엔드포인트를 담당한다.
 */

const service = new AuthService();

export class AuthController {
  /**
   * POST /auth/register
   * - 로컬 회원가입
   */
  async register(req: Request, res: Response) {
    const body = req.body;
    const out = await service.registerLocal(body);
    return res.status(201).json(out);
  }

  /**
   * POST /auth/login
   * - 로컬 로그인
   */
  async login(req: Request, res: Response) {
    const body = req.body;
    const out = await service.loginLocal(body);
    return res.status(200).json(out);
  }

  /**
   * POST /auth/refresh
   * - Access/Refresh 토큰 갱신
   */
  async refresh(req: Request, res: Response) {
    const body = req.body;
    const out = await service.refreshTokens(body.refresh_token);
    return res.status(200).json(out);
  }

  /**
   * POST /auth/logout
   * - refresh_token의 jti를 Redis에서 폐기한다.
   */
  async logout(req: Request, res: Response) {
    const body = req.body;

    const auth = req.auth!;
    const out = await service.logout({ uid: auth.uid, role: auth.role }, body.refresh_token);
    return res.status(200).json(out);
  }

  /**
   * GET /auth/oauth/github
   * - GitHub OAuth 시작 URL을 반환한다.
   */
  async githubOauthStart(_req: Request, res: Response) {
    const out = await service.githubOauthStart("github");
    return res.status(200).json(out);
  }

  /**
   * GET /auth/oauth/github/callback?code=...&state=...
   * - GitHub OAuth 콜백 처리
   */
  async githubOauthCallback(req: Request, res: Response) {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");

    const out = await service.githubOauthCallback({ code, state });
    return res.status(200).json(out);
  }

  /**
   * POST /auth/firebase
   * - Firebase (Google) 소셜 로그인
   */
  async firebaseLogin(req: Request, res: Response) {
    const body = req.body;
    const out = await service.firebaseLogin(body.id_token);
    return res.status(200).json(out);
  }
}
