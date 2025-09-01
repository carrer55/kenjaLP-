import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Clock, CheckCircle, XCircle, AlertTriangle, Edit } from 'lucide-react';
import { useApplications } from '../hooks/useApplications';
import { useAuth } from '../contexts/AuthContext';

interface RecentApplicationsProps {
  onShowDetail: (type: 'business-trip' | 'expense', id: string) => void;
  onNavigate: (view: string) => void;
}

function RecentApplications({ onShowDetail, onNavigate }: RecentApplicationsProps) {
  const { user } = useAuth();
  const { applications, isLoading, error, getUserApplications } = useApplications();
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadRecentApplications();
    }
  }, [user]);

  const loadRecentApplications = async () => {
    if (!user) return;
    
    try {
      await getUserApplications(user.id);
    } catch (error) {
      console.error('最近の申請の読み込みエラー:', error);
    }
  };

  useEffect(() => {
    if (applications && applications.length > 0) {
      // 最新の5件を取得し、適切な形式に変換
      const recent = applications
        .slice(0, 5)
        .map(app => ({
          id: app.id,
          date: new Date(app.created_at).toLocaleDateString('ja-JP'),
          type: app.type === 'business_trip_request' ? '出張申請' : '経費申請',
          applicant: app.applicant_name || '不明',
          amount: `¥${app.total_amount?.toLocaleString() || '0'}`,
          status: getStatusLabel(app.status),
          statusColor: getStatusColor(app.status),
          originalType: app.type
        }));
      setRecentApplications(recent);
    }
  }, [applications]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '承認済み';
      case 'pending': return '承認待ち';
      case 'returned': return '差し戻し';
      case 'rejected': return '却下';
      case 'draft': return '下書き';
      default: return '不明';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-700 bg-emerald-100';
      case 'pending': return 'text-amber-700 bg-amber-100';
      case 'returned': return 'text-orange-700 bg-orange-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      case 'draft': return 'text-slate-700 bg-slate-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'returned': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'draft': return <Edit className="w-4 h-4 text-slate-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleApplicationClick = (app: any) => {
    const type = app.originalType === 'business_trip_request' ? 'business-trip' : 'expense';
    onShowDetail(type, app.id);
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-slate-800 relative z-10">最近の申請</h2>
          <button 
            onClick={() => onNavigate('application-status')}
            className="text-slate-400 hover:text-slate-600 relative z-10"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-slate-800 relative z-10">最近の申請</h2>
          <button 
            onClick={() => onNavigate('application-status')}
            className="text-slate-400 hover:text-slate-600 relative z-10"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center py-8 text-red-600">
          エラーが発生しました: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 lg:p-6 border border-white/30 shadow-xl relative overflow-hidden">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-slate-800 relative z-10">最近の申請</h2>
        <button 
          onClick={() => onNavigate('application-status')}
          className="text-slate-400 hover:text-slate-600 relative z-10"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-hidden relative z-10">
        {recentApplications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            申請がありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2 lg:gap-4 text-xs font-medium text-slate-600 pb-2 border-b border-white/30 min-w-max">
                <span>日付</span>
                <span>種別</span>
                <span>申請者</span>
                <span>金額</span>
                <span>ステータス</span>
              </div>
              {recentApplications.map((app, index) => (
                <div 
                  key={app.id} 
                  className="grid grid-cols-5 gap-2 lg:gap-4 items-center py-3 hover:bg-white/20 rounded-lg px-2 transition-colors min-w-max cursor-pointer"
                  onClick={() => handleApplicationClick(app)}
                >
                  <span className="text-slate-700 text-sm">{app.date}</span>
                  <span className="text-slate-700 text-sm">{app.type}</span>
                  <span className="text-slate-700 text-sm">{app.applicant}</span>
                  <span className="text-slate-900 font-medium text-sm">{app.amount}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.statusColor} flex items-center gap-1`}>
                    {getStatusIcon(app.status)}
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentApplications;