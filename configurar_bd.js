const fs = require('fs');
const path = require('path');

// ==========================================
// AREA DE CONFIGURACIÓN - EDITE AQUI
// ==========================================

const CONFIG = {
    // Tipo de base de datos. Opciones: 'sqlite', 'postgresql', 'mysql', 'sqlserver'
    provider: 'mysql',

    // Configuración específica para SQLite
    sqlite: {
        // Nombre del archivo de base de datos
        fileName: 'farmacorp.db'
    },

    // Configuración para Base de Datos Remota (PostgreSQL, MySQL, SQL Server)
    remote: {
        host: '127.0.0.1',
        // Puertos por defecto: 5432 (Postgres), 3306 (MySQL), 1433 (SQL Server)
        port: 3306,
        user: 'root',
        password: 'alex',
        database: 'farmacorp',
        // Opciones adicionales para SQL Server
        sqlserverOptions: ';encrypt=false;trustServerCertificate=true'
    }
};

// ==========================================
// FIN DE CONFIGURACIÓN - NO EDITAR ABAJO
// ==========================================

async function updateDatabaseConfig() {
    console.log('🔄 Iniciando actualización de configuración de base de datos...');
    console.log(`📊 Tipo de base de datos seleccionado: ${CONFIG.provider}`);

    let databaseUrl = '';

    // 1. Construir la URL de conexión
    if (CONFIG.provider === 'sqlite') {
        // Asegurar que el nombre del archivo empieza con ./ si es relativo
        let dbPath = CONFIG.sqlite.fileName;
        if (!dbPath.startsWith('file:') && !dbPath.startsWith('/')) {
            if (!dbPath.startsWith('./')) {
                dbPath = './' + dbPath;
            }
            databaseUrl = `file:${dbPath}`;
        } else {
            databaseUrl = dbPath;
        }
    } else {
        const { user, password, host, port, database, sqlserverOptions } = CONFIG.remote;
        if (CONFIG.provider === 'postgresql') {
            databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
        } else if (CONFIG.provider === 'mysql') {
            databaseUrl = `mysql://${user}:${password}@${host}:${port}/${database}`;
        } else if (CONFIG.provider === 'sqlserver') {
            // Formato SQL Server: sqlserver://HOST:PORT;database=DB;user=USER;password=PASS;...
            databaseUrl = `sqlserver://${host}:${port};database=${database};user=${user};password=${password}${sqlserverOptions || ''}`;
        }
    }

    console.log(`🔗 Nueva cadena de conexión generada: ${databaseUrl}`);

    // 2. Actualizar archivo .env
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Reemplazar o agregar DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(/DATABASE_URL=["'].*["']/, `DATABASE_URL="${databaseUrl}"`);
        envContent = envContent.replace(/DATABASE_URL=[^\r\n]*/, `DATABASE_URL="${databaseUrl}"`);
    } else {
        envContent += `\nDATABASE_URL="${databaseUrl}"\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env actualizado correctamente.');

    // 3. Actualizar prisma/schema.prisma
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
        let schemaContent = fs.readFileSync(schemaPath, 'utf8');

        // Actualizar el provider
        // Busca "provider = "algo"" dentro del bloque datasource db
        const datasourceRegex = /(datasource\s+db\s+\{[\s\S]*?provider\s*=\s*)(["']\w+["'])([\s\S]*?\})/;

        if (datasourceRegex.test(schemaContent)) {
            schemaContent = schemaContent.replace(datasourceRegex, `$1"${CONFIG.provider}"$3`);
            fs.writeFileSync(schemaPath, schemaContent);
            console.log('✅ Archivo prisma/schema.prisma actualizado correctamente.');
        } else {
            console.warn('⚠️ No se encontró el bloque datasource en schema.prisma. Verifique manualmente.');
        }
    } else {
        console.error('❌ No se encontró el archivo prisma/schema.prisma');
    }

    console.log('\n🎉 ¡Configuración completada!');
    console.log('NOTA: Si cambió el proveedor (ej. sqlite a postgres), recuerde borrar la carpeta prisma/migrations y ejecutar:');
    console.log('      npx prisma migrate dev --name init');
    console.log('      O para sincronizar sin migraciones: npx prisma db push');
}

updateDatabaseConfig();
