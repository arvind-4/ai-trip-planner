import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Utensils, 
  Bed, 
  Camera, 
  Car,
  Plane,
  Sparkles,
  Edit
} from "lucide-react";
import backend from "~backend/client";
import type { ActivityType } from "~backend/trip/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  flight: Plane,
  accommodation: Bed,
  activity: Camera,
  restaurant: Utensils,
  transport: Car,
  attraction: MapPin,
};

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => backend.trip.getTrip({ id: parseInt(id!) }),
    enabled: !!id,
  });

  const generateItineraryMutation = useMutation({
    mutationFn: backend.trip.generateItinerary,
    onSuccess: async (data) => {
      // Add generated items to the trip
      for (const item of data.itinerary) {
        await backend.trip.addItineraryItem({
          tripId: parseInt(id!),
          dayNumber: item.dayNumber,
          startTime: item.startTime,
          endTime: item.endTime,
          activityType: item.activityType,
          title: item.title,
          description: item.description,
          location: item.location,
          cost: item.cost,
          bookingUrl: item.bookingUrl,
          weatherDependent: item.weatherDependent,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      toast({
        title: "Itinerary Generated!",
        description: "Your AI-powered itinerary has been created.",
      });
    },
    onError: (error) => {
      console.error("Failed to generate itinerary:", error);
      toast({
        title: "Error",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateItinerary = () => {
    if (!trip) return;

    generateItineraryMutation.mutate({
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budgetMax,
      preferences: trip.preferences,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const groupItineraryByDay = () => {
    if (!trip?.itinerary) return {};
    
    return trip.itinerary.reduce((acc, item) => {
      if (!acc[item.dayNumber]) {
        acc[item.dayNumber] = [];
      }
      acc[item.dayNumber].push(item);
      return acc;
    }, {} as Record<number, typeof trip.itinerary>);
  };

  const getDayDate = (dayNumber: number) => {
    if (!trip) return "";
    const startDate = new Date(trip.startDate);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayNumber - 1);
    return dayDate;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Loading trip...</h1>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Trip not found</h1>
          <Button asChild className="mt-4">
            <Link to="/trips">Back to Trips</Link>
          </Button>
        </div>
      </div>
    );
  }

  const itineraryByDay = groupItineraryByDay();
  const hasItinerary = Object.keys(itineraryByDay).length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/trips">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {trip.destination}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {trip.status}
        </Badge>
      </div>

      {/* Trip Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
            </div>
            {(trip.budgetMin || trip.budgetMax) && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {trip.budgetMin && trip.budgetMax
                    ? `$${trip.budgetMin.toLocaleString()} - $${trip.budgetMax.toLocaleString()}`
                    : trip.budgetMin
                    ? `From $${trip.budgetMin.toLocaleString()}`
                    : `Up to $${trip.budgetMax.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {trip.preferences.interests.map((interest) => (
                <Badge key={interest} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Travel Style:</span>
              <p className="capitalize">{trip.preferences.travelStyle}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Accommodation:</span>
              <p className="capitalize">{trip.preferences.accommodation}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pace:</span>
              <p className="capitalize">{trip.preferences.pace}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Group Size:</span>
              <p>{trip.preferences.groupSize} people</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itinerary Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Itinerary</h2>
          {!hasItinerary && (
            <Button 
              onClick={handleGenerateItinerary}
              disabled={generateItineraryMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateItineraryMutation.isPending ? "Generating..." : "Generate AI Itinerary"}
            </Button>
          )}
        </div>

        {!hasItinerary ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No itinerary yet</CardTitle>
              <CardDescription className="mb-4">
                Generate an AI-powered itinerary based on your preferences
              </CardDescription>
              <Button 
                onClick={handleGenerateItinerary}
                disabled={generateItineraryMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateItineraryMutation.isPending ? "Generating..." : "Generate Itinerary"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(itineraryByDay)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([dayNumber, items]) => {
                const dayDate = getDayDate(parseInt(dayNumber));
                return (
                  <Card key={dayNumber}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Day {dayNumber} - {formatDate(dayDate.toISOString())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {items
                          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
                          .map((item, index) => {
                            const Icon = activityIcons[item.activityType];
                            return (
                              <div key={item.id}>
                                <div className="flex items-start gap-4">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">{item.title}</h4>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {item.startTime && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(item.startTime)}
                                            {item.endTime && ` - ${formatTime(item.endTime)}`}
                                          </div>
                                        )}
                                        {item.cost && (
                                          <div className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            ${item.cost}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    )}
                                    {item.location && (
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {item.location}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="capitalize">
                                        {item.activityType}
                                      </Badge>
                                      {item.weatherDependent && (
                                        <Badge variant="secondary">Weather Dependent</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {index < items.length - 1 && <Separator className="my-4" />}
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
