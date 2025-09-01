import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Statistics {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalAmount: number;
  averageProcessingTime: number;
  applicationsByType: {
    business_trip: number;
    expense: number;
  };
  applicationsByStatus: {
    draft: number;
    pending: number;
    submitted: number;
    approved: number;
    rejected: number;
    returned: number;
    on_hold: number;
  };
  monthlyApplications: {
    month: string;
    count: number;
    amount: number;
  }[];
}

interface UseStatisticsReturn {
  statistics: Statistics | null;
  isLoading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
  getUserStatistics: (userId: string) => Promise<void>;
  getDepartmentStatistics: (departmentId: string) => Promise<void>;
}

export function useStatistics(): UseStatisticsReturn {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stats = await calculateStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error refreshing statistics:', err);
      setError('統計データの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatistics = async (): Promise<Statistics> => {
    // 基本統計を取得
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('*');

    if (appsError) {
      throw new Error(appsError.message);
    }

    const apps = applications || [];

    // 申請種別別の集計
    const applicationsByType = {
      business_trip: apps.filter(app => app.type === 'business_trip').length,
      expense: apps.filter(app => app.type === 'expense').length
    };

    // ステータス別の集計
    const applicationsByStatus = {
      draft: apps.filter(app => app.status === 'draft').length,
      pending: apps.filter(app => app.status === 'pending').length,
      submitted: apps.filter(app => app.status === 'submitted').length,
      approved: apps.filter(app => app.status === 'approved').length,
      rejected: apps.filter(app => app.status === 'rejected').length,
      returned: apps.filter(app => app.status === 'returned').length,
      on_hold: apps.filter(app => app.status === 'on_hold').length
    };

    // 総申請数
    const totalApplications = apps.length;

    // 保留中の申請数
    const pendingApplications = apps.filter(app => 
      ['pending', 'submitted'].includes(app.status)
    ).length;

    // 承認済み申請数
    const approvedApplications = apps.filter(app => 
      app.status === 'approved'
    ).length;

    // 却下申請数
    const rejectedApplications = apps.filter(app => 
      app.status === 'rejected'
    ).length;

    // 総金額
    const totalAmount = apps.reduce((sum, app) => 
      sum + (app.total_amount || 0), 0
    );

    // 平均処理時間（日数）
    const processingTimes = apps
      .filter(app => app.approved_at && app.submitted_at)
      .map(app => {
        const submitted = new Date(app.submitted_at!);
        const approved = new Date(app.approved_at!);
        return Math.ceil((approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
      });

    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    // 月別申請数と金額
    const monthlyData = new Map<string, { count: number; amount: number }>();
    
    apps.forEach(app => {
      const month = new Date(app.created_at).toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || { count: 0, amount: 0 };
      monthlyData.set(month, {
        count: current.count + 1,
        amount: current.amount + (app.total_amount || 0)
      });
    });

    const monthlyApplications = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalAmount,
      averageProcessingTime,
      applicationsByType,
      applicationsByStatus,
      monthlyApplications
    };
  };

  const getUserStatistics = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ユーザー固有の統計を取得
      const { data: userApps, error: userAppsError } = await supabase
        .from('applications')
        .select('*')
        .eq('applicant_id', userId);

      if (userAppsError) {
        throw new Error(userAppsError.message);
      }

      const apps = userApps || [];

      const userStats: Statistics = {
        totalApplications: apps.length,
        pendingApplications: apps.filter(app => 
          ['pending', 'submitted'].includes(app.status)
        ).length,
        approvedApplications: apps.filter(app => 
          app.status === 'approved'
        ).length,
        rejectedApplications: apps.filter(app => 
          app.status === 'rejected'
        ).length,
        totalAmount: apps.reduce((sum, app) => 
          sum + (app.total_amount || 0), 0
        ),
        averageProcessingTime: 0, // ユーザー固有の処理時間は計算が複雑なため省略
        applicationsByType: {
          business_trip: apps.filter(app => app.type === 'business_trip').length,
          expense: apps.filter(app => app.type === 'expense').length
        },
        applicationsByStatus: {
          draft: apps.filter(app => app.status === 'draft').length,
          pending: apps.filter(app => app.status === 'pending').length,
          submitted: apps.filter(app => app.status === 'submitted').length,
          approved: apps.filter(app => app.status === 'approved').length,
          rejected: apps.filter(app => app.status === 'rejected').length,
          returned: apps.filter(app => app.status === 'returned').length,
          on_hold: apps.filter(app => app.status === 'on_hold').length
        },
        monthlyApplications: []
      };

      setStatistics(userStats);
    } catch (err) {
      console.error('Error fetching user statistics:', err);
      setError('ユーザー統計の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const getDepartmentStatistics = async (departmentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 部署固有の統計を取得
      const { data: deptApps, error: deptAppsError } = await supabase
        .from('applications')
        .select('*')
        .eq('department_id', departmentId);

      if (deptAppsError) {
        throw new Error(deptAppsError.message);
      }

      const apps = deptApps || [];

      const deptStats: Statistics = {
        totalApplications: apps.length,
        pendingApplications: apps.filter(app => 
          ['pending', 'submitted'].includes(app.status)
        ).length,
        approvedApplications: apps.filter(app => 
          app.status === 'approved'
        ).length,
        rejectedApplications: apps.filter(app => 
          app.status === 'rejected'
        ).length,
        totalAmount: apps.reduce((sum, app) => 
          sum + (app.total_amount || 0), 0
        ),
        averageProcessingTime: 0,
        applicationsByType: {
          business_trip: apps.filter(app => app.type === 'business_trip').length,
          expense: apps.filter(app => app.type === 'expense').length
        },
        applicationsByStatus: {
          draft: apps.filter(app => app.status === 'draft').length,
          pending: apps.filter(app => app.status === 'pending').length,
          submitted: apps.filter(app => app.status === 'submitted').length,
          approved: apps.filter(app => app.status === 'approved').length,
          rejected: apps.filter(app => app.status === 'rejected').length,
          returned: apps.filter(app => app.status === 'returned').length,
          on_hold: apps.filter(app => app.status === 'on_hold').length
        },
        monthlyApplications: []
      };

      setStatistics(deptStats);
    } catch (err) {
      console.error('Error fetching department statistics:', err);
      setError('部署統計の取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    statistics,
    isLoading,
    error,
    refreshStatistics,
    getUserStatistics,
    getDepartmentStatistics
  };
}
