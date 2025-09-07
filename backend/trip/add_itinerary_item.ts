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

    // --- Stricter Validation and Sanitization ---
    const dayNumber = req.dayNumber;
    if (typeof dayNumber !== 'number' || !Number.isInteger(dayNumber) || dayNumber < 1) {
        throw APIError.invalidArgument("dayNumber must be a positive integer");
    }

    const activityType = req.activityType;
    const validActivityTypes = ["flight", "accommodation", "activity", "restaurant", "transport", "attraction"];
    if (typeof activityType !== 'string' || !validActivityTypes.includes(activityType.trim())) {
        throw APIError.invalidArgument(`activityType must be one of: ${validActivityTypes.join(", ")}`);
    }

    const title = req.title;
    if (typeof title !== 'string' || title.trim() === '') {
        throw APIError.invalidArgument("title is required and cannot be empty");
    }

    const cost = req.cost;
    if (cost !== undefined && cost !== null && (typeof cost !== 'number' || cost < 0)) {
        throw APIError.invalidArgument("cost must be a non-negative number");
    }

    const cleanReq = {
        dayNumber: dayNumber,
        activityType: activityType.trim(),
        title: title.trim(),
        startTime: (req.startTime && typeof req.startTime === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.startTime.trim())) ? req.startTime.trim() : null,
        endTime: (req.endTime && typeof req.endTime === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.endTime.trim())) ? req.endTime.trim() : null,
        description: (req.description && typeof req.description === 'string') ? req.description.trim() : null,
        location: (req.location && typeof req.location === 'string') ? req.location.trim() : null,
        cost: (cost === undefined || cost === null) ? null : Math.floor(cost),
        bookingUrl: (req.bookingUrl && typeof req.bookingUrl === 'string') ? req.bookingUrl.trim() : null,
        weatherDependent: Boolean(req.weatherDependent)
    };
    // --- End Validation ---

    try {
      const item = await tripDB.queryRow<ItineraryItem>`
        INSERT INTO itinerary_items (
          trip_id, day_number, start_time, end_time, activity_type,
          title, description, location, cost, booking_url, weather_dependent
        )
        VALUES (
          ${tripId}, 
          ${cleanReq.dayNumber}, 
          ${cleanReq.startTime}, 
          ${cleanReq.endTime}, 
          ${cleanReq.activityType}, 
          ${cleanReq.title}, 
          ${cleanReq.description}, 
          ${cleanReq.location},
          ${cleanReq.cost}, 
          ${cleanReq.bookingUrl}, 
          ${cleanReq.weatherDependent}
        )
        RETURNING 
          id, trip_id as "tripId", day_number as "dayNumber",
          start_time as "startTime", end_time as "endTime",
          activity_type as "activityType", title, description, location,
          cost, booking_url as "bookingUrl", weather_dependent as "weatherDependent",
          created_at as "createdAt"
      `;

      if (!item) {
        throw APIError.internal("Failed to create itinerary item - no result returned from database");
      }

      return item;
    } catch (error: any) {
        const errorDetails = {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
        };
        console.error("Database error inserting itinerary item:", {
            ...errorDetails,
            request: { tripId, ...req }
        });
        
        if (error instanceof APIError) {
            throw error;
        }
        
        // Handle specific PostgreSQL errors to return meaningful API errors
        if (error.code) {
            switch (error.code) {
                case '23502': // not_null_violation
                    throw APIError.invalidArgument(`A required field is missing: ${error.column}`, errorDetails);
                case '23503': // foreign_key_violation
                    throw APIError.notFound(`Invalid reference: ${error.constraint}`, errorDetails);
                case '23514': // check_violation
                    throw APIError.invalidArgument(`Data violates constraint '${error.constraint}'`, errorDetails);
                case '22P02': // invalid_text_representation
                    throw APIError.invalidArgument(`Invalid data format: ${error.message}`, errorDetails);
                default:
                    // For unhandled specific codes, still throw internal but with all details
                    throw APIError.internal(`A database error occurred (code: ${error.code})`, errorDetails);
            }
        }
        
        // For generic errors, check message for common patterns
        if (error.message && error.message.includes('violates check constraint')) {
            throw APIError.invalidArgument(error.message, errorDetails);
        }
        
        throw APIError.internal("An unexpected database error occurred.", errorDetails);
    }
  }
);
