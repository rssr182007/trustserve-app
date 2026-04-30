import { useAuth } from './AuthContext';

export function useUserRole() {
  const { user, profile, role, loading } = useAuth();
  
  return {
    user: user ? {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name,
      role: role,
    } : null,
    role: role,
    isLoading: loading,
    isCustomer: role === 'customer',
    isProvider: role === 'provider',
  };
}
