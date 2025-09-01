import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type Application = Tables<'applications'>;
type Profile = Tables<'profiles'>;
type Department = Tables<'departments'>;
type Company = Tables<'companies'>;
type BusinessTripDetail = Tables<'business_trip_details'>;
type ExpenseDetail = Tables<'expense_details'>;
type ExpenseItem = Tables<'expense_items'>;
type Attachment = Tables<'attachments'>;

export interface AdminApplication extends Application {
  applicant_profile?: Profile;
  department?: Department;
  company?: Company;
  business_trip_details?: BusinessTripDetail;
  expense_details?: ExpenseDetail;
  expense_items?: ExpenseItem[];
  attachments?: Attachment[];
}

export interface AdminStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalAmount: number;
  applicationsByDepartment: { [key: string]: number };
  applicationsByStatus: { [key: string]: number };
  averageProcessingTime: number;
}

export interface UseAdminManagementReturn {
  applications: AdminApplication[];
  isLoading: boolean;
  error: string | null;
  stats: AdminStats | null;
  searchApplications: (filters: {
    searchTerm?: string;
    departmentFilter?: string;
    statusFilter?: string;
    dateRange?: { start: string; end: string };
    category?: string;
  }) => Promise<void>;
  getApplicationById: (id: string) => Promise<AdminApplication | null>;
  updateApplicationStatus: (id: string, status: string, comment?: string) => Promise<{ success: boolean; error?: string }>;
  deleteApplication: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
}

export function useAdminManagement(): UseAdminManagementReturn {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    loadAllApplications();
  }, []);

  const loadAllApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          applicant_profile:profiles!applications_applicant_id_fkey(*),
          department:departments!applications_department_id_fkey(*),
          company:companies!applications_company_id_fkey(*),
          business_trip_details(*),
          expense_details(*),
          expense_items(*),
          attachments(*)
        `)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        throw new Error(`申請データの取得に失敗しました: ${applicationsError.message}`);
      }

      setApplications(applicationsData || []);
      calculateStats(applicationsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('申請データの読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (apps: AdminApplication[]) => {
    const totalApplications = apps.length;
    const pendingApplications = apps.filter(app => app.status === 'pending').length;
    const approvedApplications = apps.filter(app => app.status === 'approved').length;
    const rejectedApplications = apps.filter(app => app.status === 'rejected').length;
    
    const totalAmount = apps.reduce((sum, app) => {
      return sum + (app.total_amount || 0);
    }, 0);

    const applicationsByDepartment: { [key: string]: number } = {};
    const applicationsByStatus: { [key: string]: number } = {};

    apps.forEach(app => {
      const deptName = app.department?.name || '不明';
      applicationsByDepartment[deptName] = (applicationsByDepartment[deptName] || 0) + 1;
      
      applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
    });

    // 平均処理時間の計算（承認済み・却下済みの申請のみ）
    const processedApps = apps.filter(app => 
      app.status === 'approved' || app.status === 'rejected'
    );
    
    let averageProcessingTime = 0;
    if (processedApps.length > 0) {
      const totalTime = processedApps.reduce((sum, app) => {
        const created = new Date(app.created_at);
        const updated = new Date(app.updated_at);
        return sum + (updated.getTime() - created.getTime());
      }, 0);
      averageProcessingTime = totalTime / processedApps.length / (1000 * 60 * 60 * 24); // 日数
    }

    setStats({
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalAmount,
      applicationsByDepartment,
      applicationsByStatus,
      averageProcessingTime
    });
  };

  const searchApplications = async (filters: {
    searchTerm?: string;
    departmentFilter?: string;
    statusFilter?: string;
    dateRange?: { start: string; end: string };
    category?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('applications')
        .select(`
          *,
          applicant_profile:profiles!applications_applicant_id_fkey(*),
          department:departments!applications_department_id_fkey(*),
          company:companies!applications_company_id_fkey(*),
          business_trip_details(*),
          expense_details(*),
          expense_items(*),
          attachments(*)
        `);

      // 検索条件を適用
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,applicant_profile.full_name.ilike.%${filters.searchTerm}%`);
      }

      if (filters.departmentFilter && filters.departmentFilter !== 'all') {
        query = query.eq('department_id', filters.departmentFilter);
      }

      if (filters.statusFilter && filters.statusFilter !== 'all') {
        query = query.eq('status', filters.statusFilter);
      }

      if (filters.dateRange?.start && filters.dateRange?.end) {
        query = query.gte('created_at', filters.dateRange.start).lte('created_at', filters.dateRange.end);
      }

      if (filters.category) {
        query = query.eq('type', filters.category);
      }

      const { data: applicationsData, error: applicationsError } = await query
        .order('created_at', { ascending: false });

      if (applicationsError) {
        throw new Error(`申請データの検索に失敗しました: ${applicationsError.message}`);
      }

      setApplications(applicationsData || []);
      calculateStats(applicationsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('申請データの検索エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getApplicationById = async (id: string): Promise<AdminApplication | null> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          applicant_profile:profiles!applications_applicant_id_fkey(*),
          department:departments!applications_department_id_fkey(*),
          company:companies!applications_company_id_fkey(*),
          business_trip_details(*),
          expense_details(*),
          expense_items(*),
          attachments(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`申請データの取得に失敗しました: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('申請データ取得エラー:', err);
      return null;
    }
  };

  const updateApplicationStatus = async (id: string, status: string, comment?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('applications')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`申請ステータスの更新に失敗しました: ${error.message}`);
      }

      // 承認ログに記録
      if (comment) {
        const { error: logError } = await supabase
          .from('approval_logs')
          .insert({
            application_id: id,
            approver_id: (await supabase.auth.getUser()).data.user?.id || '',
            action: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated',
            comment,
            status_before: applications.find(app => app.id === id)?.status || '',
            status_after: status
          });

        if (logError) {
          console.warn('承認ログの記録に失敗しました:', logError);
        }
      }

      await loadAllApplications();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('申請ステータス更新エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteApplication = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      // 関連データを削除
      const { error: attachmentsError } = await supabase
        .from('attachments')
        .delete()
        .eq('application_id', id);

      if (attachmentsError) {
        console.warn('添付ファイルの削除に失敗しました:', attachmentsError);
      }

      const { error: expenseItemsError } = await supabase
        .from('expense_items')
        .delete()
        .eq('application_id', id);

      if (expenseItemsError) {
        console.warn('経費項目の削除に失敗しました:', expenseItemsError);
      }

      const { error: expenseDetailsError } = await supabase
        .from('expense_details')
        .delete()
        .eq('application_id', id);

      if (expenseDetailsError) {
        console.warn('経費詳細の削除に失敗しました:', expenseDetailsError);
      }

      const { error: businessTripDetailsError } = await supabase
        .from('business_trip_details')
        .delete()
        .eq('application_id', id);

      if (businessTripDetailsError) {
        console.warn('出張詳細の削除に失敗しました:', businessTripDetailsError);
      }

      const { error: approvalLogsError } = await supabase
        .from('approval_logs')
        .delete()
        .eq('application_id', id);

      if (approvalLogsError) {
        console.warn('承認ログの削除に失敗しました:', approvalLogsError);
      }

      // 申請を削除
      const { error: applicationError } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (applicationError) {
        throw new Error(`申請の削除に失敗しました: ${applicationError.message}`);
      }

      await loadAllApplications();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('申請削除エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const refreshData = async () => {
    await loadAllApplications();
  };

  return {
    applications,
    isLoading,
    error,
    stats,
    searchApplications,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication,
    refreshData
  };
}
