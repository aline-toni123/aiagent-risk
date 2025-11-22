"use client";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Calculator,
  FileText,
  Map,
  Upload,
  Database,
  BarChart3,
  Bell,
  TrendingUp,
  Shield,
  Users,
  Building2,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  Brain,
  Globe,
  ChartNetwork
} from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features">
      <div className="py-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <motion.h2
            initial={{ opacity: 0, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-foreground text-balance text-3xl font-semibold md:text-4xl"
          >
            <span className="text-muted-foreground">
              Agentic AI-Driven Credit Risk Assessment for
            </span>{" "}
            SMEs & Individuals
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-muted-foreground mt-4 text-lg"
          >
            Experience autonomous financial intelligence with multi-step reasoning, 
            real-time market data, and predictive analytics.
          </motion.p>
          <div className="mt-12 grid gap-12 sm:grid-cols-2">
            {/* Feature 1 - Enhanced with Agentic Badge */}
            <div className="col-span-full space-y-4">
              <Card className="overflow-hidden px-6 sm:col-span-2 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Agentic AI
                  </div>
                  <div className="bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    Multi-Step Reasoning
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mask-b-from-75% mx-auto -mt-2 max-w-sm px-2 pt-8"
                >
                  <CreditScoreIllustration />
                </motion.div>
              </Card>
              <div className="max-w-md sm:col-span-3">
                <motion.h3 className="text-foreground text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary animate-pulse" />
                  Autonomous Credit Risk Intelligence
                </motion.h3>
                <motion.p className="text-muted-foreground mt-3 text-balance">
                  Revolutionary agentic AI that thinks autonomously through complex financial decisions. 
                  Analyzes income patterns, repayment history, business viability, industry trends, and 
                  location-specific economic data with transparent multi-step reasoning. See exactly how 
                  the AI arrives at conclusions with confidence scores and source attribution.
                </motion.p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <ChartNetwork className="h-3 w-3" />
                    95% Accuracy
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    &lt;30s Processing
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Real-Time Market Data
                  </span>
                </div>
              </div>
            </div>
            {/* Feature 2 - Enhanced */}
            <div className="grid grid-rows-[1fr_auto] space-y-4">
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
                <div className="absolute top-2 right-2">
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Predictive
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <RiskReportIllustration />
                </motion.div>
              </Card>
              <div>
                <h3 className="text-foreground text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Actionable Risk Reports
                </h3>
                <p className="text-muted-foreground mt-3 text-balance">
                  Generate comprehensive reports with AI reasoning transparency. Each report includes 
                  step-by-step analysis, confidence scores, data source attribution, predictive insights, 
                  and specific action recommendations with KPIs to track.
                </p>
              </div>
            </div>
            {/* Feature 3 - Enhanced */}
            <div className="grid grid-rows-[1fr_auto] space-y-4">
              <Card className="overflow-hidden p-6 relative">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-full"></div>
                <div className="absolute top-2 right-2">
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Live Data
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <RiskHeatmapIllustration />
                </motion.div>
              </Card>
              <div>
                <h3 className="text-foreground text-lg font-semibold flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  Real-Time Risk Intelligence
                </h3>
                <p className="text-muted-foreground mt-3 text-balance">
                  Interactive heatmaps powered by live market data and autonomous pattern recognition. 
                  AI continuously monitors credit risk patterns across geographic locations, business 
                  sectors, and demographic segments with proactive alerts and optimization suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CreditScoreIllustration = () => {
  return (
    <Card
      aria-hidden
      className="p-4 transition-transform duration-200 group-hover:translate-y-0"
    >
      {/* Calculator Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-foreground/5 flex size-8 items-center justify-center rounded-lg border relative">
          <Brain className="size-4 text-foreground/60" />
          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <div>
          <div className="text-sm font-medium">Agentic SmartRisk</div>
          <div className="text-muted-foreground text-xs flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI reasoning active
          </div>
        </div>
      </div>

      {/* Score Display with Confidence */}
      <div className="mb-4 flex justify-center">
        <div className="bg-foreground/10 rounded-full p-6 border relative">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">72</div>
            <div className="text-xs text-muted-foreground">Risk Score</div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
            92% Confidence
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-foreground/5 rounded-lg p-3 space-y-2 border">
        <div className="text-muted-foreground text-xs font-medium mb-2 flex items-center gap-1">
          <ChartNetwork className="h-3 w-3" />
          AI Analysis Chain
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-3 text-foreground/60" />
              <span className="text-muted-foreground">Income Level</span>
            </div>
            <div className="bg-green-500/20 text-green-700 px-2 py-0.5 rounded text-xs">Good</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-3 text-foreground/60" />
              <span className="text-muted-foreground">Payment History</span>
            </div>
            <div className="bg-yellow-500/20 text-yellow-700 px-2 py-0.5 rounded text-xs">Fair</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-3 text-foreground/60" />
              <span className="text-muted-foreground">Business Type</span>
            </div>
            <div className="bg-green-500/20 text-green-700 px-2 py-0.5 rounded text-xs">Low Risk</div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-3 flex justify-center">
        <div className="bg-foreground/10 text-foreground/80 px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1">
          <Brain className="h-3 w-3" />
          Moderate Risk
        </div>
      </div>
    </Card>
  );
};

const RiskReportIllustration = () => {
  return (
    <Card aria-hidden className="p-4">
      {/* Report Header */}
      <div className="mb-4 flex justify-center">
        <div className="bg-foreground/10 flex size-10 items-center justify-center rounded-full border">
          <FileText className="size-5 text-foreground/60" />
        </div>
      </div>

      {/* Report Status */}
      <div className="mb-4 text-center">
        <div className="text-sm font-medium">Risk Assessment Report</div>
        <div className="text-muted-foreground text-xs flex items-center justify-center gap-1 mt-1">
          <div className="bg-foreground/40 size-1.5 rounded-full"></div>
          Generated & Ready
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-foreground/5 flex size-6 items-center justify-center rounded-lg border">
            <BarChart3 className="size-3 text-foreground/60" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-foreground/80">
              Score Analysis
            </div>
            <div className="bg-foreground/10 h-1 rounded-full mt-1">
              <div className="bg-foreground/40 h-full w-full rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-foreground/5 flex size-6 items-center justify-center rounded-lg border">
            <AlertTriangle className="size-3 text-foreground/60" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-foreground/80">
              Risk Factors
            </div>
            <div className="bg-foreground/10 h-1 rounded-full mt-1">
              <div className="bg-foreground/40 h-full w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-foreground/5 flex size-6 items-center justify-center rounded-lg border">
            <TrendingUp className="size-3 text-foreground/60" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-foreground/80">
              Recommendations
            </div>
            <div className="bg-foreground/10 h-1 rounded-full mt-1">
              <div className="bg-foreground/40 h-full w-1/2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Status */}
      <div className="mt-4 text-center">
        <div className="text-muted-foreground text-xs">
          AI insights included...
        </div>
      </div>
    </Card>
  );
};

const RiskHeatmapIllustration = () => {
  return (
    <div aria-hidden className="relative">
      {/* Main Heatmap Display */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-center">
          <div className="bg-foreground/10 flex size-8 items-center justify-center rounded-full border">
            <Map className="size-4 text-foreground/60" />
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-sm font-medium">Regional Risk Analysis</div>
          <div className="text-muted-foreground text-xs">Live heatmap data</div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${
                i % 4 === 0
                  ? "bg-red-500/20"
                  : i % 3 === 0
                  ? "bg-yellow-500/20"
                  : "bg-green-500/20"
              }`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <div className="bg-green-500/20 size-2 rounded"></div>
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-yellow-500/20 size-2 rounded"></div>
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-red-500/20 size-2 rounded"></div>
            <span className="text-muted-foreground">High</span>
          </div>
        </div>
      </Card>

      {/* Connection indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-foreground/10 h-px w-full"></div>
      </div>
    </div>
  );
};