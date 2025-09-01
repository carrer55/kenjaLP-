import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '../types/supabase';

type Application = Tables<'applications'>;
type BusinessTripDetail = Tables<'business_trip_details'>;
type ExpenseDetail = Tables<'expense_details'>;
type ExpenseItem = Tables<'expense_items'>;
type Attachment = Tables<'attachments'>;

interface ApplicationWithDetails extends Application {
  business_trip_details?: BusinessTripDetail;
  expense_details?: ExpenseDetail;
  expense_items?: ExpenseItem[];
  attachments?: Attachment[];
}

interface CreateApplicationData {
  type: 'business_trip' | 'expense';
  title: string;
  priority: string;
  department_id: string;
  business_trip_details?: {
    start_date: string;
    end_date: string;
    location: string;
    purpose: string;
    visit_target: string;
    companions?: string;
    estimated_transportation?: number;
    estimated_accommodation?: number;
    estimated_daily_allowance?: number;
    action_and_results?: string;
  };
  expense_details?: {
    total_expenses: number;
    daily_allowance_received?: number;
    expense_items: {
      amount: number;
      category: string;
      item_date: string;
      description?: string;
      store_name?: string;
      receipt_url?: string;
    }[];
  };
}

interface UseApplicationsReturn {
  applications: ApplicationWithDetails[];
  isLoading: boolean;
  error: string | null;
  createApplication: (data: CreateApplicationData) => Promise<{ success: boolean; error?: string; applicationId?: string }>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<{ success: boolean; error?: string }>;
  deleteApplication: (id: string) => Promise<{ success: boolean; error?: string }>;
  getApplication: (id: string) => Promise<{ success: boolean; data?: ApplicationWithDetails; error?: string }>;
  getUserApplications: (userId: string) => Promise<void>;
  refreshApplications: () => Promise<void>;
}

export function useApplications(): UseApplicationsReturn {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createApplication = async (data: CreateApplicationData): Promise<{ success: boolean; error?: string; applicationId?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. 申請の基本情報を作成
      const applicationData: TablesInsert<'applications'> = {
        type: data.type,
        title: data.title,
        priority: data.priority,
        department_id: data.department_id,
        status: 'draft',
        applicant_id: (await supabase.auth.getUser()).data.user?.id || '',
        submitted_at: null,
        total_amount: null
      };

      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (applicationError || !application) {
        return { success: false, error: applicationError?.message || '申請の作成に失敗しました' };
      }

      // 2. 申請種別に応じた詳細情報を作成
      if (data.type === 'business_trip' && data.business_trip_details) {
        const { error: tripError } = await supabase
          .from('business_trip_details')
          .insert({
            application_id: application.id,
            ...data.business_trip_details
          });

        if (tripError) {
          console.error('Error creating business trip details:', tripError);
          // 詳細作成に失敗しても申請は成功とする
        }
      } else if (data.type === 'expense' && data.expense_details) {
        // 経費詳細を作成
        const { data: expenseDetail, error: expenseError } = await supabase
          .from('expense_details')
          .insert({
            application_id: application.id,
            total_expenses: data.expense_details.total_expenses,
            daily_allowance_received: data.expense_details.daily_allowance_received
          })
          .select()
          .single();

        if (expenseError) {
          console.error('Error creating expense details:', expenseError);
        } else if (expenseDetail && data.expense_details.expense_items) {
          // 経費項目を作成
          const expenseItems = data.expense_details.expense_items.map(item => ({
            expense_detail_id: expenseDetail.id,
            ...item
          }));

          const { error: itemsError } = await supabase
            .from('expense_items')
            .insert(expenseItems);

          if (itemsError) {
            console.error('Error creating expense items:', itemsError);
          }
        }
      }

      // 3. 申請リストを更新
      await refreshApplications();

      return { success: true, applicationId: application.id };
    } catch (err) {
      console.error('Error creating application:', err);
      return { success: false, error: '申請作成中にエラーが発生しました' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      // ローカル状態を更新
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, ...updates } : app
      ));

      return { success: true };
    } catch (err) {
      console.error('Error updating application:', err);
      return { success: false, error: '申請更新中にエラーが発生しました' };
    }
  };

  const deleteApplication = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      // ローカル状態から削除
      setApplications(prev => prev.filter(app => app.id !== id));

      return { success: true };
    } catch (err) {
      console.error('Error deleting application:', err);
      return { success: false, error: '申請削除中にエラーが発生しました' };
    }
  };

  const getApplication = async (id: string): Promise<{ success: boolean; data?: ApplicationWithDetails; error?: string }> => {
    try {
      // 申請の基本情報を取得
      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (applicationError || !application) {
        return { success: false, error: applicationError?.message || '申請が見つかりません' };
      }

      const result: ApplicationWithDetails = { ...application };

      // 申請種別に応じた詳細情報を取得
      if (application.type === 'business_trip') {
        const { data: tripDetails } = await supabase
          .from('business_trip_details')
          .select('*')
          .eq('application_id', id)
          .single();

        if (tripDetails) {
          result.business_trip_details = tripDetails;
        }
      } else if (application.type === 'expense') {
        const { data: expenseDetails } = await supabase
          .from('expense_details')
          .select('*')
          .eq('application_id', id)
          .single();

        if (expenseDetails) {
          result.expense_details = expenseDetails;

          // 経費項目を取得
          const { data: expenseItems } = await supabase
            .from('expense_items')
            .select('*')
            .eq('expense_detail_id', expenseDetails.id);

          if (expenseItems) {
            result.expense_items = expenseItems;
          }
        }
      }

      // 添付ファイルを取得
      const { data: attachments } = await supabase
        .from('attachments')
        .select('*')
        .eq('application_id', id);

      if (attachments) {
        result.attachments = attachments;
      }

      return { success: true, data: result };
    } catch (err) {
      console.error('Error getting application:', err);
      return { success: false, error: '申請取得中にエラーが発生しました' };
    }
  };

  const getUserApplications = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      // 各申請の詳細情報を取得
      const applicationsWithDetails = await Promise.all(
        (data || []).map(async (application) => {
          const { data: details } = await getApplication(application.id);
          return details?.data || application;
        })
      );

      setApplications(applicationsWithDetails);
    } catch (err) {
      console.error('Error fetching user applications:', err);
      setError('申請の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await getUserApplications(user.id);
    }
  };

  return {
    applications,
    isLoading,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    getApplication,
    getUserApplications,
    refreshApplications
  };
}
