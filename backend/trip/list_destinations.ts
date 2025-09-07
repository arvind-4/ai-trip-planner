import { api } from "encore.dev/api";
import { tripDB } from "./db";
import { Destination } from "./types";

interface ListDestinationsResponse {
  destinations: Destination[];
}

// Retrieves all available destinations for trip planning.
export const listDestinations = api<void, ListDestinationsResponse>(
  { expose: true, method: "GET", path: "/destinations" },
  async () => {
    const destinations: Destination[] = [];
    
    for await (const dest of tripDB.query<Destination>`
      SELECT id, name, country, description, image_url as "imageUrl",
             average_cost_per_day as "averageCostPerDay", best_months as "bestMonths",
             tags, coordinates, created_at as "createdAt"
      FROM destinations
      ORDER BY name
    `) {
      destinations.push(dest);
    }

    return { destinations };
  }
);
