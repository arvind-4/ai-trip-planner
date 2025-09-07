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
    console.log("Adding itinerary item - received data:", { tripId, ...req });

    // Verify trip exists
    const trip = await tripDB.queryRow`
      SELECT id FROM trips WHERE id = ${tripId} AND user_id = 'default-user'
    `;

    if (!trip) {
      console.error("Trip not found:", tripId);
      throw APIError.notFound("trip not found");
    }

    // Validate and sanitize required fields
    if (!req.title || typeof req.title !== 'string' || req.title.trim() === "") {
      console.error("Invalid title:", req.title);
      throw APIError.invalidArgument("title is required and cannot be empty");
    }

    if (!req.activityType || typeof req.activityType !== 'string' || req.activityType.trim() === "") {
      console.error("Invalid activityType:", req.activityType);
      throw APIError.invalidArgument("activityType is required and cannot be empty");
    }

    if (!req.dayNumber || typeof req.dayNumber !== 'number' || req.dayNumber < 1) {
      console.error("Invalid dayNumber:", req.dayNumber);
      throw APIError.invalidArgument("dayNumber must be a positive integer");
    }

    // Validate activity type is one of the allowed values
    const validActivityTypes = ["flight", "accommodation", "activity", "restaurant", "transport", "attraction"];
    if (!validActivityTypes.includes(req.activityType.trim())) {
      console.error("Invalid activityType value:", req.activityType);
      throw APIError.invalidArgument(`activityType must be one of: ${validActivityTypes.join(", ")}`);
    }

    // Sanitize and prepare data
    const cleanTitle = req.title.trim();
    const cleanActivityType = req.activityType.trim();
    const cleanDescription = req.description && typeof req.description === 'string' ? req.description.trim() || null : null;
    const cleanLocation = req.location && typeof req.location === 'string' ? req.location.trim() || null : null;
    const cleanBookingUrl = req.bookingUrl && typeof req.bookingUrl === 'string' ? req.bookingUrl.trim() || null : null;
    const weatherDependent = Boolean(req.weatherDependent);
    
    // Validate and clean time format if provided
    let cleanStartTime = null;
    let cleanEndTime = null;
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (req.startTime && typeof req.startTime === 'string') {
      const trimmedStartTime = req.startTime.trim();
      if (timeRegex.test(trimmedStartTime)) {
        cleanStartTime = trimmedStartTime;
      } else {
        console.warn("Invalid startTime format, ignoring:", req.startTime);
      }
    }
    
    if (req.endTime && typeof req.endTime === 'string') {
      const trimmedEndTime = req.endTime.trim();
      if (timeRegex.test(trimmedEndTime)) {
        cleanEndTime = trimmedEndTime;
      } else {
        console.warn("Invalid endTime format, ignoring:", req.endTime);
      }
    }

    // Validate and clean cost if provided
    let cleanCost = null;
    if (req.cost !== undefined && req.cost !== null) {
      if (typeof req.cost === 'number' && req.cost >= 0) {
        cleanCost = Math.floor(req.cost); // Ensure integer
      } else {
        console.warn("Invalid cost value, ignoring:", req.cost);
      }
    }

    console.log("Cleaned data for insertion:", {
      tripId,
      dayNumber: req.dayNumber,
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      activityType: cleanActivityType,
      title: cleanTitle,
      description: cleanDescription,
      location: cleanLocation,
      cost: cleanCost,
      bookingUrl: cleanBookingUrl,
      weatherDependent
    });

    try {
      const item = await tripDB.queryRow<ItineraryItem>`
        INSERT INTO itinerary_items (
          trip_id, day_number, start_time, end_time, activity_type,
          title, description, location, cost, booking_url, weather_dependent
        )
        VALUES (
          ${tripId}, 
          ${req.dayNumber}, 
          ${cleanStartTime}, 
          ${cleanEndTime}, 
          ${cleanActivityType}, 
          ${cleanTitle}, 
          ${cleanDescription}, 
          ${cleanLocation},
          ${cleanCost}, 
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
        console.error("No item returned from database insertion");
        throw APIError.internal("Failed to create itinerary item - no result returned");
      }

      console.log("Successfully created itinerary item:", item);
      return item;
    } catch (error: any) {
      console.error("Database error inserting itinerary item:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error detail:", error.detail);
      console.error("Error constraint:", error.constraint);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle specific PostgreSQL errors
      if (error.code) {
        switch (error.code) {
          case '23502': // NOT NULL violation
            const field = error.column || 'unknown field';
            throw APIError.invalidArgument(`Missing required field: ${field}`);
          case '23503': // FOREIGN KEY violation
            throw APIError.invalidArgument("Invalid trip ID reference");
          case '23514': // CHECK constraint violation
            const constraintName = error.constraint || 'unknown constraint';
            console.error("Check constraint violation:", constraintName, error.detail);
            if (constraintName.includes('day_number')) {
              throw APIError.invalidArgument("Day number must be a positive integer");
            } else if (constraintName.includes('activity_type')) {
              throw APIError.invalidArgument("Invalid activity type");
            } else if (constraintName.includes('cost')) {
              throw APIError.invalidArgument("Cost must be non-negative");
            } else {
              throw APIError.invalidArgument(`Invalid data: ${error.detail || error.message}`);
            }
          case '22007': // Invalid datetime format
            throw APIError.invalidArgument("Invalid time format - use HH:MM");
          case '22P02': // Invalid input syntax
            throw APIError.invalidArgument("Invalid data format");
          default:
            console.error("Unhandled database error code:", error.code);
            throw APIError.internal(`Database constraint error: ${error.message}`);
        }
      }
      
      throw APIError.internal(`Database error while creating itinerary item: ${error.message}`);
    }
  }
);
