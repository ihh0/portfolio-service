import { Request, Response } from "express";
import { ExperiencesService } from "./experiences.service";

/**
 * ExperiencesController
 * - 경력 엔드포인트 처리를 담당한다.
 */

const service = new ExperiencesService();

export class ExperiencesController {
  /**
   * GET /users/:uid/experiences
   * - 사용자 경력 목록을 조회한다.
   */
  async listByUser(req: Request, res: Response) {
    const userUid = String(req.params.uid);
    const q = req.query as any;

    const result = await service.listByUser({
      userUid,
      page: q.page,
      size: q.size,
    });

    return res.status(200).json(result);
  }

  /**
   * GET /experiences/:id
   * - 경력 상세를 조회한다.
   */
  async getOne(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await service.getOne({ id });
    return res.status(200).json(result);
  }

  /**
   * POST /users/:uid/experiences
   * - 경력을 생성한다.
   */
  async createForUser(req: Request, res: Response) {
    const userUid = String(req.params.uid);
    const body = req.body;
    const requester = req.auth!;

    const result = await service.createForUser({ userUid, body, requester });
    return res.status(201).json(result);
  }

  /**
   * PATCH /experiences/:id
   * - 경력을 수정한다.
   */
  async patch(req: Request, res: Response) {
    const id = Number(req.params.id);
    const body = req.body;
    const requester = req.auth!;

    const result = await service.patch({ id, body, requester });
    return res.status(200).json(result);
  }

  /**
   * DELETE /experiences/:id
   * - 경력을 soft delete한다.
   */
  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const requester = req.auth!;

    await service.remove({ id, requester });
    return res.status(204).send();
  }
}
