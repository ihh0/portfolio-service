import { Request, Response } from "express";
import { UsersService } from "./users.service";
import { ProjectsService } from "../projects/projects.service";

/**
 * UsersController
 * - 사용자 엔드포인트 처리를 담당한다.
 */

const service = new UsersService();
const projectsService = new ProjectsService();

export class UsersController {
  /**
   * GET /users
   * - 사용자 목록을 조회한다.
   */
  async list(req: Request, res: Response) {
    const q = req.query as any;

    // optional auth: 미들웨어에서 설정되지만 없을 수 있으므로 안전하게 접근
    const requester = req.auth;

    const result = await service.listUsers({
      page: q.page,
      size: q.size,
      keyword: q.keyword,
      requester,
    });

    return res.status(200).json(result);
  }

  /**
   * GET /users/:uid
   * - 사용자 프로필을 조회한다.
   */
  async getProfile(req: Request, res: Response) {
    const uid = String(req.params.uid);
    const requester = req.auth;

    const result = await service.getProfile({ uid, requester });
    return res.status(200).json(result);
  }

  /**
   * GET /users/:uid/projects
   * - 권한에 따라 공개/비공개 범위를 결정한다.
   */
  async listProjects(req: Request, res: Response) {
    const uid = String(req.params.uid);
    const q = req.query as any;
    const requester = req.auth; // optional auth

    const result = await projectsService.listUserProjects({
      userUid: uid,
      page: q.page,
      size: q.size,
      sort: q.sort,
      requester,
    });

    return res.status(200).json(result);
  }

  /**
   * PATCH /users/:uid
   * - 사용자 정보를 수정한다.
   */
  async patch(req: Request, res: Response) {
    const uid = String(req.params.uid);
    const body = req.body;
    const requester = req.auth!;

    const result = await service.patchUser({ uid, body, requester });
    return res.status(200).json(result);
  }

  /**
   * PATCH /users/:uid/featured
   * - 사용자 featured 상태를 설정한다.
   */
  async setFeatured(req: Request, res: Response) {
    const uid = String(req.params.uid);
    const body = req.body;
    const requester = req.auth!;

    const result = await service.setFeatured({ uid, is_featured: body.is_featured, requester });
    return res.status(200).json(result);
  }

  /**
   * DELETE /users/:uid
   * - owner/admin만 가능하며 멱등이다.
   */
  async delete(req: Request, res: Response) {
    const uid = String(req.params.uid);
    const requester = req.auth!;

    await service.softDeleteUser({ uid, requester });
    return res.status(204).send();
  }
}
