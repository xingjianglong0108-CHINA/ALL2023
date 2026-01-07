
import React, { useState, useMemo } from 'react';
import { PatientData, Lineage, RiskLevel } from './types';
import { initialPatientState, evaluateRisk } from './constants';
import { 
  Activity, Dna, User, Microscope, AlertCircle, RefreshCw, HelpCircle, 
  Stethoscope, X, Clock, FlaskConical, ShieldCheck, Target, Droplets, 
  LayoutDashboard, ShieldAlert, Table as TableIcon, Smile, Waves, AlertTriangle,
  Zap, Info, Flame, Brain, CheckCircle2, ChevronRight, Calculator, ListChecks, Syringe
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

// MPAL 标记物定义
const MPAL_MARKERS = {
  MYELOID: [
    { id: 'mpo', label: 'MPO (强度>50%)', type: 'myeloid' },
  ],
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
  T_LINEAGE: [
    { id: 'ccd3', label: 'cCD3 (胞浆)', type: 't' },
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('risk');
  const [data, setData] = useState<PatientData>(initialPatientState);
  const [showProtocol, setShowProtocol] = useState(false);
  
  const [fibValue, setFibValue] = useState<number | ''>('');
  const [at3Value, setAt3Value] = useState<number | ''>('');
  
  // MPAL 专用状态
  const [mpalMarkers, setMpalMarkers] = useState<Record<string, boolean>>({});

  // CNSL 判定专用状态
  const [csfWbc, setCsfWbc] = useState<number | ''>('');
  const [hasBlasts, setHasBlasts] = useState(false);
  const [hasCranialNervePalsy, setHasCranialNervePalsy] = useState(false);

  const riskResult = useMemo(() => evaluateRisk(data), [data]);
  const currentProtocol = PROTOCOL_DETAILS[riskResult.level] || PROTOCOL_DETAILS[RiskLevel.PENDING];

  const handleChange = (field: keyof PatientData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // MPAL 判定逻辑
  const mpalAnalysis = useMemo(() => {
    const monoCount = ['cd11c', 'cd14', 'cd64', 'cd11b', 'lysozyme'].filter(m => mpalMarkers[m]).length;
    
    const isMyeloid = !!mpalMarkers['mpo'] || monoCount >= 2;
    const isB = !!mpalMarkers['cd19_strong'] || (['ccd79a', 'ccd22', 'cd10'].filter(m => mpalMarkers[m]).length >= 1);
    const isT = !!mpalMarkers['ccd3'];

    const lineages = [];
    if (isMyeloid) lineages.push('Myeloid (髓系)');
    if (isB) lineages.push('B-lineage (B系)');
    if (isT) lineages.push('T-lineage (T系)');

    const isMPAL = lineages.length >= 2;

    return { isMyeloid, isB, isT, isMPAL, lineages, monoCount };
  }, [mpalMarkers]);

  // CNSL 实时判定结论
  const cnslConclusion = useMemo(() => {
    if (hasCranialNervePalsy) return { level: 'CNS3', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: '存在脑神经麻痹，直接判定为 CNS3 (CNSL)' };
    if (csfWbc === '' || csfWbc === 0) {
       return hasBlasts ? { level: 'CNS2', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'WBC < 5/μL 但可见原始细胞' } : { level: 'CNS1', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: '无原始细胞' };
    }
    if (csfWbc < 5) {
       return hasBlasts ? { level: 'CNS2', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'WBC < 5/μL 且可见原始细胞' } : { level: 'CNS1', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: '无原始细胞' };
    }
    return hasBlasts ? { level: 'CNS3', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'WBC ≥ 5/μL 且可见原始细胞 (CNSL)' } : { level: 'CNS1', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'WBC ≥ 5/μL 但无原始细胞' };
  }, [csfWbc, hasBlasts, hasCranialNervePalsy]);

  const toggleMpalMarker = (id: string) => {
    setMpalMarkers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden">
      {/* 水印层 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] select-none flex flex-wrap justify-center content-center gap-20 p-10">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="text-4xl font-black transform -rotate-45 whitespace-nowrap text-slate-900">
            LZRYEK
          </div>
        ))}
      </div>

      {/* 侧边导航栏 */}
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
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">并发症管理</div>
          <NavButton active={activeTab === 'stomatitis'} onClick={() => setActiveTab('stomatitis')} icon={<Smile size={16}/>} label="口腔炎的处理" />
          <NavButton active={activeTab === 'hyperleukemia'} onClick={() => setActiveTab('hyperleukemia')} icon={<AlertTriangle size={16}/>} label="高白细胞白血病" />
          <NavButton active={activeTab === 'tls'} onClick={() => setActiveTab('tls')} icon={<Waves size={16}/>} label="肿瘤溶解综合征" />
        </div>

        <div className="mt-auto pt-10 px-2 opacity-50 text-[10px]">
          <p>© 2025 SCCCG 方案专家组</p>
          <p>Manual V2.0 (Updated 2025.08)</p>
          <p className="mt-1 font-bold">LZRYEK Security</p>
        </div>
      </nav>

      {/* 主内容区 */}
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

        {/* MPAL 判定模块 (WHO 2022) */}
        {activeTab === 'mpal' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
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
                      1. 髓系判定：MPO 阳性（流式/IHC）或满足单核细胞系标准。<br/>
                      2. 单核标准：NSE、CD11c、CD14、CD64、溶菌酶中至少 2 项阳性。<br/>
                      3. T系标准：cCD3 强阳性。<br/>
                      4. B系标准：CD19 强阳性。
                    </p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* CNSL 诊断与防治版块 (完善后) */}
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
                {/* 判定工具卡片 */}
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
                            <input 
                              type="number" 
                              value={csfWbc} 
                              onChange={e => setCsfWbc(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="输入计数..."
                              className="w-full text-3xl font-black text-slate-700 py-2 border-b-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            />
                          </div>
                          
                          <div className="space-y-3">
                             <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-blue-200 transition-all group">
                                <input type="checkbox" checked={hasBlasts} onChange={e => setHasBlasts(e.target.checked)} className="w-5 h-5 rounded text-blue-600"/>
                                <div>
                                   <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">可见原始细胞 (Blasts)</p>
                                   <p className="text-[10px] text-slate-400">脑脊液离心沉淀涂片发现</p>
                                </div>
                             </label>

                             <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-red-200 transition-all group">
                                <input type="checkbox" checked={hasCranialNervePalsy} onChange={e => setHasCranialNervePalsy(e.target.checked)} className="w-5 h-5 rounded text-red-600"/>
                                <div>
                                   <p className="text-sm font-bold text-slate-700 group-hover:text-red-700 transition-colors">脑神经麻痹</p>
                                   <p className="text-[10px] text-slate-400">需除外其他原因导致的瘫痪</p>
                                </div>
                             </label>
                          </div>
                        </div>

                        <div className={`p-8 rounded-3xl border-2 flex flex-col items-center justify-center text-center transition-all duration-500 ${cnslConclusion.bg} ${cnslConclusion.border}`}>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">判定结论</p>
                           <h4 className={`text-4xl font-black mb-2 ${cnslConclusion.color}`}>{cnslConclusion.level}</h4>
                           <p className="text-sm font-bold text-slate-700 px-4 leading-snug">{cnslConclusion.desc}</p>
                           
                           <div className="mt-6 flex gap-1">
                              {[1,2,3].map(i => (
                                <div key={i} className={`w-8 h-1 rounded-full ${cnslConclusion.level === 'CNS'+i ? (i===1?'bg-emerald-500':i===2?'bg-amber-500':'bg-red-500') : 'bg-slate-200 opacity-30'}`} />
                              ))}
                           </div>
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
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-4">小于 1 岁</td><td className="px-4 py-4">6</td><td className="px-4 py-4">15</td><td className="px-4 py-4">2</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-4">1 ~ 2 岁</td><td className="px-4 py-4">8</td><td className="px-4 py-4">20</td><td className="px-4 py-4">2</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors bg-blue-50/30">
                              <td className="px-4 py-4">2 ~ 3 岁</td><td className="px-4 py-4">10</td><td className="px-4 py-4">25</td><td className="px-4 py-4">5</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-4">大于 3 岁</td><td className="px-4 py-4">12</td><td className="px-4 py-4">30</td><td className="px-4 py-4">5</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-4 text-[10px] text-slate-400 italic">备注：由于 V2.0 方案优化，HD-MTX 期间的鞘注可根据情况调整。注意：MTX 需避光使用。</p>
                   </section>
                </div>

                {/* 右侧明细卡片 */}
                <div className="space-y-6">
                   <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                        <ListChecks size={16}/> 防治方案要点
                      </h3>
                      
                      <div className="space-y-6">
                         <div className="relative pl-6 border-l border-slate-700">
                            <div className="absolute -left-1.5 top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900 shadow-sm shadow-blue-500/50" />
                            <h4 className="text-sm font-black mb-1">预防性方案 (Prophylaxis)</h4>
                            <ul className="text-[10px] text-slate-400 space-y-1">
                               <li>• 诱导期：d1, d15, d33 (TIT × 3)</li>
                               <li>• 巩固期：HD-MTX 前均需 TIT</li>
                               <li>• 维持期：每 8~12 周一次 TIT</li>
                               <li className="text-blue-400 mt-1 font-bold">总计：LR 13~14次 / IR&HR 18~22次</li>
                            </ul>
                         </div>

                         <div className="relative pl-6 border-l border-slate-700">
                            <div className="absolute -left-1.5 top-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 shadow-sm shadow-red-500/50" />
                            <h4 className="text-sm font-black mb-1">治疗性方案 (Treatment)</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                               针对 CNS2/CNS3/TLM+ 的强化治疗：
                            </p>
                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                               <p className="text-[10px] font-bold text-red-400">TIT 每周 2 次，直至 CSF 正常 × 2</p>
                               <p className="text-[10px] text-slate-400 mt-1">随后每 1~2 周一次巩固，直至进入维持期转为常规。</p>
                            </div>
                         </div>
                         
                         <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl">
                            <h4 className="text-[10px] font-black text-amber-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12}/> CRT 放射治疗指征</h4>
                            <p className="text-[10px] text-amber-200/70 leading-relaxed">
                               1. 确诊 CNS3 的 T-ALL 或 HR-B-ALL。<br/>
                               2. 诱导结束 CSF 未转阴。<br/>
                               3. 建议年龄 &gt; 2 岁，剂量 12~18 Gy。
                            </p>
                         </div>
                      </div>
                   </section>

                   <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2"><Info size={14} className="text-blue-500"/> 穿刺损伤 (Traumatic LP)</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
                         定义：CSF 中 RBC &ge; 10/μL 且可见原始细胞。
                      </p>
                      <div className="text-[10px] font-bold p-3 bg-blue-50 rounded-xl text-blue-800 border border-blue-100">
                         处理建议：建议在后续 IT 时追加 Ara-C 或 Dex 的剂量，并在下次 IT 前确保复查 CSF 结果。注意止血药的使用。
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* 凝血管理模块 (同步 V2.0 附件七) */}
        {activeTab === 'coagulation' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">L-ASP 凝血管理 (V2.0)</h2>
                <p className="text-slate-500 text-sm">监测 AT-III 及 FIB，注意 11-16 岁为血栓高发年龄段</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Fib (g/L)</label>
                      <input type="number" step="0.1" value={fibValue} onChange={e => setFibValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-4xl font-black text-blue-600 py-2 border-b-2 border-slate-100 bg-transparent outline-none focus:border-blue-500" placeholder="0.0"/>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">AT-III (%)</label>
                      <input type="number" value={at3Value} onChange={e => setAt3Value(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-4xl font-black text-emerald-600 py-2 border-b-2 border-slate-100 bg-transparent outline-none focus:border-emerald-500" placeholder="0"/>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                      <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Info size={16}/> V2.0 手册提示</h4>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        • 穿刺损伤定义：CSF 中 RBC &ge; 10/μL。<br/>
                        • AT 活性需维持在 60% 以上，否则需加用肝素。<br/>
                        • FIB &lt; 0.5 g/L 时建议补充纤维蛋白原浓缩物。
                      </p>
                   </div>
                   {fibValue !== '' && fibValue < 0.5 && (
                     <div className="p-4 bg-red-100 text-red-800 rounded-xl font-bold text-sm flex items-center gap-2">
                        <AlertCircle/> Fib 低于阈值，建议干预
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* 其他 Tab 内容... */}
        {activeTab === 'stomatitis' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header><h2 className="text-2xl font-bold text-slate-800">口腔炎分级处理</h2></header>
             <div className="grid grid-cols-1 gap-4">
                <StomatitisGrade grade="1 级" ctcae="无症状或红斑" treatment="谷氨酰胺 0.3g/kg.d；依信含漱。" />
                <StomatitisGrade grade="3 级" ctcae="严重疼痛，仅能进流食" treatment="贝复新涂患处；曲安奈德 tid；必要时阿片类镇痛。" alert="V2.0：若 ANC < 0.5 必须全身抗感染。" />
             </div>
          </div>
        )}

        {activeTab === 'hyperleukemia' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header><h2 className="text-2xl font-bold text-slate-800">高白处理 (WBC &gt; 100)</h2></header>
             <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><Zap/> 紧急降白建议</h3>
                <p className="text-xs text-red-700 leading-relaxed italic">
                  HU 100mg/kg.d；WBC &gt; 100 慎输 RBC 除非 Hb &lt; 40g/L；强力水化 3000ml/m².d。
                </p>
             </div>
          </div>
        )}

        {activeTab === 'tls' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header><h2 className="text-2xl font-bold text-slate-800">肿瘤溶解综合征 (TLS)</h2></header>
             <div className="grid grid-cols-2 gap-4">
                <MetricBox label="血尿酸" val="&gt; 476 μmol/L" desc="或增加 25%" />
                <MetricBox label="血钾" val="&gt; 6.0 mmol/L" desc="或增加 25%" />
             </div>
          </div>
        )}
        
        {activeTab === 'phlike' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header><h2 className="text-2xl font-bold text-slate-800">Ph-like 靶向用药 (V2.0)</h2></header>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <TargetOption title="JAK-STAT 通路" drug="芦克替尼" color="indigo" fusions="CRLF2, JAK1/2/3, IL7R" dosage="10-15mg/m² BID"/>
               <TargetOption title="ABL 家族重排" drug="达沙替尼" color="blue" fusions="ABL1/2, CSF1R, PDGFRB" dosage="60-80mg/m² QD"/>
             </div>
          </div>
        )}

      </main>

      {/* 方案建议弹窗 */}
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

/* --- 辅助组件 --- */

function MpalMarkerGroup({ title, subtitle, markers, selected, onToggle, color }: any) {
  const colorStyles: any = {
    orange: 'bg-orange-50 border-orange-100 text-orange-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
    purple: 'bg-purple-50 border-purple-100 text-purple-900'
  };

  const btnActiveStyles: any = {
    orange: 'bg-orange-500 text-white border-orange-600',
    amber: 'bg-amber-500 text-white border-amber-600',
    blue: 'bg-blue-500 text-white border-blue-600',
    purple: 'bg-purple-500 text-white border-purple-600'
  };

  return (
    <section className={`p-5 rounded-2xl border ${colorStyles[color]} transition-all`}>
      <div className="mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
        {subtitle && <p className="text-[10px] opacity-60 font-bold">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {markers.map((m: any) => (
          <button
            key={m.id}
            onClick={() => onToggle(m.id)}
            className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all text-left flex items-center justify-between ${
              selected[m.id] 
                ? btnActiveStyles[color]
                : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'
            }`}
          >
            {m.label}
            {selected[m.id] && <CheckCircle2 size={10}/>}
          </button>
        ))}
      </div>
    </section>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function InputGroup({ label, value, onChange }: { label: string, value: number | null, onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</label>
      <input 
        type="number" 
        value={value === 0 ? '' : (value || '')} 
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-full px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
      />
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
        <input type="number" step="0.001" value={value === null ? '' : value} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold bg-white/50" />
        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">%</span>
      </div>
    </div>
  );
}

function StomatitisGrade({ grade, ctcae, treatment, alert }: any) {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white/90 shadow-sm space-y-2">
       <div className="flex justify-between items-center"><span className="px-2 py-1 bg-slate-800 text-white text-xs font-black rounded">{grade}</span><span className="text-[10px] text-slate-400">CTCAE v5.0</span></div>
       <p className="text-xs font-bold text-slate-700 italic">{ctcae}</p>
       <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold">处理：</span>{treatment}</p>
       {alert && <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg">{alert}</p>}
    </div>
  );
}

function MetricBox({ label, val, desc }: any) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-lg font-black text-slate-700">{val}</p>
      <p className="text-[10px] text-slate-400">{desc}</p>
    </div>
  );
}

function TargetOption({ title, fusions, drug, dosage, color }: any) {
  const colors: any = { blue: 'border-blue-200 bg-blue-50 text-blue-800', indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800' };
  return (
    <div className={`p-6 rounded-3xl border-2 ${colors[color]}`}>
      <h4 className="font-black mb-1">{title}</h4>
      <p className="text-xs opacity-70 mb-4">涉及基因: {fusions}</p>
      <div className="flex items-center gap-6">
        <div><p className="text-[10px] font-bold uppercase opacity-50">建议药物</p><p className="font-bold">{drug}</p></div>
        <div><p className="text-[10px] font-bold uppercase opacity-50">用法参考</p><p className="font-bold">{dosage}</p></div>
      </div>
    </div>
  );
}
