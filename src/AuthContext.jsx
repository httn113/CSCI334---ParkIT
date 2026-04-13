import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'parkit_role';

export function AuthProvider({ children }) {
  // const [role, setRole] = useState(() => sessionStorage.getItem(SESSION_KEY));

  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY))
  const login = useCallback((accessToken) => {
    sessionStorage.setItem(SESSION_KEY, accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    // setRole(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
