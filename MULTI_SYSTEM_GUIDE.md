
## Ejecución de Multiples Sistemas (Sucursales)

Este sistema soporta la ejecución simultánea de múltiples instancias (ej. Central, Norte, Sur) con configuraciones independientes.

1.  **Configuración**: Edita el archivo `.rc.json` con los datos de cada entorno (Base de datos, nombres, puertos).
2.  **Ejecutar**:
    
    Para correr la **Sucursal Central**:
    ```bash
    npx env-cmd -e central npm run dev
    ```

    Para correr la **Sucursal Norte**:
    ```bash
    npx env-cmd -e norte npm run dev -- -p 3001
    ```

    Cada sistema tendrá:
    - Su propia base de datos (definida en `DATABASE_URL`).
    - Su propia sesión (cookies no se mezclan).
    - Su propio nombre visible en el encabezado.
