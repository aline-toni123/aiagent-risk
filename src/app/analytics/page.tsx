"use client";

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Projection {
  month: number;
  projectedScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  insights: string;
}

interface ForecastData {
  projections: Projection[];
  summary: string;
  recommendations: string[];
  assessmentsAnalyzed: number;
}

export default function AnalyticsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    fetchForecast();
  }, [session, router]);

  const fetchForecast = async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('bearer_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch('/api/forecast', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch forecast');
      }

      const data = await res.json();
      setForecast(data);
    } catch (err) {
      console.error('Forecast fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
      toast.error(err instanceof Error ? err.message : 'Failed to load forecast');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Risk Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights and predictive forecasting</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchForecast} 
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            Refresh Forecast
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-semibold">Forecast Error</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Forecast Section */}
        {forecast && !isLoading && !error && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  12-Month Risk Forecast
                </CardTitle>
                <CardDescription>
                  Based on {forecast.assessmentsAnalyzed} historical assessments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">{forecast.summary}</h3>
                  <p className="text-muted-foreground">Current Projected Score: {forecast.projections[0]?.projectedScore || 'N/A'}</p>
                </div>

                {/* Projections Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Month</th>
                        <th className="text-left p-3">Projected Score</th>
                        <th className="text-left p-3">Risk Level</th>
                        <th className="text-left p-3">Insights</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.projections.slice(0, 6).map((proj, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="p-3 font-medium">{proj.month}</td>
                          <td className="p-3">
                            <span className="font-semibold">{proj.projectedScore}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              proj.riskLevel === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              proj.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {proj.riskLevel}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground max-w-xs">
                            {proj.insights}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recommendations */}
                {forecast.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Actionable Recommendations</h4>
                    <div className="space-y-2">
                      {forecast.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <DollarSign className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Full 12-Month Projections (Scrollable) */}
            {forecast.projections.length > 6 && (
              <Card>
                <CardHeader>
                  <CardTitle>Full 12-Month Projections</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Month</th>
                        <th className="text-left p-3">Projected Score</th>
                        <th className="text-left p-3">Risk Level</th>
                        <th className="text-left p-3">Insights</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.projections.slice(6).map((proj, index) => (
                        <tr key={index + 6} className="border-b last:border-b-0">
                          <td className="p-3 font-medium">{proj.month}</td>
                          <td className="p-3 font-semibold">{proj.projectedScore}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              proj.riskLevel === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              proj.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {proj.riskLevel}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground max-w-xs">
                            {proj.insights}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No Data State */}
        {!forecast && !isLoading && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                Create some risk assessments to unlock predictive forecasting and analytics.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}