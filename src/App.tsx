/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Copy,
  Check,
  Sparkles,
  Trash2,
  SlidersHorizontal,
  History,
  Printer,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Moon,
  Sun,
  Info
} from 'lucide-react';

// 로또 공 색상 분류 (동행복권 공식 표준)
export const getBallColorClass = (num: number): string => {
  if (num <= 10) return 'ball-yellow text-amber-950 font-black';
  if (num <= 20) return 'ball-blue text-white font-black';
  if (num <= 30) return 'ball-red text-white font-black';
  if (num <= 40) return 'ball-gray text-white font-black';
  return 'ball-green text-white font-black';
};

interface SavedGame {
  id: string;
  numbers: number[];
  createdAt: string;
  type: 'single' | 'bundle';
  bundleId?: string;
  label?: string;
}

export default function App() {
  // 테마 모드: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('lotto_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // 테마 변경 시 html 및 로컬 스토리지 반영
  useEffect(() => {
    try {
      localStorage.setItem('lotto_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    showToast(theme === 'light' ? '🌙 다크 모드로 변경되었습니다.' : '☀️ 화이트(라이트) 모드로 변경되었습니다.');
  };

  // 모드: 단일 추천 (single) vs 5게임 세트 (bundle)
  const [activeTab, setActiveTab] = useState<'single' | 'bundle'>('single');

  // 단일 추천 상태
  const [singleNumbers, setSingleNumbers] = useState<number[]>([7, 14, 21, 28, 35, 42]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollingNumbers, setRollingNumbers] = useState<number[]>([7, 14, 21, 28, 35, 42]);

  // 5게임 세트 상태 (A, B, C, D, E)
  const [bundleSets, setBundleSets] = useState<number[][]>([
    [3, 11, 19, 25, 33, 41],
    [5, 12, 22, 31, 38, 45],
    [8, 17, 24, 29, 36, 43],
    [1, 14, 20, 27, 34, 40],
    [6, 15, 23, 30, 37, 44],
  ]);

  // 고정수 (반드시 포함할 번호, 최대 5개) & 제외수 (제외할 번호)
  const [includeNumbers, setIncludeNumbers] = useState<number[]>([]);
  const [excludeNumbers, setExcludeNumbers] = useState<number[]>([]);
  const [showFilterSettings, setShowFilterSettings] = useState<boolean>(false);

  // 추천 기록 (localStorage 연동)
  const [history, setHistory] = useState<SavedGame[]>(() => {
    try {
      const saved = localStorage.getItem('lotto_recommend_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 토스트 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // 기록 저장 시 로컬 스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('lotto_recommend_history', JSON.stringify(history.slice(0, 50)));
    } catch {
      // ignore quota error
    }
  }, [history]);

  // 랜덤 번호 생성 유틸리티 (1~45 중 6개 오름차순)
  const generateSet = (includes: number[] = includeNumbers, excludes: number[] = excludeNumbers): number[] => {
    const validIncludes = includes.filter((n) => !excludes.includes(n)).slice(0, 5);
    const availablePool: number[] = [];
    for (let i = 1; i <= 45; i++) {
      if (!excludes.includes(i) && !validIncludes.includes(i)) {
        availablePool.push(i);
      }
    }

    const needed = 6 - validIncludes.length;
    // Fisher-Yates 셔플
    for (let i = availablePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
    }

    const picked = [...validIncludes, ...availablePool.slice(0, needed)];
    picked.sort((a, b) => a - b);
    return picked;
  };

  // 단일 번호 추첨 실행
  const rollSingle = () => {
    if (isRolling) return;
    setIsRolling(true);

    let counter = 0;
    const interval = window.setInterval(() => {
      // 롤링 애니메이션용 임의 번호
      const temp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort(
        (a, b) => a - b
      );
      setRollingNumbers(temp);
      counter++;

      if (counter >= 10) {
        clearInterval(interval);
        const finalNumbers = generateSet();
        setRollingNumbers(finalNumbers);
        setSingleNumbers(finalNumbers);
        setIsRolling(false);

        // 히스토리에 추가
        const newRecord: SavedGame = {
          id: Date.now().toString(),
          numbers: finalNumbers,
          createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'single',
        };
        setHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
      }
    }, 45);
  };

  // 5게임 세트 일괄 추첨
  const rollBundle = () => {
    const newSets: number[][] = [];
    for (let i = 0; i < 5; i++) {
      newSets.push(generateSet());
    }
    setBundleSets(newSets);

    const bundleId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const records: SavedGame[] = newSets.map((nums, idx) => ({
      id: `${bundleId}-${idx}`,
      numbers: nums,
      createdAt: timeStr,
      type: 'bundle',
      bundleId,
      label: `${String.fromCharCode(65 + idx)}게임`,
    }));

    setHistory((prev) => [...records, ...prev.slice(0, 45)]);
    showToast('5개 게임(1장)이 새롭게 추첨되었습니다!');
  };

  // 특정 세트만 다시 추첨 (5게임 중 특정 슬롯)
  const rerollSlot = (index: number) => {
    const updated = [...bundleSets];
    updated[index] = generateSet();
    setBundleSets(updated);
    showToast(`${String.fromCharCode(65 + index)}게임 번호가 다시 생성되었습니다.`);
  };

  // 클립보드 복사 유틸
  const copyToClipboard = (nums: number[], label = '로또 번호') => {
    const formatted = nums.map((n) => String(n).padStart(2, '0')).join(', ');
    navigator.clipboard.writeText(formatted).then(() => {
      showToast(`${label}가 복사되었습니다! [${formatted}]`);
    }).catch(() => {
      showToast(`복사에 실패했습니다.`);
    });
  };

  // 5게임 전체 텍스트 복사
  const copyAllBundle = () => {
    const lines = bundleSets.map((set, idx) => {
      const letter = String.fromCharCode(65 + idx);
      const nums = set.map((n) => String(n).padStart(2, '0')).join(', ');
      return `[${letter}게임] ${nums}`;
    });
    const text = `=== 행운의 로또 6/45 5게임 ===\n${lines.join('\n')}\n========================`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('5개 게임 전체 번호가 복사되었습니다!');
    });
  };

  // 고정수 토글
  const toggleIncludeNumber = (n: number) => {
    if (includeNumbers.includes(n)) {
      setIncludeNumbers(includeNumbers.filter((x) => x !== n));
    } else {
      if (includeNumbers.length >= 5) {
        showToast('포함할 번호는 최대 5개까지만 선택 가능합니다.');
        return;
      }
      setIncludeNumbers([...includeNumbers, n]);
      setExcludeNumbers(excludeNumbers.filter((x) => x !== n)); // 제외수에서 자동 해제
    }
  };

  // 제외수 토글
  const toggleExcludeNumber = (n: number) => {
    if (excludeNumbers.includes(n)) {
      setExcludeNumbers(excludeNumbers.filter((x) => x !== n));
    } else {
      if (excludeNumbers.length >= 39) {
        showToast('최소 6개의 번호는 남아있어야 합니다.');
        return;
      }
      setExcludeNumbers([...excludeNumbers, n]);
      setIncludeNumbers(includeNumbers.filter((x) => x !== n)); // 포함수에서 자동 해제
    }
  };

  // 필터 초기화
  const resetFilters = () => {
    setIncludeNumbers([]);
    setExcludeNumbers([]);
    showToast('포함/제외 번호 설정이 초기화되었습니다.');
  };

  // 키보드 단축키 (스페이스바로 추첨)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        if (activeTab === 'single') {
          rollSingle();
        } else {
          rollBundle();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isRolling, includeNumbers, excludeNumbers]);

  // 번호 분석 계산
  const targetNumbers = activeTab === 'single' ? singleNumbers : bundleSets[0];
  const sum = targetNumbers.reduce((a, b) => a + b, 0);
  const oddCount = targetNumbers.filter((n) => n % 2 !== 0).length;
  const evenCount = 6 - oddCount;
  const lowCount = targetNumbers.filter((n) => n <= 22).length; // 1~22 저번호
  const highCount = 6 - lowCount; // 23~45 고번호

  // 연속 번호 유무 파악 (예: 14, 15)
  const consecutivePairs: string[] = [];
  for (let i = 0; i < targetNumbers.length - 1; i++) {
    if (targetNumbers[i + 1] === targetNumbers[i] + 1) {
      consecutivePairs.push(`${targetNumbers[i]}-${targetNumbers[i + 1]}`);
    }
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col items-center py-6 px-4 sm:px-6 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-800'
    }`}>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className={`fixed top-5 z-50 backdrop-blur-md text-sm px-4 py-2.5 rounded-full shadow-xl border animate-bounce flex items-center gap-2 ${
          isDark 
            ? 'bg-slate-800/95 text-slate-100 border-slate-700 shadow-slate-950/60' 
            : 'bg-slate-900/90 text-white border-slate-700/60 shadow-slate-900/20'
        }`}>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 헤더 영역 및 테마 토글 버튼 */}
      <header className="w-full max-w-xl text-center mb-6 no-print relative">
        {/* 상단 다크/화이트 모드 토글 버튼 */}
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700/80 shadow-inner'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
            title={isDark ? '화이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="화면 모드 전환"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>화이트 모드</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>다크 모드</span>
              </>
            )}
          </button>
        </div>

        <div className="inline-flex items-center gap-2 mb-1.5 text-xs font-semibold tracking-wider uppercase text-amber-500">
          <Sparkles className="w-4 h-4" />
          <span>Lotto 6/45 Lucky Number Generator</span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <span>로또 6/45 번호 추천기</span>
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          클릭 한 번으로 1부터 45까지 최적의 행운 조합을 추천받으세요
        </p>

        {/* 상단 탭 전환: 1게임 단일 추천 vs 5게임 세트 (1장) */}
        <div className="flex items-center justify-center mt-5">
          <div className={`p-1 rounded-xl flex items-center w-full max-w-xs text-sm font-semibold transition-colors ${
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200/80'
          }`}>
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'single'
                  ? isDark
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1게임 추천
            </button>
            <button
              onClick={() => setActiveTab('bundle')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'bundle'
                  ? isDark
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5게임 세트 (1장)
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 카드 */}
      <main className="w-full max-w-xl">
        {/* === 1. 단일 모드 (1게임 추천) === */}
        {activeTab === 'single' && (
          <div className={`rounded-2xl shadow-sm border p-6 sm:p-8 text-center relative overflow-hidden transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 shadow-black/40'
              : 'bg-white border-slate-200/80'
          }`}>
            {/* 로또 공 6개 표시 */}
            <div className="py-4">
              <div className="flex justify-center items-center gap-2.5 sm:gap-4 flex-wrap">
                {(isRolling ? rollingNumbers : singleNumbers).map((num, idx) => (
                  <div
                    key={idx}
                    className={`w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl rounded-full lotto-ball ${getBallColorClass(
                      num
                    )} ${!isRolling ? 'animate-ball-appear' : ''}`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <span>{num}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 메인 액션 버튼 */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={rollSingle}
                disabled={isRolling}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <RotateCw className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? '번호 추첨 중...' : '행운 번호 추첨하기'}</span>
              </button>

              <button
                onClick={() => copyToClipboard(singleNumbers, '단일 로또 번호')}
                className={`w-full sm:w-auto px-5 py-3.5 font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <Copy className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>번호 복사</span>
              </button>
            </div>

            <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <kbd className={`px-1.5 py-0.5 border rounded text-[11px] font-mono mr-1 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}>
                Space
              </kbd>
              키를 누르면 바로 다시 추첨됩니다
            </p>

            {/* 번호 조합 분석 (간단 통계) */}
            <div className={`mt-7 pt-5 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 text-left ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>총합 (Sum)</span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{sum}</span>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>통상 100~175</span>
              </div>
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>홀짝 비율</span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {oddCount} : {evenCount}
                </span>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>홀 {oddCount} / 짝 {evenCount}</span>
              </div>
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>저고 비율</span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {lowCount} : {highCount}
                </span>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>1~22 : 23~45</span>
              </div>
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>연속 번호</span>
                <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {consecutivePairs.length > 0 ? consecutivePairs.join(', ') : '없음'}
                </span>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {consecutivePairs.length > 0 ? `${consecutivePairs.length}쌍 연속` : '고른 분포'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* === 2. 5게임 세트 모드 (실제 복권 1장 형태) === */}
        {activeTab === 'bundle' && (
          <div className={`rounded-2xl shadow-sm border p-5 sm:p-7 relative transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 shadow-black/40'
              : 'bg-white border-slate-200/80'
          }`}>
            {/* 영수증 스타일 헤더 */}
            <div className={`border-b border-dashed pb-4 mb-4 flex items-center justify-between ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <span className={`text-xs font-bold tracking-widest block uppercase ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  LOTTO 6/45 SLIP
                </span>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  행운의 복권 1장 (5게임)
                </h3>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={rollBundle}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>전체 재추첨</span>
                </button>
                <button
                  onClick={copyAllBundle}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <Copy className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>전체 복사</span>
                </button>
                <button
                  onClick={() => window.print()}
                  title="영수증 인쇄"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 5개 게임 슬롯 (A, B, C, D, E) */}
            <div className="space-y-3">
              {bundleSets.map((numbers, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl border transition-all gap-2 ${
                      isDark
                        ? 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/80'
                        : 'bg-slate-50/70 hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`w-7 h-7 rounded-md font-black text-xs flex items-center justify-center ${
                        isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-white'
                      }`}>
                        {letter}
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>자동</span>
                    </div>

                    {/* 번호 6개 공 */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {numbers.map((n, i) => (
                        <div
                          key={i}
                          className={`w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base rounded-full lotto-ball ${getBallColorClass(
                            n
                          )}`}
                        >
                          <span>{n}</span>
                        </div>
                      ))}
                    </div>

                    {/* 라인별 액션 */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto no-print">
                      <button
                        onClick={() => copyToClipboard(numbers, `${letter}게임`)}
                        title="이 게임 복사"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isDark
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-white'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rerollSlot(idx)}
                        title="이 게임만 다시 뽑기"
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isDark
                            ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-white'
                        }`}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 바코드 느낌 & 영수증 안내 */}
            <div className={`mt-5 pt-4 border-t border-dashed text-center ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex justify-center items-center gap-1 my-1">
                {[...Array(32)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
                    style={{
                      width: `${(i % 3) + 1.5}px`,
                      opacity: (i % 2 === 0 ? 0.9 : 0.4),
                    }}
                  />
                ))}
              </div>
              <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                동행복권 로또 6/45 규격 · 1게임당 1,000원 상당
              </p>
            </div>
          </div>
        )}

        {/* === 3. 맞춤 설정 (포함수 / 제외수 선택 - 접이식) === */}
        <div className={`mt-4 rounded-2xl shadow-sm border overflow-hidden no-print transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200/80'
        }`}>
          <button
            onClick={() => setShowFilterSettings(!showFilterSettings)}
            className={`w-full px-5 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                맞춤 번호 필터 (포함수 / 제외수)
              </span>
              {(includeNumbers.length > 0 || excludeNumbers.length > 0) && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50' : 'bg-amber-100 text-amber-800'
                }`}>
                  포함 {includeNumbers.length} / 제외 {excludeNumbers.length}
                </span>
              )}
            </div>
            {showFilterSettings ? (
              <ChevronUp className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            )}
          </button>

          {showFilterSettings && (
            <div className={`p-5 border-t ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  꼭 포함하고 싶은 번호(최대 5개) 또는 제외하고 싶은 번호를 지정하세요.
                </p>
                {(includeNumbers.length > 0 || excludeNumbers.length > 0) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-rose-400 hover:text-rose-500 font-medium underline cursor-pointer"
                  >
                    필터 전체 초기화
                  </button>
                )}
              </div>

              {/* 현재 선택 요약 */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className={`flex-1 border p-2.5 rounded-xl ${
                  isDark
                    ? 'bg-emerald-950/30 border-emerald-900/60'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}>
                  <span className={`text-xs font-bold block mb-1 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-800'
                  }`}>
                    꼭 포함할 고정수 ({includeNumbers.length}/5)
                  </span>
                  <div className="flex flex-wrap gap-1 min-h-[28px] items-center">
                    {includeNumbers.length === 0 ? (
                      <span className={`text-xs ${isDark ? 'text-emerald-600/80' : 'text-emerald-600/70'}`}>
                        아래 번호판에서 선택하세요
                      </span>
                    ) : (
                      includeNumbers.map((n) => (
                        <button
                          key={n}
                          onClick={() => toggleIncludeNumber(n)}
                          className="px-2 py-0.5 bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-emerald-600 cursor-pointer"
                        >
                          <span>{n}</span>
                          <X className="w-3 h-3" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className={`flex-1 border p-2.5 rounded-xl ${
                  isDark
                    ? 'bg-rose-950/30 border-rose-900/60'
                    : 'bg-rose-50/70 border-rose-200'
                }`}>
                  <span className={`text-xs font-bold block mb-1 ${
                    isDark ? 'text-rose-400' : 'text-rose-800'
                  }`}>
                    제외할 번호 ({excludeNumbers.length}/39)
                  </span>
                  <div className="flex flex-wrap gap-1 min-h-[28px] items-center">
                    {excludeNumbers.length === 0 ? (
                      <span className={`text-xs ${isDark ? 'text-rose-600/80' : 'text-rose-600/70'}`}>
                        아래 번호판에서 선택하세요
                      </span>
                    ) : (
                      excludeNumbers.map((n) => (
                        <button
                          key={n}
                          onClick={() => toggleExcludeNumber(n)}
                          className="px-2 py-0.5 bg-rose-500 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-rose-600 cursor-pointer"
                        >
                          <span>{n}</span>
                          <X className="w-3 h-3" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 1~45 인터랙티브 미니 번호판 */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    번호를 클릭하면 [포함] → [제외] → [해제] 순으로 변경됩니다.
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 포함
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> 제외
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-9 sm:grid-cols-9 gap-1.5 text-center">
                  {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                    const isIncluded = includeNumbers.includes(num);
                    const isExcluded = excludeNumbers.includes(num);

                    let btnStyle = isDark 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                    if (isIncluded) {
                      btnStyle = 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-300';
                    } else if (isExcluded) {
                      btnStyle = 'bg-rose-500 text-white font-bold line-through opacity-80 ring-2 ring-rose-300';
                    }

                    return (
                      <button
                        key={num}
                        onClick={() => {
                          if (isIncluded) {
                            toggleIncludeNumber(num);
                            toggleExcludeNumber(num);
                          } else if (isExcluded) {
                            toggleExcludeNumber(num);
                          } else {
                            toggleIncludeNumber(num);
                          }
                        }}
                        className={`h-8 sm:h-9 text-xs sm:text-sm rounded-lg transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === 4. 추천 히스토리 (보관함) === */}
        {history.length > 0 && (
          <div className={`mt-4 rounded-2xl shadow-sm border p-5 no-print transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <History className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  최근 추천 기록 ({history.length})
                </h4>
              </div>
              <button
                onClick={() => {
                  if (confirm('모든 추첨 기록을 삭제하시겠습니까?')) {
                    setHistory([]);
                    localStorage.removeItem('lotto_recommend_history');
                    showToast('모든 기록이 삭제되었습니다.');
                  }
                }}
                className={`text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>기록 지우기</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {history.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono w-14 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {record.createdAt}
                    </span>
                    {record.label && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {record.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      {record.numbers.map((n, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 text-xs rounded-full inline-flex items-center justify-center font-bold ${getBallColorClass(
                            n
                          )}`}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(record.numbers, '기록 번호')}
                    title="복사"
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공식 정보 및 색상 가이드 안내 */}
        <div className={`mt-4 p-4 rounded-xl border text-xs space-y-2 no-print transition-colors ${
          isDark
            ? 'bg-slate-900/60 border-slate-800 text-slate-400'
            : 'bg-slate-200/50 border-slate-200/80 text-slate-600'
        }`}>
          <div className="flex items-start gap-2">
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <div className="space-y-1">
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                동행복권 로또 6/45 공식 색상 기준
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full ball-yellow"></span> 1 ~ 10 (노랑)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full ball-blue"></span> 11 ~ 20 (파랑)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full ball-red"></span> 21 ~ 30 (빨강)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full ball-gray"></span> 31 ~ 40 (회색)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full ball-green"></span> 41 ~ 45 (초록)
                </span>
              </div>
            </div>
          </div>
          <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200/60 text-slate-500'
          }`}>
            <span>추첨시간: 매주 토요일 오후 8시 35분 (MBC)</span>
            <a
              href="https://dhlottery.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 font-medium transition-colors ${
                isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-600 hover:text-amber-600'
              }`}
            >
              <span>동행복권 공식 홈페이지</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      <footer className={`mt-8 text-center text-xs no-print ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        본 추천기는 무작위 확률 기반으로 생성되며 당첨을 보장하지 않습니다. 건전한 복권 문화를 응원합니다.
      </footer>
    </div>
  );
}
