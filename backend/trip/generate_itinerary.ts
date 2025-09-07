import { api } from "encore.dev/api";
import { GenerateItineraryRequest, ItineraryItem } from "./types";
import { generateTripItinerary } from "./ai";

interface GenerateItineraryResponse {
  itinerary: ItineraryItem[];
}

// Generates an AI-powered itinerary based on user preferences and destination.
export const generateItinerary = api<GenerateItineraryRequest, GenerateItineraryResponse>(
  { expose: true, method: "POST", path: "/generate-itinerary" },
  async (req) => {
    const itinerary = await generateTripItinerary(req);
    return { itinerary };
  }
);
