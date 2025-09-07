import { api, APIError } from "encore.dev/api";
import { tripDB } from "./db";

interface DeleteTripParams {
  id: number;
}

// Deletes a trip and all its associated itinerary items.
export const deleteTrip = api<DeleteTripParams, void>(
  { expose: true, method: "DELETE", path: "/trips/:id" },
  async ({ id }) => {
    const result = await tripDB.queryRow<{ count: number }>`
      DELETE FROM trips 
      WHERE id = ${id} AND user_id = 'default-user'
      RETURNING 1 as count
    `;

    if (!result) {
      throw APIError.notFound("trip not found");
    }
  }
);
