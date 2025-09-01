import { supabase } from './supabase';

export interface OCRResult {
  store: string;
  date: string;
  amount: number;
  confidence: number;
  category?: string;
  description?: string;
}

export interface OCRProcessingOptions {
  language?: 'ja' | 'en';
  enhance?: boolean;
  autoCategorize?: boolean;
}

// OCR処理のメイン関数
export async function processReceiptOCR(
  file: File,
  options: OCRProcessingOptions = {}
): Promise<OCRResult> {
  try {
    // ファイルの検証
    if (!isValidReceiptFile(file)) {
      throw new Error('サポートされていないファイル形式です');
    }

    // 実際のOCR処理（外部APIを使用）
    const ocrResult = await callOCRAPI(file, options);
    
    // 結果の後処理
    const processedResult = await postProcessOCRResult(ocrResult, options);
    
    return processedResult;
  } catch (error) {
    console.error('OCR処理エラー:', error);
    throw new Error('OCR処理に失敗しました');
  }
}

// ファイル形式の検証
function isValidReceiptFile(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];
  
  return validTypes.includes(file.type);
}

// 外部OCR APIの呼び出し（例：Google Cloud Vision API、Azure Computer Vision等）
async function callOCRAPI(file: File, options: OCRProcessingOptions): Promise<any> {
  // 実際の実装では、選択したOCRサービスに合わせて実装
  // ここではモック実装を提供
  
  // ファイルをBase64エンコード
  const base64Data = await fileToBase64(file);
  
  // モックOCR処理（実際の実装では外部APIを呼び出し）
  return await mockOCRProcessing(base64Data, options);
}

// ファイルをBase64エンコード
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// モックOCR処理（実際の実装では削除）
async function mockOCRProcessing(base64Data: string, options: OCRProcessingOptions): Promise<any> {
  // 実際の実装では、ここで外部OCR APIを呼び出し
  // 例：Google Cloud Vision API
  /*
  const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GOOGLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        image: {
          content: base64Data
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    })
  });
  
  return await response.json();
  */
  
  // モックデータを返す
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
  
  return {
    text: 'セブンイレブン 新宿店\n2024-01-15\nコーヒー 150円\n合計: 150円',
    confidence: 0.95
  };
}

// OCR結果の後処理
async function postProcessOCRResult(rawResult: any, options: OCRProcessingOptions): Promise<OCRResult> {
  // テキストから情報を抽出
  const extractedInfo = extractReceiptInfo(rawResult.text || '');
  
  // カテゴリの自動分類
  if (options.autoCategorize) {
    extractedInfo.category = autoCategorizeExpense(extractedInfo.store);
  }
  
  return {
    store: extractedInfo.store,
    date: extractedInfo.date,
    amount: extractedInfo.amount,
    confidence: rawResult.confidence || 0.8,
    category: extractedInfo.category,
    description: extractedInfo.description
  };
}

// レシートテキストから情報を抽出
function extractReceiptInfo(text: string): {
  store: string;
  date: string;
  amount: number;
  category?: string;
  description?: string;
} {
  const lines = text.split('\n').filter(line => line.trim());
  
  let store = '';
  let date = '';
  let amount = 0;
  let description = '';
  
  // 店舗名の抽出（最初の行または「店」「支店」を含む行）
  for (const line of lines) {
    if (line.includes('店') || line.includes('支店') || line.includes('株式会社') || line.includes('有限会社')) {
      store = line.trim();
      break;
    }
  }
  if (!store && lines.length > 0) {
    store = lines[0].trim();
  }
  
  // 日付の抽出（YYYY-MM-DD形式または日本語形式）
  const datePatterns = [
    /\d{4}-\d{2}-\d{2}/,
    /\d{4}\/\d{2}\/\d{2}/,
    /\d{4}年\d{1,2}月\d{1,2}日/
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }
    if (date) break;
  }
  
  // 金額の抽出（「合計」「総計」「計」の後の数字）
  const amountPatterns = [
    /合計[：:]\s*(\d+)/,
    /総計[：:]\s*(\d+)/,
    /計[：:]\s*(\d+)/,
    /(\d+)円/
  ];
  
  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        amount = parseInt(match[1] || match[0]);
        break;
      }
    }
    if (amount) break;
  }
  
  // 説明の抽出（金額以外の行から）
  const descriptionLines = lines.filter(line => 
    !line.includes('合計') && 
    !line.includes('総計') && 
    !line.includes('計') &&
    !line.match(/\d+円/) &&
    line.trim() !== store &&
    line.trim() !== date
  );
  
  description = descriptionLines.join(' ');
  
  return { store, date, amount, description };
}

