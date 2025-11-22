"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Activity,
  Calculator,
  FileText,
  BarChart3,
  Loader2,
  User,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChatSidebar } from "@/components/chat-sidebar";

interface Assessment {
  id: number;
  applicantName: string;
  aiScore: number;
  riskLevel: string;
  createdAt: string;
}

interface Alert {
  id: number;
  severity: string;
  message: string;
  createdAt: string;
  assessment?: {
    applicantName: string;
  };
}

interface Report {
  id: number;
  generatedAt: string;
  assessment?: {
    applicantName: string;
  };
}

interface ActivityItem {
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "info" | "error";
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState('assessments');
  const [stats, setStats] = useState([
    {
      title: "Total Risk Score",
      value: "0",
      change: "+0%",
      icon: Shield,
      trend: "up",
    },
    {
      title: "Active Assessments",
      value: "0",
      change: "+0",
      icon: Activity,
      trend: "up",
    },
    {
      title: "High Risk Alerts",
      value: "0",
      change: "-0",
      icon: AlertTriangle,
      trend: "down",
    },
    {
      title: "Monthly Analysis",
      value: "0",
      change: "+0%",
      icon: BarChart3,
      trend: "up",
    },
  ]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [formData, setFormData] = useState({
    applicantName: '',
    creditScore: '',
    income: '',
    debtToIncomeRatio: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Finance Hub data states
  const [accountsData, setAccountsData] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [budgetsData, setBudgetsData] = useState<any[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [goalsData, setGoalsData] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  const [plannerMode, setPlannerMode] = useState(false);
  const [crewMode, setCrewMode] = useState(false);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error("Authentication required");
        router.push("/login");
        return;
      }

      setIsLoading(true);
      setError(null);

      // Fetch assessments
      const assessmentsRes = await fetch("/api/assessments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!assessmentsRes.ok) throw new Error("Failed to fetch assessments");
      const assessments: Assessment[] = await assessmentsRes.json();

      // Fetch alerts
      const alertsRes = await fetch("/api/alerts?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!alertsRes.ok) throw new Error("Failed to fetch alerts");
      const alerts: Alert[] = await alertsRes.json();

      // Fetch reports
      const reportsRes = await fetch("/api/reports?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reportsRes.ok) throw new Error("Failed to fetch reports");
      const reports: Report[] = await reportsRes.json();

      // Calculate stats
      const totalAssessments = assessments.length;
      const avgRiskScore = assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + (a.aiScore || 0), 0) / assessments.length)
        : 0;
      const highAlerts = alerts.filter(a => ['high', 'critical'].includes(a.severity)).length;
      const monthlyReports = reports.filter(r => {
        const generatedAt = new Date(r.generatedAt);
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return generatedAt > monthAgo;
      }).length;

      setStats([
        {
          title: "Total Risk Score",
          value: avgRiskScore.toString(),
          change: "+12%",
          icon: Shield,
          trend: "up",
        },
        {
          title: "Active Assessments",
          value: totalAssessments.toString(),
          change: "+2",
          icon: Activity,
          trend: "up",
        },
        {
          title: "High Risk Alerts",
          value: highAlerts.toString(),
          change: "-1",
          icon: AlertTriangle,
          trend: "down",
        },
        {
          title: "Monthly Analysis",
          value: monthlyReports.toString(),
          change: "+8%",
          icon: BarChart3,
          trend: "up",
        },
      ]);

      // Combine recent activity
      const allActivity: ActivityItem[] = [
        ...assessments.slice(0, 5).map(a => ({
          title: "Risk assessment completed",
          description: `${a.applicantName} - Score: ${a.aiScore}`,
          time: new Date(a.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) + ' ago', // Approximate
          type: "success" as const,
        })),
        ...alerts.slice(0, 5).map(al => ({
          title: `${al.severity.charAt(0).toUpperCase() + al.severity.slice(1)} risk alert`,
          description: `${al.assessment?.applicantName || 'Unknown'} - ${al.message.substring(0, 50)}...`,
          time: new Date(al.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) + ' ago',
          type: (al.severity === 'low' ? 'info' : al.severity === 'medium' ? 'warning' : 'warning') as "info" | "warning",
        })),
        ...reports.slice(0, 5).map(r => ({
          title: "Report generated",
          description: `${r.assessment?.applicantName || 'N/A'} risk analysis`,
          time: new Date(r.generatedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) + ' ago',
          type: "info" as const,
        })),
      ];

      // Sort by createdAt desc and take top 4
      const sortedActivity = allActivity
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()) // Approximate sort
        .slice(0, 4);

      setRecentActivity(sortedActivity);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load dashboard data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [router]);

  // Finance tab fetchers
  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      setFinanceError(null);
      const token = localStorage.getItem("bearer_token");
      if (!token) throw new Error("Authentication required");
      const res = await fetch('/api/finance/accounts?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load accounts');
      const data = await res.json();
      setAccountsData(data);
    } catch (e: any) {
      setFinanceError(e.message);
      toast.error(e.message);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      setFinanceError(null);
      const token = localStorage.getItem("bearer_token");
      if (!token) throw new Error("Authentication required");
      const res = await fetch('/api/finance/transactions?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load transactions');
      const data = await res.json();
      setTransactionsData(data);
    } catch (e: any) {
      setFinanceError(e.message);
      toast.error(e.message);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      setBudgetsLoading(true);
      setFinanceError(null);
      const token = localStorage.getItem("bearer_token");
      if (!token) throw new Error("Authentication required");
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const res = await fetch(`/api/finance/budgets?month=${month}&year=${year}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load budgets');
      const data = await res.json();
      setBudgetsData(data);
    } catch (e: any) {
      setFinanceError(e.message);
      toast.error(e.message);
    } finally {
      setBudgetsLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      setGoalsLoading(true);
      setFinanceError(null);
      const token = localStorage.getItem("bearer_token");
      if (!token) throw new Error("Authentication required");
      const res = await fetch('/api/finance/goals?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load goals');
      const data = await res.json();
      setGoalsData(data);
    } catch (e: any) {
      setFinanceError(e.message);
      toast.error(e.message);
    } finally {
      setGoalsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'accounts') fetchAccounts();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'budgets') fetchBudgets();
    if (activeTab === 'goals') fetchGoals();
  }, [activeTab]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) throw new Error("No auth token");

      const body = {
        applicantName: formData.applicantName.trim(),
        creditScore: parseFloat(formData.creditScore),
        income: parseFloat(formData.income),
        debtToIncomeRatio: parseFloat(formData.debtToIncomeRatio)
      };

      // Validation same as above
      if (!body.applicantName) throw new Error("Applicant name required");
      if (isNaN(body.creditScore) || body.creditScore < 300 || body.creditScore > 850) throw new Error("Credit score must be 300-850");
      if (isNaN(body.income) || body.income <= 0) throw new Error("Income must be positive");
      if (isNaN(body.debtToIncomeRatio) || body.debtToIncomeRatio < 0 || body.debtToIncomeRatio > 1) throw new Error("DTI must be 0-1");

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create assessment");
      }

      toast.success("Assessment created successfully!");
      setFormData({ applicantName: '', creditScore: '', income: '', debtToIncomeRatio: '' });
      setOpenModal(false);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error || "Authentication required"}</p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  // Calculate total score if no data yet
  const totalRiskScore = stats[0]?.value || 0;
  const activeAssessments = stats[1]?.value || 0;
  const highRiskAlerts = stats[2]?.value || 0;
  const monthlyAnalyses = stats[3]?.value || 0;
  const recentActivityData = recentActivity;

  const statsData = stats;

  const quickActions = [
    {
      title: "New Risk Assessment",
      description: "Calculate risk score for a new credit application",
      icon: Calculator,
      onClick: () => setShowModal(true),
    },
    {
      title: "View Reports",
      description: "Access detailed risk analysis reports",
      icon: FileText,
      href: "#reports",
    },
    {
      title: "Risk Analytics",
      description: "Explore comprehensive analytics dashboard",
      icon: TrendingUp,
      href: "#analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                Welcome back, {session.user.name}!
              </h1>
              <p className="text-muted-foreground">
                Here's your risk analytics overview
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p
                    className={`text-sm font-medium ${stat.trend === "up"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    {stat.change} from last month
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Finance Hub Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={activeTab === 'assessments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('assessments')}
          >
            Assessments
          </Button>
          <Button
            variant={activeTab === 'planner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('planner')}
          >
            Agentic Planner
          </Button>
          <Button
            variant={activeTab === 'crew' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('crew')}
          >
            🤖 AI Crew
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </Button>
          <Button
            variant={activeTab === 'accounts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('accounts')}
          >
            Accounts
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </Button>
          <Button
            variant={activeTab === 'budgets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('budgets')}
          >
            Budgets
          </Button>
          <Button
            variant={activeTab === 'goals' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('goals')}
          >
            Goals
          </Button>
        </div>

        {activeTab === 'assessments' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card
                    key={0}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setShowModal(true)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Calculator className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">New Risk Assessment</h3>
                        <p className="text-sm text-muted-foreground">
                          Calculate risk score for a new credit application
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setPlannerMode(true);
                      setIsChatOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Agentic Finance Plan</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate a step-by-step investment plan using AI
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/30"
                    onClick={() => {
                      setCrewMode(true);
                      setIsChatOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          🤖 Multi-Agent AI Crew
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Delegate tasks to specialized AI agents working together
                        </p>
                      </div>
                    </div>
                  </Card>
                  {quickActions.slice(1).map((action, index) => (
                    <Card
                      key={index}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={action.onClick}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <action.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Risk Overview Chart Placeholder */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Risk Trend Analysis</h3>
                <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Risk trend visualization
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
              <Card className="p-6">
                <div className="space-y-4">
                  {recentActivityData.length > 0 ? (
                    recentActivityData.map((activity, index) => (
                      <div
                        key={index}
                        className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                      >
                        <div
                          className={`mt-1 h-2 w-2 rounded-full ${activity.type === "success"
                              ? "bg-green-500"
                              : activity.type === "warning"
                                ? "bg-yellow-500"
                                : activity.type === "info"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                        />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="mx-auto h-8 w-8 mb-2" />
                      <p>No recent activity found. Create your first assessment to get started.</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={fetchStats}>
                  Refresh Activity
                </Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Agentic Finance Planner</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open the chat (bottom right) and describe your goal, capital, timeframe, and risk tolerance. We'll generate an AI plan with KPIs and projections.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => { setPlannerMode(true); setIsChatOpen(true); }}>Open Planner Chat</Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'crew' && (
          <div className="space-y-6">
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">🤖 Multi-Agent AI Crew</h3>
                  <p className="text-muted-foreground mb-4">
                    Task delegation, inter-agent collaboration, and dynamic planning with specialized AI agents working together.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-background/50 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Financial Analyst
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Analyzes data, identifies patterns, provides insights
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Risk Assessor
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Evaluates risks and provides mitigation strategies
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-green-500" />
                    Budget Planner
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Creates budgets and optimizes spending
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    Investment Advisor
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Designs strategies and allocates assets
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">🎯 Crew Capabilities</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Task Delegation:</strong> Automatically assigns tasks to specialized agents</li>
                  <li>• <strong>Inter-Agent Communication:</strong> Agents collaborate and share insights</li>
                  <li>• <strong>Dynamic Planning:</strong> Real-time adjustment of goals and strategies</li>
                  <li>• <strong>Memory & Knowledge:</strong> Learns from interactions and builds context</li>
                  <li>• <strong>Process Modes:</strong> Sequential, Parallel, or Hierarchical execution</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => { setCrewMode(true); setIsChatOpen(true); }} size="lg">
                  Launch AI Crew Chat
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('assessments')}>
                  View Example
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Trend Analysis</h3>
              <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Risk trend visualization</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Reports</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View detailed risk analysis reports and export findings.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/reports')}>Go to Reports</Button>
                <Button variant="outline" onClick={fetchStats}>Refresh Summary</Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Connected Accounts</h3>
                <Button>Add Account</Button>
              </div>
              {accountsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : accountsData.length > 0 ? (
                <div className="space-y-4">
                  {accountsData.map((account) => (
                    <div key={account.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">{account.institution} • {account.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${account.balance.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{account.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No accounts connected.
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : transactionsData.length > 0 ? (
                <div className="space-y-4">
                  {transactionsData.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()} • {tx.category?.name || 'Uncategorized'}</p>
                      </div>
                      <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : ''}`}>
                        {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent transactions.
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Monthly Budgets</h3>
                <Button>Create Budget</Button>
              </div>
              {budgetsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : budgetsData.length > 0 ? (
                <div className="space-y-4">
                  {budgetsData.map((budget) => (
                    <div key={budget.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">{budget.category?.name}</p>
                        <p className="font-medium">${budget.amount.toLocaleString()}</p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${budget.spent.toLocaleString()} spent of ${budget.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No budgets set for this month.
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Financial Goals</h3>
                <Button>Set Goal</Button>
              </div>
              {goalsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : goalsData.length > 0 ? (
                <div className="space-y-4">
                  {goalsData.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">{goal.name}</p>
                        <p className="font-medium">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {goal.deadline ? `Target: ${new Date(goal.deadline).toLocaleDateString()}` : 'No deadline'}
                        </p>
                        <p className="text-xs font-medium">
                          {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active goals.
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* New Assessment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
            <DialogDescription>
              Enter applicant details to calculate risk score
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickSubmit} className="space-y-4">
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Assessment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setPlannerMode(false);
          setCrewMode(false);
        }}
        plannerMode={plannerMode}
        crewMode={crewMode}
      />
    </div>
  );
}