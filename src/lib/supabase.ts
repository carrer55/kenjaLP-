import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Supabase設定
const supabaseUrl = 'https://bjoxgogehtfibmsbdqmo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3hnb2dlaHRmaWJtc2JkcW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDU5MDYsImV4cCI6MjA3MjI4MTkwNn0.hEw7ePcRK1DgRhZB2k1Aefp7nWqa6antDemOww52lMY'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// 接続テスト関数
export const testSupabaseConnection = async () => {
  try {
    // より安全な接続テスト: auth.getSessionを使用
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Supabase認証エラー:', sessionError)
      return { success: false, message: `認証エラー: ${sessionError.message}` }
    }

    // データベース接続テスト: 空のクエリを実行
    const { error: dbError } = await supabase.rpc('ping').single()
    
    // ping関数が存在しない場合は正常（接続は成功している）
    if (dbError && dbError.code === 'PGRST202') {
      console.log('✅ Supabase接続成功: データベースに正常に接続されました')
      return { 
        success: true, 
        message: 'Supabase接続成功！データベースとAPIが正常に動作しています。',
        details: {
          url: supabaseUrl,
          session: sessionData.session ? 'ログイン中' : '未ログイン',
          timestamp: new Date().toISOString()
        }
      }
    }
    
    if (dbError) {
      console.error('❌ Supabaseデータベースエラー:', dbError)
      return { success: false, message: `データベースエラー: ${dbError.message}` }
    }

    console.log('✅ Supabase接続成功: 全ての機能が正常です')
    return { 
      success: true, 
      message: 'Supabase接続成功！全ての機能が正常に動作しています。',
      details: {
        url: supabaseUrl,
        session: sessionData.session ? 'ログイン中' : '未ログイン',
        timestamp: new Date().toISOString()
      }
    }
  } catch (err) {
    console.error('❌ Supabase接続エラー:', err)
    return { 
      success: false, 
      message: err instanceof Error ? err.message : '不明なエラーが発生しました' 
    }
  }
}
