export type StartInputs = {
  // Page 1 — where you are now
  currentAge: number;              // 18-75
  currentInvested: number;         // CAD
  currentMonthlyCapacity: number;  // CAD

  // Page 2 — your timeline
  startWorkingAge: number;         // age user started working full-time
  pastMonthlyCapacity: number;     // CAD, savings capacity back then
  startInvestingAge: number;       // age user actually started investing
  targetRetirementAge: number;     // ambition; not used by FIRE projection but shown in chart axis

  // Page 3 — assumptions
  annualExpenses: number;          // today's CAD; FIRE number = expenses * 25
  savingsGrowthRate: number;       // decimal, e.g. 0.03 for 3%/yr capacity growth
  investmentReturnRate: number;    // decimal, e.g. 0.07 for 7% nominal
};

export type SandboxState = StartInputs; // sandbox can diverge from initial inputs

export type Trajectory = {
  balanceByYear: number[];         // index 0 = starting age
  retirementAge: number | null;    // null if FIRE never reached within projection window
};

export type FormPage = 1 | 2 | 3;
export type SceneId = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = pre-narrative, 1-5 = N1-N5, 6 = sandbox

export type AppState = {
  inputs: StartInputs | null;
  currentFormPage: FormPage | null; // null once narrative starts
  currentScene: SceneId;
  sandboxActive: boolean;
  sandbox: SandboxState;
};
