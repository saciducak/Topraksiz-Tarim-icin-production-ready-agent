import React from 'react';
import { BiWater, BiMeteor, BiStats } from 'react-icons/bi';

interface SensorData {
    ph: string;
    ec: string;
    temperature: string;
}

interface SensorPanelProps {
    data: SensorData;
    onChange: (key: keyof SensorData, value: string) => void;
}

export default function SensorPanel({ data, onChange }: SensorPanelProps) {
    return (
        <div className="card-saas p-6 mt-8 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <BiStats size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 text-sm">Canlı Sensör Entegrasyonu</h4>
                    <p className="text-xs text-slate-500">IoT cihazlarınızdan alınan anlık veriler</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* pH Input */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">pH Seviyesi</label>
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 text-slate-400">
                            <BiWater size={18} />
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            value={data.ph}
                            onChange={(e) => onChange('ph', e.target.value)}
                            className="input-saas pl-10"
                            placeholder="7.0"
                        />
                    </div>
                </div>

                {/* EC Input */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">EC (mS/cm)</label>
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 text-slate-400">
                            <BiMeteor size={18} />
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            value={data.ec}
                            onChange={(e) => onChange('ec', e.target.value)}
                            className="input-saas pl-10"
                            placeholder="2.0"
                        />
                    </div>
                </div>

                {/* Temp Input */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Sıcaklık (°C)</label>
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 text-slate-400">
                            <BiMeteor size={18} />
                        </div>
                        <input
                            type="number"
                            step="1"
                            value={data.temperature}
                            onChange={(e) => onChange('temperature', e.target.value)}
                            className="input-saas pl-10"
                            placeholder="24"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
