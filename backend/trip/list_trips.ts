import { api } from "encore.dev/api";
import { tripDB } from "./db";
import { Trip } from "./types";

interface ListTripsResponse {
  trips: Trip[];
}

// Retrieves all trips for the user.
export const listTrips = api<void, ListTripsResponse>(
  { expose: true, method: "GET", path: "/trips" },
  async () => {
    const trips: Trip[] = [];
    
    for await (const trip of tripDB.query<Trip>`
      SELECT id, user_id as "userId", title, destination, 
             start_date as "startDate", end_date as "endDate",
             budget_min as "budgetMin", budget_max as "budgetMax",
             preferences, status, 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM trips 
      WHERE user_id = 'default-user'
      ORDER BY created_at DESC
    `) {
      trips.push(trip);
    }

    return { trips };
  }
);
