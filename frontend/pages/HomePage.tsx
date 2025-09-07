import { Link } from "react-router-dom";
import { MapPin, Brain, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          AI-Powered Trip Planning
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Let artificial intelligence create personalized travel itineraries that match your interests, 
          budget, and travel style. Smart planning for unforgettable journeys.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/plan">Start Planning</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link to="/trips">View My Trips</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardHeader>
            <Brain className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>AI-Powered</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Advanced AI algorithms analyze your preferences to create the perfect trip
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <MapPin className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Personalized</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Every itinerary is tailored to your interests, budget, and travel style
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Calendar className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Complete Itineraries</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Day-by-day plans including activities, meals, and accommodations
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Sparkles className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Plans adapt to weather, events, and real-time conditions
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              1
            </div>
            <h3 className="text-xl font-semibold">Tell Us Your Preferences</h3>
            <p className="text-muted-foreground">
              Share your destination, dates, budget, and interests. The more we know, the better your trip.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              2
            </div>
            <h3 className="text-xl font-semibold">AI Creates Your Itinerary</h3>
            <p className="text-muted-foreground">
              Our AI analyzes thousands of options to create a personalized day-by-day plan.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
              3
            </div>
            <h3 className="text-xl font-semibold">Book and Enjoy</h3>
            <p className="text-muted-foreground">
              Review, customize, and book your perfect trip. Then just enjoy your journey!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 bg-accent rounded-lg p-12">
        <h2 className="text-3xl font-bold">Ready for Your Next Adventure?</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Join thousands of travelers who trust AI to plan their perfect trips. 
          Start planning your next adventure today.
        </p>
        <Button asChild size="lg" className="text-lg px-8">
          <Link to="/plan">Plan My Trip</Link>
        </Button>
      </section>
    </div>
  );
}
