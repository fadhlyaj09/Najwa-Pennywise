'use server';
// This is a mock authentication service.
// In a real application, this would be handled by a backend service.
import { findUserByEmail, registerNewUser } from "@/ai/flows/user-auth-flow";


export const FAKE_USER = {
  email: 'user@example.com',
  password: 'password',
};

export async function authenticate(email: string, pass: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const user = await findUserByEmail(email.toLowerCase());
    if (user && user.password === pass) {
      return true;
    }
  } catch (error) {
    console.error("Error during authentication:", error);
    // Fallback to local user if sheets auth fails, useful for development
    if (email.toLowerCase() === FAKE_USER.email && pass === FAKE_USER.password) {
        return true;
    }
  }
  
  return false;
}

export async function registerUser(email: string, pass: string): Promise<{success: boolean, message: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const result = await registerNewUser({ email: email.toLowerCase(), password: pass });
        return result;
    } catch (error) {
        console.error("Error during registration:", error);
        return { success: false, message: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.' };
    }
}
