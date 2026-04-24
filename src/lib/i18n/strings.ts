import { UiLang } from '@/utils/langTracker';

export interface UiStrings {
  followUp: Record<
    | 'destination'
    | 'startDate'
    | 'endDate'
    | 'totalPeople'
    | 'companions'
    | 'travelStyle'
    | 'flightDepartureTime',
    string
  >;
  tripTooLong: string;
  invalidProfile: string;
  generating: string;
  generationFailed: (msg: string) => string;
  genericError: (msg: string) => string;
  inputPlaceholder: string;
  planner: {
    header: string;
    greeting: string;
    updated: string;
    placeholder: string;
    errorPrefix: string;
    quickCommands: string[];
    languageChanged: string;
  };
}

const EN: UiStrings = {
  followUp: {
    destination: 'Where would you like to travel? 🌍',
    startDate: 'When does your trip start? (e.g. 2026-06-01)',
    endDate: 'When does it end? (max 15 days)',
    totalPeople: 'How many people are traveling?',
    companions:
      "Tell me about your travel companions — their ages, gender, and what they enjoy (e.g. '32F who loves food, 35M who prefers hiking')",
    travelStyle: "What's your travel style? (e.g. relaxed, adventure, foodie, luxury)",
    flightDepartureTime: 'Do you have a departure flight time? (e.g. 09:00, or skip)',
  },
  tripTooLong: "⚠️ That's more than 15 days! Please shorten your trip to a maximum of 15 days.",
  invalidProfile: 'AI did not return a valid profile. Please try again.',
  generating:
    '✨ Perfect! I have everything I need. Generating your personalized itinerary...\n\nThis may take 15-20 seconds.',
  generationFailed: (msg) => `❌ Generation failed: ${msg}. Please try again.`,
  genericError: (msg) => `❌ Error: ${msg}`,
  inputPlaceholder: 'Tell me about your trip...',
  planner: {
    header: 'Modify Itinerary',
    greeting: "Need to change your itinerary? Just tell me what you'd like to adjust! 💬",
    updated: '✅ Itinerary updated! Scroll up to see the changes.',
    placeholder: 'e.g. Add beach time on day 3',
    errorPrefix: '❌',
    quickCommands: [
      'Change lunch to local seafood',
      'Add a coffee break in the afternoon',
      'Make day 2 more relaxed',
      'Move dinner 1 hour later',
    ],
    languageChanged: '✅ Switched to English.',
  },
};

const KO: UiStrings = {
  followUp: {
    destination: '어디로 여행을 가고 싶으세요? 🌍',
    startDate: '여행 시작일은 언제인가요? (예: 2026-06-01)',
    endDate: '종료일은 언제인가요? (최대 15일)',
    totalPeople: '총 몇 명이 여행하시나요?',
    companions:
      '동행자에 대해 알려주세요 — 나이, 성별, 좋아하는 것 (예: "음식을 좋아하는 32세 여성, 등산을 선호하는 35세 남성")',
    travelStyle: '여행 스타일이 어떻게 되세요? (예: 여유롭게, 모험, 미식, 럭셔리)',
    flightDepartureTime: '출발 비행기 시간이 있나요? (예: 09:00, 없으면 건너뛰기)',
  },
  tripTooLong: '⚠️ 15일을 초과했어요! 최대 15일까지만 가능합니다.',
  invalidProfile: 'AI가 올바른 프로필을 반환하지 못했어요. 다시 시도해 주세요.',
  generating:
    '✨ 좋아요! 필요한 정보가 모두 모였어요. 맞춤 일정을 생성하고 있어요...\n\n약 15-20초 정도 걸려요.',
  generationFailed: (msg) => `❌ 생성 실패: ${msg}. 다시 시도해 주세요.`,
  genericError: (msg) => `❌ 오류: ${msg}`,
  inputPlaceholder: '여행에 대해 알려주세요...',
  planner: {
    header: '일정 수정',
    greeting: '일정을 바꾸고 싶으세요? 어떻게 조정할지 알려주세요! 💬',
    updated: '✅ 일정이 업데이트되었어요! 위로 스크롤해서 확인하세요.',
    placeholder: '예: 3일차에 해변 시간 추가',
    errorPrefix: '❌',
    quickCommands: [
      '점심을 현지 해산물로 변경',
      '오후에 커피 브레이크 추가',
      '2일차를 더 여유롭게',
      '저녁을 1시간 늦추기',
    ],
    languageChanged: '✅ 한국어로 변경했어요.',
  },
};

const JA: UiStrings = {
  followUp: {
    destination: 'どこへ旅行したいですか? 🌍',
    startDate: '出発日はいつですか? (例: 2026-06-01)',
    endDate: '終了日はいつですか? (最大15日)',
    totalPeople: '何名で旅行されますか?',
    companions:
      '同行者について教えてください — 年齢、性別、好みなど (例: 「食べるのが好きな32歳の女性、ハイキングが好きな35歳の男性」)',
    travelStyle: '旅行スタイルは? (例: のんびり、冒険、グルメ、ラグジュアリー)',
    flightDepartureTime: '出発便の時刻はありますか? (例: 09:00、なければスキップ)',
  },
  tripTooLong: '⚠️ 15日を超えています! 最大15日までにしてください。',
  invalidProfile: 'AIが有効なプロフィールを返しませんでした。もう一度お試しください。',
  generating:
    '✨ 完璧! 必要な情報が揃いました。あなた専用の旅程を生成しています...\n\n15〜20秒ほどかかります。',
  generationFailed: (msg) => `❌ 生成に失敗しました: ${msg}。もう一度お試しください。`,
  genericError: (msg) => `❌ エラー: ${msg}`,
  inputPlaceholder: '旅行について教えてください...',
  planner: {
    header: '旅程を修正',
    greeting: '旅程を変更しますか? どう調整したいか教えてください! 💬',
    updated: '✅ 旅程が更新されました! 上にスクロールして確認してください。',
    placeholder: '例: 3日目にビーチの時間を追加',
    errorPrefix: '❌',
    quickCommands: [
      'ランチを地元のシーフードに変更',
      '午後にコーヒーブレイクを追加',
      '2日目をもっとのんびりに',
      '夕食を1時間遅くする',
    ],
    languageChanged: '✅ 日本語に切り替えました。',
  },
};

const TABLE: Record<UiLang, UiStrings> = { en: EN, ko: KO, ja: JA };

export function t(lang: UiLang): UiStrings {
  return TABLE[lang] || EN;
}
