import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type Profile = Tables<'profiles'>;
type Department = Tables<'departments'>;
type Company = Tables<'companies'>;

interface UserProfile {
  profile: Profile | null;
  department: Department | null;
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(): UserProfile {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初期プロフィール読み込み
    loadUserProfile();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setDepartment(null);
          setCompany(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // プロフィール情報を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('プロフィールの取得に失敗しました');
        setIsLoading(false);
        return;
      }

      setProfile(profileData);

      // 部署情報を取得
      if (profileData.department_id) {
        const { data: departmentData, error: departmentError } = await supabase
          .from('departments')
          .select('*')
          .eq('id', profileData.department_id)
          .single();

        if (!departmentError && departmentData) {
          setDepartment(departmentData);

          // 会社情報を取得
          if (departmentData.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', departmentData.company_id)
              .single();

            if (!companyError && companyData) {
              setCompany(companyData);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('プロフィールの読み込み中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!profile) {
        return { success: false, error: 'プロフィールが読み込まれていません' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      setProfile(data);
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: 'プロフィール更新中にエラーが発生しました' };
    }
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  return {
    profile,
    department,
    company,
    isLoading,
    error,
    updateProfile,
    refreshProfile
  };
}
