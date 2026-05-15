import { useQuery } from "@tanstack/react-query";
import { type Vacancy } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function CareersPage() {
  const { data: vacancies = [], isLoading } = useQuery<Vacancy[]>({
    queryKey: ["/api/public/vacancies"],
    queryFn: async () => {
      const res = await fetch("/api/public/vacancies");
      if (!res.ok) throw new Error("Failed to fetch vacancies");
      return res.json();
    },
  });

  const openVacancies = vacancies.filter((v) => v.status === "Open");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Explore exciting career opportunities at Emblazers. We're looking for talented individuals
            to help us shape the future of education.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Open Positions</h2>
          <p className="text-muted-foreground">
            {openVacancies.length} {openVacancies.length === 1 ? "position" : "positions"} available
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : openVacancies.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Open Positions</h3>
              <p className="text-muted-foreground">
                There are currently no open positions. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {openVacancies.map((vacancy) => (
              <Card key={vacancy.id} className="hover-elevate transition-all" data-testid={`card-vacancy-${vacancy.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">{vacancy.title}</CardTitle>
                    <Badge variant="secondary">{vacancy.employmentType}</Badge>
                  </div>
                  <CardDescription>{vacancy.department} - {vacancy.designation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{vacancy.positions} {vacancy.positions === 1 ? "position" : "positions"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Apply by {new Date(vacancy.lastDate).toLocaleDateString()}</span>
                    </div>
                    {vacancy.salaryRange && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{vacancy.salaryRange}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2 mb-4">{vacancy.description}</p>
                  <Link href={`/careers/${vacancy.id}`}>
                    <Button className="w-full" data-testid={`button-view-${vacancy.id}`}>
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-muted py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Emblazers School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
