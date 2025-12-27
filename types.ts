
export enum RiskLevel {
  LR = '低危 (Low Risk)',
  IR = '中危 (Intermediate Risk)',
  HR = '高危 (High Risk)',
  PENDING = '待评估'
}

export enum Lineage {
  BCELL = 'B-ALL',
  TCELL = 'T-ALL'
}

export interface PatientData {
  age: number;
  initialWbc: number;
  lineage: Lineage;
  
  // Clinical features
  cnsl: boolean; // CNS3
  testicularLeukemia: boolean;
  
  // Cytogenetics / Molecular
  etv6Runx1: boolean; // t(12;21)
  hyperdiploidy50: boolean; // >50 and +4, +10
  phPositive: boolean; // t(9;22) BCR-ABL1
  phLike: boolean;
  t1_19: boolean; // TCF3-PBX1
  mllOrMef2d: boolean; // MLL or MEF2D rearrangement
  hypodiploidy44: boolean; // <44
  iamp21: boolean;
  ikzf1DeleAndNoDux4: boolean; // IKZF1 deletion without DUX4
  tcf3Hlf: boolean; // TCF3-HLF rearrangement
  
  // Response (MRD and Imaging)
  mrdD15: number | null;
  mrdD33: number | null;
  mrdW12: number | null; // Pre-consolidation (W12~14)
  
  d33MediastinalMassReduced: boolean; // Post-induction d33 evaluation
  persistentMassPreConsolidation: boolean;
}

export interface RiskEvaluation {
  level: RiskLevel;
  reasons: string[];
}
