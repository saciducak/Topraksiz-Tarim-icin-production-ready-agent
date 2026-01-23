import { BiTestTube, BiWater, BiTachometer, BiChip } from 'react-icons/bi';

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
        <div className="card" style={{ marginTop: '2rem', border: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <BiChip style={{ color: 'var(--secondary)', fontSize: '1.5rem' }} />
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>IoT Sensör Simülasyonu</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sanal sensör verileri ile analiz hassasiyetini artırın</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

                {/* pH Input */}
                <div className="sensor-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        <BiTestTube /> Su pH Değeri
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="range"
                            min="0" max="14" step="0.1"
                            value={data.ph || 6.5}
                            onChange={(e) => onChange('ph', e.target.value)}
                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                        />
                        <input
                            type="number"
                            className="input-field"
                            value={data.ph}
                            onChange={(e) => onChange('ph', e.target.value)}
                            placeholder="6.5"
                            style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                    </div>
                </div>

                {/* EC Input */}
                <div className="sensor-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        <BiWater /> EC (İletkenlik)
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="range"
                            min="0" max="5" step="0.1"
                            value={data.ec || 2.0}
                            onChange={(e) => onChange('ec', e.target.value)}
                            style={{ flex: 1, accentColor: 'var(--secondary)' }}
                        />
                        <input
                            type="number"
                            className="input-field"
                            value={data.ec}
                            onChange={(e) => onChange('ec', e.target.value)}
                            placeholder="2.0"
                            style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                    </div>
                </div>

                {/* Temperature Input */}
                <div className="sensor-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        <BiTachometer /> Su Sıcaklığı (°C)
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="range"
                            min="10" max="40" step="1"
                            value={data.temperature || 22}
                            onChange={(e) => onChange('temperature', e.target.value)}
                            style={{ flex: 1, accentColor: 'var(--warning)' }}
                        />
                        <input
                            type="number"
                            className="input-field"
                            value={data.temperature}
                            onChange={(e) => onChange('temperature', e.target.value)}
                            placeholder="22"
                            style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
