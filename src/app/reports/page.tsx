"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  FileText,
  Download,
  Trash2,
  AlertCircle,
  Loader2,
  Plus
} from "lucide-react";
import {
  Button
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";

interface Report {
  id: number;
  reportSummary: string;
  generatedAt: string;
  pdfUrl?: string;
  assessment?: {
    applicantName: string;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push("/login");
    } else if (session?.user) {
      fetchReports();
    }
  }, [session, sessionPending, router]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) throw new Error("No auth token");

      const res = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load reports: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/reports?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Report deleted!");
      fetchReports();
    } catch (err: any) {
      toast.error("Failed to delete report");
    }
  };

  const handleDownload = (pdfUrl?: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast.error("No PDF available for download");
    }
  };

  if (sessionPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !session?.user) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold">Error</h2>
          <p>{error || "Authentication required"}</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Risk Reports</h1>
            <p className="text-muted-foreground">View and manage your generated reports</p>
          </div>
          <Button onClick={() => router.push("/assessments")} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Back to Assessments
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Reports</CardTitle>
            <CardDescription>Total: {reports.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No reports yet. Generate one from your assessments!</p>
                <Button onClick={() => router.push("/assessments")} className="mt-4">
                  Create Assessment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Date Generated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.assessment?.applicantName || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.reportSummary}</TableCell>
                      <TableCell>{new Date(report.generatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report.pdfUrl)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}