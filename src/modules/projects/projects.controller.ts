import { Request, Response } from "express";
import { ProjectsService } from "./projects.service";

/**
 * ProjectsController
 * - 프로젝트 엔드포인트 처리를 담당한다.
 */

const service = new ProjectsService();

export class ProjectsController {
  /**
   * GET /projects
   * - 공개 프로젝트 목록을 조회한다.
   */
  async list(req: Request, res: Response) {
    const q = req.query as any;
    const result = await service.listPublicProjects(q);
    return res.status(200).json(result);
  }

  /**
   * GET /projects/:id
   * - 프로젝트 상세를 조회한다.
   */
  async getOne(req: Request, res: Response) {
    const id = Number(req.params.id);
    const requester = req.auth;

    const result = await service.getProjectDetail({ id, requester });
    return res.status(200).json(result);
  }

  /**
   * POST /projects
   * - 프로젝트를 생성한다.
   */
  async create(req: Request, res: Response) {
    const body = req.body;
    const requester = req.auth!;

    const result = await service.createProject({ body, requester });
    return res.status(201).json(result);
  }

  /**
   * PATCH /projects/:id
   * - 프로젝트를 수정한다.
   */
  async patch(req: Request, res: Response) {
    const id = Number(req.params.id);
    const body = req.body;
    const requester = req.auth!;

    const result = await service.patchProject({ id, body, requester });
    return res.status(200).json(result);
  }

  /**
   * DELETE /projects/:id
   * - 프로젝트를 soft delete한다.
   */
  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const requester = req.auth!;

    await service.deleteProject({ id, requester });
    return res.status(204).send();
  }

  /**
   * POST /projects/:id/likes
   * - 프로젝트 좋아요를 추가한다.
   */
  async like(req: Request, res: Response) {
    const projectId = Number(req.params.id);
    const requester = req.auth!;

    const out = await service.likeProject({ projectId, requester });

    // 멱등 설계: created면 201, 이미 있으면 204
    if (out.created) {
      return res.status(201).json({ ok: true });
    }
    return res.status(204).send();
  }

  /**
   * DELETE /projects/:id/likes
   * - 프로젝트 좋아요를 제거한다.
   */
  async unlike(req: Request, res: Response) {
    const projectId = Number(req.params.id);
    const requester = req.auth!;

    const out = await service.unlikeProject({ projectId, requester });

    if (out.deleted) return res.status(200).json({ ok: true });
    return res.status(204).send();
  }
}
