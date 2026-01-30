# 🚀 Guía de Despliegue Gratuito (Farmacorp)

Para desplegar tu aplicación Next.js con base de datos MySQL gratis, utilizaremos la siguiente combinación "Premium":
- **Frontend/Backend**: [Vercel](https://vercel.com) (Líder mundial, creadores de Next.js).
- **Base de Datos MySQL**: [TiDB Cloud](https://tidbcloud.com) o [Aiven](https://aiven.io) (Ambos ofrecen capas gratuitas generosas para MySQL).

## PASO 1: Subir tu código a GitHub
¡Hecho! Tu código ya está en: `https://github.com/alex181180hub/farmacorp`

## PASO 2: Inicializar la Base de Datos (TiDB)
**¡LISTO! ✅**
Ya he creado las tablas y el usuario administrador en tu base de datos en la nube. **No necesitas hacer nada más aquí.**

## PASO 3: Desplegar en Vercel (Último paso)

1. Ve a [Vercel.com](https://vercel.com) -> **"New Project"**.
2. Importa tu repositorio: **`alex181180hub/farmacorp`**.
3. En la sección **Environment Variables**, expande y agrega:
   - **Name**: `DATABASE_URL`
   - **Value**: `mysql://6cP3JJybuXfFXQh.root:gUXetuxeuF1MERaT@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict`
4. Haz clic en **"Deploy"**.

¡En unos segundos tendrás tu link público funcionando!

## PASO 3: Desplegar en Vercel

1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Importa tu repositorio `farmacorp`.
4. En la configuración de despliegue, busca la sección **Environment Variables**.
5. Agrega una variable:
   - **Name**: `DATABASE_URL`
   - **Value**: (Pega la URL que obtuviste de TiDB Cloud en el Paso 2).
6. Haz clic en **"Deploy"**.

## PASO 4: Inicializar la Base de Datos en Producción

Una vez desplegado, Vercel construirá el sitio, pero necesitamos crear las tablas la primera vez.

1. Ve al panel de control de tu proyecto en Vercel.
2. Ve a la pestaña **"Settings"** -> **"Functions"** (asegúrate de que esté configurado en una región cercana).
3. Para ejecutar las migraciones, la forma más fácil es conectarte desde tu máquina local a la base de datos remota una sola vez:
   
   - Edita tu archivo `.env` local temporalmente poniendo la URL de TiDB Cloud.
   - Ejecuta: `npx prisma migrate deploy`
   - (Esto creará las tablas en la nube).
   - Vuelve a poner tu URL local en el `.env` para seguir desarrollando.

¡Listo! Tu sistema estará online en `https://farmacorp.vercel.app`.
