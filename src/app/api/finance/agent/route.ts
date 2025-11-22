import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { goal, startingCapital, timeframeMonths, riskTolerance } = await req.json();

    if (!goal || startingCapital == null || !timeframeMonths || !riskTolerance) {
      return NextResponse.json(
        { error: "Missing required fields: goal, startingCapital, timeframeMonths, riskTolerance" },
        { status: 400 }
      );
    }

    const cap = Number(startingCapital);
    const months = Number(timeframeMonths);
    const rt = String(riskTolerance).toLowerCase();

    if (isNaN(cap) || cap < 0) {
      return NextResponse.json({ error: "startingCapital must be a non-negative number" }, { status: 400 });
    }
    if (isNaN(months) || months <= 0) {
      return NextResponse.json({ error: "timeframeMonths must be a positive number" }, { status: 400 });
    }
    if (!["low", "medium", "high"].includes(rt)) {
      return NextResponse.json({ error: "riskTolerance must be one of: low, medium, high" }, { status: 400 });
    }

    const targetAnnualReturn = rt === "high" ? 0.15 : rt === "medium" ? 0.09 : 0.05;
    const monthlyReturn = Math.pow(1 + targetAnnualReturn, 1 / 12) - 1;

    // Simple projection
    const projection: Array<{ month: number; projectedValue: number }> = [];
    let value = cap;
    for (let m = 1; m <= months; m++) {
      value = value * (1 + monthlyReturn);
      projection.push({ month: m, projectedValue: Number(value.toFixed(2)) });
    }

    // Risk controls
    const riskControls = rt === "high"
      ? [
          "Set a 10% trailing stop on growth positions",
          "Cap any single position to <= 10% of portfolio",
          "Weekly review of drawdowns > 5%",
        ]
      : rt === "medium"
      ? [
          "Use 60/40 equity-to-fixed-income split as baseline",
          "Rebalance quarterly within ±5% bands",
          "Position size <= 7% each",
        ]
      : [
          "Favor investment-grade bonds and broad market ETFs",
          "Rebalance semi-annually within ±3% bands",
          "Max 5% in any single equity position",
        ];

    const kpis = [
      { id: "cagr", label: "Target CAGR", value: `${Math.round(targetAnnualReturn * 100)}%` },
      { id: "max_dd", label: "Max Drawdown Budget", value: rt === "high" ? "-25%" : rt === "medium" ? "-15%" : "-8%" },
      { id: "vol", label: "Volatility Class", value: rt.toUpperCase() },
    ];

    const roadmap = [
      {
        phase: "Month 0-1",
        items: [
          "Define investment policy statement (IPS)",
          "Allocate initial capital per risk target",
          "Set up brokerage auto-rebalance + alerts",
        ],
      },
      {
        phase: "Month 2-3",
        items: [
          "Deploy capital in tranches (3-4 buys)",
          "Activate risk controls (stops, limits)",
          "Start monthly performance reporting",
        ],
      },
      {
        phase: "Quarterly",
        items: [
          "Rebalance to target weights",
          "Review KPI drift and adjust",
          "Tax-loss harvesting where applicable",
        ],
      },
    ];

    const plan = {
      goal,
      startingCapital: cap,
      timeframeMonths: months,
      riskTolerance: rt,
      targetAnnualReturn,
      monthlyReturn: Number((monthlyReturn * 100).toFixed(2)),
      projection,
      riskControls,
      kpis,
      roadmap,
      nextBestActions: [
        "Create a diversified allocation aligned to risk",
        "Schedule monthly KPI email report",
        "Set up auto-rebalance and stop-loss rules",
      ],
    };

    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}