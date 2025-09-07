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
    if (!req.title || req.title.trim() === "") {
      throw APIError.invalidArgument("title is required and cannot be empty");
    }

    if (!req.activityType || req.activityType.trim() === "") {
      throw APIError.invalidArgument("activityType is required and cannot be empty");
    }

    if (!req.dayNumber || req.dayNumber < 1) {
      throw APIError.invalidArgument("dayNumber must be a positive integer");
    }

    // Validate activity type is one of the allowed values
    const validActivityTypes = ["flight", "accommodation", "activity", "restaurant", "transport", "attraction"];
    if (!validActivityTypes.includes(req.activityType)) {
      throw APIError.invalidArgument(`activityType must be one of: ${validActivityTypes.join(", ")}`);
    }

    try {
      const item = await tripDB.queryRow<ItineraryItem>`
        INSERT INTO itinerary_items (
          trip_id, day_number, start_time, end_time, activity_type,
          title, description, location, cost, booking_url, weather_dependent
        )
        VALUES (
          ${tripId}, ${req.dayNumber}, ${req.startTime || null}, ${req.endTime || null}, 
          ${req.activityType}, ${req.title.trim()}, ${req.description?.trim() || null}, ${req.location?.trim() || null},
          ${req.cost || null}, ${req.bookingUrl?.trim() || null}, ${req.weatherDependent || false}
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
      console.error("Request data:", { tripId, ...req });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Log the specific database error for debugging
      console.error("Database error details:", (error as any).message, (error as any).code);
      throw APIError.internal("Database error while creating itinerary item");
    }
  }
);
