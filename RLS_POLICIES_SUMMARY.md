# Supabase RLS (Row Level Security) ポリシー設定状況

## 概要
このドキュメントでは、賢者の精算システムで設定されているRLSポリシーの詳細と使用方法について説明します。

## 設定済みテーブルとポリシー

### 1. profiles テーブル
**目的**: ユーザープロフィール情報の管理

**ポリシー**:
- **Users can view own profile**: ユーザーは自身のプロフィールを閲覧可能
- **Users can update own profile**: ユーザーは自身のプロフィールを更新可能
- **Admins can manage all profiles**: 管理者は全てのプロフィールを管理可能
- **Department admins can view department profiles**: 部門管理者は自身の部署内のプロフィールを閲覧可能
- **Department admins can update department profiles**: 部門管理者は自身の部署内のプロフィールを更新可能

**アクセス制御**:
- 一般ユーザー: 自身のプロフィールのみ閲覧・更新
- 部門管理者: 自身の部署内のプロフィールを閲覧・更新
- 管理者: 全てのプロフィールを完全管理

### 2. departments テーブル
**目的**: 部署情報の管理

**ポリシー**:
- **Authenticated users can view departments**: 認証済みユーザーは全ての部署を閲覧可能
- **Admins can manage departments**: 管理者は部署の作成・更新・削除が可能

**アクセス制御**:
- 一般ユーザー: 閲覧のみ
- 管理者: 完全管理

### 3. companies テーブル
**目的**: 会社情報の管理

**ポリシー**:
- **Authenticated users can view companies**: 認証済みユーザーは全ての会社を閲覧可能
- **Admins can manage companies**: 管理者は会社の作成・更新・削除が可能

**アクセス制御**:
- 一般ユーザー: 閲覧のみ
- 管理者: 完全管理

### 4. travel_regulations テーブル
**目的**: 出張旅費規程の管理

**ポリシー**:
- **Authenticated users can view travel regulations**: 認証済みユーザーは全ての規程を閲覧可能
- **Admins can manage travel regulations**: 管理者は規程の作成・更新・削除が可能

**アクセス制御**:
- 一般ユーザー: 閲覧のみ
- 管理者: 完全管理

### 5. positions_allowances テーブル
**目的**: 役職別手当の管理

**ポリシー**:
- **Authenticated users can view position allowances**: 認証済みユーザーは全ての手当を閲覧可能
- **Admins can manage position allowances**: 管理者は手当の作成・更新・削除が可能

**アクセス制御**:
- 一般ユーザー: 閲覧のみ
- 管理者: 完全管理

### 6. applications テーブル
**目的**: 申請情報の管理

**ポリシー**:
- **Users can view own applications**: ユーザーは自身の申請を閲覧可能
- **Users can create applications**: ユーザーは申請を作成可能
- **Users can update own applications**: ユーザーは自身の申請を更新可能（draft/returned状態のみ）
- **Approvers can view assigned applications**: 承認者は割り当てられた申請を閲覧可能
- **Approvers can update application status**: 承認者は申請のステータスを更新可能
- **Department admins can view department applications**: 部門管理者は自身の部署の申請を閲覧可能
- **Admins can manage all applications**: 管理者は全ての申請を完全管理

**アクセス制御**:
- 一般ユーザー: 自身の申請の作成・閲覧・更新（制限あり）
- 承認者: 割り当てられた申請の閲覧・ステータス更新
- 部門管理者: 自身の部署の申請を閲覧
- 管理者: 全ての申請を完全管理

### 7. business_trip_details テーブル
**目的**: 出張詳細情報の管理

**ポリシー**:
- **Users can view own business trip details**: ユーザーは自身の出張詳細を閲覧可能
- **Users can manage own business trip details**: ユーザーは自身の出張詳細を管理可能
- **Approvers and admins can view business trip details**: 承認者・管理者は関連する出張詳細を閲覧可能

**アクセス制御**:
- 一般ユーザー: 自身の出張詳細を完全管理
- 承認者・部門管理者・管理者: 関連する出張詳細を閲覧

### 8. expense_details テーブル
**目的**: 経費詳細情報の管理

**ポリシー**:
- **Users can view own expense details**: ユーザーは自身の経費詳細を閲覧可能
- **Users can manage own expense details**: ユーザーは自身の経費詳細を管理可能
- **Approvers and admins can view expense details**: 承認者・管理者は関連する経費詳細を閲覧可能

