import { z } from "zod";
import { registry } from "./openapi";

export const errorResponseSchema = z.object({
  timestamp: z.string().datetime(),
  path: z.string(),
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

// OpenAPI 컴포넌트로 등록
registry.registerComponent("schemas", "ErrorResponse", errorResponseSchema as any);
export const ErrorResponse = errorResponseSchema;