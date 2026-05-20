import {
  actualTrajectory,
  costOfDelay,
  counterfactualAtCurrentAge,
  counterfactualTrajectory,
  earlyOnlyTrajectory,
  fireNumber,
} from "./math";
import type { StartInputs, Trajectory } from "./types";

export type BalancePoint = {
  age: number;
  balance: number;
};

export type NarrativeModel = {
  inputs: StartInputs;
  actual: Trajectory;
  counterfactual: Trajectory;
  earlyOnly: Trajectory;
  actualPoints: BalancePoint[];
  // Additive counterfactual from currentAge forward: principal =
  // currentInvested + earlyBalance, contributing currentMonthlyCapacity.
  counterfactualPoints: BalancePoint[];
  // Early-only accumulation from startWorkingAge → currentAge. Used by N1–N3 to
  // visualize how the head start gets built; its final value is the "head
  // start" that gets added on top of the user's actual savings in N4.
  earlyOnlyPoints: BalancePoint[];
  fireTarget: number;
  counterfactualToday: number; // currentInvested + earlyBalance
  headStart: number;           // earlyBalance (= dollarGap at currentAge)
  dollarGap: number;
  yearsGap: number | null;
  actualRetirementAge: number | null;
  counterfactualRetirementAge: number | null;
  maxAge: number;
  yMax: number;
};

export function buildNarrativeModel(inputs: StartInputs): NarrativeModel {
  const actual = actualTrajectory(inputs);
  const counterfactual = counterfactualTrajectory(inputs);
  const earlyOnly = earlyOnlyTrajectory(inputs);
  const result = costOfDelay(inputs);
  const fireTarget = fireNumber(inputs.annualExpenses);
  const counterfactualToday = counterfactualAtCurrentAge(inputs);
  const headStart = counterfactualToday - inputs.currentInvested;

  const actualPoints = trajectoryPoints(inputs.currentAge, actual.balanceByYear);
  const counterfactualPoints = trajectoryPoints(
    inputs.currentAge,
    counterfactual.balanceByYear,
  );
  const earlyOnlyPoints = trajectoryPoints(
    inputs.startWorkingAge,
    earlyOnly.balanceByYear,
  );

  const maxAge = Math.max(
    inputs.targetRetirementAge,
    inputs.currentAge + 10,
    result.actualRetirementAge ?? inputs.currentAge + 35,
    result.counterfactualRetirementAge ?? inputs.currentAge + 35,
  );

  const yMax =
    Math.max(
      fireTarget,
      inputs.currentInvested,
      counterfactualToday,
      maxBalanceThroughAge(actualPoints, maxAge),
      maxBalanceThroughAge(counterfactualPoints, maxAge),
    ) * 1.12;

  return {
    inputs,
    actual,
    counterfactual,
    earlyOnly,
    actualPoints,
    counterfactualPoints,
    earlyOnlyPoints,
    fireTarget,
    counterfactualToday,
    headStart,
    dollarGap: result.dollarGap,
    yearsGap: result.yearsGap,
    actualRetirementAge: result.actualRetirementAge,
    counterfactualRetirementAge: result.counterfactualRetirementAge,
    maxAge,
    yMax: yMax > 0 ? yMax : 1,
  };
}

export function trajectoryPoints(
  startingAge: number,
  balanceByYear: number[],
): BalancePoint[] {
  return balanceByYear.map((balance, index) => ({
    age: startingAge + index,
    balance,
  }));
}

export function pointsThroughAge(
  points: BalancePoint[],
  ageLimit: number,
): BalancePoint[] {
  if (points.length === 0) return [];
  if (ageLimit <= points[0].age) return [points[0]];

  const visible: BalancePoint[] = [];
  for (const point of points) {
    if (point.age <= ageLimit) {
      visible.push(point);
      continue;
    }

    const previous = visible[visible.length - 1];
    if (previous && point.age > previous.age) {
      const ratio = (ageLimit - previous.age) / (point.age - previous.age);
      visible.push({
        age: ageLimit,
        balance: previous.balance + (point.balance - previous.balance) * ratio,
      });
    }
    break;
  }

  return visible;
}

export function pointAtAge(
  points: BalancePoint[],
  age: number,
): BalancePoint | null {
  return pointsThroughAge(points, age).at(-1) ?? null;
}

function maxBalanceThroughAge(points: BalancePoint[], maxAge: number): number {
  return pointsThroughAge(points, maxAge).reduce(
    (max, point) => Math.max(max, point.balance),
    0,
  );
}
