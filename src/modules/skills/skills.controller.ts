import { Request, Response } from "express";
import { SkillsService } from "./skills.service";

/**
 * SkillsController
 * - 스킬 엔드포인트 처리를 담당한다.
 */

const service = new SkillsService();

export class SkillsController {
  /**
   * GET /skills
   * - 스킬 목록을 조회한다.
   */
  async list(req: Request, res: Response) {
    const q = req.query as any;

    const result = await service.listSkills({ keyword: q.keyword });
    return res.status(200).json(result);
  }

  /**
   * POST /skills
   * - 스킬을 생성한다.
   */
  async create(req: Request, res: Response) {
    const body = req.body;
    const requester = req.auth!;

    const result = await service.createSkill({ name: body.name, requester });
    return res.status(201).json(result);
  }

  /**
   * PATCH /skills/:id
   * - 스킬을 수정한다.
   */
  async patch(req: Request, res: Response) {
    const id = Number(req.params.id);
    const body = req.body;
    const requester = req.auth!;

    const result = await service.patchSkill({ id, name: body.name, requester });
    return res.status(200).json(result);
  }

  /**
   * DELETE /skills/:id
   * - 스킬을 soft delete한다.
   */
  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const requester = req.auth!;

    await service.deleteSkill({ id, requester });
    return res.status(204).send();
  }
}
