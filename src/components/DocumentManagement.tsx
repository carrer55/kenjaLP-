import React, { useState, useEffect } from 'react';
import { FileText, Calendar, MapPin, Building, Users, CheckCircle, Clock, AlertTriangle, Plus, Eye, Edit, Trash2, AlertCircle, Download } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useDocumentManagement } from '../hooks/useDocumentManagement';
import { useAuth } from '../contexts/AuthContext';

interface DocumentManagementProps {
  onNavigate: (view: string, documentType?: string) => void;
}

interface BusinessTrip {
  id: string;
  title: string;
  purpose: string;
  applicant: string;
  department: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  amount: number;
}

interface Expense {
  id: string;
  title: string;
  applicant: string;
  department: string;
  submittedDate: string;
  status: string;
  amount: number;
  category: string;
}

function DocumentManagement({ onNavigate }: DocumentManagementProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBusinessTripCompleteModal, setShowBusinessTripCompleteModal] = useState(false);
  const [showExpenseCompleteModal, setShowExpenseCompleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const { user } = useAuth();
  const { 
    documents, 
    isLoading, 
    error, 
    searchDocuments, 
    deleteDocument, 
    refreshDocuments 
  } = useDocumentManagement();

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    await searchDocuments({
      searchTerm: searchTerm || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined
    });
  };

  useEffect(() => {
    loadDocuments();
  }, [searchTerm, categoryFilter, statusFilter]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLaterAction = () => {
    setShowBusinessTripCompleteModal(false);
    setShowExpenseCompleteModal(false);
  };

  const handleDocumentAction = (action: string, document: any) => {
    setSelectedDocument(document);
    if (action === 'view') {
      onNavigate('document-preview', document.id);
    } else if (action === 'edit') {
      onNavigate('document-editor', document.id);
    } else if (action === 'delete') {
      if (confirm('この文書を削除してもよろしいですか？')) {
        deleteDocument(document.id);
      }
    }
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'receipt': return '領収書';
      case 'document': return '文書';
      case 'other': return 'その他';
      default: return category;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-slate-600">文書データを読み込み中...</p>
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
              onClick={refreshDocuments}
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
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="document-management" />
        </div>

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="document-management" />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">文書管理</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={() => onNavigate('document-creation', 'business-trip')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>出張報告書作成</span>
                  </button>
                  <button
                    onClick={() => onNavigate('document-creation', 'expense')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-900 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>経費精算書作成</span>
                  </button>
                </div>
              </div>

              {/* フィルター */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 border border-white/30 shadow-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 検索 */}
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="ファイル名、説明で検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    />
                  </div>

                  {/* カテゴリフィルター */}
                  <div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    >
                      <option value="all">全てのカテゴリ</option>
                      <option value="receipt">領収書</option>
                      <option value="document">文書</option>
                      <option value="other">その他</option>
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
                </div>
              </div>

              {/* 文書一覧 */}
              <div className="grid gap-6">
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">文書がありません</p>
                    <p className="text-slate-400">新規作成またはアップロードで文書を追加してください</p>
                  </div>
                ) : (
                  documents.map((document) => (
                    <div key={document.id} className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-slate-800">
                              {document.file_name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.application?.status || 'draft')}`}>
                              {getStatusLabel(document.application?.status || 'draft')}
                            </span>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {getCategoryLabel(document.category || 'other')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">申請者:</span> {document.uploaded_by_profile?.full_name || '不明'}
                            </div>
                                                         <div>
                               <span className="font-medium">部署:</span> {document.application?.department_id || '不明'}
                             </div>
                                                         <div>
                               <span className="font-medium">ファイルサイズ:</span> {formatFileSize(document.file_size || 0)}
                             </div>
                            <div>
                              <span className="font-medium">ファイルタイプ:</span> {document.file_type}
                            </div>
                            <div>
                              <span className="font-medium">アップロード日:</span> {new Date(document.created_at).toLocaleDateString('ja-JP')}
                            </div>
                                                         {/* 説明フィールドは現在サポートされていません */}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDocumentAction('view', document)}
                            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200"
                            title="表示"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDocumentAction('edit', document)}
                            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200"
                            title="編集"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDocumentAction('delete', document)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="削除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center space-x-4">
                          <span>作成日: {new Date(document.created_at).toLocaleDateString('ja-JP')}</span>
                                                     <span>更新日: {new Date(document.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="flex items-center space-x-1 px-3 py-1 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200">
                            <Download className="w-4 h-4" />
                            <span>ダウンロード</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 出張完了モーダル */}
      {showBusinessTripCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">出張完了</h3>
            <p className="text-slate-600 mb-6">出張が完了しました。報告書の作成をお勧めします。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleLaterAction}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                後で
              </button>
              <button
                onClick={() => {
                  setShowBusinessTripCompleteModal(false);
                  onNavigate('document-creation', 'business-trip');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                報告書作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 経費完了モーダル */}
      {showExpenseCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">経費精算完了</h3>
            <p className="text-slate-600 mb-6">経費精算が完了しました。精算書の作成をお勧めします。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleLaterAction}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                後で
              </button>
              <button
                onClick={() => {
                  setShowExpenseCompleteModal(false);
                  onNavigate('document-creation', 'expense');
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                精算書作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentManagement;