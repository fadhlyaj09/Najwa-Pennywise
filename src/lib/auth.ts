// This is a mock authentication service.
// In a real application, this would be handled by a backend service.

export const FAKE_USER = {
  email: 'user@example.com',
  password: 'password',
};

// Function to get users from localStorage
const getStoredUsers = () => {
    if (typeof window === 'undefined') {
        return [];
    }
    const usersJson = localStorage.getItem('pennywise_users');
    try {
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
        return [];
    }
}

export async function authenticate(email: string, pass: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const storedUsers = getStoredUsers();
  const allUsers = [FAKE_USER, ...storedUsers];

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
    const userExists = storedUsers.some((u: {email: string}) => u.email.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
        return { success: false, message: 'Email sudah terdaftar.' };
    }

    const newUser = { email, password: pass };
    storedUsers.push(newUser);
    localStorage.setItem('pennywise_users', JSON.stringify(storedUsers));
    
    return { success: true, message: 'Pendaftaran berhasil!' };
}
