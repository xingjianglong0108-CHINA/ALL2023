
import React, { useState, useMemo } from 'react';
import { PatientData, Lineage, RiskLevel } from './types';
import { initialPatientState, evaluateRisk } from './constants';
import { 
  Activity, Dna, User, Microscope, AlertCircle, RefreshCw, HelpCircle, 
  Stethoscope, X, Clock, FlaskConical, ShieldCheck, Target, Droplets, 
  LayoutDashboard, ShieldAlert, Table as TableIcon, Smile, Waves, AlertTriangle,
  Zap, Info, Flame, Brain, CheckCircle2, ChevronRight, Calculator, ListChecks, Syringe,
  Thermometer, Droplet, HeartPulse, Scale
} from 'lucide-react';

const PROTOCOL_DETAILS = {
  [RiskLevel.LR]: {
    phases: [
      { name: "诱导缓解 (Induction)", duration: "d1-d33", detail: "VDLD2 (DNR × 2) + CAM。注意：L-ASP 调整为 d9, d30。" },
      { name: "早期巩固 (Consolidation)", duration: "W5-W12", detail: "常规开展 eMV 方案 (MTX 100~300mg/m² 剂量递增)。" },
      { name: "延迟强化 (Re-induction)", duration: "W20-W26", detail: "VDLD3 (DOX × 3) + CAM 第二轮 eMV 方案。" },
      { name: "维持治疗 (Maintenance)", duration: "2 年", detail: "仅 6-MP + MTX。V2.0 取消了每 8 周一轮的 VCR+Dex。" }
    ],
    highlight: "V2.0 重点：低危组取消维持期 VD 脉冲，巩固期常规 eMV。"
  },
  [RiskLevel.IR]: {
    phases: [
      { name: "诱导缓解 (Induction)", duration: "d1-d33", detail: "VDLD4 (DNR × 4) + CAM+L。Ph+ 或 ABL 类重排 d3 起加用 TKI (达沙替尼)。" },
      { name: "早期巩固 (Consolidation)", duration: "W5-W14", detail: "HD-MTX 5g/m² × 4。可根据路径评估贝林妥欧应用。" },
      { name: "延迟强化 (Re-induction)", duration: "W24-W30", detail: "VDLD4 (DOX × 4) + CAM+L。B-ALL 有条件者加用贝林妥欧。" },
      { name: "维持治疗 (Maintenance)", duration: "2.5 年(男)/2 年(女)", detail: "6-MP + MTX + 每 8 周一次 VD。" }
    ],
    highlight: "V2.0 重点：T-ALL 诱导 d3 起随机西达本胺；B-ALL 整合贝林妥欧路径。"
  },
  [RiskLevel.HR]: {
    phases: [
      { name: "诱导缓解 (Induction)", duration: "d1-d33", detail: "高强度 VDLD4 + CAM × 2 或贝林妥欧。T-ALL 联合西达本胺。" },
      { name: "强化巩固 (Blocks)", duration: "W5-W16", detail: "高强度化疗块 (Block HR-1', 2', 3') × 2。积极评估移植。" },
      { name: "移植评估 (HSCT)", duration: "关键决策", detail: "符合移植指征者于强化巩固后进入移植。" },
      { name: "维持治疗", duration: "2.5 年", detail: "非移植患者进入标准维持。" }
    ],
    highlight: "V2.0 重点：MEF2D::BCL9 与 TCF3-HLF 纳入高危；强化巩固 Block 体系。"
  },
  [RiskLevel.PENDING]: { phases: [], highlight: "请先完成评估。" }
};

type AppTab = 'risk' | 'mpal' | 'cnsl' | 'phlike' | 'coagulation' | 'stomatitis' | 'hyperleukemia' | 'tls';

