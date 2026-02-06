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
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginTop: '20px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BiStats color="var(--primary)" /> Anlık Sensör Verileri (Opsiyonel)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '8px' }}>pH Değeri</label>
                    <div style={{ position: 'relative' }}>
                        <BiWater style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                        <input
                            type="number"
                            step="0.1"
                            value={data.ph}
                            onChange={(e) => onChange('ph', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '8px' }}>EC (mS/cm)</label>
                    <div style={{ position: 'relative' }}>
                        <BiMeteor style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                        <input
                            type="number"
                            step="0.1"
                            value={data.ec}
                            onChange={(e) => onChange('ec', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '8px' }}>Sıcaklık (°C)</label>
                    <div style={{ position: 'relative' }}>
                        <BiMeteor style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                        <input
                            type="number"
                            step="1"
                            value={data.temperature}
                            onChange={(e) => onChange('temperature', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
