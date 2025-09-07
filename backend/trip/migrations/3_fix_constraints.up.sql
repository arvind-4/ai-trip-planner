-- Remove existing constraints that might be too restrictive
ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_activity_type_check;
ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_title_check;
ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_day_number_check;
ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS itinerary_items_cost_check;

-- Add more flexible constraints
ALTER TABLE itinerary_items ADD CONSTRAINT itinerary_items_day_number_check CHECK (day_number > 0);
ALTER TABLE itinerary_items ADD CONSTRAINT itinerary_items_cost_check CHECK (cost IS NULL OR cost >= 0);
ALTER TABLE itinerary_items ADD CONSTRAINT itinerary_items_activity_type_check CHECK (activity_type IN ('flight', 'accommodation', 'activity', 'restaurant', 'transport', 'attraction'));

-- Ensure title is not null but allow any non-empty string
ALTER TABLE itinerary_items ALTER COLUMN title SET NOT NULL;

-- Make weather_dependent not null with default
ALTER TABLE itinerary_items ALTER COLUMN weather_dependent SET NOT NULL;
ALTER TABLE itinerary_items ALTER COLUMN weather_dependent SET DEFAULT FALSE;

-- Update any existing rows that might have null weather_dependent
UPDATE itinerary_items SET weather_dependent = FALSE WHERE weather_dependent IS NULL;
