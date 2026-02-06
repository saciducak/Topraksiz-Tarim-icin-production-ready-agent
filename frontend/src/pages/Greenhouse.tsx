import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiLeaf, BiPlus, BiTrendingUp, BiBarChart } from 'react-icons/bi';

interface Plant {
    id: string;
    name: string;
    type: string;
    created_at: string;
}

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
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

export default function Greenhouse() {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [newPlantName, setNewPlantName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddMode, setIsAddMode] = useState(false);

    useEffect(() => {
        fetchPlants();
    }, []);

    const fetchPlants = async () => {
        try {
            const res = await fetch('/api/v1/plants/');
            if (res.ok) {
                const data = await res.json();
                setPlants(data);
            }
        } catch (error) {
            console.error('Failed to fetch plants', error);
        } finally {
            setLoading(false);
        }
    };

    const addPlant = async () => {
        if (!newPlantName.trim()) return;
        try {
            const res = await fetch('/api/v1/plants/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPlantName, type: 'Tomato' })
            });
            if (res.ok) {
                setNewPlantName('');
                setIsAddMode(false);
                fetchPlants();
            }
        } catch (error) {
            console.error('Failed to add plant', error);
        }
    };

    return (
        <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>

            {/* PAGE HEADER */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}
            >
                <motion.div variants={fadeInUp}>
                    <div className="hero-badge" style={{ marginBottom: '16px' }}>
                        <span className="dot"></span>
                        CANLI İZLEME
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Dijital Sera Yönetimi</h1>
                    <p style={{ maxWidth: '500px', color: '#888' }}>
                        Bitkilerinizi kaydedin, gelişim süreçlerini takip edin ve AI destekli analizlerle verimi artırın.
                    </p>
                </motion.div>

                <motion.button
                    className="btn btn-primary"
                    variants={fadeInUp}
                    onClick={() => setIsAddMode(!isAddMode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <BiPlus size={20} /> Yeni Bitki Ekle
                </motion.button>
            </motion.div>

            {/* ADD PLANT INPUT */}
            <AnimatePresence>
                {isAddMode && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '32px' }}
                    >
                        <div className="analysis-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>BİTKİ ADI</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Domates - Sera A - Sıra 1"
                                    value={newPlantName}
                                    onChange={(e) => setNewPlantName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ paddingTop: '24px' }}>
                                <button className="btn btn-primary" onClick={addPlant}>Kaydet</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PLANT GRID */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <motion.div
                    className="plant-grid"
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}
                >
                    {plants.length === 0 ? (
                        <motion.div variants={fadeInUp} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <BiLeaf size={48} color="#444" style={{ marginBottom: '16px' }} />
                            <h3 style={{ color: '#888' }}>Henüz Kayıtlı Bitki Yok</h3>
                            <p style={{ color: '#666' }}>Yeni bitki ekleyerek başlayın.</p>
                        </motion.div>
                    ) : (
                        plants.map((plant) => (
                            <motion.div
                                key={plant.id}
                                className="glass-panel"
                                variants={fadeInUp}
                                style={{ padding: '24px', borderRadius: '20px' }}
                                whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: 'var(--shadow-glow-primary)',
                                        color: 'black'
                                    }}>
                                        <BiLeaf size={24} />
                                    </div>
                                    <div style={{
                                        padding: '6px 12px',
                                        background: '#222',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: '#aaa',
                                        border: '1px solid #333'
                                    }}>
                                        {plant.type.toUpperCase()}
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'white' }}>{plant.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '24px' }}>
                                    Kayıt: {new Date(plant.created_at).toLocaleDateString('tr-TR')}
                                </p>

                                <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.875rem' }}>
                                        <BiTrendingUp /> Geçmiş
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '0.875rem' }}>
                                        <BiBarChart /> Analiz
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}
        </main>
    );
}
