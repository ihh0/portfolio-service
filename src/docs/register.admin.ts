import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const adminStatsOverviewResponse = z.object({
  users: z.number().int(),
  featured_users: z.number().int(),
  projects: z.number().int(),
  public_projects: z.number().int(),
  experiences: z.number().int(),
  skills: z.number().int(),
  project_skills: z.number().int(),
  project_likes: z.number().int(),
});

// GET /admin/stats/overview
registry.registerPath({
  method: "get",
  path: "/admin/stats/overview",
  tags: ["Admin"],
  summary: "Get statistics overview (admin only)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: adminStatsOverviewResponse,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponse } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorResponse } },
    },
    500: {
      description: "Internal Server Error",
      content: { "application/json": { schema: ErrorResponse } },
    },
  },
});
