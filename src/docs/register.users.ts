import { z } from "zod";
import { registry } from "./openapi";
import { ErrorResponse } from "./schemas";

const userPublic = z.object({
  uid: z.string(),
  login_id: z.string(),
  display_name: z.string(),
  is_featured: z.boolean(),
  // email/phone은 privacy에 따라 "필드 제거" 정책이므로 optional로 표현
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const userDetail = userPublic.extend({
  created_at: z.string(),
  updated_at: z.string(),
  privacy: z
    .object({
      is_email_public: z.boolean(),
      is_phone_public: z.boolean(),
    })
    .optional(),
});

registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["Users"],
  summary: "List users",
  request: {
    query: z.object({
      keyword: z.string().optional(),
      page: z.coerce.number().int().min(0).default(0).optional(),
      size: z.coerce.number().int().min(1).max(50).default(20).optional(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            content: z.array(userPublic),
            page: z.number().int(),
            size: z.number().int(),
            totalElements: z.number().int(),
            totalPages: z.number().int(),
            sort: z.literal("created_at,DESC"),
          }),
        },
      },
    },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// GET /users/{uid}
registry.registerPath({
  method: "get",
  path: "/users/{uid}",
  tags: ["Users"],
  summary: "Get public profile",
  request: {
    params: z.object({ uid: z.string() }),
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: userDetail } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// PATCH /users/{uid}
registry.registerPath({
  method: "patch",
  path: "/users/{uid}",
  tags: ["Users"],
  summary: "Patch user (owner/admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ uid: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            display_name: z.string().min(1).max(50).optional(),
            is_email_public: z.boolean().optional(),
            is_phone_public: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: userDetail } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// PATCH /users/{uid}/featured
registry.registerPath({
  method: "patch",
  path: "/users/{uid}/featured",
  tags: ["Users"],
  summary: "Set is_featured (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ uid: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            is_featured: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: userDetail } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// 사용자 프로젝트 목록 조회 응답 스키마 (GET /projects와 동일)
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
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  skills: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

// GET /users/{uid}/projects
registry.registerPath({
  method: "get",
  path: "/users/{uid}/projects",
  tags: ["Users"],
  summary: "List user's projects (public: public projects only, owner/admin: all projects)",
  request: {
    params: z.object({ uid: z.string() }),
    query: z.object({
      page: z.coerce.number().int().min(0).default(0).optional(),
      size: z.coerce.number().int().refine((n) => [10, 20, 50].includes(n), "size must be 10|20|50").default(10).optional(),
      sort: z.enum(["popular", "latest"]).default("popular").optional(),
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
    404: { description: "User not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});

// DELETE /users/{uid}
registry.registerPath({
  method: "delete",
  path: "/users/{uid}",
  tags: ["Users"],
  summary: "Delete user account (soft delete, owner/admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ uid: z.string() }),
  },
  responses: {
    204: { description: "No Content (deleted or already deleted)" },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "User not found", content: { "application/json": { schema: ErrorResponse } } },
    422: { description: "Validation", content: { "application/json": { schema: ErrorResponse } } },
    500: { description: "Server", content: { "application/json": { schema: ErrorResponse } } },
  },
});
