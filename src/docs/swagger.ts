import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./openapi";

export function createSwaggerRouter() {
  const r = Router();

  r.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(generateOpenApiDocument(), {
      explorer: true,
    })
  );

  return r;
}