import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth, type Profile } from '../hooks/useSupabaseAuth';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    position: string;
    phone_number: string;
    role?: 'admin' | 'department_admin' | 'approver' | 'general_user';
    plan?: 'Free' | 'Pro' | 'Enterprise';
    department_id?: string;
    invited_by?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string; data?: Profile }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  userRole: 'admin' | 'department_admin' | 'approver' | 'general_user';
  userPlan: 'Free' | 'Pro' | 'Enterprise';
  isOnboardingComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useSupabaseAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
