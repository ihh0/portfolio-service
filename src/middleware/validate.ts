import type { Request, Response, NextFunction } from "express";
import { ZodError, type AnyZodObject } from "zod";
import { ApiError } from "./error";

/**
 * validate
 * - req.body/query/params를 Zod로 검증하고 req에 반영한다.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });

      if (Object.prototype.hasOwnProperty.call(result, "body")) {
        req.body = result.body;
      }
      if (Object.prototype.hasOwnProperty.call(result, "query")) {
        req.query = result.query;
      }
      if (Object.prototype.hasOwnProperty.call(result, "params")) {
        req.params = result.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.reduce((acc, curr) => {
          const key = curr.path.join(".") || "_";
          acc[key] = curr.message;
          return acc;
        }, {} as Record<string, string>);

        return next(
          new ApiError({
            status: 422,
            code: "VALIDATION_FAILED",
            message: "Validation failed",
            details,
          })
        );
      }
      return next(error);
    }
  };
}