// 経費カテゴリの自動分類
function autoCategorizeExpense(storeName: string): string {
  const storeNameLower = storeName.toLowerCase();
  
  // 交通費
  if (storeNameLower.includes('jr') || 
      storeNameLower.includes('タクシー') || 
      storeNameLower.includes('電車') || 
      storeNameLower.includes('新幹線') || 
      storeNameLower.includes('バス') ||
      storeNameLower.includes('地下鉄') ||
      storeNameLower.includes('モノレール')) {
    return '旅費交通費';
  }
  
  // 宿泊費
  if (storeNameLower.includes('ホテル') || 
      storeNameLower.includes('宿泊') || 
      storeNameLower.includes('旅館') ||
      storeNameLower.includes('inn') ||
      storeNameLower.includes('hotel')) {
    return '旅費交通費';
  }
  
  // 接待交際費
  if (storeNameLower.includes('レストラン') || 
      storeNameLower.includes('居酒屋') || 
      storeNameLower.includes('カフェ') || 
      storeNameLower.includes('料理') ||
      storeNameLower.includes('焼肉') ||
      storeNameLower.includes('寿司') ||
      storeNameLower.includes('ラーメン')) {
    return '接待交際費';
  }
  
  // 通信費
  if (storeNameLower.includes('docomo') || 
      storeNameLower.includes('au') || 
      storeNameLower.includes('softbank') || 
      storeNameLower.includes('通信') ||
      storeNameLower.includes('電話') ||
      storeNameLower.includes('携帯')) {
    return '通信費';
  }
  
  // 消耗品費
  if (storeNameLower.includes('文具') || 
      storeNameLower.includes('オフィス') || 
      storeNameLower.includes('用品') ||
      storeNameLower.includes('100円') ||
      storeNameLower.includes('ダイソー') ||
      storeNameLower.includes('セリア')) {
    return '消耗品費';
  }
  
  // 広告宣伝費
  if (storeNameLower.includes('広告') || 
      storeNameLower.includes('宣伝') || 
      storeNameLower.includes('印刷') ||
      storeNameLower.includes('デザイン') ||
      storeNameLower.includes('制作')) {
    return '広告宣伝費';
  }
  
  // 福利厚生費
  if (storeNameLower.includes('健康') || 
      storeNameLower.includes('福利') || 
      storeNameLower.includes('保険') ||
      storeNameLower.includes('医療') ||
      storeNameLower.includes('薬局')) {
    return '福利厚生費';
  }
  
  // ガソリン代
  if (storeNameLower.includes('ガソリン') || 
      storeNameLower.includes('スタンド') || 
      storeNameLower.includes('eneos') ||
      storeNameLower.includes('出光') ||
      storeNameLower.includes('コスモ')) {
    return '旅費交通費';
  }
  
  // コンビニ
  if (storeNameLower.includes('セブン') || 
      storeNameLower.includes('ファミマ') || 
      storeNameLower.includes('ローソン') ||
      storeNameLower.includes('コンビニ')) {
    return '雑費（その他）';
  }
  
  return '雑費（その他）';
}

// OCR結果の信頼度を評価
export function evaluateOCRConfidence(result: OCRResult): number {
  let confidence = 0.8; // ベース信頼度
  
  // 店舗名の長さで評価
  if (result.store.length > 5) confidence += 0.1;
  if (result.store.length < 2) confidence -= 0.2;
  
  // 日付の妥当性で評価
  const date = new Date(result.date);
  if (!isNaN(date.getTime())) confidence += 0.1;
  else confidence -= 0.3;
  
  // 金額の妥当性で評価
  if (result.amount > 0 && result.amount < 1000000) confidence += 0.1;
  else confidence -= 0.2;
  
  // カテゴリの自動分類が成功した場合
  if (result.category) confidence += 0.1;
  
  return Math.max(0.1, Math.min(1.0, confidence));
}

// 複数のOCR結果を比較して最適な結果を選択
export function selectBestOCRResult(results: OCRResult[]): OCRResult | null {
  if (results.length === 0) return null;
  
  // 信頼度でソート
  const sortedResults = results.sort((a, b) => b.confidence - a.confidence);
  
  // 最高信頼度の結果を返す
  return sortedResults[0];
}

// OCR処理の進捗を追跡
export interface OCRProgress {
  stage: 'uploading' | 'processing' | 'extracting' | 'categorizing' | 'completed';
  progress: number; // 0-100
  message: string;
}

export function createOCRProgressTracker(): {
  onProgress: (progress: OCRProgress) => void;
  trackProgress: (stage: OCRProgress['stage'], progress: number, message: string) => void;
} {
  let onProgressCallback: ((progress: OCRProgress) => void) | null = null;
  
  const onProgress = (callback: (progress: OCRProgress) => void) => {
    onProgressCallback = callback;
  };
  
  const trackProgress = (stage: OCRProgress['stage'], progress: number, message: string) => {
    if (onProgressCallback) {
      onProgressCallback({ stage, progress, message });
    }
  };
  
  return { onProgress, trackProgress };
}
