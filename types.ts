
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
  
  // 临床特征
  cnsl: boolean; // CNS3
  testicularLeukemia: boolean;
  
  // 遗传学指标 (V2.0)
  etv6Runx1: boolean; // t(12;21)
  hyperdiploidy50: boolean; // 超二倍体 >50
  phPositive: boolean; // t(9;22) BCR-ABL1
  phLike: boolean;
  t1_19: boolean; // t(1;19) TCF3-PBX1 - IR indicator
  mll: boolean; // MLL (KMT2A) rearrangement
  mef2dBcl9: boolean; // MEF2D::BCL9 - HR indicator
  mef2dOther: boolean; // Other MEF2D - IR indicator
  hypodiploidy44: boolean; // 低二倍体 <44
  iamp21: boolean;
  ikzf1DeleAndNoDux4: boolean; // IKZF1缺失且无DUX4
  tcf3Hlf: boolean; // TCF3-HLF - HR indicator
  
  // 治疗反应 (MRD)
  mrdD15: number | null;
  mrdD33: number | null;
  mrdW12: number | null; // 巩固治疗前 (W12~14)
  
  // 影像学反应 (V2.0 附件十二)
  d33MediastinalMassReduced: boolean; // 纵隔瘤灶缩小是否 < 1/3 (true表示缩小到1/3以下)
  persistentMassPreConsolidation: boolean; // 巩固治疗前仍存在瘤灶
}

export interface RiskEvaluation {
  level: RiskLevel;
  reasons: string[];
}
