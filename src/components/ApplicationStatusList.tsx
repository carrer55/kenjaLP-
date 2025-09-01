import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useApplications } from '../hooks/useApplications';
import { useAuth } from '../contexts/AuthContext';

interface ApplicationStatusListProps {
  onNavigate: (view: string) => void;
  onShowDetail: (type: 'business-trip' | 'expense', id: string) => void;
}

interface Application {
  id: string;
  type: string;
  title: string;
  total_amount: number | null;
  created_at: string;
  status: string;
  current_approver_name?: string;
  updated_at: string;
}

function ApplicationStatusList({ onNavigate, onShowDetail }: ApplicationStatusListProps) {
  const { user } = useAuth();
  const { applications, isLoading, error, getUserApplications } = useApplications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;
    
    try {
      await getUserApplications(user.id);
    } catch (error) {
      console.error('申請一覧の読み込みエラー:', error);
    }
  };

  useEffect(() => {
    if (applications) {
      let filtered = [...applications];
      
      // 検索フィルター
      if (searchTerm) {
        filtered = filtered.filter(app => 
          app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // ステータスフィルター
      if (statusFilter !== 'all') {
        filtered = filtered.filter(app => app.status === statusFilter);
      }
      
      setFilteredApplications(filtered);
    }
  }, [applications, searchTerm, statusFilter]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'returned':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-slate-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'business_trip_request': return '出張申請';
      case 'expense_request': return '経費申請';
      default: return '不明';
    }
  };

  const handleApplicationClick = (app: Application) => {
    const type = app.type === 'business_trip_request' ? 'business-trip' : 'expense';
    onShowDetail(type, app.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
        
        <div className="flex h-screen relative">
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="application-status" />
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
        
        <div className="flex h-screen relative">
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="application-status" />
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
            
            <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
              <div className="max-w-7xl mx-auto">
                <div className="text-center py-20 text-red-600">
                  エラーが発生しました: {error}
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
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="application-status" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="application-status" />
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
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">申請状況一覧</h1>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="申請タイトルや種別で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent backdrop-blur-xl"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-slate-600" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white/50 border border-white/40 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent backdrop-blur-xl"
                      >
                        <option value="all">全てのステータス</option>
                        <option value="draft">下書き</option>
                        <option value="pending">承認待ち</option>
                        <option value="returned">差し戻し</option>
                        <option value="approved">承認済み</option>
                        <option value="rejected">却下</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applications List */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl border border-white/30 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/30 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">申請日</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">種別</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">タイトル</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">金額</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">ステータス</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">承認者</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">最終更新</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                            申請がありません
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => (
                          <tr 
                            key={app.id} 
                            className="hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => handleApplicationClick(app)}
                          >
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
                              ¥{app.total_amount?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusIcon(app.status)}
                                <span className="ml-1">{getStatusLabel(app.status)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {app.current_approver_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {new Date(app.updated_at).toLocaleDateString('ja-JP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplicationClick(app);
                                  }}
                                  className="text-navy-600 hover:text-navy-900 p-1 rounded hover:bg-white/20"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {app.status === 'draft' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // 編集機能は後で実装
                                    }}
                                    className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-white/20"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
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

export default ApplicationStatusList;