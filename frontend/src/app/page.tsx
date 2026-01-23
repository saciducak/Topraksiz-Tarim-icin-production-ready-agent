'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import { BiLeaf, BiScan, BiCheckShield, BiError, BiInfoCircle, BiTimeFive, BiChevronRight, BiLoaderAlt } from 'react-icons/bi';
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

export default function Home() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New: IoT Sensor State
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
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024 // 10MB
    });

    const removeImage = () => {
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
            // Append sensor data
            formData.append('sensor_data', JSON.stringify(sensorData));

            const response = await fetch('/api/v1/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Analiz başarısız: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Calculate Health Score based on detections
    const calculateHealthScore = (r: AnalysisResult) => {
        if (!r.vision?.has_disease) return 98;
        const detectionCount = r.vision.detections.length;
        // Simple heuristic: Each detection reduces score
        // 1 detection -> 85, 2 -> 70, 3 -> 55, etc.
        return Math.max(10, 100 - (detectionCount * 20));
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 30) return 'risk';
        return 'critical';
    };

    return (
        <main className="main">
            {/* Header */}
            <header className="header">
                <div className="container header-content">
                    <div className="logo">
                        <div className="logo-icon"><BiLeaf /></div>
                        <span>Future Harvest</span>
                    </div>
                    <nav>
                        <a href="#" className="nav-link">Nasıl Çalışır?</a>
                        <a href="#" className="nav-link">Teknoloji</a>
                        <a href="#" className="nav-link">Hakkında</a>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="hero">
                <div className="container">
                    <h1>Sürdürülebilir Tarım İçin <br /><span>Akıllı Hastalık Analizi</span></h1>
                    <p>
                        Yapay zeka destekli görüntü işleme teknolojisi ile bitkilerinizin sağlığını kontrol edin,
                        hastalıkları erken teşhis edin ve veriminizi koruyun.
                    </p>
                </div>
            </section>

            {/* Upload Section */}
            <section className="upload-section container">
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    {!previewUrl ? (
                        <>
                            <div className="dropzone-icon"><BiScan /></div>
                            <h3>Görseli Buraya Bırakın</h3>
                            <p>veya dosya seçmek için tıklayın (JPG, PNG, WebP)</p>
                        </>
                    ) : (
                        <div className="preview-container" onClick={(e) => e.stopPropagation()}>
                            <img src={previewUrl} alt="Önizleme" className="preview-image" />
                            <button className="remove-btn" onClick={removeImage}>×</button>
                        </div>
                    )}
                </div>

                {/* IoT Sensor Panel */}
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <SensorPanel data={sensorData} onChange={updateSensorData} />
                </div>

                {selectedImage && !isAnalyzing && !result && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button className="btn btn-primary" onClick={analyzeImage} style={{ minWidth: '200px', fontSize: '1.1rem' }}>
                            Analizi Başlat
                        </button>
                    </div>
                )}
            </section>

            {/* Loading Overlay */}
            {isAnalyzing && (
                <div className="container">
                    <div className="loading-container card">
                        <div className="spinner"></div>
                        <h3 style={{ marginTop: '1.5rem', color: 'var(--secondary)' }}>Analiz Yapılıyor...</h3>
                        <p className="loading-text">
                            YOLOv8 Görüntü İşleme • Qdrant Bilgi Bankası • Karar Destek Sistemi
                        </p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="container">
                    <div className="card" style={{ borderColor: 'var(--error)', background: '#fff5f5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
                            <BiError size={24} />
                            <p style={{ fontWeight: 600 }}>{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Report */}
            {result && (
                <section className="results-dashboard">
                    <div className="container" style={{ maxWidth: '1000px' }}>

                        <div className="report-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <div className="report-badge">ANALİZ RAPORU</div>
                            <h2 className="section-title" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Bitki Sağlık Durumu</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Analiz ID: {result.id || 'N/A'} • {new Date().toLocaleDateString('tr-TR')}</p>
                        </div>

                        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                            {/* Left: Quick Stats & Score */}
                            <div className="report-sidebar">
                                <div className="analysis-card" style={{ position: 'sticky', top: '100px' }}>
                                    <div className="plant-health-score">
                                        <div className={`score-circle ${getScoreColor(Math.round(calculateHealthScore(result)))}`}>
                                            {Math.round(calculateHealthScore(result))}
                                        </div>
                                        <div className="score-label">Sağlık Puanı</div>
                                    </div>

                                    <div className="detection-summary">
                                        <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Tespit Edilen Bulgular</h4>
                                        {result.vision?.detections.length === 0 ? (
                                            <div className="detection-tag good">
                                                <span>✅ Sağlıklı</span>
                                            </div>
                                        ) : (
                                            result.vision?.detections.map((det, idx) => (
                                                <div key={idx} style={{ marginBottom: '1rem' }}>
                                                    <div className="detection-tag">
                                                        <span>{det.class_name}</span>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            %{Math.round(det.confidence * 100)}
                                                        </span>
                                                    </div>
                                                    <div className="confidence-bar">
                                                        <div className="confidence-fill" style={{ width: `${det.confidence * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="action-required-box" style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
                                        <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <BiCheckShield /> Eylem Planı
                                        </h5>
                                        {result.recommendations.slice(0, 1).map((rec, i) => (
                                            <div key={i}>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{rec.action}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rec.timeframe}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Detailed Report */}
                            <div className="report-content">
                                {/* AI Insight / RAG */}
                                {result.rag && (
                                    <div className="report-section card">
                                        <div className="report-section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--secondary)' }}>
                                                <BiInfoCircle /> Detaylı Analiz & Tedavi
                                            </h3>
                                        </div>

                                        <div className="markdown-content" style={{ lineHeight: 1.8, color: 'var(--text)' }}>
                                            <ReactMarkdown
                                                components={{
                                                    h1: ({ node, ...props }) => <h4 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', marginTop: '1.5rem', marginBottom: '1rem' }} {...props} />,
                                                    h2: ({ node, ...props }) => <h4 style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginTop: '1.5rem', marginBottom: '0.5rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }} {...props} />,
                                                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                                                    li: ({ node, ...props }) => <li style={{ marginBottom: '0.5rem' }} {...props} />
                                                }}
                                            >
                                                {result.rag.answer}
                                            </ReactMarkdown>
                                        </div>

                                        <div className="source-citation" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BiLeaf /> Kaynak: Future Harvest Bilgi Bankası tarafından doğrulanmıştır.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scan New Button */}
                        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                            <button className="btn btn-secondary" onClick={removeImage} style={{ padding: '1rem 2.5rem' }}>
                                🔄 Yeni Analiz Başlat
                            </button>
                        </div>

                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>© 2025 Future Harvest AI. Topraksız Tarım için Gelişmiş Çözümler.</p>
                </div>
            </footer>
        </main>
    );
}
