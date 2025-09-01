import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Calendar, User, Eye, Clock, CheckCircle, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAdminManagement } from '../hooks/useAdminManagement';
import { useAuth } from '../contexts/AuthContext';

interface AdminApplicationListProps {
  onNavigate: (view: string) => void;
}

interface Application {
  id: string;
  type: string;
  category: string;
  title: string;
  applicant: string;
  department: string;
  amount: number;
  submittedDate: string;
  status: string;
  approver: string;
  purpose?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  daysWaiting?: number;
}

function AdminApplicationList({ onNavigate }: AdminApplicationListProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { user } = useAuth();
  const { 
    applications, 
    isLoading, 
    error, 
    searchApplications, 
    refreshData 
  } = useAdminManagement();

  // ローカルストレージから選択されたカテゴリとステータスを取得
  const selectedCategory = localStorage.getItem('adminSelectedCategory') as 'application' | 'settlement' || 'application';
  const selectedStatus = localStorage.getItem('adminSelectedStatus') as 'pending' | 'approved' || 'pending';

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, selectedCategory, selectedStatus]);

  const loadApplications = async () => {
    await searchApplications({
      category: selectedCategory === 'application' ? 'business_trip' : 'expense',
      statusFilter: selectedStatus,
      searchTerm: searchTerm || undefined,
      departmentFilter: departmentFilter !== 'all' ? departmentFilter : undefined
    });
  };

  useEffect(() => {
    loadApplications();
  }, [searchTerm, departmentFilter, statusFilter]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '承認待ち';
      case 'approved': return '承認済み';
      case 'rejected': return '却下';
      case 'returned': return '差し戻し';
      case 'draft': return '下書き';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'business_trip' ? '出張' : '経費';
  };

  const getCategoryLabel = (category: string) => {
    return category === 'application' ? '申請' : '精算';
  };

  const getPageTitle = () => {
    const categoryLabel = getCategoryLabel(selectedCategory);
    const statusLabel = getStatusLabel(selectedStatus);
    return `${categoryLabel} - ${statusLabel}`;
  };

  const filteredApplications = applications.map(app => ({
    id: app.id,
    type: app.type,
    category: selectedCategory,
    title: app.title,
    applicant: app.applicant_profile?.full_name || '不明',
    department: app.department?.name || '不明',
    amount: app.total_amount || 0,
    submittedDate: app.created_at,
    status: app.status,
    approver: app.current_approver_id || '未設定',
         purpose: app.business_trip_details?.purpose || '経費申請',
     startDate: app.business_trip_details?.start_date,
     endDate: app.business_trip_details?.end_date,
     location: app.business_trip_details?.location,
    daysWaiting: app.days_waiting || 0
  }));

  const handleApplicationClick = (applicationId: string) => {
    localStorage.setItem('adminSelectedApplication', applicationId);
    onNavigate('admin-application-detail');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-slate-600">申請データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">エラーが発生しました</p>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>

      <div className="flex h-screen relative">
        <div className="hidden lg:block">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="admin-dashboard" />
        </div>

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

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onNavigate('admin-dashboard')}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>戻る</span>
                  </button>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">{getPageTitle()}</h1>
                </div>
              </div>

              {/* フィルター */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 border border-white/30 shadow-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* 検索 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="申請ID、タイトル、申請者で検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    />
                  </div>

                  {/* 部署フィルター */}
                  <div>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    >
                      <option value="all">全ての部署</option>
                      <option value="営業部">営業部</option>
                      <option value="総務部">総務部</option>
                      <option value="開発部">開発部</option>
                      <option value="企画部">企画部</option>
                      <option value="経理部">経理部</option>
                    </select>
                  </div>

                  {/* ステータスフィルター */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    >
                      <option value="all">全てのステータス</option>
                      <option value="pending">承認待ち</option>
                      <option value="approved">承認済み</option>
                      <option value="rejected">却下</option>
                      <option value="returned">差し戻し</option>
                      <option value="draft">下書き</option>
                    </select>
                  </div>

                  {/* カテゴリフィルター */}
                  <div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    >
                      <option value="all">全てのカテゴリ</option>
                      <option value="business_trip">出張</option>
                      <option value="expense">経費</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 申請一覧 */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/30 border-b border-white/30">
                      <tr>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">申請ID</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">タイプ</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">タイトル</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">申請者</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">部署</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">金額</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">提出日</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">ステータス</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">承認者</th>
                        <th className="text-left py-4 px-6 font-medium text-slate-700">待機日数</th>
                        <th className="text-center py-4 px-6 font-medium text-slate-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-12 text-slate-500">
                            {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' 
                              ? '検索条件に一致する申請が見つかりません' 
                              : '申請がありません'}
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((application) => (
                          <tr key={application.id} className="border-b border-white/20 hover:bg-white/20 transition-colors">
                            <td className="py-4 px-6 text-slate-800 font-mono text-sm">{application.id}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getTypeLabel(application.type)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-800 font-medium max-w-xs truncate" title={application.title}>
                              {application.title}
                            </td>
                            <td className="py-4 px-6 text-slate-700">{application.applicant}</td>
                            <td className="py-4 px-6 text-slate-700">{application.department}</td>
                            <td className="py-4 px-6 text-slate-700 font-medium">
                              ¥{application.amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-slate-600 text-sm">
                              {new Date(application.submittedDate).toLocaleDateString('ja-JP')}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {getStatusLabel(application.status)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700">{application.approver}</td>
                            <td className="py-4 px-6 text-slate-600 text-sm">
                              {application.daysWaiting > 0 ? (
                                <span className="inline-flex items-center space-x-1 text-orange-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{application.daysWaiting}日</span>
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleApplicationClick(application.id)}
                                  className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-colors"
                                  title="詳細表示"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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

export default AdminApplicationList;