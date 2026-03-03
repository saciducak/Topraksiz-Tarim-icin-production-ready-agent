import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import {
    BiScan, BiUpload, BiLeaf, BiRefresh, BiBrain, BiError,
    BiBarChart, BiCheckCircle, BiTimeFive, BiShieldQuarter,
    BiTargetLock, BiBookContent, BiPulse, BiCog
} from 'react-icons/bi';
import SensorPanel from '../components/SensorPanel';
import { cn } from '../lib/utils';

// ── Interfaces ──
interface Detection {
    class_name: string;
    display_name?: string;
    confidence: number;
    bbox: number[];
    source?: string;
}

interface Recommendation {
    action: string;
    priority: string;
    category?: string;
    details: string;
    timeframe?: string;
}

interface AnalysisResult {
    id: string;
    status: string;
    vision?: {
        detections: Detection[];
        summary: string;
        has_disease: boolean;
    };
    rag?: {
        query: string;
        answer: string;
        sources: any[];
    };
    recommendations: Recommendation[];
    summary: string;
}

// ── Disease name mapping (frontend fallback) ──
const DISEASE_TR: Record<string, string> = {
    early_blight_suspected: 'Erken Yanıklık (Şüpheli)',
    early_blight: 'Erken Yanıklık',
    late_blight: 'Geç Yanıklık',
    chlorosis_suspected: 'Kloroz / Sararma',
    necrosis_suspected: 'Nekroz / Doku Ölümü',
    leaf_spot: 'Yaprak Lekesi',
    leaf_mold: 'Yaprak Küfü',
    septoria_leaf_spot: 'Septoria Yaprak Lekesi',
    spider_mites: 'Kırmızı Örümcek',
    target_spot: 'Hedef Leke',
    mosaic_virus: 'Mozaik Virüsü',
    yellow_leaf_curl_virus: 'Sarı Yaprak Kıvrılma Virüsü',
    bacterial_spot: 'Bakteriyel Leke',
    healthy: 'Sağlıklı',
};
function getDisplayName(det: Detection): string {
    if (det.display_name) return det.display_name;
    const key = det.class_name.toLowerCase();
    if (DISEASE_TR[key]) return DISEASE_TR[key];
    return det.class_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Circular Score Ring ──
function ScoreRing({ score }: { score: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const color = score >= 90 ? '#059669' : score >= 70 ? '#d97706' : '#dc2626';
    const label = score >= 90 ? 'Sağlıklı' : score >= 70 ? 'Hafif Risk' : 'Kritik';
    const labelColor = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600';
    const bgGlow = score >= 90 ? 'bg-emerald-50/80' : score >= 70 ? 'bg-amber-50/80' : 'bg-red-50/80';

    return (
        <div className={cn("p-6 rounded-2xl border border-slate-100 text-center card-premium", bgGlow)}>
            <div className="score-ring mb-3">
                <svg width="128" height="128" viewBox="0 0 128 128">
                    <circle className="score-circle-bg" cx="64" cy="64" r={radius} strokeWidth="10" />
                    <circle
                        className="score-circle-fill"
                        cx="64" cy="64" r={radius}
                        strokeWidth="10"
                        stroke={color}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="score-value">
                    <span className="text-4xl font-black" style={{ color }}>{score}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SKOR</span>
                </div>
            </div>
            <div className={cn("text-sm font-extrabold uppercase tracking-wider", labelColor)}>{label}</div>
            <div className="text-[10px] text-slate-400 mt-1">YOLOv8 + Renk Analizi</div>
        </div>
    );
}

// ── Confidence Bar ──
function ConfidenceBar({ confidence }: { confidence: number }) {
    const pct = Math.round(confidence * 100);
    const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className="confidence-bar mt-2">
            <div className={cn("fill", color)} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ── Priority Badge ──
function PriorityBadge({ priority }: { priority: string }) {
    const p = priority.toLowerCase();
    const cls = p === 'high' ? 'badge-danger' : p === 'medium' ? 'badge-warning' : 'badge-success';
    const label = p === 'high' ? 'Yüksek' : p === 'medium' ? 'Orta' : 'Düşük';
    return <span className={cn("badge-saas", cls)}>{label}</span>;
}

// ── Category Badge ──
function CategoryBadge({ category }: { category?: string }) {
    if (!category) return null;
    const c = category.toLowerCase();
    const cls = `badge-category-${c}`;
    const labels: Record<string, string> = {
        kimyasal: '💊 Kimyasal',
        organik: '🌿 Organik',
        'kültürel': '🌱 Kültürel',
        genel: '📋 Genel',
        sistem: '⚙️ Sistem',
    };
    return <span className={cn("badge-saas text-[10px]", cls)}>{labels[c] || category}</span>;
}

// ── Severity ──
function getSeverity(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
}

// ══════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════
export default function Home() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sensorData, setSensorData] = useState({ ph: '6.5', ec: '2.0', temperature: '22' });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': [] }, multiple: false
    });

    const resetAnalysis = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', selectedImage);
            formData.append('sensor_data', JSON.stringify(sensorData));
            const response = await fetch('/api/v1/analyze', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const healthScore = useMemo(() => {
        if (!result) return 100;
        if (!result.vision?.has_disease) return 96;
        const dets = result.vision?.detections || [];
        const avgConf = dets.reduce((s, d) => s + d.confidence, 0) / (dets.length || 1);
        return Math.max(8, Math.round(100 - (dets.length * 15) - (avgConf * 30)));
    }, [result]);

    return (
        <main className="min-h-screen pt-24 pb-20 bg-slate-50 bg-pattern">
            <div className="w-full max-w-6xl mx-auto px-6">

                {/* ── HERO ── */}
                <section className="text-center mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        AI-Powered Plant Diagnostics v2.2
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Tarımsal Zekanın <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">Bilimsel Standartı.</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        YOLOv8 görüntü işleme, LangGraph ajan mimarisi ve RAG bilgi tabanı ile
                        işletmeniz için <span className="font-semibold text-slate-700">kesin teşhis raporları</span> oluşturun.
                    </p>
                </section>

                {/* ── WORKSPACE ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── LEFT: Upload ── */}
                    <div className={cn("transition-all duration-500", result ? "lg:col-span-4" : "lg:col-span-12")}>
                        <div className={cn("card-saas p-1", result ? "" : "max-w-3xl mx-auto")}>
                            {!previewUrl ? (
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed border-slate-200 rounded-xl p-12 text-center cursor-pointer upload-glow bg-white/50",
                                        isDragActive ? "border-emerald-500 bg-emerald-50/50" : ""
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-5">
                                        <BiUpload className="text-3xl text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Görseli Buraya Bırakın</h3>
                                    <p className="text-slate-500 text-sm">veya dosya seçmek için tıklayın</p>
                                    <p className="text-slate-400 text-xs mt-2">JPG, PNG, WebP — Maks. 10MB</p>
                                </div>
                            ) : (
                                <div className="relative group rounded-xl overflow-hidden bg-slate-900">
                                    <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                        <button onClick={resetAnalysis} className="btn-saas btn-secondary text-xs backdrop-blur-sm bg-white/80">
                                            Görseli Değiştir
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                <SensorPanel data={sensorData} onChange={(k, v) => setSensorData({ ...sensorData, [k]: v })} />

                                {selectedImage && !isAnalyzing && !result && (
                                    <button onClick={analyzeImage} className="btn-saas btn-primary w-full mt-6 py-3.5 text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30">
                                        <BiScan className="text-lg" /> Analiz Raporunu Oluştur
                                    </button>
                                )}

                                {isAnalyzing && (
                                    <div className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                            <h4 className="font-bold text-slate-900 text-sm">AI Pipeline Çalışıyor...</h4>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {['Vision (YOLO)', 'RAG Arama', 'Karar Motoru'].map((step, i) => (
                                                <span key={i} className="badge-saas badge-neutral text-[10px] animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                                                    <BiCog className="mr-1 animate-spin" style={{ animationDuration: '2s' }} /> {step}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                                        <BiError className="mt-0.5 text-lg flex-shrink-0" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Results ── */}
                    {result && (
                        <div className="lg:col-span-8 space-y-6">

                            {/* ═══ Report Header ═══ */}
                            <div className="card-gradient-border animate-fade-in">
                                <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-5 flex justify-between items-center rounded-t-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl shadow-sm">
                                            <BiBarChart className="text-emerald-600" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">Analiz Raporu</h2>
                                            <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                                                {result.id.slice(0, 8)} · {new Date().toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={resetAnalysis} className="btn-saas btn-secondary text-xs">
                                        <BiRefresh size={16} /> Yeni Analiz
                                    </button>
                                </div>

                                <div className="p-6 bg-white rounded-b-2xl">
                                    {/* Score + Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="md:col-span-1">
                                            <ScoreRing score={healthScore} />
                                        </div>
                                        <div className="md:col-span-2 flex flex-col justify-center">
                                            <h3 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2 text-lg">
                                                <BiBrain className="text-slate-400" />
                                                Teşhis Özeti
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                                {result.vision?.summary || result.summary}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.vision?.detections.map((det, i) => {
                                                    const sev = getSeverity(det.confidence);
                                                    const badgeCls = sev === 'high' ? 'badge-danger' : sev === 'medium' ? 'badge-warning' : 'badge-success';
                                                    return (
                                                        <div key={i} className={cn("badge-saas py-1 px-3", badgeCls)}>
                                                            {getDisplayName(det)}
                                                            <span className="ml-2 opacity-70">%{(det.confidence * 100).toFixed(0)}</span>
                                                        </div>
                                                    );
                                                })}
                                                {(!result.vision?.detections.length) && (
                                                    <span className="badge-saas badge-success py-1 px-3">
                                                        <BiLeaf className="mr-1" /> Sağlıklı Bitki
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ Disease Cards ═══ */}
                            {result.vision?.detections && result.vision.detections.length > 0 && (
                                <div className="animate-fade-in-delay">
                                    <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-base px-1">
                                        <BiTargetLock className="text-red-500" />
                                        Tespit Edilen Durumlar
                                        <span className="badge-saas badge-neutral ml-1">{result.vision.detections.length}</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {result.vision.detections.map((det, i) => {
                                            const sev = getSeverity(det.confidence);
                                            const pct = Math.round(det.confidence * 100);
                                            return (
                                                <div key={i} className={cn("card-disease card-premium", `severity-${sev}`)}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-base">
                                                                {getDisplayName(det)}
                                                            </h4>
                                                            <div className="flex gap-2 mt-1">
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full">
                                                                    {det.source === 'yolo' ? '🎯 YOLO Model' : det.source === 'color_analysis' ? '🎨 Renk Analizi' : '🤖 AI'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={cn(
                                                                "text-2xl font-black",
                                                                sev === 'high' ? 'text-red-600' : sev === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                                                            )}>
                                                                %{pct}
                                                            </span>
                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Güven</div>
                                                        </div>
                                                    </div>
                                                    <ConfidenceBar confidence={det.confidence} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ═══ RAG Academic Analysis ═══ */}
                            {result.rag && (
                                <div className="card-saas overflow-hidden animate-fade-in-delay card-premium">
                                    <div className="bg-gradient-to-r from-emerald-50/60 to-white border-b border-slate-100 p-4 flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 rounded-xl">
                                            <BiBookContent size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-900">Akademik Analiz & Bulgular</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ollama LLM + RAG Bilgi Tabanı</p>
                                        </div>
                                    </div>
                                    <div className="p-6 analysis-prose">
                                        <ReactMarkdown>{result.rag.answer}</ReactMarkdown>
                                    </div>
                                    {result.rag.sources && result.rag.sources.length > 0 && (
                                        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Kaynaklar</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.rag.sources.map((src: any, i: number) => (
                                                    <span key={i} className="badge-saas badge-neutral text-[10px]">
                                                        📄 {src.title || `Kaynak ${i + 1}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ Treatment Protocol ═══ */}
                            {result.recommendations.length > 0 && (
                                <div className="animate-fade-in-delay">
                                    <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-base px-1">
                                        <BiShieldQuarter className="text-emerald-600" />
                                        Tedavi Protokolü & Aksiyon Planı
                                    </h3>
                                    <div className="space-y-3">
                                        {result.recommendations.map((rec, i) => (
                                            <div key={i} className="card-action card-premium">
                                                <div className="min-w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center font-black text-emerald-700 text-sm shadow-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-start gap-2 mb-2">
                                                        <h4 className="font-bold text-slate-900 flex-1">{rec.action}</h4>
                                                        <div className="flex gap-1.5 flex-shrink-0">
                                                            <CategoryBadge category={rec.category} />
                                                            <PriorityBadge priority={rec.priority} />
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{rec.details}</p>
                                                    {rec.timeframe && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 rounded-lg px-3 py-1.5 w-fit">
                                                            <BiTimeFive className="text-slate-400" />
                                                            <span>{rec.timeframe}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ═══ Sensor Correlation ═══ */}
                            <div className="card-saas p-5 animate-fade-in-delay card-premium">
                                <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                                    <BiPulse className="text-sky-500" />
                                    Sensör Korelasyonu
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'pH', value: sensorData.ph, unit: '', optimal: '5.5 - 7.0', isWarning: parseFloat(sensorData.ph) > 7.5 || parseFloat(sensorData.ph) < 5.5 },
                                        { label: 'EC', value: sensorData.ec, unit: 'mS/cm', optimal: '1.0 - 2.5', isWarning: parseFloat(sensorData.ec) > 2.5 },
                                        { label: 'Sıcaklık', value: sensorData.temperature, unit: '°C', optimal: '18 - 28', isWarning: parseFloat(sensorData.temperature) > 32 || parseFloat(sensorData.temperature) < 15 }
                                    ].map((s, i) => (
                                        <div key={i} className={cn(
                                            "rounded-xl border p-4 text-center card-premium",
                                            s.isWarning ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-white"
                                        )}>
                                            <div className={cn("text-2xl font-black", s.isWarning ? "text-red-600" : "text-slate-900")}>
                                                {s.value}<span className="text-xs font-medium text-slate-400 ml-0.5">{s.unit}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</div>
                                            <div className={cn("text-[9px] mt-1 font-semibold", s.isWarning ? "text-red-500" : "text-slate-400")}>
                                                {s.isWarning ? '⚠️ ' : ''}Optimal: {s.optimal}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
