// schemas.generated.ts
//
// AUTO-GENERATED placeholder schema module for the generic backend template.
// In a larger application, generate this file from the actual TypeScript
// interfaces in services/ and treat those interfaces as the source of truth.

export const generatedSchemas: Record<string, unknown> = {
  Item: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      createdAt: { type: "string", format: "date-time" }
    },
    required: ["id", "name", "createdAt"],
    additionalProperties: false
  },

  CreateItemRequest: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" }
    },
    required: ["name"],
    additionalProperties: false
  }
} as const;
