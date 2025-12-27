
import React, { useState, useMemo } from 'react';
import { PatientData, Lineage, RiskLevel } from './types';
import { initialPatientState, evaluateRisk } from './constants';
// Added Brain to the lucide-react imports
import { 
  Activity, Dna, User, Microscope, AlertCircle, RefreshCw, HelpCircle, 
  Stethoscope, X, Clock, FlaskConical, ShieldCheck, Target, Droplets, 
  LayoutDashboard, ShieldAlert, Table as TableIcon, Smile, Waves, AlertTriangle,
  Zap, Info, Flame, Brain
} from 'lucide-react';

const PROTOCOL_DETAILS = {
  [RiskLevel.LR]: {
    phases: [
      { name: "诱导缓解 (Induction)", duration: "d1-d33", detail: "VDLP 方案 (VCR + DNR + L-ASP + Pred/Dex)。" },
      { name: "早期巩固 (Consolidation)", duration: "W5-W12", detail: "CAM 方案。重点在于维持缓解状态。" },
      { name: "延迟强化 (Re-induction)", duration: "W20-W26", detail: "标准再诱导方案。" },
      { name: "维持治疗 (Maintenance)", duration: "2-2.5 年", detail: "口服 6-MP 和 MTX。" }
    ],
    highlight: "重点：在保证疗效的前提下，尽量减少长期毒性。"
  },
  [RiskLevel.IR]: {
    phases: [
      { name: "诱导缓解 (Induction)", duration: "d1-d33", detail: "强化型 VDLP。若 Ph+ 需尽早考虑 TKI。" },
      { name: "早期巩固 (Consolidation)", duration: "W5-W14", detail: "增加强度。包括 HD-MTX 处理。" },
      { name: "延迟强化 (Re-induction)", duration: "W24-W30", detail: "双重再诱导。" },
      { name: "维持治疗 (Maintenance)", duration: "2.5 年", detail: "强化维持期管理。" }
    ],
    highlight: "重点：强化巩固和 CNS 预防，根据 MRD 动态调整。"
  },
  [RiskLevel.HR]: {
    phases: [
      { name: "诱导缓解 (Induction)", duration: "d1-d33", detail: "高强度 VDLP。严密监测并发症。" },
      { name: "早期巩固 (Consolidation)", duration: "W5-W16", detail: "高强度化疗块 (HD-MTX, HD-Ara-C)。" },
      { name: "移植评估 (HSCT)", duration: "关键决策", detail: "MRD 持续阳性建议缓解后尽快行 allo-HSCT。" },
      { name: "维持治疗", duration: "长期", detail: "非移植患者进行极高强度维持。" }
    ],
    highlight: "重点：最大强度化疗。积极评估移植适应症。"
  },
  [RiskLevel.PENDING]: { phases: [], highlight: "请先完成评估。" }
};

