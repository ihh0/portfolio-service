import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./openapi";

export function createSwaggerRouter() {
  const r = Router();

  r.get("/openapi.json", (_req, res) => {
    res.json(generateOpenApiDocument());
  });

  r.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      explorer: true,
      swaggerOptions: {
        url: "/docs/openapi.json",
      },
    })
  );

  return r;
}
