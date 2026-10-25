// ─── Swagger / OpenAPI Configuration ──────────────────────────────────────────
// FRD Section 14: /api/docs and /api/docs/openapi.json

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Khao Peeo — Restaurant Management & POS API",
    version: "1.0.0",
    description:
      "Industry-standard modular monolith API for unified restaurant management and POS. " +
      "All endpoints use standard response envelopes with request_id tracking.",
    contact: {
      name: "Khao Peeo Team",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          meta: { type: "object" },
          request_id: { type: "string", example: "req_abc123" },
        },
      },
      ErrorEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_FAILED" },
              message: { type: "string", example: "Validation failed" },
              details: { type: "object" },
            },
          },
          request_id: { type: "string", example: "req_abc123" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 100 },
          total_pages: { type: "integer", example: 5 },
          has_next: { type: "boolean", example: true },
          has_prev: { type: "boolean", example: false },
        },
      },
    },
    parameters: {
      IdempotencyKey: {
        name: "Idempotency-Key",
        in: "header",
        schema: { type: "string" },
        description: "Unique key for idempotent operations",
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: "Auth", description: "Authentication & session management" },
    { name: "Identity", description: "User & staff management" },
    { name: "Staff", description: "Staff Management (KP-FRD-002)" },
    { name: "Attendance", description: "Attendance & shift management (KP-FRD-003)" },
    { name: "Restaurant", description: "Restaurant settings" },
    { name: "Platform", description: "Platform superadmin operations" },
    { name: "Tables", description: "Table management & assignment" },
    { name: "Orders", description: "Order lifecycle" },
    { name: "Kitchen", description: "Kitchen Display System" },
    { name: "Menu", description: "Menu management" },
    { name: "Billing", description: "Billing & payments" },
    { name: "Inventory", description: "Inventory management" },
    { name: "Analytics", description: "Reporting & metrics" },
    { name: "Audit", description: "Audit logs" },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/modules/**/api/routes.ts", "./src/modules/**/api/routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/api/docs/openapi.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

export { swaggerSpec };
