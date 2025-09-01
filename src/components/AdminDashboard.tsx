import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, Eye, Edit, Trash2 } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useStatistics } from '../hooks/useStatistics';
import { useApplications } from '../hooks/useApplications';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

interface AdminStats {
  totalUsers: number;
  totalApplications: number;
  pendingApprovals: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  averageProcessingTime: number;
}

function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const { statistics, isLoading: statsLoading, error: statsError, refreshStatistics } = useStatistics();
  const { applications, isLoading: appsLoading, error: appsError, refreshApplications } = useApplications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalApplications: 0,
    pendingApprovals: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    averageProcessingTime: 0
  });

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      await Promise.all([
        refreshStatistics(),
        refreshApplications()
      ]);
    } catch (error) {
      console.error('管理者データの読み込みエラー:', error);
    }
  };

  useEffect(() => {
    if (statistics && applications) {
      // 管理者用の統計データを計算
      const pendingApps = applications.filter(app => app.status === 'pending');
      const approvedThisMonth = applications.filter(app => {
        if (app.status !== 'approved') return false;
        const approvedDate = new Date(app.updated_at);
        const now = new Date();
        return approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
      });
      const rejectedThisMonth = applications.filter(app => {
        if (app.status !== 'rejected') return false;
        const rejectedDate = new Date(app.updated_at);
        const now = new Date();
        return rejectedDate.getMonth() === now.getMonth() && rejectedDate.getFullYear() === now.getFullYear();
      });

      setAdminStats({
        totalUsers: 0, // ユーザー数は別途取得が必要
        totalApplications: statistics.totalApplications || 0,
        pendingApprovals: pendingApps.length,
        approvedThisMonth: approvedThisMonth.length,
        rejectedThisMonth: rejectedThisMonth.length,
        averageProcessingTime: statistics.averageProcessingTime || 0
      });
    }
  }, [statistics, applications]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-700 bg-emerald-100';
      case 'pending': return 'text-amber-700 bg-amber-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '承認済み';
      case 'pending': return '承認待ち';
      case 'rejected': return '却下';
      default: return '不明';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'business_trip_request': return '出張申請';
      case 'expense_request': return '経費申請';
      default: return '不明';
    }
  };

  if (statsLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
        
        <div className="flex h-screen relative">
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="admin-dashboard" />
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
            
            <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (statsError || appsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
        
        <div className="flex h-screen relative">
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="admin-dashboard" />
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
            
            <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
              <div className="max-w-7xl mx-auto">
                <div className="text-center py-20 text-red-600">
                  エラーが発生しました: {statsError || appsError}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="admin-dashboard" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="admin-dashboard" />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">管理者ダッシュボード</h1>
                </div>
                <button
                  onClick={loadAdminData}
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
                >
                  更新
                </button>
              </div>

              {/* Admin Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">総ユーザー数</p>
                      <p className="text-3xl font-bold text-slate-800">{adminStats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-navy-600" />
                  </div>
                </div>

                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">総申請数</p>
                      <p className="text-3xl font-bold text-slate-800">{adminStats.totalApplications.toLocaleString()}</p>
                    </div>
                    <FileText className="w-8 h-8 text-navy-600" />
                  </div>
                </div>

                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">承認待ち</p>
                      <p className="text-3xl font-bold text-amber-600">{adminStats.pendingApprovals.toLocaleString()}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                </div>

                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">今月承認</p>
                      <p className="text-3xl font-bold text-emerald-600">{adminStats.approvedThisMonth.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>

                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">今月却下</p>
                      <p className="text-3xl font-bold text-red-600">{adminStats.rejectedThisMonth.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">平均処理時間</p>
                      <p className="text-3xl font-bold text-slate-800">{adminStats.averageProcessingTime.toFixed(1)}日</p>
                    </div>
                    <Clock className="w-8 h-8 text-slate-600" />
                  </div>
                </div>
              </div>

              {/* Recent Applications Table */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/30">
                  <h2 className="text-xl font-semibold text-slate-800">最近の申請</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/30 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">申請日</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">種別</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">タイトル</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">申請者</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">ステータス</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                      {applications && applications.slice(0, 10).map((app) => (
                        <tr key={app.id} className="hover:bg-white/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {new Date(app.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {getTypeLabel(app.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {app.title}
                          </td>
                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                             {app.applicant_id || '不明'}
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)}
                              <span className="ml-1">{getStatusLabel(app.status)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => onNavigate('admin-application-detail')}
                                className="text-navy-600 hover:text-navy-900 p-1 rounded hover:bg-white/20"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onNavigate('admin-application-detail')}
                                className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-white/20"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;