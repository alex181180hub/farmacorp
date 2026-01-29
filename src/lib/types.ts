export interface Product {
    id: string;
    code: string;
    barcode: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    minStock: number;
    requiresPrescription: boolean;
    expirationDate: string;
    location: string;
}

export interface CartItem extends Product {
    quantity: number;
    discount: number; // Percentage
}

export interface Customer {
    id: string;
    nit: string;
    razonSocial: string;
    email: string;
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'QR' | 'MIXTO';

export interface Sale {
    id: string;
    date: string;
    items: CartItem[];
    subtotal: number;
    total: number;
    paymentMethod: PaymentMethod;
    customer?: Customer;
    invoiceNumber?: string;
    cuf?: string; // Código Único de Facturación
}
