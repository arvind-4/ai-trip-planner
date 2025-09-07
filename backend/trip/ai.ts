import { secret } from "encore.dev/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateItineraryRequest, ItineraryItem } from "./types";

// Define the secret for the Google Gemini API Key.
// TODO: Set this in the Leap UI in the Infrastructure tab.
const googleGeminiAPIKey = secret("GoogleGeminiAPIKey");

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(googleGeminiAPIKey());
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

function buildPrompt(req: GenerateItineraryRequest): string {
    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let budgetInfo = "Not specified";
    if (req.budget) {
        budgetInfo = `Around $${req.budget} total for the trip`;
    }

    const interests = req.preferences.interests.join(', ');

    return `
You are an expert travel planner. Create a personalized, day-by-day travel itinerary based on the following details.

**Trip Details:**
- Destination: ${req.destination}
- Trip Duration: ${days} days
- Dates: ${req.startDate} to ${req.endDate}
- Budget: ${budgetInfo}
- Travel Style: ${req.preferences.travelStyle}
- Accommodation Preference: ${req.preferences.accommodation}
- Travel Pace: ${req.preferences.pace}
- Group Size: ${req.preferences.groupSize} people
- Interests: ${interests}

**Instructions:**
1.  Generate a detailed itinerary for each day of the trip.
2.  Return the response as a single, valid JSON array of objects. Do not include any text, explanations, or markdown formatting like \`\`\`json ... \`\`\` outside of the JSON array itself.
3.  Each object in the array represents a single itinerary item and must have the following fields:
    - "dayNumber": (number) The day of the trip (e.g., 1, 2, 3).
    - "startTime": (string) The start time in "HH:MM" 24-hour format.
    - "endTime": (string) The end time in "HH:MM" 24-hour format.
    - "activityType": (string) The type of activity. Must be one of the following: "flight", "accommodation", "activity", "restaurant", "transport", "attraction".
    - "title": (string) A concise title for the activity.
    - "description": (string) A brief, engaging description of the activity.
    - "location": (string, optional) The specific location or address for the activity.
    - "cost": (number, optional) An estimated cost per person in USD.
    - "weatherDependent": (boolean) Set to true if the activity is weather-dependent.

**Example of a single item object:**
{
  "dayNumber": 1,
  "startTime": "09:00",
  "endTime": "11:30",
  "activityType": "attraction",
  "title": "Visit the Louvre Museum",
  "description": "Explore one of the world's largest art museums and a historic monument in Paris.",
  "location": "Louvre Museum, 75001 Paris, France",
  "cost": 20,
  "weatherDependent": false
}

Now, generate the complete JSON array for the trip described above.
`;
}

export async function generateTripItinerary(req: GenerateItineraryRequest): Promise<ItineraryItem[]> {
    const prompt = buildPrompt(req);

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean the response text to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const itinerary = JSON.parse(cleanedText);

        // Basic validation to ensure we got an array
        if (!Array.isArray(itinerary)) {
            console.error("AI response is not a JSON array:", itinerary);
            throw new Error("AI response is not in the expected format.");
        }

        // The response from the AI might not perfectly match our ItineraryItem type,
        // but it should be close enough for the frontend to handle.
        // The frontend has validation logic before calling addItineraryItem.
        return itinerary as ItineraryItem[];

    } catch (error) {
        console.error("Error generating itinerary with Google Gemini:", error);
        throw new Error("Failed to generate AI-powered itinerary.");
    }
}
