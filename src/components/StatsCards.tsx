import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { useStatistics } from '../hooks/useStatistics';
import { useAuth } from '../contexts/AuthContext';

function StatsCards() {
  const [showEstimatedHistory, setShowEstimatedHistory] = useState(false);
  const [showActualHistory, setShowActualHistory] = useState(false);
  const { statistics, isLoading, error, refreshStatistics } = useStatistics();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      refreshStatistics();
    }
  }, [profile, refreshStatistics]);

  // 統計データがない場合のデフォルト値
  const currentMonthEstimated = statistics?.totalAmount || 0;
  const previousMonthEstimated = 0; // 前月データは別途取得が必要
  const estimatedApplicationCount = statistics?.totalApplications || 0;
  
  const currentMonthActual = statistics?.totalAmount || 0;
  const previousMonthActual = 0;
  const actualApplicationCount = statistics?.approvedApplications || 0;
  
  // 精算見込みの前月比計算
  const estimatedDifference = currentMonthEstimated - previousMonthEstimated;
  const estimatedPercentageChange = previousMonthEstimated > 0 
    ? ((estimatedDifference / previousMonthEstimated) * 100).toFixed(1)
    : '0.0';
  const isEstimatedIncrease = estimatedDifference > 0;

  // 精算合計の前月比計算
  const actualDifference = currentMonthActual - previousMonthActual;
  const actualPercentageChange = previousMonthActual > 0
    ? ((actualDifference / previousMonthActual) * 100).toFixed(1)
    : '0.0';
  const isActualIncrease = actualDifference > 0;

  // 月別履歴データを統計フックから取得
  const estimatedHistory = statistics?.monthlyApplications.map(item => ({
    month: `${item.month}月`,
    amount: item.amount,
    applications: item.count
  })) || [];

  const actualHistory = statistics?.monthlyApplications.map(item => ({
    month: `${item.month}月`,
    amount: item.amount,
    applications: item.count
  })) || [];

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="mb-6 lg:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 lg:p-8 border border-white/30 shadow-xl">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded mb-4"></div>
              <div className="h-12 bg-slate-200 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 lg:p-8 border border-white/30 shadow-xl">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded mb-4"></div>
              <div className="h-12 bg-slate-200 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className="mb-6 lg:mb-8">
        <div className="backdrop-blur-xl bg-red-50/20 rounded-xl p-6 lg:p-8 border border-red-200/30 shadow-xl">
          <div className="text-center">
            <p className="text-red-700 text-lg font-medium mb-2">統計データの取得に失敗しました</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={refreshStatistics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 lg:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今月の精算見込みカード */}
        <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 lg:p-8 border border-white/30 shadow-xl hover:shadow-2xl hover:bg-white/30 transition-all duration-300 group relative overflow-hidden">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-700 text-lg font-semibold">今月の精算見込み</h3>
              <div className="flex items-center space-x-2">
                {estimatedApplicationCount > 10 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : isEstimatedIncrease ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  estimatedApplicationCount > 10 ? 'text-emerald-600' : 
                  isEstimatedIncrease ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {isEstimatedIncrease ? '+' : ''}{estimatedPercentageChange}%
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-3xl lg:text-4xl font-bold mb-2 text-slate-900">
                ¥{currentMonthEstimated.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">
                前月: ¥{previousMonthEstimated.toLocaleString()} 
                <span className={`ml-2 ${isEstimatedIncrease ? 'text-emerald-600' : 'text-red-500'}`}>
                  ({isEstimatedIncrease ? '+' : ''}¥{Math.abs(estimatedDifference).toLocaleString()})
                </span>
              </p>
            </div>

            {/* 申請件数ゲージ（小さく） */}
            <div className="bg-white/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">申請件数</span>
                <span className={`text-lg font-bold ${
                  estimatedApplicationCount > 15 ? 'text-red-600' : 
                  estimatedApplicationCount > 10 ? 'text-amber-600' : 'text-slate-800'
                }`}>{estimatedApplicationCount}件</span>
              </div>
              
              {/* より小さな棒グラフゲージ */}
              <div className="flex items-end space-x-1 h-4">
                {Array.from({ length: Math.max(estimatedApplicationCount, 15) }, (_, index) => (
                  <div
                    key={index}
                    className={`flex-1 rounded-sm transition-all duration-300 max-w-[4px] ${
                      index < estimatedApplicationCount
                        ? estimatedApplicationCount > 15 
                          ? 'bg-gradient-to-t from-red-500 to-red-700 group-hover:from-red-600 group-hover:to-red-800'
                          : estimatedApplicationCount > 10
                          ? 'bg-gradient-to-t from-amber-500 to-amber-700 group-hover:from-amber-600 group-hover:to-amber-800'
                          : 'bg-gradient-to-t from-navy-600 to-navy-800 group-hover:from-navy-700 group-hover:to-navy-900'
                        : 'bg-slate-200/50'
                    }`}
                    style={{ 
                      height: index < estimatedApplicationCount ? `${Math.min(100, (index + 1) * 6)}%` : '6%',
                      maxHeight: '16px'
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0件</span>
                <span>15件+</span>
              </div>
            </div>
          </div>
        </div>

        {/* 今月の精算合計カード */}
        <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 lg:p-8 border border-white/30 shadow-xl hover:shadow-2xl hover:bg-white/30 transition-all duration-300 group relative overflow-hidden">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-700 text-lg font-semibold">今月の精算合計</h3>
              <div className="flex items-center space-x-2">
                {isActualIncrease ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isActualIncrease ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isActualIncrease ? '+' : ''}{actualPercentageChange}%
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-3xl lg:text-4xl font-bold mb-2 text-slate-900">
                ¥{currentMonthActual.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">
                前月: ¥{previousMonthActual.toLocaleString()} 
                <span className={`ml-2 ${isActualIncrease ? 'text-emerald-600' : 'text-red-500'}`}>
                  ({isActualIncrease ? '+' : ''}¥{Math.abs(actualDifference).toLocaleString()})
                </span>
              </p>
            </div>

            {/* 申請件数ゲージ（小さく） */}
            <div className="bg-white/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">申請件数</span>
                <span className={`text-lg font-bold ${
                  actualApplicationCount > 12 ? 'text-red-600' : 
                  actualApplicationCount > 8 ? 'text-amber-600' : 'text-slate-800'
                }`}>{actualApplicationCount}件</span>
              </div>
              
              {/* より小さな棒グラフゲージ */}
              <div className="flex items-end space-x-1 h-4">
                {Array.from({ length: Math.max(actualApplicationCount, 15) }, (_, index) => (
                  <div
                    key={index}
                    className={`flex-1 rounded-sm transition-all duration-300 max-w-[4px] ${
                      index < actualApplicationCount
                        ? actualApplicationCount > 12 
                          ? 'bg-gradient-to-t from-red-500 to-red-700 group-hover:from-red-600 group-hover:to-red-800'
                          : actualApplicationCount > 8
                          ? 'bg-gradient-to-t from-amber-500 to-amber-700 group-hover:from-amber-600 group-hover:to-amber-800'
                          : 'bg-gradient-to-t from-navy-600 to-navy-800 group-hover:from-navy-700 group-hover:to-navy-900'
                        : 'bg-slate-200/50'
                    }`}
                    style={{ 
                      height: index < actualApplicationCount ? `${Math.min(100, (index + 1) * 6)}%` : '6%',
                      maxHeight: '16px'
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0件</span>
                <span>15件+</span>
              </div>
            </div>

            {/* 過去の実績表示ボタン */}
            <button
              onClick={() => setShowActualHistory(!showActualHistory)}
              className="w-full flex items-center justify-center space-x-2 py-2 text-slate-600 hover:text-slate-800 text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>過去の実績を表示</span>
              {showActualHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* 過去実績の展開エリア */}
            {showActualHistory && (
              <div className="mt-4 bg-white/20 rounded-lg p-4 border border-white/30">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">過去5ヶ月の精算合計</h4>
                <div className="space-y-2">
                  {actualHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.month}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-800 font-medium">¥{item.amount.toLocaleString()}</span>
                        <span className="text-slate-500 text-xs">{item.applications}件</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;