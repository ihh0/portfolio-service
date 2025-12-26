import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import { adminStatsOverviewSchema } from "./admin.schemas";

const service = new AdminService();

export class AdminController {
  /**
   * GET /admin/stats/overview
   * - 통계 Overview 조회
   */
  async getStatsOverview(_req: Request, res: Response) {
    const stats = await service.getStatsOverview();

    // Zod 스키마로 응답 검증
    const validated = adminStatsOverviewSchema.parse(stats);

    return res.status(200).json(validated);
  }
}

