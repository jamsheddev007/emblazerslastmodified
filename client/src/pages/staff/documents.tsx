import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { staffNavItems, useStaffDocuments } from "./staff-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ExternalLink } from "lucide-react";

export default function StaffDocuments() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { data: documents = [], isLoading } = useStaffDocuments();

  useEffect(() => {
    if (!session || session.role !== "staff" || !session.loggedIn) {
      setLocation("/staff/login");
    }
  }, [session, setLocation]);

  if (!session || session.role !== "staff") return null;

  return (
    <ModuleLayout module="hr" navItems={staffNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">My Documents</h1>
          <p className="text-muted-foreground mt-1">View your uploaded documents</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-documents">No documents uploaded yet. Contact HR to upload your documents.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any) => (
              <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-teal-600 shrink-0" />
                    <span className="truncate">{doc.documentName || doc.documentType}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" data-testid={`badge-doc-type-${doc.id}`}>{doc.documentType}</Badge>
                  </div>
                  {doc.uploadedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline mt-2"
                      data-testid={`link-download-${doc.id}`}
                    >
                      <ExternalLink className="w-3 h-3" /> View / Download
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
