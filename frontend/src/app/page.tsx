'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import { BiLeaf, BiScan, BiCheckShield, BiError, BiInfoCircle, BiTimeFive, BiChevronRight, BiLoaderAlt } from 'react-icons/bi';

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

            {/* Results Dashboard */}
            {result && (
                <section className="results-dashboard">
                    <div className="container">
                        <h2 className="section-title">Analiz Paneli</h2>

                        <div className="dashboard-grid">

                            {/* Left Column: Diagnostics */}
                            <div className="analysis-card">
                                <div className="plant-health-score">
                                    <div className={`score-circle ${getScoreColor(Math.round(calculateHealthScore(result)))}`}>
                                        {Math.round(calculateHealthScore(result))}
                                    </div>
                                    <div className="score-label">Bitki Sağlık Puanı</div>
                                </div>

                                <div className="detection-summary">
                                    <h4>Teşhis Sonuçları</h4>
                                    {result.vision?.detections.length === 0 ? (
                                        <div className="detection-tag" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--primary)' }}>
                                            <span>✅ Sağlıklı Görünüm</span>
                                        </div>
                                    ) : (
                                        result.vision?.detections.map((det, idx) => (
                                            <div key={idx} style={{ marginBottom: '1rem' }}>
                                                <div className="detection-tag">
                                                    <span>{det.class_name}</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        %{Math.round(det.confidence * 100)} Güven
                                                    </span>
                                                </div>
                                                <div className="confidence-bar">
                                                    <div className="confidence-fill" style={{ width: `${det.confidence * 100}%` }}></div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BiCheckShield /> Sistem Özeti
                                    </h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                        {result.vision?.summary}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Recommendations & RAG */}
                            <div className="recommendations-wrapper">

                                {/* Recommendations */}
                                {result.recommendations.map((rec, idx) => (
                                    <div key={idx} className={`rec-card ${rec.priority}`}>
                                        <div className="rec-header">
                                            <div className="rec-title">{rec.action}</div>
                                            <div className="rec-priority">{rec.priority === 'high' ? 'Yüksek Öncelik' : 'Öneri'}</div>
                                        </div>
                                        <div className="rec-details">
                                            {rec.details}
                                        </div>
                                        {rec.timeframe && (
                                            <div className="rec-meta">
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <BiTimeFive /> {rec.timeframe}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* RAG Insight Card */}
                                {result.rag && (
                                    <div className="rag-insight-card">
                                        <h3><BiInfoCircle /> Akıllı Tarım Asistanı</h3>
                                        <div className="rag-content">
                                            <ReactMarkdown>{result.rag.answer}</ReactMarkdown>
                                        </div>
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                            Kullandığı Kaynaklar: {result.rag.sources.length} adet doğrulanmış tarım makalesi
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Try Again */}
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <button className="btn btn-secondary" onClick={removeImage}>
                                Yeni Analiz Başlat
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
