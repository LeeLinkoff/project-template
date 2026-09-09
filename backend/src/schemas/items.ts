// schemas/items.ts
//
// Runtime validation for the example Items API.
// Keep these schemas aligned with the corresponding service-layer request contracts in services/items.ts.


import { z } from "zod";


export const createItemSchema = z.object({
  orderId: z.number().int().positive("orderId must be a positive integer"),
  name: z.string().min(1, "name is required"),
  description: z.string().optional()
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const itemIdParamsSchema = z.object({
  id: z.string().min(1, "id is required")
});
