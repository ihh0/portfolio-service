import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const healthResponse = z.object({
  status: z.literal("ok"),
  version: z.string(),
  buildTime: z.string().nullable(),
});

// GET /health
registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Health check",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": { schema: healthResponse },
      },
    },
    500: {
      description: "Internal error",
      content: { "application/json": { schema: ErrorResponse } },
    },
  },
});
