import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  position: string;
  phone_number: string;
  email: string;
  role: 'admin' | 'department_admin' | 'approver' | 'general_user';
  plan: 'Free' | 'Pro' | 'Enterprise';
  department_id?: string;
  invited_by?: string;
  last_login_at?: string;
  status: 'active' | 'invited' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // 初期認証状態を取得
    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session) {
          await handleAuthChange(session);
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthChange(session);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAuthChange = async (session: Session) => {
    try {
      const user = session.user;
      
      // プロフィール情報を取得
      let profile: Profile | null = null;
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          profile = profileData;
        }
      }

      setAuthState({
        user,
        profile,
        session,
        isAuthenticated: !!user,
        isLoading: false
      });
    } catch (error) {
      console.error('Error handling auth change:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // ログイン成功時は handleAuthChange で処理される
        return { success: true };
      }

      return { success: false, error: 'ログインに失敗しました' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'ログイン中にエラーが発生しました' };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const register = async (userData: {
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
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // ユーザー登録
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            company_name: userData.company_name,
            position: userData.position,
            phone_number: userData.phone_number
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // プロフィールテーブルにユーザー情報を挿入
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: userData.full_name,
            company_name: userData.company_name,
            position: userData.position,
            phone_number: userData.phone_number,
            email: userData.email,
            role: userData.role || 'general_user',
            plan: userData.plan || 'Free',
            department_id: userData.department_id,
            invited_by: userData.invited_by,
            status: 'active'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // プロフィール作成に失敗してもユーザー登録は成功とする
        }

        return { success: true, message: '登録が完了しました。メールを確認してください。' };
      }

      return { success: false, error: '登録に失敗しました' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: '登録中にエラーが発生しました' };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!authState.user) {
        return { success: false, error: 'ユーザーが認証されていません' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // ローカル状態を更新
      setAuthState(prev => ({
        ...prev,
        profile: data
      }));

      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'プロフィール更新中にエラーが発生しました' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'パスワードリセット用のメールを送信しました' };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'パスワードリセット中にエラーが発生しました' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'パスワードが更新されました' };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'パスワード更新中にエラーが発生しました' };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    updatePassword,
    userRole: authState.profile?.role || 'general_user',
    userPlan: authState.profile?.plan || 'Free',
    isOnboardingComplete: !!authState.profile
  };
}