**アクセス制御**:
- 一般ユーザー: 自身の経費詳細を完全管理
- 承認者・部門管理者・管理者: 関連する経費詳細を閲覧

### 9. expense_items テーブル
**目的**: 経費項目の管理

**ポリシー**:
- **Users can view own expense items**: ユーザーは自身の経費項目を閲覧可能
- **Users can manage own expense items**: ユーザーは自身の経費項目を管理可能
- **Approvers and admins can view expense items**: 承認者・管理者は関連する経費項目を閲覧可能

**アクセス制御**:
- 一般ユーザー: 自身の経費項目を完全管理
- 承認者・部門管理者・管理者: 関連する経費項目を閲覧

### 10. attachments テーブル
**目的**: 添付ファイルの管理

**ポリシー**:
- **Users can view own attachments**: ユーザーは自身の添付ファイルを閲覧可能
- **Users can manage own attachments**: ユーザーは自身の添付ファイルを管理可能
- **Approvers and admins can view attachments**: 承認者・管理者は関連する添付ファイルを閲覧可能

**アクセス制御**:
- 一般ユーザー: 自身の添付ファイルを完全管理
- 承認者・部門管理者・管理者: 関連する添付ファイルを閲覧

### 11. approval_logs テーブル
**目的**: 承認ログの管理

**ポリシー**:
- **Users can view own application logs**: ユーザーは自身の申請のログを閲覧可能
- **Admins can manage all approval logs**: 管理者は全ての承認ログを完全管理
- **Approvers and admins can view approval logs**: 承認者・管理者は関連する承認ログを閲覧可能

**アクセス制御**:
- 一般ユーザー: 自身の申請のログを閲覧
- 承認者・部門管理者: 関連する承認ログを閲覧
- 管理者: 全ての承認ログを完全管理

## ユーザーロールと権限

### general_user (一般ユーザー)
- 自身のプロフィールの閲覧・更新
- 自身の申請の作成・閲覧・更新（制限あり）
- 関連する詳細情報の管理
- 添付ファイルの管理
- 承認ログの閲覧

### approver (承認者)
- 一般ユーザーの権限に加えて
- 割り当てられた申請の閲覧・ステータス更新
- 関連する詳細情報の閲覧
- 承認ログの作成・閲覧

### department_admin (部門管理者)
- 一般ユーザーの権限に加えて
- 自身の部署内のプロフィールの閲覧・更新
- 自身の部署の申請の閲覧
- 関連する詳細情報の閲覧
- 承認ログの閲覧

### admin (管理者)
- 全てのテーブルの完全管理権限
- ユーザーの作成・管理
- 部署・会社の管理
- 規程・手当の管理
- 全ての申請の管理
- 全てのログの管理

## セキュリティの特徴

### 1. データ分離
- ユーザーは自身のデータのみにアクセス可能
- 部署レベルでのデータ分離
- 承認者・管理者は必要最小限のデータにアクセス

### 2. 操作制限
- 申請の更新は特定のステータスでのみ可能
- 管理者以外は削除操作が制限
- 外部キー制約による整合性保証

### 3. 監査ログ
- 全ての承認アクションがログに記録
- 変更履歴の追跡が可能

## 使用方法

### フロントエンドでの実装
```typescript
import { supabase } from '../lib/supabase';

// ユーザーの申請を取得
const { data: applications, error } = await supabase
  .from('applications')
  .select('*')
  .eq('applicant_id', user.id);

// 承認者の申請を取得
const { data: pendingApprovals, error } = await supabase
  .from('applications')
  .select('*')
  .eq('current_approver_id', user.id);
```

### 管理者機能の実装
```typescript
// 管理者のみが実行可能
const { data: allProfiles, error } = await supabase
  .from('profiles')
  .select('*');
```

## 注意事項

1. **認証必須**: 全てのテーブルで認証が必要
2. **権限チェック**: フロントエンドでも適切な権限チェックを実装
3. **エラーハンドリング**: RLSによるアクセス拒否の適切な処理
4. **テスト**: 各ロールでのアクセス権限のテストが重要

## 今後の拡張

- より細かい権限設定
- 時間ベースのアクセス制御
- データ暗号化
- 監査ログの強化
