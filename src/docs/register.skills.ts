import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const skill = z.object({ id: z.number().int(), name: z.string() });

// GET /skills
registry.registerPath({
  method: "get",
  path: "/skills",
  tags: ["기술"],
  summary: "List skills",
  request: {
    query: z.object({
      keyword: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            content: z.array(skill),
            sort: z.literal("name,ASC"),
            limit: z.number().int(),
          }),
        },
      },
    },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// POST /skills
registry.registerPath({
  method: "post",
  path: "/skills",
  tags: ["기술"],
  summary: "Create a skill (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1).max(50),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: skill } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    409: { description: "Conflict", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// PATCH /skills/{id}
registry.registerPath({
  method: "patch",
  path: "/skills/{id}",
  tags: ["기술"],
  summary: "Update skill (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1).max(50).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: skill } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    409: { description: "Conflict", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// DELETE /skills/{id}
registry.registerPath({
  method: "delete",
  path: "/skills/{id}",
  tags: ["기술"],
  summary: "Delete skill (admin, soft delete)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    204: { description: "No Content" },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});
