import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { BiScan, BiCheckShield, BiError, BiInfoCircle, BiUpload, BiRefresh } from 'react-icons/bi';
import SensorPanel from '../components/SensorPanel';

interface Detection {
    class_name: string;
    confidence: number;
    bbox: number[];
}

interface Recommendation {
    action: string;
    priority: string;
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

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
};

const stagger = {
    visible: {
        transition: { staggerChildren: 0.1 }
    }
};

export default function Home() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [sensorData, setSensorData] = useState({
        ph: '6.5',
        ec: '2.0',
        temperature: '22'
    });

    const updateSensorData = (key: keyof typeof sensorData, value: string) => {
        setSensorData(prev => ({ ...prev, [key]: value }));
    };

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
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const removeImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedImage(null);
        setPreviewUrl(null);
        setResult(null);
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedImage);
            formData.append('sensor_data', JSON.stringify(sensorData));

            const response = await fetch('/api/v1/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Analiz hatası: ${errorText || response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const calculateHealthScore = (r: AnalysisResult) => {
        if (!r.vision?.has_disease) return 98;
        const detectionCount = r.vision.detections.length;
        return Math.max(10, 100 - (detectionCount * 20));
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 30) return 'risk';
        return 'critical';
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="home-page"
        >
            <section className="hero">
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div variants={fadeInUp} style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="hero-badge">
                            YENİ NESİL ZİRAİ ZEKA
                        </div>
                    </motion.div>

                    <motion.h1 variants={fadeInUp}>
                        Doğanın Dili, <br />
                        <span className="highlight">Verinin Gücüyle Buluştu</span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="hero-text">
                        YOLOv8 Görüntü İşleme Ajanları ve Vektör Tabanlı Zeka, bitkilerinizi anlamak için birleşti.
                        Sadece teşhis koymuyoruz; binlerce akademik kaynağı ve anlık sensör verilerini işleyerek
                        <span style={{ color: '#fff', fontWeight: 500 }}> nokta atışı reçeteler</span> sunuyoruz.
                    </motion.p>
                </div>
            </section>

            <section id="upload" className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
                <motion.div variants={fadeInUp} className="upload-card glass-panel">

                    {!previewUrl ? (
                        <div
                            {...getRootProps()}
                            className={`dropzone ${isDragActive ? 'active' : ''}`}
                        >
                            <input {...getInputProps()} />
                            <div className="dropzone-icon">
                                <BiUpload />
                            </div>
                            <h3>Görseli Buraya Sürükleyin</h3>
                            <p>veya dosya seçmek için tıklayın</p>
                            <div className="formats">
                                <span className="format-tag">JPG</span>
                                <span className="format-tag">PNG</span>
                                <span className="format-tag">WEBP</span>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}
                        >
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
                            <button
                                onClick={removeImage}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: 'rgba(0,0,0,0.7)', color: 'white',
                                    border: 'none', width: '40px', height: '40px',
                                    borderRadius: '50%', cursor: 'pointer', fontSize: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        </motion.div>
                    )}

                    <motion.div variants={fadeInUp} style={{ marginTop: '30px' }}>
                        <SensorPanel data={sensorData} onChange={updateSensorData} />
                    </motion.div>

                    {selectedImage && !isAnalyzing && !result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: 'center', marginTop: '30px' }}
                        >
                            <button className="btn btn-primary" onClick={analyzeImage} style={{ padding: '16px 48px', fontSize: '1.1rem' }}>
                                <BiScan size={24} /> Analizi Başlat
                            </button>
                        </motion.div>
                    )}

                    {isAnalyzing && (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p style={{ marginTop: '20px', color: '#888' }}>
                                AI analiz yapıyor, lütfen bekleyin...
                            </p>
                        </div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ marginTop: '20px', padding: '20px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <BiError size={24} /> {error}
                        </motion.div>
                    )}
                </motion.div>

            </section>

            {/* RESULTS SECTION (Wide) */}
            <section id="results" className="container" style={{ paddingBottom: '100px' }}>
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ marginTop: '60px' }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Bitki Sağlık Raporu</h2>
                                <p style={{ color: '#666' }}>Analiz ID: {result.id}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>

                                {/* Left Column: Vision & Score */}
                                <motion.div
                                    className="glass-panel"
                                    style={{ padding: '32px', borderRadius: '24px', height: 'fit-content' }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                        <div className={`score-circle ${getScoreColor(calculateHealthScore(result))}`}>
                                            {Math.round(calculateHealthScore(result))}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#888', fontWeight: 600, letterSpacing: '0.05em' }}>GENEL SAĞLIK PUANI</div>
                                    </div>

                                    <h4 style={{ marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>GÖRSEL TESPİTLER</h4>
                                    {result.vision?.detections.map((det, idx) => (
                                        <div key={idx} className="detection-tag">
                                            <span>{det.class_name}</span>
                                            <span style={{ color: 'var(--primary)' }}>%{Math.round(det.confidence * 100)}</span>
                                        </div>
                                    ))}
                                    {(!result.vision?.detections || result.vision.detections.length === 0) && (
                                        <p style={{ color: '#666', fontStyle: 'italic' }}>Hastalık belirtisi tespit edilmedi.</p>
                                    )}

                                    {result.recommendations.length > 0 && (
                                        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h5 style={{ margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <BiCheckShield /> ÖNERİLEN AKSİYON
                                            </h5>
                                            <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5' }}>{result.recommendations[0].action}</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Right Column: RAG & Detail */}
                                <motion.div
                                    className="glass-panel"
                                    style={{ padding: '40px', borderRadius: '24px' }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '20px' }}>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: 700 }}>
                                            <BiInfoCircle color="var(--accent)" /> Detaylı AI Analizi
                                        </h3>
                                    </div>
                                    {result.rag && (
                                        <div className="markdown-body">
                                            <ReactMarkdown>{result.rag.answer}</ReactMarkdown>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--surface-glass-border)', fontSize: '0.8rem', color: '#666' }}>
                                        Kaynak: Future Harvest AI Bilgi Bankası • Model: YOLOv8 + Llama 3
                                    </div>
                                </motion.div>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '80px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={removeImage}
                                    style={{ padding: '16px 48px', fontSize: '1rem' }}
                                >
                                    <BiRefresh /> Yeni Analiz Yap
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

        </motion.div>
    );
}
