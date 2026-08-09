// swagger-spec.ts
//
// OpenAPI 3.0 spec for the generic backend template.
// components.schemas is kept separate so it can later be generated from
// real TypeScript interfaces in services/. Run your schema-generation step
// after changing service interfaces if you adopt automated schema generation.
//
// `paths` remains hand-maintained because route verbs, request bodies, response
// codes, and descriptions are HTTP metadata rather than TypeScript type data.

import { generatedSchemas } from "./schemas.generated";

const swaggerSpec = {
  openapi: "3.0.3",

  info: {
    title: "Generic Backend API",
    version: "1.0.0",
    description:
      "Reusable Express + TypeScript backend template with thin routes, service-layer business logic, " +
      "health monitoring, and Swagger/OpenAPI documentation."
  },

  servers: [
    {
      url: "/",
      description: "Same-origin proxy in production or development"
    }
  ],

  tags: [
    {
      name: "Diagnostics",
      description: "Health and status endpoints"
    },
    {
      name: "Items",
      description: "Example application API endpoints"
    }
  ],

  components: {
    schemas: {
      ...generatedSchemas,
      ErrorResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          error: { type: "string" }
        },
        required: ["ok", "error"]
      }
    }
  },

  paths: {
    "/api/health": {
      get: {
        tags: ["Diagnostics"],
        summary: "Health check",
        description:
          "Returns service status. Used to confirm the backend is reachable and responding.",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    service: { type: "string", example: "generic-backend" },
                    timestamp: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/api/items": {
      get: {
        tags: ["Items"],
        summary: "List items",
        responses: {
          "200": {
            description: "Item collection",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Item" }
                    }
                  },
                  required: ["items"]
                }
              }
            }
          }
        }
      },

      post: {
        tags: ["Items"],
        summary: "Create an item",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateItemRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Created item",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Item" }
              }
            }
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },

    "/api/items/{id}": {
      get: {
        tags: ["Items"],
        summary: "Get an item by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Requested item",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Item" }
              }
            }
          },
          "404": {
            description: "Item not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerSpec;
