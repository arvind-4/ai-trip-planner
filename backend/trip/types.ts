export type TripStatus = "draft" | "planned" | "booked" | "completed";
export type ActivityType = "flight" | "accommodation" | "activity" | "restaurant" | "transport" | "attraction";

export interface TripPreferences {
  interests: string[];
  travelStyle: "budget" | "mid-range" | "luxury";
  accommodation: "hostel" | "hotel" | "apartment" | "resort";
  pace: "relaxed" | "moderate" | "packed";
  groupSize: number;
  accessibility?: string[];
}

export interface Trip {
  id: number;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetMin?: number;
  budgetMax?: number;
  preferences: TripPreferences;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryItem {
  id: number;
  tripId: number;
  dayNumber: number;
  startTime?: string;
  endTime?: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  location?: string;
  cost?: number;
  bookingUrl?: string;
  weatherDependent: boolean;
  createdAt: string;
}

export interface Destination {
  id: number;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
  averageCostPerDay?: number;
  bestMonths: string[];
  tags: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface CreateTripRequest {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetMin?: number;
  budgetMax?: number;
  preferences: TripPreferences;
}

export interface UpdateTripRequest {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferences?: TripPreferences;
  status?: TripStatus;
}

export interface CreateItineraryItemRequest {
  dayNumber: number;
  startTime?: string;
  endTime?: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  location?: string;
  cost?: number;
  bookingUrl?: string;
  weatherDependent?: boolean;
}

export interface GenerateItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  preferences: TripPreferences;
}

export interface TripWithItinerary extends Trip {
  itinerary: ItineraryItem[];
}
