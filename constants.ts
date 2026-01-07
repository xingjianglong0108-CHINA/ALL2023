
import { PatientData, RiskLevel, RiskEvaluation, Lineage } from './types';

export const initialPatientState: PatientData = {
  age: 0,
  initialWbc: 0,
  lineage: Lineage.BCELL,
  cnsl: false,
  testicularLeukemia: false,
  etv6Runx1: false,
  hyperdiploidy50: false,
  phPositive: false,
  phLike: false,
  t1_19: false,
  mll: false,
  mef2dBcl9: false,
  mef2dOther: false,
  hypodiploidy44: false,
  iamp21: false,
  ikzf1DeleAndNoDux4: false,
  tcf3Hlf: false,
  mrdD15: null,
  mrdD33: null,
  mrdW12: null,
  d33MediastinalMassReduced: true, 
  persistentMassPreConsolidation: false
};

export const evaluateRisk = (data: PatientData): RiskEvaluation => {
  const hrReasons: string[] = [];
  const irReasons: string[] = [];

  // 1. 高危 (HR) 判定 - V2.0 标准
  if (data.mrdD15 !== null && data.mrdD15 >= 10) hrReasons.push("d15 MRD ≥ 10%");
  if (data.mrdD33 !== null && data.mrdD33 >= 1) hrReasons.push("d33 MRD ≥ 1%");
  if (data.mrdW12 !== null && data.mrdW12 >= 0.01) hrReasons.push("巩固治疗前(W12~14) MRD ≥ 0.01%");
  if (data.mll) hrReasons.push("MLL (KMT2A) 基因重排阳性");
  if (data.mef2dBcl9) hrReasons.push("MEF2D::BCL9 基因重排阳性");
  if (data.hypodiploidy44) hrReasons.push("低二倍体 (<44)");
  if (data.iamp21) hrReasons.push("iAMP21 阳性");
  if (data.ikzf1DeleAndNoDux4) hrReasons.push("IKZF1 缺失且无 DUX4 重排");
  if (data.tcf3Hlf) hrReasons.push("TCF3-HLF 基因重排阳性");
  if (!data.d33MediastinalMassReduced || data.persistentMassPreConsolidation) {
    hrReasons.push("诱导d33评估纵隔瘤灶未缩小至1/3或巩固前仍存在瘤灶");
  }

  if (hrReasons.length > 0) {
    return { level: RiskLevel.HR, reasons: hrReasons };
  }

  // 2. 中危 (IR) 判定 - V2.0 标准
  if (data.age >= 10) irReasons.push("年龄 ≥ 10 岁");
  if (data.initialWbc >= 50) irReasons.push("初诊 WBC ≥ 50 × 10⁹/L");
  if (data.lineage === Lineage.TCELL) irReasons.push("T-ALL");
  if (data.cnsl || data.testicularLeukemia) irReasons.push("CNS3 或 睾丸受累 (TL)");
  if (data.phPositive) irReasons.push("Ph+ ALL t(9;22)");
  if (data.phLike) irReasons.push("Ph-Like ALL");
  if (data.t1_19) irReasons.push("t(1;19) (TCF3-PBX1)");
  if (data.mef2dOther) irReasons.push("其他 MEF2D 基因重排");
  if (data.mrdD15 !== null && data.mrdD15 >= 0.1 && data.mrdD15 < 10) irReasons.push("d15 MRD 为 0.1% ~ 10%");
  if (data.mrdD33 !== null && data.mrdD33 >= 0.01 && data.mrdD33 < 1) irReasons.push("d33 MRD 为 0.01% ~ 1%");
  if (data.mrdW12 !== null && data.mrdW12 < 0.01) {
    // 巩固前MRD阴性但有其他IR因素，仍为IR
  }

  // 3. 低危 (LR) 判定
  // 必须同时符合：年龄1-10岁, WBC<50, d15MRD<0.1%, d33MRD<0.01%
  const meetsLrClinical = (data.age >= 1 && data.age < 10) && 
                          (data.initialWbc < 50) && 
                          (data.mrdD15 !== null && data.mrdD15 < 0.1) && 
                          (data.mrdD33 !== null && data.mrdD33 < 0.01);

  if (irReasons.length > 0 || !meetsLrClinical) {
    const combinedReasons = [...irReasons];
    if (!meetsLrClinical && irReasons.length === 0) {
      combinedReasons.push("未完全符合低危临床/MRD标准 (自动归入中危)");
    }
    return { level: RiskLevel.IR, reasons: combinedReasons };
  }

  return { level: RiskLevel.LR, reasons: ["符合所有低危标准 (V2.0)"] };
};