const MPAL_MARKERS = {
  MYELOID: [{ id: 'mpo', label: 'MPO (强度>50%)', type: 'myeloid' }],
  MONOCYTE: [
    { id: 'cd11c', label: 'CD11c', type: 'monocyte' },
    { id: 'cd14', label: 'CD14', type: 'monocyte' },
    { id: 'cd64', label: 'CD64', type: 'monocyte' },
    { id: 'cd11b', label: 'CD11b', type: 'monocyte' },
    { id: 'lysozyme', label: '溶菌酶 (Lysozyme)', type: 'monocyte' },
  ],
  B_LINEAGE: [
    { id: 'cd19_strong', label: 'CD19 (强阳性)', type: 'b' },
    { id: 'ccd79a', label: 'cCD79a', type: 'b' },
    { id: 'ccd22', label: 'cCD22', type: 'b' },
    { id: 'cd10', label: 'CD10', type: 'b' },
  ],
  T_LINEAGE: [{ id: 'ccd3', label: 'cCD3 (胞浆)', type: 't' }]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('risk');
  const [data, setData] = useState<PatientData>(initialPatientState);
  const [showProtocol, setShowProtocol] = useState(false);
  
  const [fibValue, setFibValue] = useState<number | ''>('');
  const [at3Value, setAt3Value] = useState<number | ''>('');
  
  const [mpalMarkers, setMpalMarkers] = useState<Record<string, boolean>>({});

  const [csfWbc, setCsfWbc] = useState<number | ''>('');
  const [hasBlasts, setHasBlasts] = useState(false);
  const [hasCranialNervePalsy, setHasCranialNervePalsy] = useState(false);

  const riskResult = useMemo(() => evaluateRisk(data), [data]);
  const currentProtocol = PROTOCOL_DETAILS[riskResult.level] || PROTOCOL_DETAILS[RiskLevel.PENDING];

  const handleChange = (field: keyof PatientData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const mpalAnalysis = useMemo(() => {
    const monoCount = ['cd11c', 'cd14', 'cd64', 'cd11b', 'lysozyme'].filter(m => mpalMarkers[m]).length;
    const isMyeloid = !!mpalMarkers['mpo'] || monoCount >= 2;
    const isB = !!mpalMarkers['cd19_strong'] || (['ccd79a', 'ccd22', 'cd10'].filter(m => mpalMarkers[m]).length >= 1);
    const isT = !!mpalMarkers['ccd3'];
    const lineages = [];
    if (isMyeloid) lineages.push('Myeloid (髓系)');
    if (isB) lineages.push('B-lineage (B系)');
    if (isT) lineages.push('T-lineage (T系)');
    return { isMyeloid, isB, isT, isMPAL: lineages.length >= 2, lineages, monoCount };
  }, [mpalMarkers]);

  const cnslConclusion = useMemo(() => {
    if (hasCranialNervePalsy) return { level: 'CNS3', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: '存在脑神经麻痹，直接判定为 CNS3 (CNSL)' };
    if (csfWbc === '' || csfWbc === 0) return hasBlasts ? { level: 'CNS2', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'WBC < 5/μL 但可见原始细胞' } : { level: 'CNS1', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: '无原始细胞' };
    if (csfWbc < 5) return hasBlasts ? { level: 'CNS2', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'WBC < 5/μL 且可见原始细胞' } : { level: 'CNS1', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: '无原始细胞' };
    return hasBlasts ? { level: 'CNS3', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'WBC ≥ 5/μL 且可见原始细胞 (CNSL)' } : { level: 'CNS1', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'WBC ≥ 5/μL 但无原始细胞' };
  }, [csfWbc, hasBlasts, hasCranialNervePalsy]);

  const coagAssessment = useMemo(() => {
    const isHighAgeRisk = data.age > 10;
    const isAt3Low = at3Value !== '' && at3Value < 60;
    const isFibLow = fibValue !== '' && fibValue < 1.0;
    const needsHeparin = isAt3Low || (isHighAgeRisk && fibValue !== '' && fibValue < 1.5);
    return { isHighAgeRisk, isAt3Low, isFibLow, needsHeparin };
  }, [data.age, at3Value, fibValue]);

  const toggleMpalMarker = (id: string) => {
    setMpalMarkers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden">
      <nav className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-3 px-2 mb-8 mt-4">
          <Activity className="w-8 h-8 text-blue-500" />
          <div className="leading-tight">
            <h1 className="font-bold text-white text-lg tracking-tight">SCCCG-ALL</h1>
            <p className="text-[10px] text-slate-500 font-medium">临床决策支持系统 V2.0</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <NavButton active={activeTab === 'risk'} onClick={() => setActiveTab('risk')} icon={<LayoutDashboard size={16}/>} label="危险度分层评估" />
          <NavButton active={activeTab === 'mpal'} onClick={() => setActiveTab('mpal')} icon={<Dna size={16}/>} label="MPAL 判定模块" />
          <NavButton active={activeTab === 'cnsl'} onClick={() => setActiveTab('cnsl')} icon={<Brain size={16}/>} label="CNSL 诊断与防治" />
          <NavButton active={activeTab === 'phlike'} onClick={() => setActiveTab('phlike')} icon={<Target size={16}/>} label="Ph-like 靶向建议" />
          <NavButton active={activeTab === 'coagulation'} onClick={() => setActiveTab('coagulation')} icon={<Droplets size={16}/>} label="L-ASP 凝血管理" />
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-800 mt-4">并发症管理 V2.0</div>
          <NavButton active={activeTab === 'stomatitis'} onClick={() => setActiveTab('stomatitis')} icon={<Smile size={16}/>} label="口腔炎的处理" />
          <NavButton active={activeTab === 'hyperleukemia'} onClick={() => setActiveTab('hyperleukemia')} icon={<AlertTriangle size={16}/>} label="高白细胞白血病" />
          <NavButton active={activeTab === 'tls'} onClick={() => setActiveTab('tls')} icon={<Waves size={16}/>} label="肿瘤溶解综合征" />
        </div>
        <div className="mt-auto pt-10 px-2 opacity-50 text-[10px]">
          <p>© 2025 SCCCG 方案专家组</p>
          <p>Manual V2.0 (宝典同步版)</p>
          <p className="mt-1 font-bold italic">Safety First: LZRYEK System</p>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative bg-transparent">
        
        {activeTab === 'risk' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">危险度分层评估 (V2.0)</h2>
                  <p className="text-slate-500 text-sm">已剔除强的松试验，更新 MEF2D 及 TCF3-HLF 指标</p>
                </div>
                <button onClick={() => setData(initialPatientState)} className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors">
                  <RefreshCw size={14} /> 重置输入
                </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                   <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={16} className="text-blue-500"/> 临床基础信息
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="年龄 (岁)" value={data.age} onChange={v => handleChange('age', v)} />
                        <InputGroup label="初诊 WBC (×10⁹/L)" value={data.initialWbc} onChange={v => handleChange('initialWbc', v)} />
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">免疫分型</label>
                          <div className="flex p-1 bg-slate-100 rounded-lg">
                            {Object.values(Lineage).map(l => (
                              <button key={l} onClick={() => handleChange('lineage', l)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${data.lineage === l ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-end gap-3 pb-1">
                           <label className="flex items-center gap-2 cursor-pointer select-none">
                             <input type="checkbox" checked={data.cnsl} onChange={e => handleChange('cnsl', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                             <span className="text-xs font-bold text-slate-600">CNS3 累及</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer select-none">
                             <input type="checkbox" checked={data.testicularLeukemia} onChange={e => handleChange('testicularLeukemia', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                             <span className="text-xs font-bold text-slate-600">睾丸受累 (TL)</span>
                           </label>
                        </div>
                      </div>
                   </section>

                   <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Dna size={16} className="text-indigo-500"/> 分子与细胞遗传学 (V2.0)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <ToggleItem label="KMT2A (MLL) 重排" checked={data.mll} onChange={v => handleChange('mll', v)} danger />
                        <ToggleItem label="MEF2D::BCL9" checked={data.mef2dBcl9} onChange={v => handleChange('mef2dBcl9', v)} danger />
                        <ToggleItem label="TCF3-HLF" checked={data.tcf3Hlf} onChange={v => handleChange('tcf3Hlf', v)} danger />
                        <ToggleItem label="低二倍体 (<44)" checked={data.hypodiploidy44} onChange={v => handleChange('hypodiploidy44', v)} danger />
                        <ToggleItem label="IKZF1 缺失 (无DUX4)" checked={data.ikzf1DeleAndNoDux4} onChange={v => handleChange('ikzf1DeleAndNoDux4', v)} danger />
                        <ToggleItem label="t(1;19) (TCF3-PBX1)" checked={data.t1_19} onChange={v => handleChange('t1_19', v)} warning />
                        <ToggleItem label="Ph-ALL / Ph-Like" checked={data.phPositive || data.phLike} onChange={v => handleChange('phPositive', v)} warning />
                        <ToggleItem label="其他 MEF2D 重排" checked={data.mef2dOther} onChange={v => handleChange('mef2dOther', v)} warning />
                        <ToggleItem label="t(12;21) / ETV6-RUNX1" checked={data.etv6Runx1} onChange={v => handleChange('etv6Runx1', v)} success />
                        <ToggleItem label="超二倍体 (>50)" checked={data.hyperdiploidy50} onChange={v => handleChange('hyperdiploidy50', v)} success />
                      </div>
                   </section>

                   <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Microscope size={16} className="text-emerald-500"/> 治疗反应评估
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MrdInput label="d15 MRD (%)" value={data.mrdD15} onChange={v => handleChange('mrdD15', v)} />
                        <MrdInput label="d33 MRD (%)" value={data.mrdD33} onChange={v => handleChange('mrdD33', v)} />
                        <MrdInput label="W12 MRD (%)" value={data.mrdW12} onChange={v => handleChange('mrdW12', v)} />
                      </div>
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                        <ToggleItem label="诱导 d33 评估纵隔瘤灶缩小不足 1/3" checked={!data.d33MediastinalMassReduced} onChange={v => handleChange('d33MediastinalMassReduced', !v)} danger />
                        <ToggleItem label="巩固治疗前仍存在瘤灶" checked={data.persistentMassPreConsolidation} onChange={v => handleChange('persistentMassPreConsolidation', v)} danger />
                      </div>
                   </section>
                </div>
                <div className="space-y-6">
                  <div className="sticky top-6">
                    <section className={`rounded-3xl p-8 border-2 shadow-xl transition-all duration-500 text-center ${
                      riskResult.level === RiskLevel.HR ? 'bg-red-50/90 border-red-100' :
                      riskResult.level === RiskLevel.IR ? 'bg-amber-50/90 border-amber-100' :
                      'bg-emerald-50/90 border-emerald-100'
                    } backdrop-blur-md`}>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">V2.0 评估结果</p>
                      <h2 className={`text-3xl font-black mb-6 ${
                        riskResult.level === RiskLevel.HR ? 'text-red-700' :
                        riskResult.level === RiskLevel.IR ? 'text-amber-700' :
                        'text-emerald-700'
                      }`}>{riskResult.level}</h2>
                      <button onClick={() => setShowProtocol(true)} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg ${
                        riskResult.level === RiskLevel.HR ? 'bg-red-600 text-white' :
                        riskResult.level === RiskLevel.IR ? 'bg-amber-600 text-white' :
                        'bg-emerald-600 text-white'
                      }`}>
                        <Stethoscope size={20}/> 查看治疗建议
                      </button>
                      <div className="mt-8 text-left">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">决策依据：</h4>
                        <div className="space-y-2">
                          {riskResult.reasons.map((r, i) => (
                            <div key={i} className="flex gap-2 text-xs text-slate-600 font-medium">
                              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* MPAL Diagnostic Tab */}
        {activeTab === 'mpal' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
             <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">MPAL 判定模块 (WHO 2022)</h2>
                  <p className="text-slate-500 text-sm">混合表型急性白血病判定工具</p>
                </div>
                <button onClick={() => setMpalMarkers({})} className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1">
                  <RefreshCw size={12}/> 重置标记物
                </button>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <MpalMarkerGroup title="髓系标记 (Myeloid)" markers={MPAL_MARKERS.MYELOID} selected={mpalMarkers} onToggle={toggleMpalMarker} color="orange" />
                  <MpalMarkerGroup title="单核细胞分化 (Monocyte)" markers={MPAL_MARKERS.MONOCYTE} selected={mpalMarkers} onToggle={toggleMpalMarker} color="amber" subtitle="满足 2 项或以上判定单核分化" />
                  <MpalMarkerGroup title="B 淋巴系 (B-lineage)" markers={MPAL_MARKERS.B_LINEAGE} selected={mpalMarkers} onToggle={toggleMpalMarker} color="blue" subtitle="CD19(强) 或其他标记满足条件" />
                  <MpalMarkerGroup title="T 淋巴系 (T-lineage)" markers={MPAL_MARKERS.T_LINEAGE} selected={mpalMarkers} onToggle={toggleMpalMarker} color="purple" />
                </div>

                <div className="space-y-6">
                  <section className={`p-6 rounded-3xl border-2 transition-all ${mpalAnalysis.isMPAL ? 'bg-blue-600 border-blue-400 shadow-blue-200 text-white' : 'bg-white border-slate-200 text-slate-800'} shadow-xl`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest mb-4 opacity-70 ${mpalAnalysis.isMPAL ? 'text-blue-100' : 'text-slate-400'}`}>判定结论</h3>
                    <div className="flex items-center gap-3 mb-6">
                      {mpalAnalysis.isMPAL ? <CheckCircle2 size={32} className="text-white"/> : <HelpCircle size={32} className="text-slate-300"/>}
                      <div>
                        <p className={`text-2xl font-black ${mpalAnalysis.isMPAL ? 'text-white' : 'text-slate-400'}`}>
                          {mpalAnalysis.isMPAL ? '符合 MPAL' : '不符合 MPAL'}
                        </p>
                        <p className={`text-[10px] font-bold ${mpalAnalysis.isMPAL ? 'text-blue-100' : 'text-slate-400'}`}>
                          基于 WHO 2022 分型标准
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <div className={`p-3 rounded-xl flex items-center justify-between ${mpalAnalysis.isMyeloid ? (mpalAnalysis.isMPAL ? 'bg-blue-700' : 'bg-orange-50 text-orange-700') : 'bg-slate-50 text-slate-300'}`}>
                         <span className="text-xs font-black">髓系判定</span>
                         {mpalAnalysis.isMyeloid ? <span className="text-[10px] font-bold">Positive</span> : <X size={12}/>}
                       </div>
                       <div className={`p-3 rounded-xl flex items-center justify-between ${mpalAnalysis.isB ? (mpalAnalysis.isMPAL ? 'bg-blue-700' : 'bg-blue-50 text-blue-700') : 'bg-slate-50 text-slate-300'}`}>
                         <span className="text-xs font-black">B系判定</span>
                         {mpalAnalysis.isB ? <span className="text-[10px] font-bold">Positive</span> : <X size={12}/>}
                       </div>
                       <div className={`p-3 rounded-xl flex items-center justify-between ${mpalAnalysis.isT ? (mpalAnalysis.isMPAL ? 'bg-blue-700' : 'bg-purple-50 text-purple-700') : 'bg-slate-50 text-slate-300'}`}>
                         <span className="text-xs font-black">T系判定</span>
                         {mpalAnalysis.isT ? <span className="text-[10px] font-bold">Positive</span> : <X size={12}/>}
                       </div>
                    </div>

                    {mpalAnalysis.isMPAL && (
                      <div className="mt-6 pt-6 border-t border-blue-500/30">
                        <p className="text-[10px] font-bold mb-2 opacity-80 uppercase">受累谱系：</p>
                        <div className="flex flex-wrap gap-2">
                           {mpalAnalysis.lineages.map(l => (
                             <span key={l} className="px-2 py-1 bg-white/20 rounded text-[10px] font-black">{l}</span>
                           ))}
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <h4 className="text-[10px] font-black text-amber-800 uppercase mb-2 flex items-center gap-1"><Info size={12}/> WHO 2022 逻辑备注</h4>
                    <p className="text-[10px] text-amber-700 leading-relaxed italic">
                      1. 髓系判定：MPO 阳性或满足单核细胞系标准。<br/>
                      2. 单核标准：NSE、CD11c、CD14、CD64、溶菌酶中至少 2 项阳性。<br/>
                      3. T系标准：cCD3 强阳性。<br/>
                      4. B系标准：CD19 强阳性或其他标记符合条件。
                    </p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Ph-like Targeted Advice Tab */}
        {activeTab === 'phlike' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">Ph-like ALL 靶向建议 (V2.0)</h2>
                <p className="text-slate-500 text-sm">基于融合基因类型的精准治疗路径</p>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><Target size={24}/></div>
                      <div>
                        <h3 className="font-bold text-slate-800">ABL-class 通路</h3>
                        <p className="text-[10px] text-blue-600 font-black uppercase">ABL1, ABL2, CSF1R, PDGFRB 重排</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                         <p className="text-[10px] font-black text-blue-400 uppercase mb-1">推荐药物</p>
                         <p className="text-xl font-black text-blue-800">达沙替尼 (Dasatinib)</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400">剂量标准</p>
                            <p className="text-xs font-black text-slate-700">60 - 80 mg/m²/d</p>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400">给药频次</p>
                            <p className="text-xs font-black text-slate-700">每日一次 (QD)</p>
                         </div>
                      </div>
                      <div className="p-4 bg-slate-900 text-white rounded-2xl">
                         <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2">V2.0 介入时机</h4>
                         <p className="text-[11px] leading-relaxed">
                            • 若诱导 d15 骨髓原始细胞 ≥ 5%，建议从 d15 开始介入 TKI。<br/>
                            • 若已知存在 ABL 重排且 WBC 极高，临床医生可评估诱导早期介入。
                         </p>
                      </div>
                   </div>
                </section>

                <section className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200"><Dna size={24}/></div>
                      <div>
                        <h3 className="font-bold text-slate-800">JAK-STAT 通路</h3>
                        <p className="text-[10px] text-indigo-600 font-black uppercase">CRLF2, JAK1/2/3, EPOR, IL7R 重排</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                         <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">推荐药物</p>
                         <p className="text-xl font-black text-indigo-800">芦克替尼 (Ruxolitinib)</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400">剂量标准</p>
                            <p className="text-xs font-black text-slate-700">10 - 15 mg/m²/d</p>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400">给药频次</p>
                            <p className="text-xs font-black text-slate-700">分两次服用 (BID)</p>
                         </div>
                      </div>
                      <div className="p-4 bg-slate-900 text-white rounded-2xl">
                         <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-2">V2.0 介入时机</h4>
                         <p className="text-[11px] leading-relaxed">
                            • 建议根据诱导 d15 MRD 评估结果启动。<br/>
                            • Ruxolitinib 需特别关注贫血和血小板减少的骨髓抑制副反应。
                         </p>
                      </div>
                   </div>
                </section>
             </div>
          </div>
        )}

        {/* Coagulation Tab */}
        {activeTab === 'coagulation' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">L-ASP 凝血管理 (V2.0 附件七)</h2>
                  <p className="text-slate-500 text-sm">针对左旋门冬酰胺酶诱发的低凝状态及血栓预防</p>
                </div>
                <div className="px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                  Manual V2.0
                </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                   <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator size={16} className="text-blue-500"/>
                        <h3 className="font-bold text-slate-800">监测指标输入</h3>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">纤维蛋白原 Fib (g/L)</label>
                        <input type="number" step="0.1" value={fibValue} onChange={e => setFibValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-3xl font-black text-blue-600 py-2 border-b-2 border-slate-100 outline-none focus:border-blue-500 bg-transparent transition-all" placeholder="0.0"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">抗凝血酶 III AT-III (%)</label>
                        <input type="number" value={at3Value} onChange={e => setAt3Value(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-3xl font-black text-emerald-600 py-2 border-b-2 border-slate-100 outline-none focus:border-emerald-500 bg-transparent transition-all" placeholder="100"/>
                      </div>
                   </section>

                   <section className={`p-6 rounded-3xl border-2 transition-all ${coagAssessment.needsHeparin ? 'bg-orange-600 border-orange-400 text-white shadow-orange-200' : 'bg-white border-slate-200 text-slate-800'} shadow-xl`}>
                      <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">血栓风险评估</h3>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between border-b border-current border-opacity-10 pb-2">
                            <span className="text-xs font-bold">高龄风险 (年龄 &gt; 10)</span>
                            {coagAssessment.isHighAgeRisk ? <CheckCircle2 size={16}/> : <X size={16}/>}
                         </div>
                         <div className="flex items-center justify-between border-b border-current border-opacity-10 pb-2">
                            <span className="text-xs font-bold">AT-III 活性不足 (&lt; 60%)</span>
                            {coagAssessment.isAt3Low ? <CheckCircle2 size={16}/> : <X size={16}/>}
                         </div>
                         <div className="flex items-center justify-between border-b border-current border-opacity-10 pb-2">
                            <span className="text-xs font-bold">Fib 严重低下 (&lt; 1.0)</span>
                            {coagAssessment.isFibLow ? <CheckCircle2 size={16}/> : <X size={16}/>}
                         </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                         <p className="text-[10px] font-black uppercase mb-1 opacity-70">干预决策</p>
                         <p className="text-xl font-black">{coagAssessment.needsHeparin ? '建议启动预防性抗凝' : '继续严密观察'}</p>
                      </div>
                   </section>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                        <Droplets size={18}/> V2.0 凝血干预路径
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h4 className="text-sm font-black flex items-center gap-2 text-emerald-400"><Scale size={16}/> FIB 补充策略</h4>
                            <ul className="text-[11px] text-slate-400 space-y-2">
                               <li>• <span className="text-white font-bold">Fib &lt; 0.5 g/L</span>: 必须补充。</li>
                               <li>• <span className="text-white font-bold">Fib 0.5 ~ 0.8 g/L</span>: 若合并出血倾向，建议补充。</li>
                               <li>• <span className="text-white font-bold">推荐制剂</span>: 纤维蛋白原浓缩物 25~50 mg/kg。</li>
                            </ul>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-sm font-black flex items-center gap-2 text-blue-400"><HeartPulse size={16}/> AT-III 补充与抗凝</h4>
                            <ul className="text-[11px] text-slate-400 space-y-2">
                               <li>• <span className="text-white font-bold">AT-III &lt; 60%</span>: 补充 AT-III 浓缩物。</li>
                               <li>• <span className="text-white font-bold">计算公式</span>: (80 - 实测值) × 体重(kg) × 0.8。</li>
                               <li>• <span className="text-white font-bold">肝素应用</span>: 小剂量肝素持续输注 (2-5 U/kg/h)。</li>
                            </ul>
                         </div>
                      </div>
                   </section>
                </div>
             </div>
          </div>
        )}

        {/* Stomatitis Tab */}
        {activeTab === 'stomatitis' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">口腔炎防治与护理 (V2.0)</h2>
                <p className="text-slate-500 text-sm">针对大剂量化疗后的粘膜损伤管理</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StomatitisCard grade="1 级" desc="无症状或轻微红斑" treatment="软毛牙刷；生理盐水含漱；谷氨酰胺 0.3g/kg.d (最大30g)。" />
                <StomatitisCard grade="2 级" desc="红斑，溃疡，可正常进食" treatment="依信 (EGF) 喷剂；康复新液含漱；制霉菌素预防真菌。" />
                <StomatitisCard grade="3 级" desc="严重疼痛，仅能进流质" treatment="曲安奈德 tid；贝复新局部涂抹；PCA 镇痛介入。" color="border-orange-200 bg-orange-50" />
                <StomatitisCard grade="4 级" desc="危及生命，需气管切开或重症" treatment="全静脉营养 (TPN)；广谱抗感染；阿片类镇痛。" color="border-red-200 bg-red-50" />
             </div>
          </div>
        )}

        {/* Hyperleukemia Tab */}
        {activeTab === 'hyperleukemia' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">高白细胞白血病处理 (WBC &gt; 100)</h2>
                <p className="text-slate-500 text-sm">极高白细胞计数的紧急降白与并发症防范</p>
             </header>
             <div className="bg-red-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={80}/></div>
                <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Zap className="text-yellow-400"/> 紧急降白协议 (V2.0)</h3>
                <div className="space-y-6 relative z-10">
                   <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">1</div>
                      <div>
                         <p className="font-bold">羟基脲 (HU) 快速降白</p>
                         <p className="text-xs text-red-200 mt-1">100 mg/kg/d，分 2-3 次口服。待 WBC &lt; 50 × 10⁹/L 时停药。</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">2</div>
                      <div>
                         <p className="font-bold">强的松预处理</p>
                         <p className="text-xs text-red-200 mt-1">口服强的松或静脉地塞米松，严密监测 TLS。</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">3</div>
                      <div>
                         <p className="font-bold">强力水化碱化</p>
                         <p className="text-xs text-red-200 mt-1">3000 ml/m²/d 液体量，维持尿量 100-150 ml/h，尿 pH 7.0~7.5。</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TLS Tab */}
        {activeTab === 'tls' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">肿瘤溶解综合征 (TLS) 管理</h2>
                <p className="text-slate-500 text-sm">针对高负荷白血病化疗初期的代谢风险防范</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4">Cairo-Bishop 诊断标准</h3>
                   <div className="space-y-3">
                      <TlsMetric label="血尿酸 (Uric Acid)" val="≥ 476 μmol/L" />
                      <TlsMetric label="血钾 (Potassium)" val="≥ 6.0 mmol/L" />
                      <TlsMetric label="血磷 (Phosphorus)" val="≥ 2.1 mmol/L" />
                      <TlsMetric label="血钙 (Calcium)" val="≤ 1.75 mmol/L" />
                   </div>
                </section>
                <section className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl">
                   <h3 className="text-lg font-black mb-4 flex items-center gap-2"><FlaskConical className="text-indigo-300"/> 防治策略</h3>
                   <div className="space-y-5">
                      <div>
                         <p className="text-[10px] font-black text-indigo-400 uppercase">降尿酸药物</p>
                         <p className="text-sm font-bold mt-1">别嘌醇 (Allopurinol): 300 mg/m²/d</p>
                      </div>
                      <div className="pt-4 border-t border-indigo-800">
                         <p className="text-[10px] font-black text-indigo-400 uppercase">重症备选</p>
                         <p className="text-sm font-bold mt-1">拉布立海 (Rasburicase): 0.2 mg/kg</p>
                      </div>
                   </div>
                </section>
             </div>
          </div>
        )}

        {/* CNSL Tab */}
        {activeTab === 'cnsl' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">CNSL 诊断与防治 (V2.0)</h2>
                  <p className="text-slate-500 text-sm">中枢神经系统白血病的判定标准与三联鞘注方案</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">CNS1: 正常</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">CNS2: 警戒</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200">CNS3: 确诊 (CNSL)</span>
                </div>
             </header>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                   <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Calculator size={20}/></div>
                        <h3 className="font-bold text-slate-800">CNS 状态判定辅助</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">脑脊液 WBC 计数 (cells/μL)</label>
                            <input type="number" value={csfWbc} onChange={e => setCsfWbc(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-3xl font-black text-slate-700 py-2 border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="0"/>
                          </div>
                          <div className="space-y-3">
                             <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-blue-200 transition-all group">
                                <input type="checkbox" checked={hasBlasts} onChange={e => setHasBlasts(e.target.checked)} className="w-5 h-5 rounded text-blue-600"/>
                                <div><p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">可见原始细胞</p><p className="text-[10px] text-slate-400">脑脊液涂片发现</p></div>
                             </label>
                             <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-red-200 transition-all group">
                                <input type="checkbox" checked={hasCranialNervePalsy} onChange={e => setHasCranialNervePalsy(e.target.checked)} className="w-5 h-5 rounded text-red-600"/>
                                <div><p className="text-sm font-bold text-slate-700 group-hover:text-red-700">脑神经麻痹</p><p className="text-[10px] text-slate-400">需排除其他原因</p></div>
                             </label>
                          </div>
                        </div>
                        <div className={`p-8 rounded-3xl border-2 flex flex-col items-center justify-center text-center transition-all duration-500 ${cnslConclusion.bg} ${cnslConclusion.border}`}>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">判定结论</p>
                           <h4 className={`text-4xl font-black mb-2 ${cnslConclusion.color}`}>{cnslConclusion.level}</h4>
                           <p className="text-sm font-bold text-slate-700 px-4 leading-snug">{cnslConclusion.desc}</p>
                        </div>
                      </div>
                   </section>

                   <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Syringe size={20}/></div>
                        <h3 className="font-bold text-slate-800">三联鞘注 (TIT) 标准剂量</h3>
                      </div>
                      <div className="overflow-hidden border border-slate-100 rounded-2xl">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">年龄段</th>
                              <th className="px-4 py-3 text-[10px] font-black text-blue-600 uppercase">MTX (mg)</th>
                              <th className="px-4 py-3 text-[10px] font-black text-emerald-600 uppercase">Ara-C (mg)</th>
                              <th className="px-4 py-3 text-[10px] font-black text-amber-600 uppercase">Dex (mg)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                            <tr><td className="px-4 py-4">小于 1 岁</td><td className="px-4 py-4">6</td><td className="px-4 py-4">15</td><td className="px-4 py-4">2</td></tr>
                            <tr><td className="px-4 py-4">1 ~ 2 岁</td><td className="px-4 py-4">8</td><td className="px-4 py-4">20</td><td className="px-4 py-4">2</td></tr>
                            <tr className="bg-blue-50/30"><td className="px-4 py-4">2 ~ 3 岁</td><td className="px-4 py-4">10</td><td className="px-4 py-4">25</td><td className="px-4 py-4">5</td></tr>
                            <tr><td className="px-4 py-4">大于 3 岁</td><td className="px-4 py-4">12</td><td className="px-4 py-4">30</td><td className="px-4 py-4">5</td></tr>
                          </tbody>
                        </table>
                      </div>
                   </section>
                </div>
                <div className="space-y-6">
                   <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2"><ListChecks size={16}/> 防治方案要点</h3>
                      <div className="space-y-6">
                         <div className="relative pl-6 border-l border-slate-700">
                            <div className="absolute -left-1.5 top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900 shadow-sm shadow-blue-500/50" />
                            <h4 className="text-sm font-black mb-1">预防性方案</h4>
                            <ul className="text-[10px] text-slate-400 space-y-1">
                               <li>• 诱导期：d1, d15, d33 (TIT × 3)</li>
                               <li>• 巩固期：HD-MTX 前均需 TIT</li>
                               <li>• 维持期：每 8~12 周一次 TIT</li>
                            </ul>
                         </div>
                         <div className="relative pl-6 border-l border-slate-700">
                            <div className="absolute -left-1.5 top-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 shadow-sm shadow-red-500/50" />
                            <h4 className="text-sm font-black mb-1">治疗性方案</h4>
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 mt-2">
                               <p className="text-[10px] font-bold text-red-400">TIT 每周 2 次，直至 CSF 正常 × 2</p>
                            </div>
                         </div>
                      </div>
                   </section>
                </div>
             </div>
          </div>
        )}

      </main>

      {showProtocol && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-6 flex items-center justify-between text-white ${riskResult.level === RiskLevel.HR ? 'bg-red-600' : riskResult.level === RiskLevel.IR ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              <h3 className="text-xl font-bold flex items-center gap-2"><Stethoscope/> V2.0 方案建议: {riskResult.level}</h3>
              <button onClick={() => setShowProtocol(false)}><X/></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="p-4 bg-slate-50 rounded-xl text-sm border border-slate-100 italic text-slate-600">{currentProtocol.highlight}</div>
              <div className="relative space-y-8 pl-6 border-l-2 border-slate-100">
                {currentProtocol.phases.map((p, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full" />
                    <h4 className="font-bold text-slate-800">{p.name} <span className="text-[10px] text-slate-400 ml-2">{p.duration}</span></h4>
                    <p className="text-xs text-slate-500 mt-1">{p.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Helpers --- */

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}><span className="shrink-0">{icon}</span><span className="truncate">{label}</span></button>
  );
}

function InputGroup({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</label>
      <input type="number" value={value || ''} onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function ToggleItem({ label, checked, onChange, danger, success, warning }: any) {
  return (
    <button onClick={() => onChange(!checked)} className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
      checked ? (danger ? 'bg-red-50 border-red-200 text-red-700' : success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700') : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
    }`}>
      <span className="text-[10px] font-bold truncate pr-2">{label}</span>
      <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${checked ? 'bg-current border-current' : 'border-slate-300'}`}>
        {checked && <div className="w-1 h-1 bg-white rounded-full" />}
      </div>
    </button>
  );
}

function MrdInput({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
      <div className="relative">
        <input type="number" step="0.001" value={value === null ? '' : value} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold" />
        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">%</span>
      </div>
    </div>
  );
}

function MpalMarkerGroup({ title, markers, selected, onToggle, color }: any) {
  const styles: any = { 
    orange: 'bg-orange-50 border-orange-100 text-orange-900', 
    blue: 'bg-blue-50 border-blue-100 text-blue-900', 
    amber: 'bg-amber-50 border-amber-100 text-amber-900', 
    purple: 'bg-purple-50 border-purple-100 text-purple-900' 
  };
  const btnActive: any = { 
    orange: 'bg-orange-500 text-white', 
    blue: 'bg-blue-500 text-white', 
    amber: 'bg-amber-500 text-white', 
    purple: 'bg-purple-500 text-white' 
  };
  return (
    <section className={`p-4 rounded-2xl border ${styles[color]}`}>
      <h3 className="text-[10px] font-black uppercase mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {markers.map((m: any) => (
          <button key={m.id} onClick={() => onToggle(m.id)} className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${selected[m.id] ? btnActive[color] : 'bg-white border-slate-200 text-slate-600'}`}>{m.label}</button>
        ))}
      </div>
    </section>
  );
}

function StomatitisCard({ grade, desc, treatment, color = "border-slate-200 bg-white" }: any) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${color}`}>
       <div className="flex justify-between items-center mb-2"><span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-black rounded">{grade}</span></div>
       <p className="text-xs font-bold text-slate-800 mb-2">{desc}</p>
       <p className="text-[11px] text-slate-600 leading-relaxed"><span className="font-bold">处理建议：</span>{treatment}</p>
    </div>
  );
}

function TlsMetric({ label, val }: any) {
  return (
    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
       <span className="text-[11px] font-medium text-slate-500">{label}</span>
       <span className="text-xs font-black text-slate-800">{val}</span>
    </div>
  );
}
