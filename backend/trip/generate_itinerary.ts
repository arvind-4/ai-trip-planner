import { api } from "encore.dev/api";
import { GenerateItineraryRequest, ItineraryItem, ActivityType } from "./types";

interface GenerateItineraryResponse {
  itinerary: ItineraryItem[];
}

// Generates an AI-powered itinerary based on user preferences and destination.
export const generateItinerary = api<GenerateItineraryRequest, GenerateItineraryResponse>(
  { expose: true, method: "POST", path: "/generate-itinerary" },
  async (req) => {
    // Calculate trip duration
    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Generate sample itinerary based on preferences
    const itinerary: Partial<ItineraryItem>[] = [];
    let itemId = 1;

    for (let day = 1; day <= days; day++) {
      // Morning activities
      if (req.preferences.interests.includes("culture")) {
        itinerary.push({
          id: itemId++,
          tripId: 0,
          dayNumber: day,
          startTime: "09:00",
          endTime: "11:30",
          activityType: "attraction" as ActivityType,
          title: `Cultural Site Visit - Day ${day}`,
          description: "Explore local museums, historical sites, or cultural landmarks",
          location: req.destination,
          cost: req.preferences.travelStyle === "luxury" ? 50 : req.preferences.travelStyle === "mid-range" ? 25 : 15,
          weatherDependent: false,
          createdAt: new Date().toISOString()
        });
      }

      if (req.preferences.interests.includes("food")) {
        itinerary.push({
          id: itemId++,
          tripId: 0,
          dayNumber: day,
          startTime: "12:00",
          endTime: "13:30",
          activityType: "restaurant" as ActivityType,
          title: `Local Cuisine Experience - Day ${day}`,
          description: "Try authentic local dishes at recommended restaurants",
          location: req.destination,
          cost: req.preferences.travelStyle === "luxury" ? 80 : req.preferences.travelStyle === "mid-range" ? 40 : 20,
          weatherDependent: false,
          createdAt: new Date().toISOString()
        });
      }

      // Afternoon activities
      if (req.preferences.interests.includes("nature")) {
        itinerary.push({
          id: itemId++,
          tripId: 0,
          dayNumber: day,
          startTime: "14:30",
          endTime: "17:00",
          activityType: "activity" as ActivityType,
          title: `Nature Activity - Day ${day}`,
          description: "Hiking, parks, scenic viewpoints, or outdoor activities",
          location: req.destination,
          cost: req.preferences.travelStyle === "luxury" ? 60 : req.preferences.travelStyle === "mid-range" ? 30 : 10,
          weatherDependent: true,
          createdAt: new Date().toISOString()
        });
      }

      // Evening activities
      if (req.preferences.interests.includes("nightlife") && day < days) {
        itinerary.push({
          id: itemId++,
          tripId: 0,
          dayNumber: day,
          startTime: "20:00",
          endTime: "23:00",
          activityType: "activity" as ActivityType,
          title: `Evening Entertainment - Day ${day}`,
          description: "Local bars, live music, cultural performances, or nightlife",
          location: req.destination,
          cost: req.preferences.travelStyle === "luxury" ? 100 : req.preferences.travelStyle === "mid-range" ? 50 : 25,
          weatherDependent: false,
          createdAt: new Date().toISOString()
        });
      }

      // Accommodation (except last day)
      if (day < days) {
        const accommodationCost = req.preferences.travelStyle === "luxury" ? 200 : 
                                req.preferences.travelStyle === "mid-range" ? 100 : 50;
        
        itinerary.push({
          id: itemId++,
          tripId: 0,
          dayNumber: day,
          startTime: "22:00",
          endTime: "08:00",
          activityType: "accommodation" as ActivityType,
          title: `${req.preferences.accommodation.charAt(0).toUpperCase() + req.preferences.accommodation.slice(1)} Stay`,
          description: `Comfortable ${req.preferences.accommodation} accommodation`,
          location: req.destination,
          cost: accommodationCost,
          weatherDependent: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    return { itinerary: itinerary as ItineraryItem[] };
  }
);
