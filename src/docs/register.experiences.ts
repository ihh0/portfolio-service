import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const experience = z.object({
  id: z.number().int(),
  company: z.string(),
  position: z.string(),
  employment_type: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  description: z.string().nullable(),
});

const experienceResponse = experience.extend({
  created_at: z.string(),
  updated_at: z.string(),
});

// GET /users/{uid}/experiences
registry.registerPath({
  method: "get",
  path: "/users/{uid}/experiences",
  tags: ["Experiences"],
  summary: "List experiences by user (public)",
  request: {
    params: z.object({ uid: z.string() }),
    query: z.object({
      page: z.coerce.number().int().min(0).default(0).optional(),
      size: z.coerce.number().int().refine((n) => [10, 20, 50].includes(n), "size must be 10|20|50").default(10).optional(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            content: z.array(experienceResponse),
            page: z.number().int(),
            size: z.number().int(),
            totalElements: z.number().int(),
            totalPages: z.number().int(),
            sort: z.literal("start_date,DESC"),
          }),
        },
      },
    },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// GET /experiences/{id}
registry.registerPath({
  method: "get",
  path: "/experiences/{id}",
  tags: ["Experiences"],
  summary: "Get experience by id (public)",
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: experienceResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

const experienceCreateBody = z.object({
  company: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  employment_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "FREELANCE", "OTHER"]),
  start_date: z.string().length(10),
  end_date: z.string().length(10).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

// POST /users/{uid}/experiences
registry.registerPath({
  method: "post",
  path: "/users/{uid}/experiences",
  tags: ["Experiences"],
  summary: "Create experience (owner/admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ uid: z.string() }),
    body: {
      content: { "application/json": { schema: experienceCreateBody } },
    },
  },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: experienceResponse } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// PATCH /experiences/{id}
registry.registerPath({
  method: "patch",
  path: "/experiences/{id}",
  tags: ["Experiences"],
  summary: "Patch experience (owner/admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
    body: {
      content: { "application/json": { schema: experienceCreateBody.partial() } },
    },
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: experienceResponse } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// DELETE /experiences/{id}
registry.registerPath({
  method: "delete",
  path: "/experiences/{id}",
  tags: ["Experiences"],
  summary: "Delete experience (owner/admin, soft delete)",
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