type AppTab = 'risk' | 'mpal' | 'cnsl' | 'phlike' | 'coagulation' | 'stomatitis' | 'hyperleukemia' | 'tls';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('risk');
  const [data, setData] = useState<PatientData>(initialPatientState);
  const [showProtocol, setShowProtocol] = useState(false);
  const [showDoseTable, setShowDoseTable] = useState(false);

  const [fibValue, setFibValue] = useState<number | ''>('');
  const [at3Value, setAt3Value] = useState<number | ''>('');
  const [mpalMarkers, setMpalMarkers] = useState<Record<string, boolean>>({});

  const riskResult = useMemo(() => evaluateRisk(data), [data]);
  const currentProtocol = PROTOCOL_DETAILS[riskResult.level] || PROTOCOL_DETAILS[RiskLevel.PENDING];

  const handleChange = (field: keyof PatientData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden">
      {/* 水印层 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] select-none flex flex-wrap justify-center content-center gap-20 p-10">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="text-4xl font-black transform -rotate-45 whitespace-nowrap">
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
            <p className="text-[10px] text-slate-500 font-medium">临床决策支持系统 2023</p>
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
          <p>© 2024 SCCCG 方案专家组</p>
          <p>Version 3.5 (Updated 2023.09)</p>
          <p className="mt-1 font-bold">LZRYEK Security</p>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative bg-transparent">
        {/* 危险度分层评估模块 */}
        {activeTab === 'risk' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">危险度分层评估</h2>
                  <p className="text-slate-500 text-sm">根据 SCCCG-ALL-2023 方案执行自动化分层计算</p>
                </div>
                <button onClick={() => setData(initialPatientState)} className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors">
                  <RefreshCw size={14} /> 重置输入
                </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                   <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={16} className="text-blue-500"/> 基础临床信息
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
                        <Dna size={16} className="text-indigo-500"/> 生物学/遗传学指标
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <ToggleItem label="MLL / MEF2D 重排" checked={data.mllOrMef2d} onChange={v => handleChange('mllOrMef2d', v)} danger />
                        <ToggleItem label="iAMP21" checked={data.iamp21} onChange={v => handleChange('iamp21', v)} danger />
                        <ToggleItem label="IKZF1 缺失 (无DUX4)" checked={data.ikzf1DeleAndNoDux4} onChange={v => handleChange('ikzf1DeleAndNoDux4', v)} danger />
                        <ToggleItem label="t(12;21) / ETV6-RUNX1" checked={data.etv6Runx1} onChange={v => handleChange('etv6Runx1', v)} success />
                        <ToggleItem label="超二倍体 (>50,+4,+10)" checked={data.hyperdiploidy50} onChange={v => handleChange('hyperdiploidy50', v)} success />
                        <ToggleItem label="Ph-ALL t(9;22)" checked={data.phPositive} onChange={v => handleChange('phPositive', v)} warning />
                        <ToggleItem label="Ph-Like ALL" checked={data.phLike} onChange={v => handleChange('phLike', v)} warning />
                      </div>
                   </section>
                   <section className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Microscope size={16} className="text-emerald-500"/> 治疗反应评估 (MRD)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MrdInput label="d15 MRD (%)" value={data.mrdD15} onChange={v => handleChange('mrdD15', v)} info={<MrdLegend d15 />} />
                        <MrdInput label="d33 MRD (%)" value={data.mrdD33} onChange={v => handleChange('mrdD33', v)} info={<MrdLegend d33 />} />
                        <MrdInput label="巩固前 MRD (%)" value={data.mrdW12} onChange={v => handleChange('mrdW12', v)} info={<MrdLegend w12 />} />
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
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">评估结果</p>
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
                        <Stethoscope size={20}/> 查看治疗方案建议
                      </button>
                      <div className="mt-8 text-left">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">决策依据：</h4>
                        <div className="space-y-2">
                          {riskResult.reasons.map((r, i) => (
                            <div key={i} className="flex gap-2 text-xs text-slate-600 font-medium">
                              <div className="w-1 h-1 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
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

        {/* 口腔炎的处理模块 */}
        {activeTab === 'stomatitis' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
            <header className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">口腔炎的处理</h2>
                <p className="text-slate-500 text-sm">评分标准采用 CTCAE v5.0 | 处理建议参考《宝典 2023 附录6》</p>
              </div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">口腔粘膜炎</div>
            </header>

            <div className="grid grid-cols-1 gap-4">
              <StomatitisGrade 
                grade="1 级" 
                ctcae="无症状或症状轻微；仅有红斑"
                treatment="1. 谷氨酰胺 0.3g/kg.d 分次 po；2. 依信含漱(尽量>30s/次) qid，漱口后暂禁水食；3. 保持口腔清洁，避免硬食。"
              />
              <StomatitisGrade 
                grade="2 级" 
                ctcae="疼痛但可进固体食物；散在溃疡"
                treatment="1. 延续 1 级处理；2. 增加谷氨酰胺颗粒/施林 po tid (按年龄调整剂量)；3. 局部可喷涂利多卡因止痛。"
              />
              <StomatitisGrade 
                grade="3 级" 
                ctcae="严重疼痛；干扰进食，仅能进流食"
                treatment="1. 延续 2 级处理；2. 贝复新(重组牛成纤维细胞生长因子)涂患处 q12h；3. 曲安奈德软膏涂溃疡处 tid；4. 必要时巨和粒含漱。"
                alert="ANC < 0.5 或伴感染者需开始全身抗感染治疗。"
              />
              <StomatitisGrade 
                grade="4 级" 
                ctcae="威胁生命；无法进食进水，需住院治疗"
                treatment="1. 全面升级处理方案；2. 开始静脉营养支持(TPN)；3. 静脉使用谷氨酰胺；4. 康普舒漱口液漱口；5. 严防败血症。"
                danger
              />
            </div>

            <div className="bg-amber-50/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-200 flex gap-4">
              <Info className="text-amber-600 shrink-0" size={24}/>
              <div className="text-xs text-amber-900 space-y-2">
                <p className="font-bold uppercase tracking-widest text-[10px]">专家特别提醒：</p>
                <p>• <b>真菌防治：</b>疑有鹅口疮需加用 2.5%SB 漱口，并在依信漱口后涂抹制霉菌素(100万U+NS20ml)。</p>
                <p>• <b>止痛管理：</b>严重溃疡痛可酌情使用喷利多卡因止痛。无法耐受者需考虑阿片类药物镇痛。</p>
              </div>
            </div>
          </div>
        )}

        {/* 高白细胞白血病处理模块 */}
        {activeTab === 'hyperleukemia' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">高白细胞白血病的处理</h2>
                <p className="text-slate-500 text-sm">定义：WBC > 100 × 10⁹/L | 紧急并发症预防建议</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-red-600"><Flame size={18}/> 核心风险与监测</h3>
                   <p className="text-xs text-slate-500 leading-relaxed mb-4">WBC > 100 时脑出血风险增高，WBC > 300/400 为重症。主因白细胞淤滞导致脑/肺栓塞。</p>
                   <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-slate-50 rounded-lg text-xs"><span>头颅 CT</span><span className="font-bold">评估颅内出血</span></div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded-lg text-xs"><span>PLT 维持</span><span className="font-bold">30 - 50k</span></div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded-lg text-xs"><span>降尿酸</span><span className="font-bold">拉布立海/非布司他</span></div>
                   </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-bold flex items-center gap-2 mb-4 text-blue-600"><Zap size={18}/> 减负与水化建议</h3>
                   <ul className="text-xs text-slate-600 space-y-3">
                      <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0"/><b>羟基脲 (HU)：</b>100mg/kg.d 分次口服，Q12H 监测，WBC &lt; 100 后停药。</li>
                      <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0"/><b>输血限制：</b>WBC > 100 尽量不输红细胞，除非 Hb &lt; 40g/L，且需分次少量 (5ml/kg)。</li>
                      <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0"/><b>水化：</b>3000ml/m².d，不建议碱化除非有酸中毒。</li>
                   </ul>
                </div>
             </div>

             <div className="bg-red-50/80 backdrop-blur-sm p-6 rounded-2xl border border-red-200">
                <h4 className="font-bold text-red-800 text-sm mb-2">白细胞单采术：</h4>
                <p className="text-xs text-red-700 italic leading-relaxed">宝典指出单采术作用有限。若 3 天 WBC 无下降趋势或出现白细胞淤滞症状，需科室讨论调整降白方案。</p>
             </div>
          </div>
        )}

        {/* 肿瘤溶解综合征处理模块 */}
        {activeTab === 'tls' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header>
                <h2 className="text-2xl font-bold text-slate-800">肿瘤溶解综合征 (TLS) 的处理</h2>
                <p className="text-slate-500 text-sm">诊断标准与分级治疗建议 | 参考《宝典 2023 附录8》</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-indigo-500"/> 实验室诊断标准 (Cairo-Bishop)</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <MetricBox label="血尿酸" val="> 476 umol/L" desc="或增加 25%" />
                      <MetricBox label="血钾" val="> 6.0 mmol/L" desc="或增加 25%" />
                      <MetricBox label="血磷" val="> 2.1 mmol/L" desc="或增加 25%" />
                      <MetricBox label="血钙" val="< 1.75 mmol/L" desc="或减少 25%" />
                   </div>
                   <p className="mt-4 text-[10px] text-slate-400">注：治疗前或治疗开始后 3-7 天内，符合以上 2 项或以上即可诊断实验室 TLS。</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-bold mb-4 text-red-600 flex items-center gap-2"><Waves size={18}/> 临床 TLS</h3>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     满足实验室 TLS 且伴随以下之一：
                   </p>
                   <ul className="text-xs text-slate-600 mt-2 space-y-1">
                      <li>• 肌酐升高 (1.5倍)</li>
                      <li>• 心律失常 / 猝死</li>
                      <li>• 癫痫发作</li>
                   </ul>
                </div>
             </div>

             <section className="bg-indigo-900 text-indigo-100 p-8 rounded-3xl shadow-xl">
                <h3 className="font-black text-xl mb-6">TLS 防治三部曲</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-2">
                      <span className="px-2 py-1 bg-indigo-700 rounded text-[10px] font-bold uppercase">第一步</span>
                      <h4 className="font-bold">强力水化</h4>
                      <p className="text-xs opacity-80 leading-relaxed">3L/m².d，不含钾/钙/磷。维持尿量 > 100ml/m²/h。</p>
                   </div>
                   <div className="space-y-2">
                      <span className="px-2 py-1 bg-indigo-700 rounded text-[10px] font-bold uppercase">第二步</span>
                      <h4 className="font-bold">尿酸管理</h4>
                      <p className="text-xs opacity-80 leading-relaxed">预防：别嘌醇 200-300mg/m².d。治疗：尿酸氧化酶 (拉布立海) 0.1-0.2mg/kg。</p>
                   </div>
                   <div className="space-y-2">
                      <span className="px-2 py-1 bg-indigo-700 rounded text-[10px] font-bold uppercase">第三步</span>
                      <h4 className="font-bold">血液净化</h4>
                      <p className="text-xs opacity-80 leading-relaxed">少尿、容量超负荷、高磷高钾难纠正时，及早行血液透析/滤过。</p>
                   </div>
                </div>
             </section>
          </div>
        )}

        {/* MPAL 模块保持不变 */}
        {activeTab === 'mpal' && (
           <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header><h2 className="text-2xl font-bold text-slate-800">MPAL 混合表型判定</h2></header>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <MpalCard title="髓系" icon={<Droplets className="text-orange-500"/>}>
                  <MpalToggle label="MPO 强阳性 (2分)" checked={!!mpalMarkers.mpo} onChange={v => setMpalMarkers(p => ({...p, mpo: v}))} />
                  <MpalToggle label="单核细胞分化 (1分)" checked={!!mpalMarkers.mono} onChange={v => setMpalMarkers(p => ({...p, mono: v}))} />
               </MpalCard>
               <MpalCard title="B 系" icon={<Dna className="text-blue-500"/>}>
                  <MpalToggle label="cCD79a / cCD22 (2分)" checked={!!mpalMarkers.ccd79} onChange={v => setMpalMarkers(p => ({...p, ccd79: v}))} />
                  <MpalToggle label="CD19 强表达 (2分)" checked={!!mpalMarkers.cd19} onChange={v => setMpalMarkers(p => ({...p, cd19: v}))} />
               </MpalCard>
               <MpalCard title="T 系" icon={<Activity className="text-red-500"/>}>
                  <MpalToggle label="cCD3 / 表面 CD3 (2分)" checked={!!mpalMarkers.ccd3} onChange={v => setMpalMarkers(p => ({...p, ccd3: v}))} />
               </MpalCard>
             </div>
           </div>
        )}

        {/* CNSL 模块保持不变 */}
        {activeTab === 'cnsl' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header><h2 className="text-2xl font-bold text-slate-800">CNSL 诊断与防治</h2></header>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200"><h4 className="font-bold text-slate-800 mb-2">CNS1</h4><p className="text-xs text-slate-500">CSF 无细胞</p></div>
                <div className="bg-amber-50/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-amber-200"><h4 className="font-bold text-amber-800 mb-2">CNS2</h4><p className="text-xs text-amber-600">WBC &lt; 5 且可见细胞</p></div>
                <div className="bg-red-50/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-red-200"><h4 className="font-bold text-red-800 mb-2">CNS3</h4><p className="text-xs text-red-600">WBC &ge; 5 且可见细胞</p></div>
             </div>
          </div>
        )}

        {/* Ph-like 模块保持不变 */}
        {activeTab === 'phlike' && (
           <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
              <header><h2 className="text-2xl font-bold text-slate-800">Ph-like 靶向建议</h2></header>
              <TargetOption title="ABL1 家族" drug="达沙替尼" color="blue" fusions="BCR-ABL1, ABL1/2" dosage="60-80mg/m² QD"/>
              <TargetOption title="JAK-STAT 通路" drug="芦可替尼" color="indigo" fusions="CRLF2, JAK2, EPOR" dosage="10-15mg/m² BID"/>
           </div>
        )}

        {/* L-ASP 凝血管理模块 */}
        {activeTab === 'coagulation' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500">
             <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">L-ASP 凝血管理辅助 (2023修订版)</h2>
                  <p className="text-slate-500 text-sm">基于 Fib 与 AT-III 的双维评估</p>
                </div>
                <button onClick={() => setShowDoseTable(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
                  <TableIcon size={16}/> 儿童抗凝药物剂量表
                </button>
             </header>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-slate-200 space-y-10">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Droplets size={14} className="text-red-500"/> Fib (g/L)</label>
                    <input type="number" step="0.1" value={fibValue} onChange={e => setFibValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-4xl font-black text-blue-600 py-2 border-b-2 border-slate-100 outline-none focus:border-blue-500 bg-transparent" placeholder="0.0"/>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> AT-III (%)</label>
                    <input type="number" value={at3Value} onChange={e => setAt3Value(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-4xl font-black text-emerald-600 py-2 border-b-2 border-slate-100 outline-none focus:border-emerald-500 bg-transparent" placeholder="0"/>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm ${fibValue === '' ? 'bg-slate-50/80' : fibValue < 0.3 ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
                      <h4 className="font-bold flex items-center gap-2 mb-2"><FlaskConical size={18}/> Fib 处理意见</h4>
                      <p className="text-xs leading-relaxed">{fibValue === '' ? '等待输入 Fib 数值...' : fibValue < 0.3 ? '警告：Fib < 0.3g/L。不主张积极补充，除非出血。必要时首选小剂量 FBG (10-20mg/kg)。' : '凝血功能目前尚可。'}</p>
                   </div>
                   <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm ${at3Value === '' ? 'bg-slate-50/80' : (at3Value < 30 || (at3Value < 50 && (data.age > 10 || riskResult.level === RiskLevel.HR))) ? 'bg-indigo-50/80 border-indigo-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
                      <h4 className="font-bold flex items-center gap-2 mb-2"><ShieldAlert size={18}/> AT-III 预防性抗凝指征</h4>
                      <p className="text-xs leading-relaxed">{at3Value === '' ? '等待输入 AT-III 数值...' : (at3Value < 30 || (at3Value < 50 && (data.age > 10 || riskResult.level === RiskLevel.HR))) ? '触发抗凝指征：建议使用肝素或利伐沙班。' : '暂未触发预防性抗凝指征。'}</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* 剂量参考表弹窗 */}
      {showDoseTable && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 bg-slate-800 text-white flex justify-between items-center"><h3 className="font-bold text-xl">儿童抗凝药物剂量参考表</h3><button onClick={() => setShowDoseTable(false)}><X/></button></div>
              <div className="p-8 overflow-y-auto space-y-8">
                <h4 className="font-bold text-blue-600 mb-4 border-l-4 border-blue-600 pl-2 text-sm">利伐沙班 (Rivaroxaban) 参考剂量</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 border rounded">2.6~3kg: 0.8mg tid</div>
                  <div className="p-2 border rounded">3~4kg: 0.9mg tid</div>
                  <div className="p-2 border rounded">4~5kg: 1.4mg tid</div>
                  <div className="p-2 border rounded">5~7kg: 1.6mg tid</div>
                  <div className="p-2 border rounded">7~8kg: 1.8mg tid</div>
                  <div className="p-2 border rounded">8~9kg: 2.4mg tid</div>
                  <div className="p-2 border rounded">9~10kg: 2.8mg tid</div>
                  <div className="p-2 border rounded">&ge;50kg: 20mg qd</div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 text-center"><button onClick={() => setShowDoseTable(false)} className="px-8 py-2 bg-slate-800 text-white rounded-xl font-bold">关闭</button></div>
           </div>
        </div>
      )}

      {/* 方案建议弹窗 */}
      {showProtocol && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className={`p-6 flex items-center justify-between text-white ${riskResult.level === RiskLevel.HR ? 'bg-red-600' : riskResult.level === RiskLevel.IR ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              <h3 className="text-xl font-bold flex items-center gap-2"><Stethoscope/> 方案建议: {riskResult.level}</h3>
              <button onClick={() => setShowProtocol(false)}><X/></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="p-4 bg-slate-50 rounded-xl text-sm border border-slate-100 italic">{currentProtocol.highlight}</div>
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
        value={value || ''} 
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
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

function MrdInput({ label, value, onChange, info }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1 relative">
      <div className="flex items-center gap-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
        <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="text-slate-300"><HelpCircle size={12}/></button>
        {show && <div className="absolute z-[100] p-3 bg-white shadow-xl rounded-lg border border-slate-200 text-[10px] w-48 mt-12">{info}</div>}
      </div>
      <div className="relative">
        <input type="number" step="0.001" value={value === null ? '' : value} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold bg-white/50" />
        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">%</span>
      </div>
    </div>
  );
}

function MrdLegend({ d15, d33, w12 }: any) {
  if (d15) return <div className="space-y-1"><b>d15 标准:</b><br/><span className="text-red-500">HR: &ge;10%</span><br/><span>IR: 0.1-10%</span></div>;
  if (d33) return <div className="space-y-1"><b>d33 标准:</b><br/><span className="text-red-500">HR: &ge;1%</span><br/><span>IR: 0.01-1%</span></div>;
  return <div className="space-y-1"><b>W12 标准:</b><br/><span className="text-red-500">HR: &ge;0.01%</span></div>;
}

function StomatitisGrade({ grade, ctcae, treatment, danger, alert }: any) {
  return (
    <div className={`p-5 rounded-2xl border-2 shadow-sm flex flex-col gap-3 ${danger ? 'bg-red-50/90 border-red-200' : 'bg-white/90 border-slate-200'} backdrop-blur-sm`}>
       <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className={`px-2 py-1 rounded-md text-xs font-black text-white ${danger ? 'bg-red-600' : 'bg-slate-800'}`}>{grade}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CTCAE v5.0</span>
       </div>
       <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700">评分定义：</p>
          <p className="text-xs text-slate-500 italic">{ctcae}</p>
       </div>
       <div className="space-y-1 pt-2">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><FlaskConical size={14}/> 处理方案：</p>
          <p className="text-xs text-slate-600 leading-relaxed">{treatment}</p>
       </div>
       {alert && (
         <div className="mt-2 p-3 bg-red-100/90 backdrop-blur-sm rounded-xl flex gap-2">
            <AlertTriangle className="text-red-600 shrink-0" size={14}/>
            <p className="text-[10px] text-red-800 font-bold">{alert}</p>
         </div>
       )}
    </div>
  );
}

function MetricBox({ label, val, desc }: any) {
  return (
    <div className="p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
      <p className="text-sm font-black text-slate-700">{val}</p>
      {desc && <p className="text-[10px] text-slate-400 italic">{desc}</p>}
    </div>
  );
}

function MpalCard({ title, icon, children }: any) {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-slate-800">
      <div className="flex items-center gap-2 font-bold border-b pb-2">{icon} {title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MpalToggle({ label, checked, onChange }: any) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${checked ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
      {label}
    </button>
  );
}

function TargetOption({ title, fusions, drug, dosage, color }: any) {
  const colors: any = { blue: 'border-blue-200 bg-blue-50/90 text-blue-800', indigo: 'border-indigo-200 bg-indigo-50/90 text-indigo-800', emerald: 'border-emerald-200 bg-emerald-50/90 text-emerald-700' };
  return (
    <div className={`p-6 rounded-3xl border-2 ${colors[color]} backdrop-blur-sm`}>
      <h4 className="font-black mb-1">{title}</h4>
      <p className="text-xs opacity-70 mb-4">涉及基因: {fusions}</p>
      <div className="flex items-center gap-6">
        <div><p className="text-[10px] font-bold uppercase opacity-50">建议药物</p><p className="font-bold">{drug}</p></div>
        <div><p className="text-[10px] font-bold uppercase opacity-50">用法参考</p><p className="font-bold">{dosage}</p></div>
      </div>
    </div>
  );
}
