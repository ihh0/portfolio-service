import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { AdminController } from "./admin.controller";

const r = Router();
const c = new AdminController();

// GET /admin/stats/overview
r.get("/admin/stats/overview", requireAuth, requireAdmin, asyncHandler(c.getStatsOverview.bind(c)));

export default r;

