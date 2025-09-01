import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type Application = Tables<'applications'>;
type ApprovalLog = Tables<'approval_logs'>;
type Profile = Tables<'profiles'>;

interface Notification {
  id: string;
  type: 'application_status' | 'approval_required' | 'approval_completed' | 'system';
  title: string;
  message: string;
  applicationId?: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  markAllAsRead: () => Promise<{ success: boolean; error?: string }>;
  deleteNotification: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  refreshNotifications: () => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初期通知読み込み
    loadNotifications();

    // リアルタイム通知監視
    const applicationsSubscription = supabase
      .channel('applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        handleApplicationChange
      )
      .subscribe();

    const approvalLogsSubscription = supabase
      .channel('approval_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_logs'
        },
        handleApprovalLogChange
      )
      .subscribe();

    return () => {
      applicationsSubscription.unsubscribe();
      approvalLogsSubscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ローカルストレージから通知を読み込み（実際の実装ではデータベーステーブルを使用）
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('通知の読み込み中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationChange = async (payload: any) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'UPDATE' && newRecord && oldRecord) {
        // ステータス変更の通知
        if (newRecord.status !== oldRecord.status) {
          await createStatusChangeNotification(newRecord, oldRecord.status, newRecord.status);
        }

        // 承認者変更の通知
        if (newRecord.current_approver_id !== oldRecord.current_approver_id && newRecord.current_approver_id) {
          await createApprovalRequiredNotification(newRecord);
        }
      }
    } catch (err) {
      console.error('Error handling application change:', err);
    }
  };

  const handleApprovalLogChange = async (payload: any) => {
    try {
      const { eventType, new: newRecord } = payload;

      if (eventType === 'INSERT' && newRecord) {
        // 承認アクション完了の通知
        await createApprovalCompletedNotification(newRecord);
      }
    } catch (err) {
      console.error('Error handling approval log change:', err);
    }
  };

  const createStatusChangeNotification = async (
    application: Application, 
    oldStatus: string, 
    newStatus: string
  ) => {
    const statusMessages = {
      'draft': '下書き',
      'pending': '承認待ち',
      'submitted': '提出済み',
      'approved': '承認済み',
      'rejected': '却下',
      'returned': '返却',
      'on_hold': '保留'
    };

    const notification: Omit<Notification, 'id' | 'createdAt'> = {
      type: 'application_status',
      title: `申請ステータスが変更されました`,
      message: `申請「${application.title}」のステータスが「${statusMessages[oldStatus as keyof typeof statusMessages] || oldStatus}」から「${statusMessages[newStatus as keyof typeof statusMessages] || newStatus}」に変更されました。`,
      applicationId: application.id,
      isRead: false,
      priority: newStatus === 'approved' || newStatus === 'rejected' ? 'high' : 'medium',
      actionUrl: `/applications/${application.id}`
    };

    await createNotification(notification);
  };

  const createApprovalRequiredNotification = async (application: Application) => {
    const notification: Omit<Notification, 'id' | 'createdAt'> = {
      type: 'approval_required',
      title: '承認が必要です',
      message: `申請「${application.title}」の承認が必要です。`,
      applicationId: application.id,
      isRead: false,
      priority: 'high',
      actionUrl: `/applications/${application.id}/approve`
    };

    await createNotification(notification);
  };

  const createApprovalCompletedNotification = async (approvalLog: ApprovalLog) => {
    // 申請情報を取得
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('id', approvalLog.application_id)
      .single();

    if (!application) return;

    const actionMessages = {
      'approve': '承認',
      'reject': '却下',
      'return': '返却',
      'hold': '保留'
    };

    const notification: Omit<Notification, 'id' | 'createdAt'> = {
      type: 'approval_completed',
      title: '承認処理が完了しました',
      message: `申請「${application.title}」が${actionMessages[approvalLog.action as keyof typeof actionMessages] || approvalLog.action}されました。`,
      applicationId: application.id,
      isRead: false,
      priority: approvalLog.action === 'approve' ? 'medium' : 'high',
      actionUrl: `/applications/${application.id}`
    };

    await createNotification(notification);
  };

  const createNotification = async (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      // ローカル状態を更新
      setNotifications(prev => [newNotification, ...prev]);
      if (!newNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }

      // ローカルストレージに保存
      const updatedNotifications = [newNotification, ...notifications];
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

      return { success: true };
    } catch (err) {
      console.error('Error creating notification:', err);
      return { success: false, error: '通知の作成に失敗しました' };
    }
  };

  const markAsRead = async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      // 未読数を更新
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);

      // ローカルストレージを更新
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

      return { success: true };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: '通知の更新に失敗しました' };
    }
  };

  const markAllAsRead = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);

      // ローカルストレージを更新
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

      return { success: true };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false, error: '通知の一括更新に失敗しました' };
    }
  };

  const deleteNotification = async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => prev - 1);
      }

      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);

      // ローカルストレージを更新
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

      return { success: true };
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false, error: '通知の削除に失敗しました' };
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    createNotification
  };
}
