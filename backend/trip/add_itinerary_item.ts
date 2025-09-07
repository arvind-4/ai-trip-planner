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
    console.log("Adding itinerary item:", { tripId, ...req });

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

    // Sanitize and prepare data
    const cleanTitle = req.title.trim();
    const cleanDescription = req.description?.trim() || null;
    const cleanLocation = req.location?.trim() || null;
    const cleanBookingUrl = req.bookingUrl?.trim() || null;
    const weatherDependent = Boolean(req.weatherDependent);
    
    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (req.startTime && !timeRegex.test(req.startTime)) {
      throw APIError.invalidArgument("startTime must be in HH:MM format");
    }
    if (req.endTime && !timeRegex.test(req.endTime)) {
      throw APIError.invalidArgument("endTime must be in HH:MM format");
    }

    // Validate cost if provided
    if (req.cost !== undefined && req.cost !== null) {
      if (typeof req.cost !== 'number' || req.cost < 0) {
        throw APIError.invalidArgument("cost must be a non-negative number");
      }
    }

    try {
      const item = await tripDB.queryRow<ItineraryItem>`
        INSERT INTO itinerary_items (
          trip_id, day_number, start_time, end_time, activity_type,
          title, description, location, cost, booking_url, weather_dependent
        )
        VALUES (
          ${tripId}, 
          ${req.dayNumber}, 
          ${req.startTime || null}, 
          ${req.endTime || null}, 
          ${req.activityType}, 
          ${cleanTitle}, 
          ${cleanDescription}, 
          ${cleanLocation},
          ${req.cost || null}, 
          ${cleanBookingUrl}, 
          ${weatherDependent}
        )
        RETURNING 
          id, 
          trip_id as "tripId", 
          day_number as "dayNumber",
          start_time as "startTime", 
          end_time as "endTime",
          activity_type as "activityType", 
          title, 
          description, 
          location,
          cost, 
          booking_url as "bookingUrl", 
          weather_dependent as "weatherDependent",
          created_at as "createdAt"
      `;

      if (!item) {
        throw APIError.internal("Failed to create itinerary item - no result returned");
      }

      console.log("Successfully created itinerary item:", item);
      return item;
    } catch (error: any) {
      console.error("Database error inserting itinerary item:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Request data:", { tripId, ...req });
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle specific PostgreSQL errors
      if (error.code) {
        switch (error.code) {
          case '23502': // NOT NULL violation
            throw APIError.invalidArgument(`Missing required field: ${error.message}`);
          case '23503': // FOREIGN KEY violation
            throw APIError.invalidArgument("Invalid trip ID or reference");
          case '23514': // CHECK constraint violation
            throw APIError.invalidArgument(`Invalid data: ${error.message}`);
          case '22007': // Invalid datetime format
            throw APIError.invalidArgument("Invalid time format - use HH:MM");
          default:
            console.error("Unhandled database error code:", error.code);
        }
      }
      
      throw APIError.internal(`Database error while creating itinerary item: ${error.message}`);
    }
  }
);
