"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const formSchema = z.object({
  applicantName: z.string().min(2, "Name must be at least 2 characters").max(100),
  creditScore: z.coerce.number().min(300, "Credit score must be at least 300").max(850, "Credit score cannot exceed 850"),
  income: z.coerce.number().min(0, "Income cannot be negative"),
  debtToIncomeRatio: z.coerce.number().min(0, "Ratio cannot be negative").max(1, "Ratio cannot exceed 1"),
  employmentHistory: z.string().max(1000, "History too long").optional(),
});

export type FormData = z.infer<typeof formSchema>;

interface NewAssessmentFormProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function NewAssessmentForm({ onSuccess, onError, className }: NewAssessmentFormProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<{ aiScore: number; riskLevel: string; analysisSummary: string } | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: "",
      creditScore: 650,
      income: 50000,
      debtToIncomeRatio: 0.3,
      employmentHistory: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsCalculating(true);
    calculatedResult && setCalculatedResult(null);

    try {
      // Calculate risk
      const calcResponse = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!calcResponse.ok) {
        throw new Error("Failed to calculate risk score");
      }

      const calcData = await calcResponse.json();
      setCalculatedResult(calcData);

      // If success callback provided, call it with full data
      const fullData = { ...values, ...calcData };
      onSuccess?.(fullData);

    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
      onError?.(message);
    } finally {
      setIsCalculating(false);
    }
  };

  const riskColor = calculatedResult ? {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }[calculatedResult.riskLevel] || "bg-gray-100 text-gray-800" : "";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="applicantName">Applicant Name</Label>
          <Input
            id="applicantName"
            {...form.register("applicantName")}
          />
          {form.formState.errors.applicantName && (
            <p className="text-sm text-destructive col-span-3">{form.formState.errors.applicantName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="creditScore">Credit Score</Label>
          <Input
            id="creditScore"
            type="number"
            {...form.register("creditScore", { valueAsNumber: true })}
          />
          {form.formState.errors.creditScore && (
            <p className="text-sm text-destructive col-span-3">{form.formState.errors.creditScore.message}</p>
          )}
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="income">Annual Income ($)</Label>
          <Input
            id="income"
            type="number"
            {...form.register("income", { valueAsNumber: true })}
          />
          {form.formState.errors.income && (
            <p className="text-sm text-destructive col-span-3">{form.formState.errors.income.message}</p>
          )}
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="debtToIncomeRatio">Debt-to-Income Ratio</Label>
          <Input
            id="debtToIncomeRatio"
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...form.register("debtToIncomeRatio", { valueAsNumber: true })}
          />
          {form.formState.errors.debtToIncomeRatio && (
            <p className="text-sm text-destructive col-span-3">{form.formState.errors.debtToIncomeRatio.message}</p>
          )}
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="employmentHistory">Employment History</Label>
          <Textarea
            id="employmentHistory"
            {...form.register("employmentHistory")}
            placeholder="Brief description of employment history..."
          />
          {form.formState.errors.employmentHistory && (
            <p className="text-sm text-destructive col-span-3">{form.formState.errors.employmentHistory.message}</p>
          )}
        </div>

        {calculatedResult && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>AI Risk Score:</span>
              <span className="font-bold">{calculatedResult.aiScore}</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Level:</span>
              <span className={`px-2 py-1 rounded-full text-sm font-semibold ${riskColor}`}>
                {calculatedResult.riskLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{calculatedResult.analysisSummary}</p>
          </div>
        )}

        <Button type="submit" className="col-span-4" disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate & Save Assessment"}
        </Button>
      </div>
    </form>
  );
}