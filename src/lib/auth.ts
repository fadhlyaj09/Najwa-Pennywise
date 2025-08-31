// This is a mock authentication service.
// In a real application, this would be handled by a backend service.

export const FAKE_USER = {
  email: 'user@example.com',
  password: 'password',
};

export async function authenticate(email: string, pass: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (email.toLowerCase() === FAKE_USER.email && pass === FAKE_USER.password) {
    return true;
  }
  
  return false;
}
