'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function createUser(data: any) {
    try {
        const hashedPassword = bcrypt.hashSync(data.password || '123456', 10);
        await prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                role: data.role,
                password: hashedPassword,
            }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al crear usuario. El nombre de usuario ya existe.' };
    }
}

export async function updateUser(id: number, data: any) {
    try {
        const updateData: any = {
            name: data.name,
            username: data.username,
            role: data.role,
        };

        if (data.password && data.password.trim() !== '') {
            updateData.password = bcrypt.hashSync(data.password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData,
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error al actualizar usuario.' };
    }
}

export async function deleteUser(id: number) {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete user' };
    }
}

export async function getSystemSettings() {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert array to object
        const config: any = {};
        settings.forEach(s => {
            config[s.key] = s.value;
        });
        return config;
    } catch {
        return {};
    }
}

export async function updateSystemSetting(key: string, value: string) {
    try {
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        revalidatePath('/');
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error updating setting' };
    }
}
