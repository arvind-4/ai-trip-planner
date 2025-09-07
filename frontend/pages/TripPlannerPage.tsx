import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, DollarSign, Users, Settings } from "lucide-react";
import backend from "~backend/client";
import type { TripPreferences, Destination } from "~backend/trip/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

export function TripPlannerPage() {
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    budgetMin: "",
    budgetMax: "",
    preferences: {
      interests: [] as string[],
      travelStyle: "mid-range" as const,
      accommodation: "hotel" as const,
      pace: "moderate" as const,
      groupSize: 2,
    } as TripPreferences,
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: destinationsData } = useQuery({
    queryKey: ["destinations"],
    queryFn: () => backend.trip.listDestinations(),
  });

  const createTripMutation = useMutation({
    mutationFn: backend.trip.createTrip,
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "Trip Created!",
        description: "Your trip has been successfully created.",
      });
      navigate(`/trips/${trip.id}`);
    },
    onError: (error) => {
      console.error("Failed to create trip:", error);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const interestOptions = [
    "culture",
    "nature",
    "food",
    "nightlife",
    "adventure",
    "relaxation",
    "shopping",
    "history",
    "art",
    "architecture",
  ];

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: checked
          ? [...prev.preferences.interests, interest]
          : prev.preferences.interests.filter((i) => i !== interest),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.destination || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTripMutation.mutate({
      title: formData.title,
      destination: formData.destination,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : undefined,
      budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
      preferences: formData.preferences,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Plan Your Perfect Trip</h1>
        <p className="text-muted-foreground">
          Tell us about your travel preferences and let AI create a personalized itinerary for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trip Details
            </CardTitle>
            <CardDescription>Basic information about your trip</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Trip Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Paris Adventure 2024"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Select
                  value={formData.destination}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, destination: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationsData?.destinations.map((dest: Destination) => (
                      <SelectItem key={dest.id} value={dest.name}>
                        {dest.name}, {dest.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget
            </CardTitle>
            <CardDescription>Your travel budget range (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Minimum Budget ($)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  placeholder="500"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Maximum Budget ($)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  placeholder="2000"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Travel Preferences
            </CardTitle>
            <CardDescription>Help us understand what you love to do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Interests */}
            <div className="space-y-3">
              <Label>Interests</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestOptions.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={formData.preferences.interests.includes(interest)}
                      onCheckedChange={(checked) =>
                        handleInterestChange(interest, checked as boolean)
                      }
                    />
                    <Label htmlFor={interest} className="capitalize">
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Travel Style</Label>
                <Select
                  value={formData.preferences.travelStyle}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, travelStyle: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid-range">Mid-range</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Accommodation Type</Label>
                <Select
                  value={formData.preferences.accommodation}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, accommodation: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="resort">Resort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Travel Pace</Label>
                <Select
                  value={formData.preferences.pace}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, pace: value as any },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupSize">Group Size</Label>
                <Input
                  id="groupSize"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.preferences.groupSize}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, groupSize: parseInt(e.target.value) || 1 },
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            className="px-8"
            disabled={createTripMutation.isPending}
          >
            {createTripMutation.isPending ? "Creating Trip..." : "Create My Trip"}
          </Button>
        </div>
      </form>
    </div>
  );
}
