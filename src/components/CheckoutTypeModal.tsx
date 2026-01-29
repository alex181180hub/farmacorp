'use client';

import { useState } from 'react';
import { FileText, Receipt } from 'lucide-react';
import styles from './CheckoutTypeModal.module.css';

interface CheckoutTypeModalProps {
    total: number;
    onSelect: (type: 'FACTURA' | 'RECIBO', method: 'EFECTIVO' | 'QR') => void;
    onCancel: () => void;
}

export default function CheckoutTypeModal({ total, onSelect, onCancel }: CheckoutTypeModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className="text-xl font-bold">Confirmar Venta</h2>

                <div className={styles.amount}>Bs. {total.toFixed(2)}</div>

                <div className="mb-6 bg-slate-50 p-3 rounded-lg border">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Método de Pago</label>
                    <div className="flex gap-2">
                        <button
                            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${selectedMethod === 'EFECTIVO' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
                            onClick={() => setSelectedMethod('EFECTIVO')}
                        >
                            Efectivo
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${selectedMethod === 'QR' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
                            onClick={() => setSelectedMethod('QR')}
                        >
                            QR Simple
                        </button>
                    </div>
                </div>

                <p className="text-secondary mb-3 text-sm">Seleccione el tipo de comprobante</p>

                <div className={styles.options}>
                    <button className={styles.btnOption} onClick={() => onSelect('FACTURA', selectedMethod)}>
                        <div className="mb-2 p-3 bg-blue-100 rounded-full text-blue-600">
                            <FileText size={24} />
                        </div>
                        <strong>Factura</strong>
                        <span>Con Crédito Fiscal</span>
                    </button>

                    <button className={styles.btnOption} onClick={() => onSelect('RECIBO', selectedMethod)}>
                        <div className="mb-2 p-3 bg-gray-100 rounded-full text-gray-600">
                            <Receipt size={24} />
                        </div>
                        <strong>Recibo</strong>
                        <span>Control Interno</span>
                    </button>
                </div>

                <button className={styles.cancelBtn} onClick={onCancel}>Cancelar Venta</button>
            </div>
        </div>
    );
}
