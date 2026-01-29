import { Product, Customer } from './types';

export const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        code: 'MED-001',
        barcode: '7770001',
        name: 'Paracetamol 500mg',
        category: 'Analgésicos',
        price: 2.50,
        stock: 150,
        minStock: 20,
        requiresPrescription: false,
        expirationDate: '2025-12-01',
        location: 'Estante A-1'
    },
    {
        id: '2',
        code: 'MED-002',
        barcode: '7770002',
        name: 'Ibuprofeno 400mg',
        category: 'Antiinflamatorios',
        price: 3.00,
        stock: 80,
        minStock: 15,
        requiresPrescription: false,
        expirationDate: '2024-10-15',
        location: 'Estante A-2'
    },
    {
        id: '3',
        code: 'MED-003',
        barcode: '7770003',
        name: 'Amoxicilina 500mg',
        category: 'Antibióticos',
        price: 5.50,
        stock: 45,
        minStock: 10,
        requiresPrescription: true,
        expirationDate: '2025-05-20',
        location: 'Estante B-1'
    },
    {
        id: '4',
        code: 'MED-004',
        barcode: '7770004',
        name: 'Mentisan 15g',
        category: 'Respiratorio',
        price: 8.00,
        stock: 200,
        minStock: 50,
        requiresPrescription: false,
        expirationDate: '2026-01-01',
        location: 'Mostrador'
    },
    {
        id: '5',
        code: 'MED-005',
        barcode: '7770005',
        name: 'Digestan',
        category: 'Estomacal',
        price: 1.50,
        stock: 120,
        minStock: 30,
        requiresPrescription: false,
        expirationDate: '2025-08-30',
        location: 'Estante C-1'
    },
    {
        id: '6',
        code: 'MED-006',
        barcode: '7770006',
        name: 'Vitamina C 1g Efervescente',
        category: 'Vitaminas',
        price: 4.00,
        stock: 60,
        minStock: 20,
        requiresPrescription: false,
        expirationDate: '2024-12-10',
        location: 'Estante D-1'
    },
    {
        id: '7',
        code: 'COS-001',
        barcode: '7770007',
        name: 'Bloqueador Solar SPF 50',
        category: 'Dermocosmética',
        price: 85.00,
        stock: 15,
        minStock: 5,
        requiresPrescription: false,
        expirationDate: '2026-03-20',
        location: 'Vitrina 1'
    }
];

export const MOCK_CUSTOMERS: Customer[] = [
    { id: '1', nit: '123456023', razonSocial: 'Juan Perez', email: 'juan@example.com' },
    { id: '2', nit: '990011223', razonSocial: 'Farmacia Sol', email: 'contacto@sol.com' },
];
