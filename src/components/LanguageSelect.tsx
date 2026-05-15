import { UiLang } from '@/utils/langTracker';

interface Props {
  value: UiLang;
  onChange: (lang: UiLang) => void;
  compact?: boolean;
}

const OPTIONS: { value: UiLang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ko', label: 'KO' },
  { value: 'ja', label: 'JA' },
];

export default function LanguageSelect({ value, onChange, compact = false }: Props) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as UiLang)}
      aria-label="Language"
      className={`border border-gray-200 bg-white text-gray-600 focus:outline-none focus:border-indigo-400 ${
        compact ? 'rounded-lg px-2 py-1 text-xs' : 'rounded-xl px-3 py-1.5 text-xs'
      }`}
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
