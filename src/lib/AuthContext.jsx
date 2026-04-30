import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('service_user');
    const savedRole = localStorage.getItem('service_role');
    const savedProfile = localStorage.getItem('service_profile');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    setProfile(userData);
    
    localStorage.setItem('service_user', JSON.stringify(userData));
    localStorage.setItem('service_role', userRole);
    localStorage.setItem('service_profile', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setProfile(null);
    localStorage.removeItem('service_user');
    localStorage.removeItem('service_role');
    localStorage.removeItem('service_profile');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}