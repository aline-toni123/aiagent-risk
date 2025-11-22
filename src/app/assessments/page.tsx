"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  FileText,
  Calculator
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
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  toast
} from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

interface Assessment {
  id: number;
  applicantName: string;
  creditScore: number;
  income: number;
  debtToIncomeRatio: number;
  riskLevel: string;
  aiScore: number;
  createdAt: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    applicantName: '',
    creditScore: '',
    income: '',
    debtToIncomeRatio: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push("/login");
    } else if (session?.user) {
      fetchAssessments();
    }
  }, [session, sessionPending, router]);

  const fetchAssessments = async () => {
    try {
      const res = await fetch("/api/assessments");
      if (!res.ok) throw new Error("Failed to fetch assessments");
      const data = await res.json();
      setAssessments(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load assessments: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = {
        applicantName: formData.applicantName.trim(),
        creditScore: parseFloat(formData.creditScore),
        income: parseFloat(formData.income),
        debtToIncomeRatio: parseFloat(formData.debtToIncomeRatio)
      };

      // Basic validation
      if (!body.applicantName) throw new Error("Applicant name required");
      if (isNaN(body.creditScore) || body.creditScore < 300 || body.creditScore > 850) throw new Error("Credit score must be 300-850");
      if (isNaN(body.income) || body.income <= 0) throw new Error("Income must be positive");
      if (isNaN(body.debtToIncomeRatio) || body.debtToIncomeRatio < 0 || body.debtToIncomeRatio > 1) throw new Error("DTI must be 0-1");

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create assessment");
      }

      toast.success("Assessment created successfully!");
      setFormData({ applicantName: '', creditScore: '', income: '', debtToIncomeRatio: '' });
      fetchAssessments(); // Refresh list
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;

    try {
      const res = await fetch(`/api/assessments?id=${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Assessment deleted!");
      fetchAssessments();
    } catch (err: any) {
      toast.error("Failed to delete assessment");
    }
  };

  const handleGenerateReport = async (assessmentId: number, applicantName: string, aiScore: number, riskLevel: string) => {
    if (!confirm(`Generate report for ${applicantName}?`)) return;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assessmentId,
          reportSummary: `Comprehensive risk analysis for ${applicantName}. AI Score: ${aiScore}, Risk Level: ${riskLevel}.`,
          pdfUrl: `/reports/${assessmentId}.pdf` // Simulated URL
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate report");
      }

      toast.success("Report generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate report: " + err.message);
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

  // Prepare pie chart data
  const riskLevelCounts = assessments.reduce((acc: any, a) => {
    acc[a.riskLevel] = (acc[a.riskLevel] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(riskLevelCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // low, medium, high, critical

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Risk Assessments</h1>
            <p className="text-muted-foreground">Manage your credit risk assessments</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
                <DialogDescription>Enter applicant details to calculate risk score</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="applicantName">Applicant Name</Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="creditScore">Credit Score</Label>
                  <Input
                    id="creditScore"
                    type="number"
                    value={formData.creditScore}
                    onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                    placeholder="750"
                    min="300"
                    max="850"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="income">Annual Income ($)</Label>
                  <Input
                    id="income"
                    type="number"
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    placeholder="80000"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="debtToIncomeRatio">Debt-to-Income Ratio</Label>
                  <Input
                    id="debtToIncomeRatio"
                    type="number"
                    step="0.01"
                    value={formData.debtToIncomeRatio}
                    onChange={(e) => setFormData({ ...formData, debtToIncomeRatio: e.target.value })}
                    placeholder="0.36"
                    min="0"
                    max="1"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Assessment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>
                You have {assessments.length} total assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No assessments found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.applicantName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            {assessment.aiScore}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${assessment.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              assessment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                assessment.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'}`}>
                            {assessment.riskLevel.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(assessment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleGenerateReport(assessment.id, assessment.applicantName, assessment.aiScore, assessment.riskLevel)}
                              title="Generate Report"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(assessment.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Overview of risk levels across all assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}