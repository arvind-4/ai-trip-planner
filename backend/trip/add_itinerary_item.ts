import { api, APIError } from "encore.dev/api";
import { tripDB } from "./db";
import { CreateItineraryItemRequest, ItineraryItem } from "./types";

interface AddItineraryItemParams {
  tripId: number;
}

// Adds a new item to a trip's itinerary.
export const addItineraryItem = api<AddItineraryItemParams & CreateItineraryItemRequest, ItineraryItem>(
  { expose: true, method: "POST", path: "/trips/:tripId/itinerary" },
  async ({ tripId, ...req }) => {
    // Verify trip exists
    const trip = await tripDB.queryRow`
      SELECT id FROM trips WHERE id = ${tripId} AND user_id = 'default-user'
    `;

    if (!trip) {
      throw APIError.notFound("trip not found");
    }

    // Validate required fields
    if (!req.title || !req.activityType) {
      throw APIError.invalidArgument("title and activityType are required");
    }

    if (!req.dayNumber || req.dayNumber < 1) {
      throw APIError.invalidArgument("dayNumber must be a positive integer");
    }

    try {
      const item = await tripDB.queryRow<ItineraryItem>`
        INSERT INTO itinerary_items (
          trip_id, day_number, start_time, end_time, activity_type,
          title, description, location, cost, booking_url, weather_dependent
        )
        VALUES (
          ${tripId}, ${req.dayNumber}, ${req.startTime || null}, ${req.endTime || null}, 
          ${req.activityType}, ${req.title}, ${req.description || null}, ${req.location || null},
          ${req.cost || null}, ${req.bookingUrl || null}, ${req.weatherDependent || false}
        )
        RETURNING id, trip_id as "tripId", day_number as "dayNumber",
                  start_time as "startTime", end_time as "endTime",
                  activity_type as "activityType", title, description, location,
                  cost, booking_url as "bookingUrl", weather_dependent as "weatherDependent",
                  created_at as "createdAt"
      `;

      if (!item) {
        throw APIError.internal("Failed to create itinerary item");
      }

      return item;
    } catch (error) {
      console.error("Error inserting itinerary item:", error);
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Database error while creating itinerary item");
    }
  }
);
