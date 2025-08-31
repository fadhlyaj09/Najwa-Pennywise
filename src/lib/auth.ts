// This is a mock authentication service.
// In a real application, this would be handled by a backend service.

export const FAKE_USER = {
  email: 'user@example.com',
  password: 'password',
};

// Function to get users from localStorage
const getStoredUsers = (): Array<{email: string, password: string}> => {
    if (typeof window === 'undefined') {
        return [];
    }
    const usersJson = localStorage.getItem('pennywise_users');
    try {
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        return [];
    }
}

// Function to get all users (stored + default if no stored users exist)
const getAllUsers = () => {
    const storedUsers = getStoredUsers();
    
    // If there are users in localStorage, use them as the source of truth.
    if (storedUsers.length > 0) {
        return storedUsers;
    }
    
    // Otherwise, if no users are stored, fall back to the default user.
    // This is mainly for the first-time run experience.
    return [FAKE_USER];
}


export async function authenticate(email: string, pass: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const allUsers = getAllUsers();
  const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (user && user.password === pass) {
    return true;
  }
  
  return false;
}

export async function registerUser(email: string, pass: string): Promise<{success: boolean, message: string}> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
        return { success: false, message: 'Registration is only available on the client.' };
    }

    const storedUsers = getStoredUsers();
    const userExists = storedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
        return { success: false, message: 'Email sudah terdaftar.' };
    }
    
    // Also check against the default user if no users are stored yet.
    if (storedUsers.length === 0 && FAKE_USER.email.toLowerCase() === email.toLowerCase()) {
         return { success: false, message: 'Email sudah terdaftar.' };
    }

    const newUser = { email, password: pass };
    storedUsers.push(newUser);
    localStorage.setItem('pennywise_users', JSON.stringify(storedUsers));
    
    return { success: true, message: 'Pendaftaran berhasil!' };
}
