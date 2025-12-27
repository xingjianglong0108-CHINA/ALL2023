
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
  mllOrMef2d: false,
  hypodiploidy44: false,
  iamp21: false,
  ikzf1DeleAndNoDux4: false,
  tcf3Hlf: false,
  mrdD15: null,
  mrdD33: null,
  mrdW12: null,
  d33MediastinalMassReduced: true, // true means reduced to < 1/3
  persistentMassPreConsolidation: false
};

export const evaluateRisk = (data: PatientData): RiskEvaluation => {
  const hrReasons: string[] = [];
  const irReasons: string[] = [];
  const lrReasons: string[] = [];

  // --- 1. Check High Risk (HR) Criteria ---
  if (data.mrdD15 !== null && data.mrdD15 >= 10) hrReasons.push("d15骨髓FCM/PCR-MRD ≥ 10%");
  if (data.mrdD33 !== null && data.mrdD33 >= 1) hrReasons.push("d33骨髓FCM/PCR-MRD ≥ 1%");
  if (data.mrdW12 !== null && data.mrdW12 >= 0.01) hrReasons.push("巩固治疗前(W12~14)骨髓MRD ≥ 0.01%");
  if (data.mllOrMef2d) hrReasons.push("MLL 或 MEF2D 基因重排阳性");
  if (data.hypodiploidy44) hrReasons.push("低二倍体 (<44)");
  if (data.iamp21) hrReasons.push("iAMP21 阳性");
  if (data.ikzf1DeleAndNoDux4) hrReasons.push("IKZF1 大片段缺失阳性 (且无伴DUX4基因重排)");
  if (data.tcf3Hlf) hrReasons.push("TCF3-HLF 基因重排");
  if (!data.d33MediastinalMassReduced || data.persistentMassPreConsolidation) {
    hrReasons.push("诱导治疗后(d33)评估纵隔瘤灶没有缩小到最初1/3 或 巩固治疗前仍存在瘤灶");
  }

  if (hrReasons.length > 0) {
    return { level: RiskLevel.HR, reasons: hrReasons };
  }

  // --- 2. Check Intermediate Risk (IR) Criteria ---
  if (data.age >= 10) irReasons.push("年龄 ≥ 10 岁");
  if (data.initialWbc >= 50) irReasons.push("初诊WBC ≥ 50 × 10^9/L");
  if (data.lineage === Lineage.TCELL) irReasons.push("T-ALL");
  if (data.cnsl || data.testicularLeukemia) irReasons.push("CNSL(CNS3) 或 睾丸白血病(TL)");
  if (data.phPositive) irReasons.push("Ph-ALL t(9;22)");
  if (data.phLike) irReasons.push("Ph-Like ALL");
  if (data.t1_19) irReasons.push("t(1;19)(TCF3-PBX1)");
  if (data.mrdD15 !== null && data.mrdD15 >= 0.1 && data.mrdD15 < 10) irReasons.push("d15骨髓MRD 0.1% ~ 10%");
  if (data.mrdD33 !== null && data.mrdD33 >= 0.01 && data.mrdD33 < 1) irReasons.push("d33骨髓MRD 0.01% ~ 1%");
  if (data.mrdW12 !== null && data.mrdW12 < 0.01) {
    // This is a subtle point in the logic: "巩固治疗前(W12~14)骨髓MRD < 0.01%" is an IR indicator if HR not met
    // Actually standard 10 for IR says: 巩固治疗前(W12~14)骨髓MRD < 0.01%
    // In our UI, if we don't have this but meet others, it's IR. 
    // We only list it as a reason if specifically input.
  }

  // Check if it fits IR profile (either meets an IR criteria or fails an LR criteria while not being HR)
  // Low Risk requirements:
  // ①年龄≥1岁且＜10岁；
  // ②WBC＜50×109/L；
  // ③d15的骨髓FCM/PCR-MRD＜0.1%；
  // ④d33骨髓 FCM/PCR-MRD＜0.01%
  // ⑤初诊时有以下两项之一 (t(12;21) or Hyperdiploidy+4+10)
  
  const meetsLrBase = (data.age >= 1 && data.age < 10) && 
                      (data.initialWbc < 50) && 
                      (data.mrdD15 !== null && data.mrdD15 < 0.1) && 
                      (data.mrdD33 !== null && data.mrdD33 < 0.01);
  const meetsLrGenetics = data.etv6Runx1 || data.hyperdiploidy50;

  if (irReasons.length > 0 || !meetsLrBase || !meetsLrGenetics) {
    // If not HR, but fails any LR requirement, it defaults to IR
    const combinedReasons = [...irReasons];
    if (!meetsLrBase || !meetsLrGenetics) {
      if (irReasons.length === 0) {
        combinedReasons.push("未达到低危标准 (遗传学或早期治疗反应不符合)");
      }
    }
    return { level: RiskLevel.IR, reasons: combinedReasons };
  }

  // --- 3. Low Risk (LR) ---
  return { level: RiskLevel.LR, reasons: ["符合所有低危标准 (年龄、WBC、MRD、遗传学)"] };
};
