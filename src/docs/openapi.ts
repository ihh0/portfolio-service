import { z } from "zod";
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Zod에 OpenAPI 확장 추가 (.openapi() 메서드 사용 가능)
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/**
 * 표준 보안 스킴
 * - Access Token: Authorization: Bearer <token>
 */
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Portfolio Service API",
      version: process.env.APP_VERSION ?? "0.1.0",
      description: "Term Project API (Express + TypeScript + TypeORM + Redis + JWT)",
    },
    // /api prefix 제거: 루트 기준으로 운영
    servers: [
      {
        url: "/",
        description: "Root base (no /api prefix)",
      },
    ],
    tags: [
      { name: "Health" },
      { name: "Auth" },
      { name: "Users" },
      { name: "Projects" },
      { name: "기술" },
      { name: "Experiences" },
      { name: "Admin" },
    ],
  });
}
