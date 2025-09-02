'use server';
/**
 * @fileOverview User authentication flow using Google Sheets as a database.
 *
 * - findUserByEmail - Finds a user in the sheet by email.
 * - registerNewUser - Registers a new user by adding them to the sheet.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { findUserByEmailInSheet, appendUserToSheet } from '@/lib/sheets';

const UserSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const findUserByEmail = ai.defineFlow(
    {
        name: 'findUserByEmail',
        inputSchema: z.string().email(),
        outputSchema: UserSchema.nullable(),
    },
    async (email) => {
        return await findUserByEmailInSheet(email);
    }
);

export const registerNewUser = ai.defineFlow(
    {
        name: 'registerNewUser',
        inputSchema: UserSchema,
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async (userData) => {
        try {
            const existingUser = await findUserByEmailInSheet(userData.email);
            if (existingUser) {
                return { success: false, message: 'Email sudah terdaftar.' };
            }
            await appendUserToSheet(userData);
            return { success: true, message: 'Pendaftaran berhasil!' };
        } catch (error) {
            if (error instanceof Error) {
                return { success: false, message: error.message };
            }
            return { success: false, message: 'Terjadi kesalahan tidak diketahui saat mendaftar.'}
        }
    }
);
