import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { type Vacancy, type InsertApplicant } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Clock, Users, CheckCircle } from "lucide-react";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cnic: "",
    address: "",
    qualification: "",
    experience: "",
    expectedSalary: "",
  });

  const { data: vacancy, isLoading, error } = useQuery<Vacancy>({
    queryKey: ["/api/public/vacancies", id],
    queryFn: async () => {
      const res = await fetch(`/api/public/vacancies/${id}`);
      if (!res.ok) throw new Error("Failed to fetch vacancy");
      return res.json();
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: InsertApplicant) => {
      const res = await fetch("/api/public/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit application");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit application. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vacancy) return;

    if (!formData.name || !formData.email || !formData.phone || !formData.cnic || !formData.qualification || !formData.experience) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const applicationData: InsertApplicant = {
      vacancyId: vacancy.id,
      vacancyTitle: vacancy.title,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cnic: formData.cnic,
      address: formData.address || undefined,
      qualification: formData.qualification,
      experience: formData.experience,
      expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "New",
    };

    applyMutation.mutate(applicationData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vacancy Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This vacancy may have been closed or removed.
              </p>
              <Link href="/careers">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Careers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (vacancy.status !== "Open") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Applications Closed</h3>
              <p className="text-muted-foreground mb-4">
                This vacancy is no longer accepting applications.
              </p>
              <Link href="/careers">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  View Other Openings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Application Submitted!</h3>
              <p className="text-muted-foreground mb-6">
                Thank you for applying for the {vacancy.title} position. We'll review your application and get back to you soon.
              </p>
              <Link href="/careers">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Careers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <Link href="/careers">
            <Button variant="ghost" className="mb-4 text-primary-foreground hover:text-primary-foreground/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Careers
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{vacancy.title}</h1>
            <Badge variant="secondary">{vacancy.employmentType}</Badge>
          </div>
          <p className="text-lg opacity-90">{vacancy.department} - {vacancy.designation}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{vacancy.positions} {vacancy.positions === 1 ? "position" : "positions"} available</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Apply by {new Date(vacancy.lastDate).toLocaleDateString()}</span>
                </div>
                {vacancy.salaryRange && (
                  <div className="text-sm">
                    <strong>Salary Range:</strong> {vacancy.salaryRange}
                  </div>
                )}
                <div className="text-sm">
                  <strong>Qualifications:</strong> {vacancy.qualifications}
                </div>
                <div className="text-sm">
                  <strong>Experience:</strong> {vacancy.experience}
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vacancy.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Position</CardTitle>
                <CardDescription>Fill in your details to submit your application</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        required
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="03XX-XXXXXXX"
                        required
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnic">CNIC Number *</Label>
                      <Input
                        id="cnic"
                        value={formData.cnic}
                        onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                        placeholder="XXXXX-XXXXXXX-X"
                        required
                        data-testid="input-cnic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your complete address"
                      rows={2}
                      data-testid="input-address"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification *</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. M.Ed, B.Sc"
                        required
                        data-testid="input-qualification"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience *</Label>
                      <Input
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g. 3 years in teaching"
                        required
                        data-testid="input-experience"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedSalary">Expected Salary (PKR)</Label>
                    <Input
                      id="expectedSalary"
                      type="number"
                      value={formData.expectedSalary}
                      onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                      placeholder="e.g. 60000"
                      data-testid="input-expected-salary"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={applyMutation.isPending} data-testid="button-submit">
                      {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Emblazers School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
