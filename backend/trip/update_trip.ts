import { api, APIError } from "encore.dev/api";
import { tripDB } from "./db";
import { UpdateTripRequest, Trip } from "./types";

interface UpdateTripParams {
  id: number;
}

// Updates an existing trip with new information.
export const updateTrip = api<UpdateTripParams & UpdateTripRequest, Trip>(
  { expose: true, method: "PUT", path: "/trips/:id" },
  async ({ id, ...updates }) => {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.destination !== undefined) {
      setParts.push(`destination = $${paramIndex++}`);
      values.push(updates.destination);
    }
    if (updates.startDate !== undefined) {
      setParts.push(`start_date = $${paramIndex++}`);
      values.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      setParts.push(`end_date = $${paramIndex++}`);
      values.push(updates.endDate);
    }
    if (updates.budgetMin !== undefined) {
      setParts.push(`budget_min = $${paramIndex++}`);
      values.push(updates.budgetMin);
    }
    if (updates.budgetMax !== undefined) {
      setParts.push(`budget_max = $${paramIndex++}`);
      values.push(updates.budgetMax);
    }
    if (updates.preferences !== undefined) {
      setParts.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(updates.preferences));
    }
    if (updates.status !== undefined) {
      setParts.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (setParts.length === 0) {
      throw APIError.invalidArgument("no updates provided");
    }

    setParts.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE trips 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex} AND user_id = 'default-user'
      RETURNING id, user_id as "userId", title, destination, 
                start_date as "startDate", end_date as "endDate",
                budget_min as "budgetMin", budget_max as "budgetMax",
                preferences, status, 
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const trip = await tripDB.rawQueryRow<Trip>(query, ...values);

    if (!trip) {
      throw APIError.notFound("trip not found");
    }

    return trip;
  }
);
