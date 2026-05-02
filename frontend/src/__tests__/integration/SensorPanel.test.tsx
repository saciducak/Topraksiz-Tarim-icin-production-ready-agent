/**
 * Integration Tests — SensorPanel Component
 * 
 * Tests the IoT sensor input panel:
 * - Renders all three sensor inputs (pH, EC, Temperature)
 * - Input values reflect passed props
 * - onChange callbacks fire with correct key and value
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SensorPanel from '../../components/SensorPanel';

const defaultData = { ph: '6.5', ec: '2.0', temperature: '22' };

describe('SensorPanel — IoT Sensor Input Panel', () => {

    it('renders section title and description', () => {
        const onChange = vi.fn();
        render(<SensorPanel data={defaultData} onChange={onChange} />);

        expect(screen.getByText('Canlı Sensör Entegrasyonu')).toBeInTheDocument();
        expect(screen.getByText(/IoT cihazlarınızdan/)).toBeInTheDocument();
    });

    it('renders all three sensor labels', () => {
        const onChange = vi.fn();
        render(<SensorPanel data={defaultData} onChange={onChange} />);

        expect(screen.getByText('pH Seviyesi')).toBeInTheDocument();
        expect(screen.getByText('EC (mS/cm)')).toBeInTheDocument();
        expect(screen.getByText('Sıcaklık (°C)')).toBeInTheDocument();
    });

    it('displays initial sensor values', () => {
        const onChange = vi.fn();
        render(<SensorPanel data={defaultData} onChange={onChange} />);

        const inputs = screen.getAllByRole('spinbutton');
        expect(inputs).toHaveLength(3);

        expect(inputs[0]).toHaveValue(6.5);   // pH
        expect(inputs[1]).toHaveValue(2.0);   // EC
        expect(inputs[2]).toHaveValue(22);    // Temperature
    });

    it('calls onChange with "ph" key when pH input changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SensorPanel data={defaultData} onChange={onChange} />);

        const phInput = screen.getAllByRole('spinbutton')[0];
        await user.clear(phInput);
        await user.type(phInput, '7.2');

        // onChange should have been called with 'ph' key
        expect(onChange).toHaveBeenCalled();
        const phCalls = onChange.mock.calls.filter(
            (call: any[]) => call[0] === 'ph'
        );
        expect(phCalls.length).toBeGreaterThan(0);
    });

    it('calls onChange with "ec" key when EC input changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SensorPanel data={defaultData} onChange={onChange} />);

        const ecInput = screen.getAllByRole('spinbutton')[1];
        await user.clear(ecInput);
        await user.type(ecInput, '3.1');

        const ecCalls = onChange.mock.calls.filter(
            (call: any[]) => call[0] === 'ec'
        );
        expect(ecCalls.length).toBeGreaterThan(0);
    });

    it('calls onChange with "temperature" key when temperature input changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SensorPanel data={defaultData} onChange={onChange} />);

        const tempInput = screen.getAllByRole('spinbutton')[2];
        await user.clear(tempInput);
        await user.type(tempInput, '28');

        const tempCalls = onChange.mock.calls.filter(
            (call: any[]) => call[0] === 'temperature'
        );
        expect(tempCalls.length).toBeGreaterThan(0);
    });

    it('renders with custom sensor values', () => {
        const customData = { ph: '5.0', ec: '1.5', temperature: '30' };
        const onChange = vi.fn();
        render(<SensorPanel data={customData} onChange={onChange} />);

        const inputs = screen.getAllByRole('spinbutton');
        expect(inputs[0]).toHaveValue(5.0);
        expect(inputs[1]).toHaveValue(1.5);
        expect(inputs[2]).toHaveValue(30);
    });
});
