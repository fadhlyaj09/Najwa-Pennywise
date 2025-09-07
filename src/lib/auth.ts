
'use server';
// This is a mock authentication service.
// In a real application, this would be handled by a backend service.
import { findUserByEmail, registerNewUser } from "@/ai/flows/user-auth-flow";

export async function authenticate(email: string, pass: string): Promise<{success: boolean, message?: string}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const user = await findUserByEmail(email.toLowerCase());
    if (user && user.password === pass) {
      return { success: true };
    }
    return { success: false, message: "Incorrect email or password." };
  } catch (error) {
    console.error("Error during authentication:", error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'Server error. Failed to connect to Google Sheet.' };
  }
}

export async function registerUser(email: string, pass: string): Promise<{success: boolean, message: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const result = await registerNewUser({ email: email.toLowerCase(), password: pass });
        return result;
    } catch (error) {
        console.error("Error during registration:", error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An error occurred during registration. Please try again.' };
    }
}
