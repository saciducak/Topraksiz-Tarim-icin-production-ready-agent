import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiLeaf, BiPlus, BiTrendingUp, BiBarChart, BiInfoCircle } from 'react-icons/bi';

interface Plant {
    id: string;
    name: string;
    type: string;
    created_at: string;
}

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
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
        <main className="w-full max-w-7xl mx-auto px-6 pt-24 pb-20">

            {/* PAGE HEADER */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
            >
                <motion.div variants={fadeInUp}>
                    <div className="badge badge-primary mb-4 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                        CANLI SERA İZLEME
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Dijital Sera Yönetimi</h1>
                    <p className="text-slate-500 max-w-lg text-lg">
                        Bitkilerinizi kaydedin, gelişim süreçlerini takip edin ve AI destekli analizlerle verimi artırın.
                    </p>
                </motion.div>

                <motion.button
                    className="btn btn-primary shadow-lg shadow-emerald-500/30"
                    variants={fadeInUp}
                    onClick={() => setIsAddMode(!isAddMode)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">BİTKİ ADI / KONUMU</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Domates - Sera A - Sıra 1"
                                    value={newPlantName}
                                    onChange={(e) => setNewPlantName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="pt-6">
                                <button className="btn btn-primary h-[50px] px-8" onClick={addPlant}>Kaydet</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PLANT GRID */}
            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                >
                    {plants.length === 0 ? (
                        <motion.div variants={fadeInUp} className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                <BiLeaf size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-slate-900 font-semibold text-lg mb-1">Henüz Kayıtlı Bitki Yok</h3>
                            <p className="text-slate-500">Listeniz boş. Yeni bir bitki ekleyerek başlayın.</p>
                        </motion.div>
                    ) : (
                        plants.map((plant) => (
                            <motion.div
                                key={plant.id}
                                className="card-clean p-6 flex flex-col justify-between"
                                variants={fadeInUp}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <BiLeaf size={24} />
                                        </div>
                                        <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {plant.type}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{plant.name}</h3>
                                    <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                                        <BiInfoCircle /> Kayıt: {new Date(plant.created_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-auto">
                                    <button className="btn btn-secondary py-2 text-xs">
                                        <BiTrendingUp /> Geçmiş
                                    </button>
                                    <button className="btn btn-primary py-2 text-xs bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white border-0 shadow-none">
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
