"use client";

import { motion } from "motion/react";
import { Card } from "./ui/card";
import {
  Shield,
  Scan,
  TrendingUp,
  Globe2,
  Bell,
  Workflow,
  BarChart3,
  Lock,
  FileSearch,
  Brain,
  Lightbulb,
  Target,
  Sparkles,
  Network,
  Zap,
  Eye,
  Bot
} from "lucide-react";
import { Badge } from "./ui/badge";

export default function AdvancedFeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Autonomous Decision Engine",
      description: "Self-learning AI that autonomously analyzes credit decisions with transparent multi-step reasoning and confidence scoring.",
      badge: "Agentic AI",
      highlight: true,
    },
    {
      icon: Network,
      title: "Real-Time Market Intelligence",
      description: "Live web search integration that pulls current financial data, market trends, and economic indicators for contextual analysis.",
      badge: "Live Data",
      highlight: true,
    },
    {
      icon: Lightbulb,
      title: "Proactive Risk Insights",
      description: "AI proactively identifies optimization opportunities and suggests preventive actions before risks materialize.",
      badge: "Predictive",
      highlight: true,
    },
    {
      icon: Eye,
      title: "Transparent AI Reasoning",
      description: "See exactly how the AI arrives at conclusions with step-by-step reasoning chains and source attribution.",
      badge: "Explainable AI",
      highlight: false,
    },
    {
      icon: Shield,
      title: "AI Fraud Detection",
      description: "Advanced pattern recognition identifies fraudulent applications with 98% accuracy using behavioral analysis.",
      badge: "98% Accuracy",
      highlight: false,
    },
    {
      icon: Scan,
      title: "Document OCR Scanning",
      description: "Automatically extract and verify data from financial documents, bank statements, and ID cards.",
      badge: "Auto-Extract",
      highlight: false,
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Forecast credit behavior and default probability using advanced ML models trained on millions of data points.",
      badge: "ML-Powered",
      highlight: false,
    },
    {
      icon: Globe2,
      title: "Multi-Currency Support",
      description: "Process assessments in 150+ currencies with real-time exchange rates and regional risk adjustments.",
      badge: "150+ Currencies",
      highlight: false,
    },
    {
      icon: Bell,
      title: "Smart Real-Time Alerts",
      description: "Intelligent notification system with risk-based prioritization and automated escalation workflows.",
      badge: "Smart Alerts",
      highlight: false,
    },
    {
      icon: Workflow,
      title: "Automated Workflows",
      description: "Configure complex approval chains and decision trees that execute automatically based on risk thresholds.",
      badge: "No-Code",
      highlight: false,
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      description: "Comprehensive dashboards with portfolio risk metrics, trend analysis, and benchmarking against industry standards.",
      badge: "Enterprise",
      highlight: false,
    },
    {
      icon: Bot,
      title: "Agentic Finance Planner",
      description: "Conversational AI assistant that autonomously creates personalized financial plans with KPIs and projections.",
      badge: "Conversational",
      highlight: true,
    },
  ];

  return (
    <section id="advanced-features" className="py-24 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            Advanced AI Capabilities
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Next-Generation Agentic Intelligence
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience autonomous AI that thinks, learns, and acts independently to provide 
            unparalleled financial insights with complete transparency.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <Card className={`p-6 h-full hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${
                feature.highlight ? 'border-primary/50 bg-primary/5' : ''
              }`}>
                {feature.highlight && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                )}
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 transition-transform duration-300 group-hover:scale-110 ${
                    feature.highlight ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <feature.icon className={`h-6 w-6 ${feature.highlight ? 'text-primary' : 'text-foreground'}`} />
                  </div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <Badge variant={feature.highlight ? "default" : "secondary"} className="text-xs shrink-0">
                      {feature.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call-to-Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Ready to Experience Agentic AI?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join leading financial institutions using autonomous AI for credit risk assessment. 
              Get started in minutes with our intelligent onboarding assistant.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Badge variant="outline" className="px-4 py-2">
                <Target className="mr-1 h-4 w-4" />
                95% Accuracy
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Zap className="mr-1 h-4 w-4" />
                &lt;30s Analysis
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Brain className="mr-1 h-4 w-4" />
                Transparent Reasoning
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Network className="mr-1 h-4 w-4" />
                Real-Time Data
              </Badge>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}