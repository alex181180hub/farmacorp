const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Configuration
const PORT = 3000;
const DB_FILENAME = 'farmacorp.db';

async function main() {
    console.log('=============================================');
    console.log('   FARMACORP POS - LAUNCHER SYSTEM');
    console.log('=============================================');
    console.log('');

    // 1. Resolve Paths
    const currentDir = __dirname;
    const dbPath = path.join(currentDir, DB_FILENAME);
    const nodeBin = path.join(currentDir, 'bin', 'node.exe');
    const serverScript = path.join(currentDir, 'server.js');

    console.log('[1/4] Environment Check');
    console.log(` - Root: ${currentDir}`);
    console.log(` - DB: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
        console.error('CRITICAL ERROR: Database file missing!');
        process.exit(1);
    }

    // Format DB URL for Prisma (Must handle Windows backslashes)
    // Prisma on Windows works best with file:C:/Path/To/Db
    const normalizedDbPath = dbPath.replace(/\\/g, '/');
    const databaseUrl = `file:${normalizedDbPath}`;

    console.log(` - Connection String: ${databaseUrl}`);

    // 2. Fix User / Verify DB Integrity
    console.log('');
    console.log('[2/4] Verifying Database Integrity...');
    const prisma = new PrismaClient({
        datasources: { db: { url: databaseUrl } }
    });

    try {
        const userCount = await prisma.user.count();
        console.log(`   > Users found: ${userCount}`);

        // Reset Admin Password
        const hash = bcrypt.hashSync('admin123', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { password: hash },
            create: {
                username: 'admin',
                password: hash,
                name: 'Administrador',
                role: 'ADMIN'
            }
        });
        console.log('   > Admin credentials secured (admin/admin123)');

    } catch (e) {
        console.error('   > DATABASE ERROR:', e.message);
        console.log('   > Attempting to continue anyway, but login might fail.');
    } finally {
        await prisma.$disconnect();
    }

    // 3. Start Server
    console.log('');
    console.log('[3/4] Starting Web Server...');

    const env = {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PORT: PORT.toString(),
        HOSTNAME: '0.0.0.0',
        NEXTAUTH_SECRET: 'secret123'
    };

    const serverProcess = spawn(nodeBin, [serverScript], {
        cwd: currentDir,
        env: env,
        stdio: 'inherit' // Pipe output directly to this window
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });

    // 4. Open Browser
    console.log('');
    console.log('[4/4] Opening Interface...');
    setTimeout(() => {
        console.log(`   > Launching http://localhost:${PORT}`);
        exec(`start http://localhost:${PORT}`);
    }, 5000);

    console.log('');
    console.log('SYSTEM RUNNING. DO NOT CLOSE THIS WINDOW.');
}

main();
