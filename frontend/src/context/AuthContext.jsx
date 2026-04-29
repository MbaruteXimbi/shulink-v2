import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const stored = localStorage.getItem('sl_user');
  const [user, setUser] = useState(stored ? JSON.parse(stored) : null);

  const login = useCallback((token, userData) => {
    localStorage.setItem('sl_token', token);
    localStorage.setItem('sl_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sl_token');
    localStorage.removeItem('sl_user');
    setUser(null);
  }, []);

  const can = useCallback((...roles) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return roles.includes(user.role);
  }, [user]);

  return (
    <Ctx.Provider value={{ user, login, logout, can }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
