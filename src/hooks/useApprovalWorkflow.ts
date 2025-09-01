import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '../types/supabase';

type Application = Tables<'applications'>;
type ApprovalLog = Tables<'approval_logs'>;
type Profile = Tables<'profiles'>;

interface ApprovalAction {
  applicationId: string;
  action: 'approve' | 'reject' | 'return' | 'hold';
  comment?: string;
  nextApproverId?: string;
}

interface ApprovalWorkflowData {
  application: Application;
  currentApprover: Profile | null;
  approvalHistory: ApprovalLog[];
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  canHold: boolean;
}

interface UseApprovalWorkflowReturn {
  pendingApprovals: ApprovalWorkflowData[];
  approvalHistory: ApprovalLog[];
  isLoading: boolean;
  error: string | null;
  submitApproval: (action: ApprovalAction) => Promise<{ success: boolean; error?: string }>;
  getPendingApprovals: (approverId: string) => Promise<void>;
  getApprovalHistory: (applicationId: string) => Promise<void>;
  refreshApprovals: () => Promise<void>;
}

export function useApprovalWorkflow(): UseApprovalWorkflowReturn {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalWorkflowData[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitApproval = async (action: ApprovalAction): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'ユーザーが認証されていません' };
      }

      // 申請の現在のステータスを取得
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', action.applicationId)
        .single();

      if (appError || !application) {
        return { success: false, error: '申請が見つかりません' };
      }

      // 承認ログを作成
      const approvalLog: TablesInsert<'approval_logs'> = {
        application_id: action.applicationId,
        approver_id: user.id,
        action: action.action,
        comment: action.comment || null,
        previous_status: application.status,
        new_status: getNewStatus(application.status, action.action)
      };

      const { error: logError } = await supabase
        .from('approval_logs')
        .insert(approvalLog);

      if (logError) {
        return { success: false, error: logError.message };
      }

      // 申請のステータスを更新
      const updateData: Partial<Application> = {
        status: approvalLog.new_status,
        updated_at: new Date().toISOString()
      };

      // 承認の場合、承認日時を設定
      if (action.action === 'approve') {
        updateData.approved_at = new Date().toISOString();
        updateData.current_approver_id = null;
      } else if (action.action === 'reject') {
        updateData.current_approver_id = null;
      } else if (action.action === 'return') {
        updateData.current_approver_id = application.applicant_id; // 申請者に返却
      } else if (action.action === 'hold') {
        updateData.current_approver_id = action.nextApproverId || null;
      }

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', action.applicationId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // 承認履歴を更新
      await getApprovalHistory(action.applicationId);

      return { success: true };
    } catch (err) {
      console.error('Error submitting approval:', err);
      return { success: false, error: '承認処理中にエラーが発生しました' };
    } finally {
      setIsLoading(false);
    }
  };

  const getNewStatus = (currentStatus: string, action: string): string => {
    switch (action) {
      case 'approve':
        return 'approved';
      case 'reject':
        return 'rejected';
      case 'return':
        return 'returned';
      case 'hold':
        return 'on_hold';
      default:
        return currentStatus;
    }
  };

  const getPendingApprovals = async (approverId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 承認待ちの申請を取得
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('current_approver_id', approverId)
        .in('status', ['pending', 'submitted'])
        .order('created_at', { ascending: false });

      if (appsError) {
        setError(appsError.message);
        return;
      }

      // 各申請の承認者情報と履歴を取得
      const approvalsWithDetails = await Promise.all(
        (applications || []).map(async (app) => {
          // 承認者情報を取得
          const { data: approver } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', approverId)
            .single();

          // 承認履歴を取得
          const { data: history } = await supabase
            .from('approval_logs')
            .select('*')
            .eq('application_id', app.id)
            .order('created_at', { ascending: true });

          return {
            application: app,
            currentApprover: approver,
            approvalHistory: history || [],
            canApprove: true,
            canReject: true,
            canReturn: true,
            canHold: true
          };
        })
      );

      setPendingApprovals(approvalsWithDetails);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError('承認待ち申請の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const getApprovalHistory = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('approval_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching approval history:', error);
        return;
      }

      setApprovalHistory(data || []);
    } catch (err) {
      console.error('Error fetching approval history:', err);
    }
  };

  const refreshApprovals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await getPendingApprovals(user.id);
    }
  };

  return {
    pendingApprovals,
    approvalHistory,
    isLoading,
    error,
    submitApproval,
    getPendingApprovals,
    getApprovalHistory,
    refreshApprovals
  };
}
