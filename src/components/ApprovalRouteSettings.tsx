import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Users, Building, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ApprovalRoute {
  id: string;
  name: string;
  description: string;
  department_id: string;
  department_name: string;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApprovalStep {
  id: string;
  step_number: number;
  approver_type: 'user' | 'role' | 'department_head';
  approver_id?: string;
  approver_name?: string;
  role_name?: string;
  department_id?: string;
  department_name?: string;
  min_amount?: number;
  max_amount?: number;
  is_required: boolean;
  can_delegate: boolean;
  auto_approve_if_same_user: boolean;
}

interface ApprovalRouteSettingsProps {
  onNavigate: (view: string) => void;
}

export default function ApprovalRouteSettings({ onNavigate }: ApprovalRouteSettingsProps) {
  const { user } = useAuth();
  const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; department_name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 編集モード
  const [editingRoute, setEditingRoute] = useState<ApprovalRoute | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 新規作成モード
  const [isCreating, setIsCreating] = useState(false);
  const [newRoute, setNewRoute] = useState<Partial<ApprovalRoute>>({
    name: '',
    description: '',
    department_id: '',
    steps: [],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 承認ルートの読み込み
      const { data: routes, error: routesError } = await supabase
        .from('approval_routes')
        .select(`
          *,
          departments!inner(name),
          approval_steps(*)
        `)
        .order('created_at', { ascending: false });
      
      if (routesError) throw routesError;
      
      // 部署の読み込み
      const { data: deps, error: depsError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (depsError) throw depsError;
      
      // ユーザーの読み込み
      const { data: usrs, error: usrsError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          departments!inner(name)
        `)
        .order('full_name');
      
      if (usrsError) throw usrsError;
      
      setApprovalRoutes(routes || []);
      setDepartments(deps || []);
      setUsers(usrs || []);
      
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      setError('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoute = () => {
    setIsCreating(true);
    setNewRoute({
      name: '',
      description: '',
      department_id: '',
      steps: [],
      is_active: true
    });
  };

  const handleSaveRoute = async () => {
    try {
      if (!newRoute.name || !newRoute.department_id) {
        alert('必須項目を入力してください');
        return;
      }

      // 承認ルートの作成
      const { data: route, error: routeError } = await supabase
        .from('approval_routes')
        .insert({
          name: newRoute.name,
          description: newRoute.description,
          department_id: newRoute.department_id,
          is_active: newRoute.is_active,
          created_by: user?.id
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // 承認ステップの作成
      if (newRoute.steps && newRoute.steps.length > 0) {
        const stepsWithRouteId = newRoute.steps.map((step, index) => ({
          ...step,
          approval_route_id: route.id,
          step_number: index + 1
        }));

        const { error: stepsError } = await supabase
          .from('approval_steps')
          .insert(stepsWithRouteId);

        if (stepsError) throw stepsError;
      }

      alert('承認ルートが作成されました');
      setIsCreating(false);
      loadData();
      
    } catch (error) {
      console.error('承認ルート作成エラー:', error);
      alert('承認ルートの作成に失敗しました');
    }
  };

  const handleEditRoute = (route: ApprovalRoute) => {
    setEditingRoute(route);
    setIsEditing(true);
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute) return;

    try {
      // 承認ルートの更新
      const { error: routeError } = await supabase
        .from('approval_routes')
        .update({
          name: editingRoute.name,
          description: editingRoute.description,
          is_active: editingRoute.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRoute.id);

      if (routeError) throw routeError;

      // 既存のステップを削除
      const { error: deleteError } = await supabase
        .from('approval_steps')
        .delete()
        .eq('approval_route_id', editingRoute.id);

      if (deleteError) throw deleteError;

      // 新しいステップを作成
      if (editingRoute.steps && editingRoute.steps.length > 0) {
        const stepsWithRouteId = editingRoute.steps.map((step, index) => ({
          ...step,
          approval_route_id: editingRoute.id,
          step_number: index + 1
        }));

        const { error: stepsError } = await supabase
          .from('approval_steps')
          .insert(stepsWithRouteId);

        if (stepsError) throw stepsError;
      }

      alert('承認ルートが更新されました');
      setIsEditing(false);
      setEditingRoute(null);
      loadData();
      
    } catch (error) {
      console.error('承認ルート更新エラー:', error);
      alert('承認ルートの更新に失敗しました');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('この承認ルートを削除しますか？')) return;

    try {
      // 承認ステップを削除
      const { error: stepsError } = await supabase
        .from('approval_steps')
        .delete()
        .eq('approval_route_id', routeId);

      if (stepsError) throw stepsError;

      // 承認ルートを削除
      const { error: routeError } = await supabase
        .from('approval_routes')
        .delete()
        .eq('id', routeId);

      if (routeError) throw routeError;

      alert('承認ルートが削除されました');
      loadData();
      
    } catch (error) {
      console.error('承認ルート削除エラー:', error);
      alert('承認ルートの削除に失敗しました');
    }
  };

  const addStep = (route: ApprovalRoute | Partial<ApprovalRoute>) => {
    const newStep: ApprovalStep = {
      id: Date.now().toString(),
      step_number: (route.steps?.length || 0) + 1,
      approver_type: 'user',
      is_required: true,
      can_delegate: false,
      auto_approve_if_same_user: false
    };

    if ('steps' in route && route.steps) {
      route.steps.push(newStep);
      if (isEditing && editingRoute) {
        setEditingRoute({ ...editingRoute });
      } else if (isCreating) {
        setNewRoute({ ...newRoute, steps: [...(newRoute.steps || []), newStep] });
      }
    }
  };

  const removeStep = (route: ApprovalRoute | Partial<ApprovalRoute>, stepId: string) => {
    if ('steps' in route && route.steps) {
      route.steps = route.steps.filter(step => step.id !== stepId);
      // ステップ番号を再設定
      route.steps.forEach((step, index) => {
        step.step_number = index + 1;
      });
      
      if (isEditing && editingRoute) {
        setEditingRoute({ ...editingRoute });
      } else if (isCreating) {
        setNewRoute({ ...newRoute, steps: route.steps });
      }
    }
  };

  const updateStep = (
    route: ApprovalRoute | Partial<ApprovalRoute>,
    stepId: string,
    field: keyof ApprovalStep,
    value: any
  ) => {
    if ('steps' in route && route.steps) {
      const step = route.steps.find(s => s.id === stepId);
      if (step) {
        (step as any)[field] = value;
        
        if (isEditing && editingRoute) {
          setEditingRoute({ ...editingRoute });
        } else if (isCreating) {
          setNewRoute({ ...newRoute, steps: route.steps });
        }
      }
    }
  };

  const getApproverDisplayName = (step: ApprovalStep): string => {
    switch (step.approver_type) {
      case 'user':
        return step.approver_name || 'ユーザー未選択';
      case 'role':
        return step.role_name || '役割未選択';
      case 'department_head':
        return step.department_name ? `${step.department_name}長` : '部署未選択';
      default:
        return '未設定';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">承認ルート設定</h1>
              <p className="text-slate-600">部署別の承認フローを設定・管理できます</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 bg-white/50 hover:bg-white/70 text-slate-700 rounded-lg transition-colors"
              >
                ダッシュボードに戻る
              </button>
              <button
                onClick={handleCreateRoute}
                className="px-6 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新規作成
              </button>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 承認ルート一覧 */}
        <div className="grid gap-6">
          {approvalRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden"
            >
              {/* ルートヘッダー */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-800">{route.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        route.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {route.is_active ? '有効' : '無効'}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-2">{route.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {route.department_name}
                      </span>
                      <span>{route.steps.length}ステップ</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 承認ステップ */}
              <div className="p-6">
                <h4 className="text-lg font-medium text-slate-800 mb-4">承認ステップ</h4>
                <div className="space-y-4">
                  {route.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-navy-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {step.step_number}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-700">
                            {getApproverDisplayName(step)}
                          </span>
                          {step.is_required && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              必須
                            </span>
                          )}
                          {step.can_delegate && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              委譲可能
                            </span>
                          )}
                        </div>
                        {step.min_amount && step.max_amount && (
                          <p className="text-sm text-slate-600">
                            金額範囲: ¥{step.min_amount.toLocaleString()} - ¥{step.max_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 新規作成モーダル */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-800">新規承認ルート作成</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ルート名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                      placeholder="例: 営業部承認ルート"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      部署 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newRoute.department_id}
                      onChange={(e) => setNewRoute({ ...newRoute, department_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                    >
                      <option value="">部署を選択</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                    rows={3}
                    placeholder="承認ルートの説明を入力してください"
                  />
                </div>

                {/* 承認ステップ */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-800">承認ステップ</h3>
                    <button
                      onClick={() => addStep(newRoute)}
                      className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      ステップ追加
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {newRoute.steps?.map((step, index) => (
                      <div
                        key={step.id}
                        className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-slate-700">ステップ {index + 1}</span>
                          <button
                            onClick={() => removeStep(newRoute, step.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              承認者タイプ
                            </label>
                            <select
                              value={step.approver_type}
                              onChange={(e) => updateStep(newRoute, step.id, 'approver_type', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                            >
                              <option value="user">特定ユーザー</option>
                              <option value="role">役割</option>
                              <option value="department_head">部署長</option>
                            </select>
                          </div>
                          
                          {step.approver_type === 'user' && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                承認者
                              </label>
                              <select
                                value={step.approver_id || ''}
                                onChange={(e) => updateStep(newRoute, step.id, 'approver_id', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                              >
                                <option value="">ユーザーを選択</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.full_name} ({user.department_name})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {step.approver_type === 'department_head' && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                対象部署
                              </label>
                              <select
                                value={step.department_id || ''}
                                onChange={(e) => updateStep(newRoute, step.id, 'department_id', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                              >
                                <option value="">部署を選択</option>
                                {departments.map(dept => (
                                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`required-${step.id}`}
                              checked={step.is_required}
                              onChange={(e) => updateStep(newRoute, step.id, 'is_required', e.target.checked)}
                              className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                            />
                            <label htmlFor={`required-${step.id}`} className="text-sm text-slate-700">
                              必須ステップ
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`delegate-${step.id}`}
                              checked={step.can_delegate}
                              onChange={(e) => updateStep(newRoute, step.id, 'can_delegate', e.target.checked)}
                              className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                            />
                            <label htmlFor={`delegate-${step.id}`} className="text-sm text-slate-700">
                              委譲可能
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`auto-${step.id}`}
                              checked={step.auto_approve_if_same_user}
                              onChange={(e) => updateStep(newRoute, step.id, 'auto_approve_if_same_user', e.target.checked)}
                              className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                            />
                            <label htmlFor={`auto-${step.id}`} className="text-sm text-slate-700">
                              同一ユーザー時自動承認
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveRoute}
                    className="px-6 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 編集モーダル */}
        {isEditing && editingRoute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-800">承認ルート編集</h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ルート名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingRoute.name}
                      onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      部署
                    </label>
                    <input
                      type="text"
                      value={editingRoute.department_name}
                      disabled
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={editingRoute.description}
                    onChange={(e) => setEditingRoute({ ...editingRoute, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                    rows={3}
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingRoute.is_active}
                        onChange={(e) => setEditingRoute({ ...editingRoute, is_active: e.target.checked })}
                        className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                      />
                      <span className="text-sm font-medium text-slate-700">有効</span>
                    </label>
                  </div>
                </div>

                {/* 承認ステップ */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-800">承認ステップ</h3>
                    <button
                      onClick={() => addStep(editingRoute)}
                      className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      ステップ追加
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {editingRoute.steps?.map((step, index) => (
                      <div
                        key={step.id}
                        className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-slate-700">ステップ {index + 1}</span>
                          <button
                            onClick={() => removeStep(editingRoute, step.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              承認者タイプ
                            </label>
                            <select
                              value={step.approver_type}
                              onChange={(e) => updateStep(editingRoute, step.id, 'approver_type', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                            >
                              <option value="user">特定ユーザー</option>
                              <option value="role">役割</option>
                              <option value="department_head">部署長</option>
                            </select>
                          </div>
                          
                          {step.approver_type === 'user' && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                承認者
                              </label>
                              <select
                                value={step.approver_id || ''}
                                onChange={(e) => updateStep(editingRoute, step.id, 'approver_id', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                              >
                                <option value="">ユーザーを選択</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.full_name} ({user.department_name})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {step.approver_type === 'department_head' && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                対象部署
                              </label>
                              <select
                                value={step.department_id || ''}
                                onChange={(e) => updateStep(editingRoute, step.id, 'department_id', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400"
                              >
                                <option value="">部署を選択</option>
                                {departments.map(dept => (
                                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-required-${step.id}`}
                              checked={step.is_required}
                              onChange={(e) => updateStep(editingRoute, step.id, 'is_required', e.target.checked)}
                              className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                            />
                            <label htmlFor={`edit-required-${step.id}`} className="text-sm text-slate-700">
                              必須ステップ
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-delegate-${step.id}`}
                              checked={step.can_delegate}
                              onChange={(e) => updateStep(editingRoute, step.id, 'can_delegate', e.target.checked)}
                              className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                            />
                            <label htmlFor={`edit-delegate-${step.id}`} className="text-sm text-slate-700">
                              委譲可能
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-auto-${step.id}`}
                              checked={step.auto_approve_if_same_user}
                              onChange={(e) => updateStep(editingRoute, step.id, 'auto_approve_if_same_user', e.target.checked)}
                              className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                            />
                            <label htmlFor={`edit-auto-${step.id}`} className="text-sm text-slate-700">
                              同一ユーザー時自動承認
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateRoute}
                    className="px-6 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    更新
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
