'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getCashRegisters, getShiftDetails, openShift, closeShift, registerMovement } from '@/actions/shift-actions';
import { getCurrentUserSession as getSessionUser } from '@/actions/report-actions';
import { Loader2, DollarSign, Lock, Unlock, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function ShiftPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [shiftData, setShiftData] = useState<any>(null);
    const [registers, setRegisters] = useState<any[]>([]);

    // Forms
    const [initialAmount, setInitialAmount] = useState('');
    const [selectedRegister, setSelectedRegister] = useState('');
    const [finalAmount, setFinalAmount] = useState('');

    const [movementType, setMovementType] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
    const [movementAmount, setMovementAmount] = useState('');
    const [movementDesc, setMovementDesc] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const u = await getSessionUser();
            if (!u) {
                router.push('/login');
                return;
            }
            setUser(u);

            const details = await getShiftDetails(u.id);
            setShiftData(details);

            if (!details) {
                const regs = await getCashRegisters();
                setRegisters(regs);
                if (regs.length > 0) setSelectedRegister(regs[0].id.toString());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleOpen() {
        if (!selectedRegister || !initialAmount) return alert('Complete los datos');
        setLoading(true);
        const res = await openShift(user.id, parseInt(selectedRegister), parseFloat(initialAmount));
        if (res.success) {
            await loadData();
        } else {
            alert(res.error);
            setLoading(false);
        }
    }

    async function handleClose() {
        if (!finalAmount) return alert('Ingrese el monto en efectivo contado');
        if (!confirm('¿Está seguro de cerrar la caja? Esta acción es irreversible.')) return;

        setLoading(true);
        const res = await closeShift(user.id, parseFloat(finalAmount));
        if (res.success) {
            alert('Caja cerrada correctamente');
            await loadData();
        } else {
            alert(res.error);
            setLoading(false);
        }
    }

    async function handleMovement() {
        if (!movementAmount || !movementDesc) return alert('Complete los datos del movimiento');
        setLoading(true);
        const res = await registerMovement(user.id, movementType, parseFloat(movementAmount), movementDesc);
        if (res.success) {
            setMovementAmount('');
            setMovementDesc('');
            await loadData();
        } else {
            alert(res.error);
            setLoading(false);
        }
    }

    if (loading && !user) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Lock size={28} className="text-blue-600" />
                Gestión de Caja (Turno)
            </h1>

            {!shiftData ? (
                // --- OPEN SHIFT FORM ---
                <div className="bg-white p-6 rounded-lg shadow-md border max-w-lg mx-auto mt-10">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-4 rounded-full text-green-600">
                            <Unlock size={48} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-center mb-6">Apertura de Caja</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Caja</label>
                            <select
                                value={selectedRegister}
                                onChange={e => setSelectedRegister(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                {registers.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} - {r.location}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial (Fondo Fijo)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">Bs.</span>
                                <input
                                    type="number"
                                    value={initialAmount}
                                    onChange={e => setInitialAmount(e.target.value)}
                                    className="w-full border p-2 pl-10 rounded"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleOpen}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
                        >
                            {loading ? 'Abriendo...' : 'ABRIR CAJA (INICIAR TURNO)'}
                        </button>
                    </div>
                </div>
            ) : (
                // --- ACTIVE SHIFT DASHBOARD ---
                <div className="grid gap-6">
                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500 mb-1">Inicio de Turno</div>
                            <div className="font-mono text-lg">{new Date(shiftData.shift.startTime).toLocaleString()}</div>
                            <div className="text-sm text-gray-400 mt-1">Caja: {shiftData.shift.cashRegister?.name}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500 mb-1">Fondo Inicial</div>
                            <div className="text-2xl font-bold text-blue-600">Bs. {Number(shiftData.shift.initialAmount).toFixed(2)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border bg-green-50 border-green-200">
                            <div className="text-sm text-green-700 mb-1">Efectivo Estimado en Caja</div>
                            <div className="text-2xl font-bold text-green-800">Bs. {shiftData.estimatedCash.toFixed(2)}</div>
                            <div className="text-xs text-green-600 mt-1">Base + Ventas(E) + Ingresos - Egresos</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Movements Form */}
                        <div className="bg-white p-5 rounded-lg shadow border flex flex-col h-full">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <TrendingUp size={20} /> Registrar Movimiento
                            </h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMovementType('INGRESO')}
                                        className={`flex-1 py-2 rounded text-sm font-bold transition-all border-2 ${movementType === 'INGRESO' ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <TrendingUp className="inline mr-1" size={16} /> INCREMENTO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMovementType('EGRESO')}
                                        className={`flex-1 py-2 rounded text-sm font-bold transition-all border-2 ${movementType === 'EGRESO' ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <TrendingDown className="inline mr-1" size={16} /> GASTO / RETIRO
                                    </button>
                                </div>

                                <div className={`p-4 rounded border ${movementType === 'INGRESO' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">
                                        {movementType === 'INGRESO' ? 'Detalle de Ingreso (Sencillo, Aporte...)' : 'Motivo del Gasto (Limpieza, Almuerzo...)'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Descripción del movimiento..."
                                        className="w-full border p-2 rounded text-sm mb-3 bg-white"
                                        value={movementDesc}
                                        onChange={e => setMovementDesc(e.target.value)}
                                    />
                                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Monto</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500 text-sm">Bs.</span>
                                        <input
                                            type="number"
                                            className="w-full border p-2 pl-8 rounded text-sm font-bold text-lg bg-white"
                                            placeholder="0.00"
                                            value={movementAmount}
                                            onChange={e => setMovementAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleMovement}
                                    disabled={loading}
                                    className={`w-full py-3 rounded text-white font-bold shadow-lg transition-transform active:scale-95 ${movementType === 'INGRESO' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-700 hover:bg-red-800'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'REGISTRAR MOVIMIENTO'}
                                </button>
                            </div>

                            {/* Movements List */}
                            <div className="flex-1 overflow-auto border-t pt-4">
                                <h4 className="text-sm font-bold text-gray-500 mb-2">Historial de Movimientos</h4>
                                {shiftData.movements && shiftData.movements.length > 0 ? (
                                    <div className="space-y-2">
                                        {shiftData.movements.map((m: any) => (
                                            <div key={m.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border text-sm">
                                                <div>
                                                    <div className={`font-bold text-xs ${m.type === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {m.type}
                                                    </div>
                                                    <div className="text-gray-700">{m.description}</div>
                                                    <div className="text-xs text-gray-400">{new Date(m.date).toLocaleTimeString()}</div>
                                                </div>
                                                <div className={`font-mono font-bold ${m.type === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {m.type === 'INGRESO' ? '+' : '-'} {Number(m.amount).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-4 italic">No hay movimientos registrados</div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t bg-gray-50 p-3 rounded">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Total Ingresos:</span>
                                    <span className="font-bold text-green-600">Bs. {shiftData.income.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Total Egresos:</span>
                                    <span className="font-bold text-red-600">Bs. {shiftData.expense.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Close Shift Form */}
                        <div className="bg-white p-5 rounded-lg shadow border border-red-100">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-red-700">
                                <Lock size={20} /> Cierre de Turno
                            </h3>
                            <div className="bg-red-50 p-4 rounded mb-4 text-sm text-red-800">
                                <p className="mb-2 font-bold">Resumen de Ventas:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Total Ventas: <strong>Bs. {shiftData.totalSales.toFixed(2)}</strong></li>
                                    <li>Efectivo (Est): <strong>Bs. {(shiftData.salesByMethod['EFECTIVO'] || 0).toFixed(2)}</strong></li>
                                    <li>QR/Otros: <strong>Bs. {(shiftData.totalSales - (shiftData.salesByMethod['EFECTIVO'] || 0)).toFixed(2)}</strong></li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700">
                                    Efectivo Físico Contado (Arqueo)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">Bs.</span>
                                    <input
                                        type="number"
                                        value={finalAmount}
                                        onChange={e => setFinalAmount(e.target.value)}
                                        className="w-full border-2 border-slate-300 p-2 pl-10 rounded text-lg font-bold text-slate-900"
                                        placeholder="0.00"
                                    />
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition"
                                >
                                    CERRAR CAJA Y FINALIZAR TURNO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
