import { api, APIError } from "encore.dev/api";
import { tripDB } from "./db";
import { TripWithItinerary, ItineraryItem } from "./types";

interface GetTripParams {
  id: number;
}

// Retrieves a specific trip with its complete itinerary.
export const getTrip = api<GetTripParams, TripWithItinerary>(
  { expose: true, method: "GET", path: "/trips/:id" },
  async ({ id }) => {
    const trip = await tripDB.queryRow<TripWithItinerary>`
      SELECT id, user_id as "userId", title, destination, 
             start_date as "startDate", end_date as "endDate",
             budget_min as "budgetMin", budget_max as "budgetMax",
             preferences, status, 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM trips 
      WHERE id = ${id} AND user_id = 'default-user'
    `;

    if (!trip) {
      throw APIError.notFound("trip not found");
    }

    // Parse preferences if it's a string
    if (trip.preferences && typeof trip.preferences === 'string') {
      try {
        trip.preferences = JSON.parse(trip.preferences);
      } catch (error) {
        // If parsing fails, set default preferences
        trip.preferences = {
          interests: [],
          travelStyle: "mid-range",
          accommodation: "hotel",
          pace: "moderate",
          groupSize: 2
        };
      }
    }

    const itinerary: ItineraryItem[] = [];
    for await (const item of tripDB.query<ItineraryItem>`
      SELECT id, trip_id as "tripId", day_number as "dayNumber",
             start_time as "startTime", end_time as "endTime",
             activity_type as "activityType", title, description, location,
             cost, booking_url as "bookingUrl", weather_dependent as "weatherDependent",
             created_at as "createdAt"
      FROM itinerary_items 
      WHERE trip_id = ${id}
      ORDER BY day_number, start_time
    `) {
      itinerary.push(item);
    }

    trip.itinerary = itinerary;
    return trip;
  }
);
