import { describe, it, expect } from "vitest";
import {
  annualContributionFV,
  counterfactualAtCurrentAge,
  earlyOnlyTrajectory,
  fireNumber,
  projectTrajectory,
  costOfDelay,
} from "./math";
import type { StartInputs } from "./types";

describe("future value (no capacity growth)", () => {
  it("known textbook case: $100/mo at 7% for 40 years ≈ $262K", () => {
    const trajectory = projectTrajectory({
      startingAge: 22,
      startingPrincipal: 0,
      baseAnnualCapacity: 1200,
      savingsGrowthRate: 0,
      investmentReturnRate: 0.07,
      fireTarget: null,
      maxYears: 40,
    });
    const finalBalance = trajectory.balanceByYear[40];
    expect(finalBalance).toBeGreaterThan(260_000);
    expect(finalBalance).toBeLessThan(265_000);
  });
});

describe("future value with capacity growth", () => {
  it("capacity scales year-over-year by (1 + g)^t", () => {
    // r=0, g=0.10, baseCapacity=$10K/yr. With r=0 the annual contribution lands
    // as-is. So balances should be [0, 10000, 10000 + 11000] = [0, 10000, 21000].
    const trajectory = projectTrajectory({
      startingAge: 30,
      startingPrincipal: 0,
      baseAnnualCapacity: 10_000,
      savingsGrowthRate: 0.10,
      investmentReturnRate: 0,
      fireTarget: null,
      maxYears: 2,
    });
    expect(trajectory.balanceByYear[0]).toBe(0);
    expect(trajectory.balanceByYear[1]).toBeCloseTo(10_000, 4);
    expect(trajectory.balanceByYear[2]).toBeCloseTo(21_000, 4);
  });
});

describe("fire number", () => {
  it("is annual expenses × 25 (4% rule)", () => {
    expect(fireNumber(40_000)).toBe(1_000_000);
    expect(fireNumber(60_000)).toBe(1_500_000);
    expect(fireNumber(0)).toBe(0);
  });
});

describe("retirement age projection", () => {
  it("matches manual iteration in a flat-rate case", () => {
    // r=0, g=0, baseCapacity=$50K/yr, fireTarget=$200K, startingAge=30.
    // With r=0 the annual contribution lands as-is, so balances grow linearly:
    //   year 1: 50K, year 2: 100K, year 3: 150K, year 4: 200K → retirement at 34.
    const trajectory = projectTrajectory({
      startingAge: 30,
      startingPrincipal: 0,
      baseAnnualCapacity: 50_000,
      savingsGrowthRate: 0,
      investmentReturnRate: 0,
      fireTarget: 200_000,
      maxYears: 10,
    });
    expect(trajectory.retirementAge).toBe(34);
  });

  it("returns startingAge when principal already exceeds fire target", () => {
    const trajectory = projectTrajectory({
      startingAge: 45,
      startingPrincipal: 1_500_000,
      baseAnnualCapacity: 0,
      savingsGrowthRate: 0,
      investmentReturnRate: 0.05,
      fireTarget: 1_000_000,
      maxYears: 30,
    });
    expect(trajectory.retirementAge).toBe(45);
  });
});

describe("counterfactual divergence", () => {
  it("counterfactual retirement age is earlier than actual when investing started late", () => {
    // Time-only divergence: equal capacity in both histories, zero growth,
    // so the only difference between trajectories is the extra 13 years of
    // compounding the counterfactual gets from starting at 22 vs. 35.
    const inputs: StartInputs = {
      currentAge: 35,
      currentInvested: 50_000,
      currentMonthlyCapacity: 1500,
      startWorkingAge: 22,
      pastMonthlyCapacity: 1500,
      startInvestingAge: 30,
      targetRetirementAge: 65,
      annualExpenses: 40_000,
      savingsGrowthRate: 0,
      investmentReturnRate: 0.07,
    };

    const result = costOfDelay(inputs);

    expect(result.actualRetirementAge).not.toBeNull();
    expect(result.counterfactualRetirementAge).not.toBeNull();
    expect(result.counterfactualRetirementAge!).toBeLessThan(result.actualRetirementAge!);
    expect(result.yearsGap).not.toBeNull();
    expect(result.yearsGap!).toBeGreaterThan(0);
    expect(result.dollarGap).toBeGreaterThan(0);
  });

  it("annualContributionFV degenerates correctly at r=0", () => {
    expect(annualContributionFV(12_000, 0)).toBe(12_000);
  });
});

describe("additive counterfactual", () => {
  // Cost-of-delay logic: the head start from hypothetical early investing
  // stacks on top of the user's actual current state. The counterfactual at
  // currentAge must equal currentInvested + earlyBalance — never less than
  // currentInvested.
  const inputs: StartInputs = {
    currentAge: 35,
    currentInvested: 50_000,
    currentMonthlyCapacity: 1500,
    startWorkingAge: 22,
    pastMonthlyCapacity: 100, // small past capacity, much smaller than current
    startInvestingAge: 35,
    targetRetirementAge: 60,
    annualExpenses: 40_000,
    savingsGrowthRate: 0,
    investmentReturnRate: 0.07,
  };

  it("counterfactualAtCurrentAge = currentInvested + earlyBalance", () => {
    const earlyBalance =
      earlyOnlyTrajectory(inputs).balanceByYear.at(-1) ?? 0;
    expect(earlyBalance).toBeGreaterThan(0);
    expect(counterfactualAtCurrentAge(inputs)).toBeCloseTo(
      inputs.currentInvested + earlyBalance,
      4,
    );
  });

  it("counterfactual reaches FIRE before actual even when pastCapacity << currentCapacity", () => {
    // The bug the additive model fixes: with old math, counterfactual used
    // pastMonthlyCapacity ($100/mo) forever and lost to actual ($50K + $1500/mo).
    // With the additive model, counterfactual = actual + headStart, so it
    // always reaches FIRE earlier (or at the same time).
    const result = costOfDelay(inputs);
    expect(result.actualRetirementAge).not.toBeNull();
    expect(result.counterfactualRetirementAge).not.toBeNull();
    expect(result.counterfactualRetirementAge!).toBeLessThanOrEqual(
      result.actualRetirementAge!,
    );
    expect(result.yearsGap!).toBeGreaterThanOrEqual(0);
    expect(result.dollarGap).toBeGreaterThan(0);
  });

  it("zero head start when user worked and invested in the same year", () => {
    const noPast: StartInputs = {
      ...inputs,
      startWorkingAge: inputs.currentAge,
      pastMonthlyCapacity: 0,
    };
    expect(counterfactualAtCurrentAge(noPast)).toBe(noPast.currentInvested);
    const result = costOfDelay(noPast);
    expect(result.dollarGap).toBe(0);
    expect(result.yearsGap).toBe(0);
  });
});
