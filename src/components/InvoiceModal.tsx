'use client';

import { QRCodeCanvas } from 'qrcode.react';
import styles from './InvoiceModal.module.css';

interface InvoiceModalProps {
    sale: any;
    qrContent: string;
    onClose: () => void;
}

export default function InvoiceModal({ sale, qrContent, onClose }: InvoiceModalProps) {

    const handlePrint = () => {
        window.print();
    };

    const isFactura = sale.saleType === 'FACTURA' || (!sale.saleType && !!sale.controlCode);

    return (
        <div className={styles.overlay}>
            <div className={styles.invoicePaper}>
                <div className={styles.header}>
                    <div className={styles.title}>FARMACORP</div>
                    <div className={styles.info}>SUCURSAL NORTE</div>
                    <div className={styles.info}>AV. CRISTO REDENTOR NRO 500</div>
                    <div className={styles.info}>SANTA CRUZ - BOLIVIA</div>
                    <div className={styles.info}>TELEFONO: 3-3333333</div>
                    <div className={styles.info}>NIT: 1020304050</div>
                    <br />
                    <div className={styles.title}>{isFactura ? 'FACTURA' : 'RECIBO DE VENTA'}</div>
                    {isFactura && (
                        <>
                            <div className={styles.info}>NRO AUT: {sale.cuf ? sale.cuf.substring(0, 15) : '0'}...</div>
                            <div className={styles.info}>FACTURA N°: {sale.invoiceNumber}</div>
                        </>
                    )}
                    {!isFactura && (
                        <div className={styles.info}>TRANSACCIÓN N°: {sale.invoiceNumber}</div>
                    )}
                </div>

                <div className={styles.details}>
                    <div className={styles.row}><span>FECHA:</span> <span>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}</span></div>
                    <div className={styles.row}><span>SENOR(ES):</span> <span>{sale.customer ? sale.customer.razonSocial : 'S/N'}</span></div>
                    <div className={styles.row}><span>NIT/CI:</span> <span>{sale.customer ? sale.customer.nit : '0'}</span></div>
                </div>

                <div>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        DESCRIPCION
                    </div>
                    {sale.items.map((item: any) => (
                        <div key={item.id} className={styles.productRow}>
                            <span className={styles.prodName}>{item.product.name}</span>
                            <div className={styles.prodNums}>
                                <span>{item.quantity} x {item.price.toFixed(2)}</span>
                                <span>{(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.totals}>
                    <div className={styles.totalRow}>
                        <span>TOTAL Bs.</span>
                        <span>{sale.total.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Son: CUARENTA Y CINCO 50/100 BOLIVIANOS (Ejemplo)
                    </div>
                </div>

                {isFactura && qrContent && (
                    <div className={styles.qrSection}>
                        <QRCodeCanvas value={qrContent} size={128} level="M" />
                    </div>
                )}

                <div className={styles.legal}>
                    {isFactura ? (
                        <p>ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO DE ÉSTA SERÁ SANCIONADO DE ACUERDO A LEY.</p>
                    ) : (
                        <p>DOCUMENTO DE CONTROL INTERNO - NO VALIDO PARA CRÉDITO FISCAL</p>
                    )}
                    <br />
                    {isFactura && (
                        <>
                            <p style={{ fontSize: '0.65rem' }}>CC: {sale.controlCode}</p>
                            <p style={{ fontSize: '0.6rem' }}>CUF: {sale.cuf}</p>
                        </>
                    )}
                </div>

                <div className="no-print" style={{ position: 'relative', zIndex: 1200 }}>
                    <button className={styles.printBtn} onClick={handlePrint}>Imprimir Comprobante</button>
                    <button className={styles.closeBtn} onClick={onClose}>Cerrar</button>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none;
          }
          .${styles.invoicePaper}, .${styles.invoicePaper} * {
            visibility: visible;
          }
          .${styles.invoicePaper} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            box-shadow: none;
            overflow: visible;
          }
        }
      `}</style>
        </div>
    );
}
