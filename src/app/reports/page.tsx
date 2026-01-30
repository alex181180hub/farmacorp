'use client';

import { useState, useEffect } from 'react';
import { FileText, TrendingUp, DollarSign, AlertCircle, FileCheck, ArrowLeft, Printer, Search, Calendar, History } from 'lucide-react';
import styles from './reports.module.css';
import { getCriticalStock, getDailyReport, getSalesBook, getTopProducts, getAllCashiers, getCurrentUserSession, getExpiredProductsHistory } from '@/actions/report-actions';

const REPORTS = [
    { id: 'daily', title: 'Cierre de Caja Diario', icon: DollarSign, desc: 'Resumen de ingresos, egresos y arqueo de caja.' },
    { id: 'sales_book', title: 'Libro de Ventas (IVA)', icon: FileCheck, desc: 'Reporte fiscal formato SIAT para declaración de impuestos.' },
    { id: 'top_products', title: 'Ranking de Productos', icon: TrendingUp, desc: 'Productos más vendidos y de mayor rentabilidad.' },
    { id: 'critical_stock', title: 'Stock Crítico', icon: AlertCircle, desc: 'Inventario con existencias por debajo del mínimo.' },
    { id: 'expired_history', title: 'Bajas por Vencimiento', icon: History, desc: 'Historial de productos eliminados del stock por fecha de vencimiento.' },
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    const [selectedUserId, setSelectedUserId] = useState('all');
    const [cashiers, setCashiers] = useState<{ id: number, name: string }[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        getCurrentUserSession().then(user => {
            if (user) {
                setCurrentUser(user);
                setSelectedUserId(user.id.toString());

                // Only Admin can see/select other cashiers
                if (user.role === 'Admin' || user.role === 'ADMIN') {
                    getAllCashiers().then(setCashiers);
                }
            }
        });
    }, []);


    const handleBack = () => {
        setSelectedReport(null);
        setData(null);
    };

    const fetchReport = async () => {
        if (!selectedReport) return;
        setLoading(true);
        setData(null);

        let res;
        if (selectedReport === 'daily') {
            res = await getDailyReport(dateFrom, dateTo, selectedUserId);
        } else if (selectedReport === 'sales_book') {
            res = await getSalesBook(dateFrom, dateTo);
        } else if (selectedReport === 'critical_stock') {
            res = await getCriticalStock();
        } else if (selectedReport === 'top_products') {
            res = await getTopProducts(dateFrom, dateTo);
        } else if (selectedReport === 'expired_history') {
            res = await getExpiredProductsHistory(dateFrom, dateTo);
        }

        setLoading(false);
        if (res?.success) {
            setData(res.data);
        } else {
            alert(res?.error || 'Error al obtener reporte');
        }
    };

    const handlePrint = () => {
        let title = '';
        let htmlContent = '';
        const reportDef = REPORTS.find(r => r.id === selectedReport);

        const style = `
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { text-align: center; color: #004b8d; }
                .meta { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8fafc; color: #333; }
                .right { text-align: right; }
                .total { font-weight: bold; font-size: 14px; background: #eee; }
            </style>
        `;

        if (selectedReport === 'daily' && data) {
            title = 'Cierre de Caja';
            const range = data.period;

            htmlContent = `
                <div class="meta">
                    <p><strong>Periodo:</strong> ${range}</p>
                    <p><strong>Total Ventas:</strong> Bs. ${data.grandTotal.sales.toFixed(2)}</p>
                    <p><strong>Total Ingresos:</strong> Bs. ${data.grandTotal.income.toFixed(2)}</p>
                    <p><strong>Total Egresos:</strong> Bs. ${data.grandTotal.expense.toFixed(2)}</p>
                    <p><strong>Diferencia Neta:</strong> Bs. ${data.grandTotal.difference.toFixed(2)}</p>
                </div>

                <h3>Detalle de Turnos</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Turno</th>
                            <th>Cajero</th>
                            <th>Caja</th>
                            <th>Apertura</th>
                            <th>Cierre</th>
                            <th class="right">Ventas</th>
                            <th class="right">Ingresos</th>
                            <th class="right">Egresos</th>
                            <th class="right">Diferencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.shifts.map((s: any) => `
                            <tr>
                                <td>#${s.id}</td>
                                <td>${s.user}</td>
                                <td>${s.register}</td>
                                <td>${new Date(s.start).toLocaleTimeString()}</td>
                                <td>${s.end ? new Date(s.end).toLocaleTimeString() : 'ABIERTO'}</td>
                                <td class="right">${s.totalSales.toFixed(2)}</td>
                                <td class="right">${s.income.toFixed(2)}</td>
                                <td class="right">${s.expense.toFixed(2)}</td>
                                <td class="right">${s.difference.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (selectedReport === 'sales_book' && data) {
            // ... (rest of logic same as before)
            title = 'Libros de Ventas (IVA)';
            htmlContent = `
                <div class="meta"><p><strong>Periodo:</strong> ${dateFrom} al ${dateTo}</p></div>
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Nº Fact</th><th>Autorización</th><th>NIT/CI</th><th>Razón Social</th><th class="right">Importe</th><th class="right">Débito Fiscal</th></tr>
                    </thead>
                    <tbody>
                        ${data.map((s: any) => `
                            <tr>
                                <td>${s.date}</td><td>${s.invoiceNumber || '-'}</td><td>${s.authorization}</td>
                                <td>${s.nit}</td><td>${s.name}</td><td class="right">${s.amount.toFixed(2)}</td>
                                <td class="right">${s.fiscalDebit.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total">
                            <td colspan="5" class="right">TOTALES</td>
                            <td class="right">${data.reduce((a: any, b: any) => a + b.amount, 0).toFixed(2)}</td>
                            <td class="right">${data.reduce((a: any, b: any) => a + b.fiscalDebit, 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else if (selectedReport === 'critical_stock' && data) {
            title = 'Stock Crítico';
            htmlContent = `
                 <table>
                     <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th class="right">Stock Actual</th><th class="right">Stock Mínimo</th></tr></thead>
                     <tbody>
                         ${data.map((p: any) => `
                             <tr>
                                 <td>${p.code}</td><td>${p.name}</td><td>${p.category?.name || '-'}</td>
                                 <td class="right" style="color:red; font-weight:bold">${p.stock}</td>
                                 <td class="right">${p.minStock}</td>
                             </tr>
                         `).join('')}
                     </tbody>
                 </table>
             `;
        } else if (selectedReport === 'top_products' && data) {
            title = 'Ranking de Productos';
            htmlContent = `
                 <div class="meta"><p><strong>Periodo:</strong> ${dateFrom} al ${dateTo}</p></div>
                 <table>
                     <thead><tr><th>#</th><th>Código</th><th>Producto</th><th class="right">Unidades Vendidas</th></tr></thead>
                     <tbody>
                         ${data.map((p: any, i: number) => `
                             <tr>
                                 <td>${i + 1}</td><td>${p.code}</td><td>${p.name}</td>
                                 <td class="right">${p.quantity}</td>
                             </tr>
                         `).join('')}
                     </tbody>
                 </table>
             `;
        } else if (selectedReport === 'expired_history' && data) {
            title = 'Historial de Bajas por Vencimiento';
            htmlContent = `
                 <div class="meta"><p><strong>Periodo:</strong> ${dateFrom} al ${dateTo}</p></div>
                 <table>
                     <thead>
                         <tr>
                             <th>Fecha</th>
                             <th>Código</th>
                             <th>Producto</th>
                             <th>Categoría</th>
                             <th class="right">Cantidad</th>
                             <th>Responsable</th>
                             <th>Notas</th>
                         </tr>
                     </thead>
                     <tbody>
                         ${data.map((item: any) => `
                             <tr>
                                 <td>${new Date(item.date).toLocaleString()}</td>
                                 <td>${item.productCode}</td>
                                 <td>${item.productName}</td>
                                 <td>${item.category}</td>
                                 <td class="right">${item.quantity}</td>
                                 <td>${item.user}</td>
                                 <td>${item.notes}</td>
                             </tr>
                         `).join('')}
                     </tbody>
                 </table>
             `;
        }

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`
                <html>
                    <head><title>${title}</title>${style}</head>
                    <body>
                        <h1>FARMATECH - ${title}</h1>
                        <p style="text-align:center; color:#666">Generado el: ${new Date().toLocaleString()}</p>
                        ${htmlContent}
                        <script>window.print();</script>
                    </body>
                </html>
            `);
            win.document.close();
        }
    };

    const handlePrintShift = (shift: any) => {
        const title = `Cierre de Caja #${shift.id}`;

        const style = `
            <style>
                body { font-family: sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                h1 { margin: 0; color: #004b8d; font-size: 24px; }
                h2 { margin: 5px 0; font-size: 16px; color: #666; }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
                .financials { margin-bottom: 20px; }
                .financial-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #eee; }
                .total-row { font-weight: bold; border-top: 2px solid #333; margin-top: 5px; padding-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f0f0f0; }
                .right { text-align: right; }
            </style>
        `;

        const htmlContent = `
            <div class="header">
                <h1>FARMATECH</h1>
                <h2>${title}</h2>
                <p>Fecha de Impresión: ${new Date().toLocaleString()}</p>
            </div>

            <div class="meta-grid">
                <div><strong>Cajero:</strong> ${shift.user}</div>
                <div><strong>Caja:</strong> ${shift.register}</div>
                <div><strong>Apertura:</strong> ${new Date(shift.start).toLocaleString()}</div>
                <div><strong>Cierre:</strong> ${shift.end ? new Date(shift.end).toLocaleString() : 'EN CURSO'}</div>
            </div>

            <h3>Resumen Financiero</h3>
            <div class="financials">
                <div class="financial-row"><span>Fondo Inicial (Apertura):</span> <span>Bs. ${shift.initialAmount.toFixed(2)}</span></div>
                <div class="financial-row"><span>(+) Ventas Totales:</span> <span>Bs. ${shift.totalSales.toFixed(2)}</span></div>
                <div class="financial-row"><span>(+) Ingresos / Aportes:</span> <span>Bs. ${shift.income.toFixed(2)}</span></div>
                <div class="financial-row"><span>(-) Gastos / Retiros:</span> <span>Bs. ${shift.expense.toFixed(2)}</span></div>
                <div class="financial-row total-row"><span>(=) Efectivo Esperado en Sistema:</span> <span>Bs. ${(shift.initialAmount + shift.totalSales + shift.income - shift.expense).toFixed(2)}</span></div>
                <div class="financial-row"><span>(-) Efectivo Declarado (Arqueo):</span> <span>Bs. ${shift.finalAmount.toFixed(2)}</span></div>
                <div class="financial-row total-row" style="color: ${shift.difference < 0 ? 'red' : 'black'}">
                    <span>(=) Diferencia (Faltante/Sobrante):</span> 
                    <span>Bs. ${shift.difference.toFixed(2)}</span>
                </div>
            </div>

            <h3>Desglose de Ventas por Método</h3>
            <ul>
                ${Object.entries(shift.methods).map(([k, v]) => `<li><strong>${k}:</strong> Bs. ${Number(v).toFixed(2)}</li>`).join('')}
            </ul>

            ${shift.movements && shift.movements.length > 0 ? `
                <h3>Detalle de Movimientos (Gastos/Ingresos)</h3>
                <table>
                    <thead><tr><th>Hora</th><th>Tipo</th><th>Descripción</th><th class="right">Monto</th></tr></thead>
                    <tbody>
                        ${shift.movements.map((m: any) => `
                            <tr>
                                <td>${new Date(m.date).toLocaleTimeString()}</td>
                                <td>${m.type}</td>
                                <td>${m.description}</td>
                                <td class="right">${m.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p><i>No hubo movimientos de caja extras.</i></p>'}
        `;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`<html><head><title>${title}</title>${style}</head><body>${htmlContent}<script>window.print();</script></body></html>`);
            win.document.close();
        }
    };

    const currentTitle = REPORTS.find(r => r.id === selectedReport)?.title;

    return (
        <div className={styles.container} style={selectedReport ? { display: 'flex', flexDirection: 'column' } : {}}>
            {!selectedReport ? (
                // --- LIST VIEW ---
                <>
                    <h1 className="mb-2 text-2xl font-bold text-primary">Reportes Gerenciales y Fiscales</h1>
                    <p className="mb-8 text-secondary">Seleccione el reporte que desea generar o exportar.</p>

                    <div className={styles.grid}>
                        {REPORTS.map((r) => (
                            <div key={r.id} className={styles.reportCard} onClick={() => setSelectedReport(r.id)}>
                                <div className={styles.icon}>
                                    <r.icon size={32} />
                                </div>
                                <h3 className={styles.reportTitle}>{r.title}</h3>
                                <p className={styles.desc}>{r.desc}</p>
                                <button className="btn btn-secondary w-full">Seleccionar</button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                // --- DETAIL / PREVIEW VIEW ---
                <>
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                        <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-gray-800">
                            <ArrowLeft size={20} className="mr-1" /> Volver
                        </button>
                        <h2 className="text-2xl font-bold flex-1">{currentTitle}</h2>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-wrap items-end gap-4">
                        {selectedReport !== 'critical_stock' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={e => setDateTo(e.target.value)}
                                        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                {selectedReport === 'daily' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cajero/Vendedor</label>
                                        {(currentUser?.role === 'Admin' || currentUser?.role === 'ADMIN') ? (
                                            <select
                                                value={selectedUserId}
                                                onChange={e => setSelectedUserId(e.target.value)}
                                                className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
                                            >
                                                <option value="all">Todos</option>
                                                <option value={currentUser?.id}>{currentUser?.name} (Yo)</option>
                                                {cashiers
                                                    .filter(c => c.id !== currentUser?.id)
                                                    .map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                            </select>
                                        ) : (
                                            <div className="px-3 py-2 bg-gray-50 border rounded text-sm text-gray-600 min-w-[150px] cursor-not-allowed">
                                                {currentUser?.name || 'Usuario Actual'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="btn btn-primary h-[38px] flex items-center gap-2"
                        >
                            {loading ? 'Cargando...' : <><Search size={16} /> Generar Reporte</>}
                        </button>

                        {data && (
                            <button onClick={handlePrint} className="btn btn-secondary ml-auto flex items-center gap-2">
                                <Printer size={16} /> Imprimir / Exportar PDF
                            </button>
                        )}
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-white rounded-lg shadow border p-6 overflow-auto">
                        {!data && !loading && (
                            <div className="text-center text-gray-400 py-20">Configure los filtros y presione "Generar Reporte"</div>
                        )}

                        {loading && (
                            <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
                        )}

                        {data && (
                            <div className="animate-in fade-in max-w-5xl mx-auto">
                                {/* Preview implementation specifically for UI */}
                                {selectedReport === 'daily' && (
                                    <div>
                                        <div className="mb-6 border-b pb-4">
                                            <h3 className="text-lg font-bold mb-4">Resumen General ({data.period})</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                                    <div className="text-xs text-blue-800 uppercase font-bold">Total Ventas</div>
                                                    <div className="text-xl font-bold text-blue-700">Bs. {data.grandTotal.sales.toFixed(2)}</div>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded border border-green-100">
                                                    <div className="text-xs text-green-800 uppercase font-bold">Total Ingresos</div>
                                                    <div className="text-xl font-bold text-green-700">Bs. {data.grandTotal.income.toFixed(2)}</div>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded border border-red-100">
                                                    <div className="text-xs text-red-800 uppercase font-bold">Total Egresos</div>
                                                    <div className="text-xl font-bold text-red-700">Bs. {data.grandTotal.expense.toFixed(2)}</div>
                                                </div>
                                                <div className={`p-3 rounded border ${data.grandTotal.difference < 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50'}`}>
                                                    <div className="text-xs text-gray-600 uppercase font-bold">Diferencia Total</div>
                                                    <div className={`text-xl font-bold ${data.grandTotal.difference < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                        Bs. {data.grandTotal.difference.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <h4 className="font-bold mb-2">Detalle por Turno / Cierre</h4>
                                        <table className="w-full text-left text-xs md:text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-2">Turno</th>
                                                    <th className="p-2">Cajero</th>
                                                    <th className="p-2">Caja</th>
                                                    <th className="p-2">Apertura</th>
                                                    <th className="p-2">Cierre</th>
                                                    <th className="p-2 text-right">Ventas</th>
                                                    <th className="p-2 text-right">Ingresos</th>
                                                    <th className="p-2 text-right">Egresos</th>
                                                    <th className="p-2 text-right">Diferencia</th>
                                                    <th className="p-2 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.shifts.map((s: any) => (
                                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 font-mono">#{s.id}</td>
                                                        <td className="p-2 font-medium">{s.user}</td>
                                                        <td className="p-2 text-gray-500">{s.register}</td>
                                                        <td className="p-2 text-gray-500">{new Date(s.start).toLocaleTimeString()}</td>
                                                        <td className="p-2 text-gray-500">{s.end ? new Date(s.end).toLocaleTimeString() : 'ABIERTO'}</td>
                                                        <td className="p-2 text-right font-bold text-blue-700">{s.totalSales.toFixed(2)}</td>
                                                        <td className="p-2 text-right text-green-600">{s.income.toFixed(2)}</td>
                                                        <td className="p-2 text-right text-red-600">{s.expense.toFixed(2)}</td>
                                                        <td className={`p-2 text-right font-bold ${s.difference < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                            {s.difference.toFixed(2)}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => handlePrintShift(s)}
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="Imprimir Cierre"
                                                            >
                                                                <Printer size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {selectedReport === 'sales_book' && (
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-2">Fecha</th>
                                                <th className="p-2">Factura</th>
                                                <th className="p-2">NIT/CI</th>
                                                <th className="p-2">Razón Social</th>
                                                <th className="p-2 text-right">Importe</th>
                                                <th className="p-2 text-right">Débito Fiscal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((s: any, idx: number) => (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="p-2">{s.date}</td>
                                                    <td className="p-2">{s.invoiceNumber}</td>
                                                    <td className="p-2">{s.nit}</td>
                                                    <td className="p-2">{s.name}</td>
                                                    <td className="p-2 text-right">{s.amount.toFixed(2)}</td>
                                                    <td className="p-2 text-right">{s.fiscalDebit.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'critical_stock' && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr><th className="p-2">Código</th><th className="p-2">Producto</th><th className="p-2">Categoría</th><th className="p-2 text-right">Stock Actual</th><th className="p-2 text-right">Mínimo</th></tr>
                                        </thead>
                                        <tbody>
                                            {data.map((p: any) => (
                                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 font-mono text-gray-500">{p.code}</td>
                                                    <td className="p-2 font-medium">{p.name}</td>
                                                    <td className="p-2">{p.category?.name}</td>
                                                    <td className="p-2 text-right text-red-600 font-bold">{p.stock}</td>
                                                    <td className="p-2 text-right text-gray-500">{p.minStock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'top_products' && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr><th className="p-2">#</th><th className="p-2">Código</th><th className="p-2">Producto</th><th className="p-2 text-right">Unidades Vendidas</th></tr>
                                        </thead>
                                        <tbody>
                                            {data.map((p: any, i: number) => (
                                                <tr key={i} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 text-gray-500">{i + 1}</td>
                                                    <td className="p-2 font-mono">{p.code}</td>
                                                    <td className="p-2 font-medium">{p.name}</td>
                                                    <td className="p-2 text-right font-bold">{p.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'expired_history' && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-2">Fecha</th>
                                                <th className="p-2">Código</th>
                                                <th className="p-2">Producto</th>
                                                <th className="p-2">Categoría</th>
                                                <th className="p-2 text-right">Cantidad</th>
                                                <th className="p-2">Responsable</th>
                                                <th className="p-2">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((item: any) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2">{new Date(item.date).toLocaleString()}</td>
                                                    <td className="p-2 font-mono text-gray-500">{item.productCode}</td>
                                                    <td className="p-2 font-medium">{item.productName}</td>
                                                    <td className="p-2">{item.category}</td>
                                                    <td className="p-2 text-right font-bold text-red-600">{item.quantity}</td>
                                                    <td className="p-2">{item.user}</td>
                                                    <td className="p-2 text-gray-500 italic">{item.notes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
