import { api } from "encore.dev/api";
import { tripDB } from "./db";
import { CreateTripRequest, Trip } from "./types";

// Creates a new trip with the specified preferences and destination.
export const createTrip = api<CreateTripRequest, Trip>(
  { expose: true, method: "POST", path: "/trips" },
  async (req) => {
    const trip = await tripDB.queryRow<Trip>`
      INSERT INTO trips (user_id, title, destination, start_date, end_date, budget_min, budget_max, preferences)
      VALUES ('default-user', ${req.title}, ${req.destination}, ${req.startDate}, ${req.endDate}, 
              ${req.budgetMin || null}, ${req.budgetMax || null}, ${JSON.stringify(req.preferences)})
      RETURNING id, user_id as "userId", title, destination, 
                start_date as "startDate", end_date as "endDate",
                budget_min as "budgetMin", budget_max as "budgetMax",
                preferences, status, 
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!trip) {
      throw new Error("Failed to create trip");
    }

    return trip;
  }
);
