# Sistema de Ventas POS - Tipo Farmacorp

Sistema de punto de venta y gestión de inventarios diseñado para farmacias en Bolivia, preparado para normativa SIN (Facturación Electrónica).

## Tecnologías

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: CSS Modules con Variables CSS (Diseño Corporativo Farmacorp)
- **Iconos**: Lucide React

## Módulos Incluidos

1.  **Dashboard**: Métricas en tiempo real de ventas y alertas.
2.  **Punto de Venta (POS)**: Búsqueda rápida, carrito, cálculo de totales.
3.  **Inventario**: Gestión de productos, stock, lotes y vencimientos.
4.  **Reportes**: Libro de ventas IVA, cierre de caja, productos críticos.

## Instrucciones de Instalación

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

3.  Abrir en navegador: [http://localhost:3000](http://localhost:3000)

## Próximos Pasos (Implementación Real)

- **Base de Datos**: Configurar conexión a SQL Server usando Prisma ORM.
- **Facturación SIAT**: Integrar librería de firma digital y consumo de API del SIN.
- **Autenticación**: Configurar NextAuth para roles (Admin, Cajero).
