// services/items.ts
//
// Example service module used by the generic API routes.
// Replace this in-memory implementation with application-specific business
// logic, persistence, external APIs, queues, or other infrastructure while
// keeping server.ts focused on HTTP concerns.

export interface Item {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
}

const items: Item[] = [
  {
    id: "1",
    name: "Example item",
    description: "Seed data for the generic backend template.",
    createdAt: new Date().toISOString()
  }
];

export function listItems(): Item[] {
  return items;
}

export function getItemById(id: string): Item | undefined {
  return items.find((item) => item.id === id);
}

export function createItem(input: CreateItemRequest): Item {
  const name = input?.name?.trim();

  if (!name) {
    throw new Error("name is required");
  }

  const item: Item = {
    id: String(Date.now()),
    name,
    description: input.description?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  items.push(item);
  return item;
}
