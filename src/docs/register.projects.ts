import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const projectListItem = z.object({
  id: z.number().int(),
  title: z.string(),
  summary: z.string().nullable(),
  is_public: z.boolean(),
  likes_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  user: z.object({
    uid: z.string(),
    login_id: z.string(),
    display_name: z.string(),
    is_featured: z.boolean(),
  }),
  skills: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

// GET /projects
registry.registerPath({
  method: "get",
  path: "/projects",
  tags: ["Projects"],
  summary: "List public projects",
  request: {
    query: z.object({
      page: z.coerce.number().int().min(0).default(0).optional(),
      size: z.coerce.number().int().refine((n) => [10, 20, 50].includes(n), "size must be 10|20|50").default(10).optional(),
      sort: z.enum(["popular", "latest"]).default("popular").optional(),
      title_keyword: z.string().optional(),
      content_keyword: z.string().optional(),
      user_keyword: z.string().optional(),
      skill_id: z.coerce.number().int().optional(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            content: z.array(projectListItem),
            page: z.number().int(),
            size: z.number().int(),
            totalElements: z.number().int(),
            totalPages: z.number().int(),
            sort: z.string(),
          }),
        },
      },
    },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

const projectDetail = z.object({
  id: z.number().int(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string().nullable(),
  content_format: z.enum(["MARKDOWN", "PLAIN_TEXT"]),
  thumbnail_asset_id: z.number().int().nullable(),
  is_public: z.boolean(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  likes_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  user: z.object({
    uid: z.string(),
    login_id: z.string(),
    display_name: z.string(),
    is_featured: z.boolean(),
  }),
  skills: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

// GET /projects/{id}
registry.registerPath({
  method: "get",
  path: "/projects/{id}",
  tags: ["Projects"],
  summary: "Get project detail (private: owner/admin only)",
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: projectDetail } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

const projectCreateBody = z.object({
  title: z.string().min(1).max(150),
  summary: z.string().max(300).optional().nullable(),
  content: z.string().optional().nullable(),
  content_format: z.enum(["MARKDOWN", "PLAIN_TEXT"]).optional(),
  is_public: z.boolean().optional(),
  thumbnail_asset_id: z.number().int().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  skill_ids: z.array(z.number().int().positive()).max(50).optional(),
});

// POST /projects
registry.registerPath({
  method: "post",
  path: "/projects",
  tags: ["Projects"],
  summary: "Create a project",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: projectCreateBody } },
    },
  },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: projectDetail } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// PATCH /projects/{id}
registry.registerPath({
  method: "patch",
  path: "/projects/{id}",
  tags: ["Projects"],
  summary: "Patch a project (owner/admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
    body: {
      content: { "application/json": { schema: projectCreateBody.partial() } },
    },
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: projectDetail } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// POST /projects/{id}/likes
registry.registerPath({
  method: "post",
  path: "/projects/{id}/likes",
  tags: ["Projects"],
  summary: "Like a project (idempotent, private: owner/admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: z.object({ ok: z.boolean() }) } } },
    204: { description: "No Content (already liked)" },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// DELETE /projects/{id}/likes
registry.registerPath({
  method: "delete",
  path: "/projects/{id}/likes",
  tags: ["Projects"],
  summary: "Unlike a project (idempotent, private: owner/admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: z.object({ ok: z.boolean() }) } } },
    204: { description: "No Content (not liked)" },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// DELETE /projects/{id}
registry.registerPath({
  method: "delete",
  path: "/projects/{id}",
  tags: ["Projects"],
  summary: "Delete a project (soft delete, owner/admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    204: { description: "No Content (deleted or already deleted)" },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});
