# Supabase Storage 設定状況

## 概要
このドキュメントでは、賢者の精算システムで設定されているSupabase Storageの詳細と使用方法について説明します。

## 作成されたバケット

### 1. receipts バケット
**目的**: 領収書画像用のファイル保存

**設定**:
- **バケット名**: `receipts`
- **公開設定**: プライベート（認証が必要）
- **ファイルサイズ制限**: 10MB
- **許可されるファイルタイプ**:
  - `image/jpeg` (JPEG画像)
  - `image/png` (PNG画像)
  - `image/webp` (WebP画像)
  - `application/pdf` (PDF)

**用途**:
- 領収書の画像ファイル
- 経費申請時の添付ファイル
- 出張時の領収書

### 2. documents バケット
**目的**: その他の添付ファイル用

**設定**:
- **バケット名**: `documents`
- **公開設定**: プライベート（認証が必要）
- **ファイルサイズ制限**: 50MB
- **許可されるファイルタイプ**:
  - **文書**: PDF, Word, Excel, PowerPoint, テキスト
  - **画像**: JPEG, PNG, WebP, GIF
  - **Office文書**: DOC, DOCX, XLS, XLSX, PPT, PPTX

**用途**:
- 申請書類
- 報告書
- その他の添付ファイル

## RLSポリシー設定

### 基本アクセスポリシー

#### receipts バケット
1. **Users can upload receipts**: 認証済みユーザーがファイルをアップロード可能
2. **Users can view receipts**: 認証済みユーザーがファイルを参照可能
3. **Users can update own receipts**: ユーザーが自身のファイルを更新可能
4. **Users can delete own receipts**: ユーザーが自身のファイルを削除可能

#### documents バケット
1. **Users can upload documents**: 認証済みユーザーがファイルをアップロード可能
2. **Users can view documents**: 認証済みユーザーがファイルを参照可能
3. **Users can update own documents**: ユーザーが自身のファイルを更新可能
4. **Users can delete own documents**: ユーザーが自身のファイルを削除可能

### 高度なアクセスポリシー

#### 承認者向け
- **Approvers can view related receipts**: 関連する申請の領収書を閲覧可能
- **Approvers can view related documents**: 関連する申請の文書を閲覧可能

#### 部門管理者向け
- **Department admins can view department receipts**: 自身の部署の申請の領収書を閲覧可能
- **Department admins can view department documents**: 自身の部署の申請の文書を閲覧可能

#### 管理者向け
- **Admins can manage all receipts**: 全ての領収書を完全管理可能
- **Admins can manage all documents**: 全ての文書を完全管理可能

## ファイルパス構造

### receipts バケット
```
receipts/
├── {userId}/
│   ├── {applicationId}/
│   │   ├── {timestamp}_receipt1.jpg
│   │   └── {timestamp}_receipt2.pdf
│   └── {timestamp}_receipt.jpg
```

### documents バケット
```
documents/
├── {userId}/
│   ├── {applicationId}/
│   │   ├── {timestamp}_document1.pdf
│   │   └── {timestamp}_document2.docx
│   └── {timestamp}_document.pdf
```

## フロントエンド実装

### Storageユーティリティ (`src/lib/storage.ts`)
```typescript
import { 
  uploadFile, 
  uploadMultipleFiles, 
  deleteFile,
  validateFile 
} from '../lib/storage';

// ファイルのアップロード
const uploadedFile = await uploadFile(file, {
  bucket: 'receipts',
  userId: user.id,
  applicationId: application.id
});

// 複数ファイルのアップロード
const uploadedFiles = await uploadMultipleFiles(files, {
  bucket: 'documents',
  userId: user.id,
  applicationId: application.id
});
```

### useFileUpload フック (`src/hooks/useFileUpload.ts`)
```typescript
import { useFileUpload } from '../hooks/useFileUpload';

const { uploadFile, isUploading, error } = useFileUpload();

const handleUpload = async (file: File) => {
  try {
    const result = await uploadFile(file, {
      bucket: 'receipts',
      userId: user.id,
      applicationId: application.id
    });
    
    console.log('アップロード成功:', result);
  } catch (error) {
    console.error('アップロードエラー:', error);
  }
};
```

## セキュリティの特徴

### 1. 認証必須
- 全てのファイル操作で認証が必要
- 匿名ユーザーはアクセス不可

### 2. ユーザー分離
- ユーザーは自身のファイルのみアクセス可能
- フォルダ構造による自然な分離

### 3. ロールベースアクセス制御
- 一般ユーザー: 自身のファイルのみ
- 承認者: 関連する申請のファイル
- 部門管理者: 部署内のファイル
- 管理者: 全てのファイル

### 4. ファイルタイプ制限
- 各バケットで許可されるファイルタイプを制限
- セキュリティリスクの軽減

### 5. ファイルサイズ制限
- receipts: 10MB制限
- documents: 50MB制限
- ストレージ容量の適切な管理

## 使用方法

### 1. 領収書のアップロード
```typescript
// 領収書画像のアップロード
const receiptFile = await uploadFile(file, {
  bucket: 'receipts',
  userId: user.id,
  applicationId: expenseApplication.id
});
```

### 2. 文書のアップロード
```typescript
// 申請書類のアップロード
const documentFile = await uploadFile(file, {
  bucket: 'documents',
  userId: user.id,
  applicationId: application.id
});
```

### 3. ファイルの削除
```typescript
// ファイルの削除
await deleteFile(filePath, 'receipts');
```

### 4. ファイルの存在確認
```typescript
// ファイルの存在確認
const exists = await fileExists(filePath, 'documents');
```

## エラーハンドリング

### 一般的なエラー
1. **ファイルサイズ超過**: 設定された制限を超えるファイル
2. **ファイルタイプ不許可**: サポートされていないファイル形式
3. **認証エラー**: 未認証ユーザーのアクセス
4. **権限エラー**: アクセス権限のないファイル

### エラー処理の例
```typescript
try {
  const result = await uploadFile(file, options);
  // 成功時の処理
} catch (error) {
  if (error.message.includes('ファイルサイズが大きすぎます')) {
    // サイズエラーの処理
  } else if (error.message.includes('サポートされていないファイルタイプ')) {
    // タイプエラーの処理
  } else {
    // その他のエラー処理
  }
}
```

## パフォーマンス最適化

### 1. キャッシュ制御
- `cacheControl: '3600'` で1時間のキャッシュ
- 頻繁にアクセスされるファイルの高速化

### 2. バッチ処理
- 複数ファイルの一括アップロード
- ネットワークリクエストの削減

### 3. プログレス追跡
- アップロード進捗の表示
- ユーザーエクスペリエンスの向上

## 今後の拡張

### 1. 画像処理
- サムネイル生成
- 画像のリサイズ・圧縮
- OCR機能の統合

### 2. バックアップ
- ファイルの自動バックアップ
- バージョン管理
- 復旧機能

### 3. 監査ログ
- ファイルアクセスの記録
- 変更履歴の追跡
- セキュリティ監査

## 注意事項

1. **認証必須**: 全てのファイル操作で認証が必要
2. **権限チェック**: フロントエンドでも適切な権限チェックを実装
3. **エラーハンドリング**: アップロード・削除エラーの適切な処理
4. **ファイル検証**: アップロード前のファイル検証が重要
5. **ストレージ管理**: 定期的な不要ファイルの削除
6. **セキュリティ**: ファイルアクセスの適切な制御
