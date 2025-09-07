import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Calendar, MapPin, DollarSign } from "lucide-react";
import backend from "~backend/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TripsPage() {
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => backend.trip.listTrips(),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "planned":
        return "default";
      case "booked":
        return "outline";
      case "completed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">
            Manage and view all your planned adventures
          </p>
        </div>
        <Button asChild>
          <Link to="/plan">
            <Plus className="h-4 w-4 mr-2" />
            Plan New Trip
          </Link>
        </Button>
      </div>

      {!tripsData?.trips.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No trips yet</CardTitle>
            <CardDescription className="mb-4">
              Start planning your first adventure with AI-powered trip planning
            </CardDescription>
            <Button asChild>
              <Link to="/plan">Plan Your First Trip</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripsData.trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to={`/trips/${trip.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">{trip.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {trip.destination}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(trip.status)}>
                      {trip.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </div>
                  
                  {(trip.budgetMin || trip.budgetMax) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {trip.budgetMin && trip.budgetMax
                        ? `$${trip.budgetMin.toLocaleString()} - $${trip.budgetMax.toLocaleString()}`
                        : trip.budgetMin
                        ? `From $${trip.budgetMin.toLocaleString()}`
                        : `Up to $${trip.budgetMax.toLocaleString()}`}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {trip.preferences.interests.slice(0, 3).map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {trip.preferences.interests.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{trip.preferences.interests.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
