import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, History, Upload, Download, FileText, AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTravelRegulations } from '../hooks/useTravelRegulations';
import { useAuth } from '../contexts/AuthContext';

interface TravelRegulationManagementProps {
  onNavigate: (view: string) => void;
}

interface Regulation {
  id: string;
  companyName: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'draft' | 'archived';
  domesticAllowance: {
    executive: number;
    manager: number;
    general: number;
  };
  overseasAllowance: {
    executive: number;
    manager: number;
    general: number;
  };
}

function TravelRegulationManagement({ onNavigate }: TravelRegulationManagementProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { 
    regulations, 
    isLoading, 
    error, 
    deleteRegulation, 
    refreshRegulations 
  } = useTravelRegulations();

  useEffect(() => {
    if (user) {
      refreshRegulations();
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const filteredRegulations = regulations.filter(regulation =>
    (regulation.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (regulation.version || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (regulation.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(null);
    const result = await deleteRegulation(id);
    if (result.success) {
      alert('旅費規程が削除されました');
    } else {
      alert(`削除に失敗しました: ${result.error}`);
    }
  };

  const handleEdit = (id: string) => {
    // 編集機能は規程作成画面で実装
    localStorage.setItem('editingRegulationId', id);
    onNavigate('travel-regulation-creation');
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // PDFアップロード処理（実装予定）
      console.log('PDFファイルが選択されました:', file.name);
      setShowUploadModal(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '有効';
      case 'draft': return '下書き';
      case 'archived': return 'アーカイブ';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
            <p className="text-slate-600">旅費規程を読み込み中...</p>
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
              onClick={refreshRegulations}
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
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="travel-regulation-management" />
        </div>

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="travel-regulation-management" />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
          
          <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">出張規定管理</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-lg font-medium hover:from-slate-700 hover:to-slate-900 transition-all duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    <span>PDFアップロード</span>
                  </button>
                  <button
                    onClick={() => onNavigate('travel-regulation-creation')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-navy-700 to-navy-900 text-white rounded-lg font-medium hover:from-navy-800 hover:to-navy-950 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新規作成</span>
                  </button>
                </div>
              </div>

              {/* 検索バー */}
              <div className="backdrop-blur-xl bg-white/20 rounded-xl p-4 border border-white/30 shadow-xl mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="会社名、バージョン、規程名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 規程一覧 */}
              <div className="grid gap-6">
                {filteredRegulations.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">旅費規程がありません</p>
                    <p className="text-slate-400">新規作成またはPDFアップロードで規程を追加してください</p>
                  </div>
                ) : (
                  filteredRegulations.map((regulation) => (
                    <div key={regulation.id} className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30 shadow-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                                                       <h3 className="text-xl font-semibold text-slate-800">
                             {regulation.version || '無題の規程'}
                           </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(regulation.status)}`}>
                              {getStatusLabel(regulation.status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">会社:</span> {regulation.company?.name || '不明'}
                            </div>
                            <div>
                              <span className="font-medium">部署:</span> {regulation.department?.name || '不明'}
                            </div>
                            <div>
                              <span className="font-medium">バージョン:</span> {regulation.version || '不明'}
                            </div>
                                                         <div>
                               <span className="font-medium">施行日:</span> {regulation.established_date ? new Date(regulation.established_date).toLocaleDateString('ja-JP') : '不明'}
                             </div>
                             <div>
                               <span className="font-medium">距離閾値:</span> {regulation.distance_threshold}km
                             </div>
                             <div>
                               <span className="font-medium">準備費:</span> {regulation.use_preparation_fee ? 'あり' : 'なし'}
                             </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(regulation.id)}
                            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(regulation.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center space-x-4">
                          <span>作成日: {new Date(regulation.created_at).toLocaleDateString('ja-JP')}</span>
                          <span>更新日: {new Date(regulation.updated_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="flex items-center space-x-1 px-3 py-1 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-lg transition-all duration-200">
                            <History className="w-4 h-4" />
                            <span>履歴</span>
                          </button>
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

      {/* PDFアップロードモーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">PDFファイルをアップロード</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">出張規程のPDFファイルを選択してください</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-block px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                ファイルを選択
              </label>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">削除の確認</h3>
            <p className="text-slate-600 mb-6">この旅費規程を削除してもよろしいですか？この操作は取り消せません。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelRegulationManagement;