import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  Languages,
  Music,
  Palette,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  ART_CHALLENGES,
  ENGLISH_PUZZLES,
  formatVND,
  getRequiredUniformForDay,
  LITERATURE_PUZZLES,
  SUPPLIES,
} from '../data/gameData';
import { DayOfWeek, SubjectRoomId, SupplyId, UniformId } from '../types/game';
import { soundEngine } from '../utils/sound';

interface LessonModalProps {
  roomId: SubjectRoomId;
  dayOfWeek: DayOfWeek;
  countdownFormatted: string;
  isOfficialClassTime: boolean;
  equippedUniform: UniformId;
  equippedSupply: SupplyId;
  studyBuffLessons: number;
  onCompleteLesson: (
    roomId: SubjectRoomId,
    moneyEarned: number,
    xpEarned: number,
    weeklyScoreGain: number,
    performanceNote: string
  ) => void;
  onClose: () => void;
}

interface MathQuestion {
  expression: string;
  hint: string;
  options: number[];
  answer: number;
}

function generateGrade8MathQuestion(): MathQuestion {
  const kind = Math.floor(Math.random() * 5);
  let expression = '';
  let hint = '';
  let answer = 0;

  if (kind === 0) {
    // Hằng đẳng thức: a^2 - b^2 = (a-b)(a+b)
    const a = Math.floor(Math.random() * 12) + 8;
    const b = Math.floor(Math.random() * 6) + 2;
    expression = `Tính nhanh: ${a}² − ${b}² = ?`;
    hint = 'Áp dụng hằng đẳng thức (a − b)(a + b)';
    answer = a * a - b * b;
  } else if (kind === 1) {
    // Phương trình bậc nhất: ax + b = c
    const a = Math.floor(Math.random() * 6) + 2;
    const x = Math.floor(Math.random() * 14) - 4;
    const b = Math.floor(Math.random() * 15) + 1;
    const c = a * x + b;
    expression = `Tìm x biết: ${a}x + ${b} = ${c}`;
    hint = 'Chuyển vế đổi dấu rồi chia cho hệ số của x';
    answer = x;
  } else if (kind === 2) {
    // Căn bậc hai số học
    const r1 = Math.floor(Math.random() * 10) + 3;
    const r2 = Math.floor(Math.random() * 9) + 2;
    expression = `Tính: √${r1 * r1} + √${r2 * r2} = ?`;
    hint = 'Khai phương từng căn bậc hai số học';
    answer = r1 + r2;
  } else if (kind === 3) {
    // Tổng các góc trong tam giác / tứ giác
    const isQuad = Math.random() > 0.5;
    if (isQuad) {
      const a = 80 + Math.floor(Math.random() * 3) * 10;
      const b = 90 + Math.floor(Math.random() * 2) * 15;
      const c = 75 + Math.floor(Math.random() * 3) * 10;
      answer = 360 - (a + b + c);
      expression = `Tứ giác ABCD có 3 góc ${a}°, ${b}°, ${c}°. Góc còn lại = ?°`;
      hint = 'Tổng 4 góc trong một tứ giác bằng 360°';
    } else {
      const a = 40 + Math.floor(Math.random() * 5) * 10;
      const b = 35 + Math.floor(Math.random() * 5) * 10;
      answer = 180 - (a + b);
      expression = `Tam giác ABC có ∠A = ${a}°, ∠B = ${b}°. Tính ∠C = ?°`;
      hint = 'Tổng 3 góc trong một tam giác bằng 180°';
    }
  } else {
    // (a + b)^2
    const a = Math.floor(Math.random() * 7) + 4;
    const b = Math.floor(Math.random() * 5) + 2;
    expression = `Tính giá trị biểu thức (${a} + ${b})² = ?`;
    hint = 'Khai triển hằng đẳng thức hoặc cộng trong ngoặc trước';
    answer = (a + b) * (a + b);
  }

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const delta = (Math.floor(Math.random() * 11) - 5) * (Math.abs(answer) > 40 ? 2 : 1);
    const candidate = answer + (delta === 0 ? 3 : delta);
    if (candidate !== answer) wrongSet.add(candidate);
  }
  const options = [answer, ...Array.from(wrongSet)].sort(() => Math.random() - 0.5);
  return { expression, hint, options, answer };
}

const PIANO_NOTES = [
  { id: 'C', label: 'Đô', freq: 261.63, color: 'bg-rose-500 hover:bg-rose-400', activeBg: 'bg-rose-300 ring-4 ring-white' },
  { id: 'D', label: 'Rê', freq: 293.66, color: 'bg-orange-500 hover:bg-orange-400', activeBg: 'bg-orange-300 ring-4 ring-white' },
  { id: 'E', label: 'Mi', freq: 329.63, color: 'bg-amber-500 hover:bg-amber-400', activeBg: 'bg-amber-300 ring-4 ring-white' },
  { id: 'F', label: 'Fa', freq: 349.23, color: 'bg-emerald-500 hover:bg-emerald-400', activeBg: 'bg-emerald-300 ring-4 ring-white' },
  { id: 'G', label: 'Sol', freq: 392.0, color: 'bg-cyan-500 hover:bg-cyan-400', activeBg: 'bg-cyan-300 ring-4 ring-white' },
  { id: 'A', label: 'La', freq: 440.0, color: 'bg-blue-500 hover:bg-blue-400', activeBg: 'bg-blue-300 ring-4 ring-white' },
  { id: 'B', label: 'Si', freq: 493.88, color: 'bg-violet-500 hover:bg-violet-400', activeBg: 'bg-violet-300 ring-4 ring-white' },
];

const ROOM_META: Record<
  SubjectRoomId,
  { title: string; subtitle: string; icon: React.ReactNode; accent: string }
> = {
  math: {
    title: 'Phòng Toán 8 · Tính Nhẩm Siêu Tốc',
    subtitle: 'Giải nhanh các phép tính đại số & hình học lớp 8 trong 45 giây',
    icon: <Calculator className="w-5 h-5 text-sky-400" />,
    accent: 'text-sky-400',
  },
  literature: {
    title: 'Phòng Ngữ Văn 8 · Trò Chơi Văn Học',
    subtitle: 'Ca dao, tác phẩm văn học trung đại & hiện đại lớp 8',
    icon: <BookOpen className="w-5 h-5 text-amber-400" />,
    accent: 'text-amber-400',
  },
  art: {
    title: 'Phòng Mĩ Thuật · Xưởng Pha Màu 8A3',
    subtitle: 'Nhận diện sắc độ và quy luật phối màu hội họa',
    icon: <Palette className="w-5 h-5 text-pink-400" />,
    accent: 'text-pink-400',
  },
  music: {
    title: 'Phòng Âm Nhạc · Giai Điệu Lớp 8A3',
    subtitle: 'Lắng nghe và đánh lại chuỗi nốt nhạc trên đàn Piano 3D',
    icon: <Music className="w-5 h-5 text-violet-400" />,
    accent: 'text-violet-400',
  },
  english: {
    title: 'Phòng Tiếng Anh 8 · Word Scramble',
    subtitle: 'Ghép các chữ cái bị xáo trộn thành từ vựng Tiếng Anh chuẩn xác',
    icon: <Languages className="w-5 h-5 text-emerald-400" />,
    accent: 'text-emerald-400',
  },
};

export const LessonModal: React.FC<LessonModalProps> = ({
  roomId,
  dayOfWeek,
  countdownFormatted,
  isOfficialClassTime,
  equippedUniform,
  equippedSupply,
  studyBuffLessons,
  onCompleteLesson,
  onClose,
}) => {
  const supply = SUPPLIES.find((s) => s.id === equippedSupply) || SUPPLIES[0];
  const req = getRequiredUniformForDay(dayOfWeek);
  const uniformOk =
    req.required === 'any' || equippedUniform === 'vip_8a3' || equippedUniform === req.required;

  const [finished, setFinished] = useState(false);
  const [finalStats, setFinalStats] = useState<{
    money: number;
    xp: number;
    score: number;
    note: string;
  } | null>(null);
  const completedRef = useRef(false);

  const finalizeLesson = useCallback(
    (correctUnits: number, maxUnits: number, note: string) => {
      if (completedRef.current) return;
      completedRef.current = true;
      const basePay = 10000;
      const perfBonus = correctUnits * 1500;
      const bellBonus = isOfficialClassTime ? 2000 : 0;
      const foodMultiplier = studyBuffLessons > 0 ? 1.3 : 1.0;

      const totalPay = Math.round(
        (basePay + perfBonus + bellBonus) * supply.bonusMultiplier * foodMultiplier
      );
      const totalXp = Math.round(
        (45 + correctUnits * 14 + (correctUnits === maxUnits ? 20 : 0)) *
          supply.bonusMultiplier *
          foodMultiplier +
          (uniformOk ? 15 : 0)
      );
      const scoreGain = 55 + correctUnits * 18 + (uniformOk ? 20 : 0);

      soundEngine.playGoodDeed();
      setFinalStats({ money: totalPay, xp: totalXp, score: scoreGain, note });
      setFinished(true);
      onCompleteLesson(roomId, totalPay, totalXp, scoreGain, note);
    },
    [isOfficialClassTime, onCompleteLesson, roomId, studyBuffLessons, supply.bonusMultiplier, uniformOk]
  );

  // ---------------- 1. MATH STATE ----------------
  const [mathTimeLeft, setMathTimeLeft] = useState(45);
  const [mathQuestion, setMathQuestion] = useState<MathQuestion>(() => generateGrade8MathQuestion());
  const [mathCorrect, setMathCorrect] = useState(0);
  const [mathAttempted, setMathAttempted] = useState(0);
  const [mathCombo, setMathCombo] = useState(0);
  const [mathFeedback, setMathFeedback] = useState<'ok' | 'err' | null>(null);

  useEffect(() => {
    if (roomId !== 'math' || finished) return;
    if (mathTimeLeft <= 0) {
      finalizeLesson(
        Math.min(10, mathCorrect),
        10,
        `Tính nhẩm đúng ${mathCorrect}/${mathAttempted} phép tính Toán 8`
      );
      return;
    }
    const timer = window.setTimeout(() => setMathTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [roomId, mathTimeLeft, finished, mathCorrect, mathAttempted, finalizeLesson]);

  const handleMathAnswer = (val: number) => {
    if (finished || mathFeedback) return;
    const isRight = val === mathQuestion.answer;
    const nextAttempt = mathAttempted + 1;
    const nextCorrect = isRight ? mathCorrect + 1 : mathCorrect;
    setMathAttempted(nextAttempt);
    if (isRight) {
      soundEngine.playCoin();
      setMathCorrect(nextCorrect);
      setMathCombo((c) => c + 1);
      setMathFeedback('ok');
    } else {
      setMathCombo(0);
      setMathFeedback('err');
    }
    window.setTimeout(() => {
      setMathFeedback(null);
      if (nextAttempt >= 10) {
        finalizeLesson(nextCorrect, 10, `Hoàn thành 10 câu Tính Nhẩm Toán 8 (Đúng ${nextCorrect}/10)`);
      } else {
        setMathQuestion(generateGrade8MathQuestion());
      }
    }, 380);
  };

  // ---------------- 2. LITERATURE STATE ----------------
  const litQuestions = useMemo(
    () => [...LITERATURE_PUZZLES].sort(() => Math.random() - 0.5).slice(0, 4),
    []
  );
  const [litStep, setLitStep] = useState(0);
  const [litSelected, setLitSelected] = useState<number | null>(null);
  const [litCorrect, setLitCorrect] = useState(0);

  // ---------------- 3. ART STATE ----------------
  const artQuestions = useMemo(() => [...ART_CHALLENGES], []);
  const [artStep, setArtStep] = useState(0);
  const [artSelected, setArtSelected] = useState<number | null>(null);
  const [artCorrect, setArtCorrect] = useState(0);

  // ---------------- 4. MUSIC STATE ----------------
  const musicRounds = useMemo(() => {
    return Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => Math.floor(Math.random() * PIANO_NOTES.length))
    );
  }, []);
  const [musicRound, setMusicRound] = useState(0);
  const [musicInput, setMusicInput] = useState<number[]>([]);
  const [musicActiveKey, setMusicActiveKey] = useState<number | null>(null);
  const [musicPlayingDemo, setMusicPlayingDemo] = useState(false);
  const [musicSuccessRounds, setMusicSuccessRounds] = useState(0);
  const [musicStatus, setMusicStatus] = useState<'listening' | 'input' | 'wrong' | 'ok'>('listening');

  const playMelodyRound = useCallback(
    (roundIdx: number) => {
      const seq = musicRounds[roundIdx];
      if (!seq) return;
      setMusicPlayingDemo(true);
      setMusicStatus('listening');
      setMusicInput([]);
      seq.forEach((noteIdx, i) => {
        window.setTimeout(() => {
          setMusicActiveKey(noteIdx);
          soundEngine.playNote(PIANO_NOTES[noteIdx].freq, 0.32);
          window.setTimeout(() => setMusicActiveKey(null), 240);
          if (i === seq.length - 1) {
            window.setTimeout(() => {
              setMusicPlayingDemo(false);
              setMusicStatus('input');
            }, 340);
          }
        }, i * 480 + 200);
      });
    },
    [musicRounds]
  );

  useEffect(() => {
    if (roomId === 'music' && !finished) {
      playMelodyRound(musicRound);
    }
  }, [roomId, musicRound, finished, playMelodyRound]);

  const handlePianoClick = (noteIdx: number) => {
    if (musicPlayingDemo || finished || musicStatus === 'ok') return;
    soundEngine.playNote(PIANO_NOTES[noteIdx].freq, 0.25);
    setMusicActiveKey(noteIdx);
    window.setTimeout(() => setMusicActiveKey(null), 180);

    const targetSeq = musicRounds[musicRound];
    const nextInput = [...musicInput, noteIdx];
    const pos = nextInput.length - 1;

    if (targetSeq[pos] !== noteIdx) {
      setMusicStatus('wrong');
      setMusicInput([]);
      return;
    }

    setMusicInput(nextInput);
    if (nextInput.length === targetSeq.length) {
      const nextWins = musicSuccessRounds + 1;
      setMusicSuccessRounds(nextWins);
      setMusicStatus('ok');
      soundEngine.playCoin();
      window.setTimeout(() => {
        if (musicRound + 1 < musicRounds.length) {
          setMusicRound((r) => r + 1);
        } else {
          finalizeLesson(nextWins * 2, 6, `Hoàn thành ${nextWins}/3 bản nhạc Lớp 8A3`);
        }
      }, 650);
    }
  };

  // ---------------- 5. ENGLISH STATE ----------------
  const engQuestions = useMemo(
    () => [...ENGLISH_PUZZLES].sort(() => Math.random() - 0.5).slice(0, 4),
    []
  );
  const [engStep, setEngStep] = useState(0);
  const [engPickedIndices, setEngPickedIndices] = useState<number[]>([]);
  const [engCorrect, setEngCorrect] = useState(0);
  const [engChecked, setEngChecked] = useState<'ok' | 'err' | null>(null);

  const curEng = engQuestions[engStep];
  const engLetters = useMemo(() => (curEng ? curEng.scrambled.split('') : []), [curEng]);
  const formedWord = engPickedIndices.map((idx) => engLetters[idx]).join('');

  const handlePickLetter = (tileIdx: number) => {
    if (engChecked || engPickedIndices.includes(tileIdx)) return;
    const next = [...engPickedIndices, tileIdx];
    setEngPickedIndices(next);
    if (next.length === engLetters.length) {
      const guess = next.map((i) => engLetters[i]).join('');
      const isRight = guess === curEng.answer;
      setEngChecked(isRight ? 'ok' : 'err');
      const nextScore = isRight ? engCorrect + 1 : engCorrect;
      if (isRight) {
        soundEngine.playCoin();
        setEngCorrect(nextScore);
      }
      window.setTimeout(() => {
        setEngChecked(null);
        setEngPickedIndices([]);
        if (engStep + 1 < engQuestions.length) {
          setEngStep((s) => s + 1);
        } else {
          finalizeLesson(nextScore * 2, 8, `Ghép đúng ${nextScore}/${engQuestions.length} từ vựng Tiếng Anh 8`);
        }
      }, 900);
    }
  };

  const meta = ROOM_META[roomId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
              {meta.icon}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">{meta.title}</h3>
              <p className="text-xs text-slate-400">
                {meta.subtitle} · {supply.name} (×{supply.bonusMultiplier})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-nums text-slate-300">
              <Clock className="w-3.5 h-3.5 text-lime-400" />
              <span>{countdownFormatted}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap"
            >
              Thoát phòng
            </button>
          </div>
        </div>

        {/* Body */}
        {!finished ? (
          <div className="p-6 space-y-5">
            {isOfficialClassTime && (
              <div className="px-3.5 py-2 rounded-lg bg-lime-950/50 border border-lime-700/60 text-xs text-lime-300 font-medium">
                Đang trong giờ học chính khóa — Hoàn thành tiết học nhận thêm +2.000đ Chuyên cần!
              </div>
            )}

            {/* 1. MATH 8 MENTAL MATH */}
            {roomId === 'math' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs font-mono-nums">
                  <span className="text-sky-300 font-semibold">
                    Câu {Math.min(10, mathAttempted + 1)}/10 · Đúng: {mathCorrect} · Combo: {mathCombo}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold ${
                      mathTimeLeft <= 10
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : 'bg-slate-950 text-amber-300 border border-slate-800'
                    }`}
                  >
                    Còn {mathTimeLeft}s
                  </span>
                </div>

                <div
                  className={`p-6 rounded-2xl border text-center space-y-2 transition-colors ${
                    mathFeedback === 'ok'
                      ? 'bg-emerald-950/50 border-emerald-500'
                      : mathFeedback === 'err'
                        ? 'bg-rose-950/50 border-rose-500'
                        : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <p className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {mathQuestion.expression}
                  </p>
                  <p className="text-xs text-slate-400">{mathQuestion.hint}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mathQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleMathAnswer(opt)}
                      className="py-4 px-4 rounded-xl bg-slate-950 hover:bg-sky-500/20 border border-slate-800 hover:border-sky-400 font-mono-nums text-xl font-bold text-white transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. LITERATURE GAME */}
            {roomId === 'literature' && litQuestions[litStep] && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-nums">
                  <span className="text-amber-400 font-semibold">Ngữ Văn Lớp 8</span>
                  <span>
                    Câu {litStep + 1} / {litQuestions.length}
                  </span>
                </div>

                <h4 className="font-display text-xl font-semibold text-white leading-snug">
                  {litQuestions[litStep].prompt}
                </h4>

                <div className="space-y-2.5">
                  {litQuestions[litStep].options.map((opt, idx) => {
                    const isSelected = litSelected === idx;
                    const isCorrect = idx === litQuestions[litStep].correctIndex;
                    let cls = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600';
                    if (litSelected !== null) {
                      if (isCorrect) cls = 'bg-emerald-950/60 border-emerald-500 text-emerald-200';
                      else if (isSelected) cls = 'bg-rose-950/60 border-rose-500 text-rose-200';
                      else cls = 'bg-slate-950/60 border-slate-800 text-slate-500';
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (litSelected !== null) return;
                          setLitSelected(idx);
                          if (isCorrect) {
                            soundEngine.playCoin();
                            setLitCorrect((c) => c + 1);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors flex items-center justify-between gap-3 ${cls}`}
                      >
                        <span>{opt}</span>
                        {litSelected !== null && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {litSelected !== null && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {litSelected !== null && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-300">{litQuestions[litStep].note}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (litStep + 1 < litQuestions.length) {
                          setLitStep((s) => s + 1);
                          setLitSelected(null);
                        } else {
                          finalizeLesson(
                            litCorrect * 2,
                            8,
                            `Hoàn thành ${litCorrect}/${litQuestions.length} câu đố Ngữ Văn`
                          );
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-semibold text-sm whitespace-nowrap shrink-0"
                    >
                      {litStep + 1 < litQuestions.length ? 'Câu tiếp theo' : 'Hoàn thành'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. ART COLOR MIXING */}
            {roomId === 'art' && artQuestions[artStep] && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-nums">
                  <span className="text-pink-400 font-semibold">{artQuestions[artStep].title}</span>
                  <span>
                    Thử thách {artStep + 1} / {artQuestions.length}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: artQuestions[artStep].targetColorCss }}
                  />
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {artQuestions[artStep].description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {artQuestions[artStep].options.map((opt, idx) => {
                    const isSelected = artSelected === idx;
                    const isCorrect = idx === artQuestions[artStep].correctIndex;
                    let cls = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600';
                    if (artSelected !== null) {
                      if (isCorrect) cls = 'bg-emerald-950/60 border-emerald-500 text-emerald-200';
                      else if (isSelected) cls = 'bg-rose-950/60 border-rose-500 text-rose-200';
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (artSelected !== null) return;
                          setArtSelected(idx);
                          if (isCorrect) {
                            soundEngine.playCoin();
                            setArtCorrect((c) => c + 1);
                          }
                        }}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 text-left text-sm font-medium transition-colors ${cls}`}
                      >
                        <span
                          className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor: opt.css }}
                        />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {artSelected !== null && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (artStep + 1 < artQuestions.length) {
                          setArtStep((s) => s + 1);
                          setArtSelected(null);
                        } else {
                          finalizeLesson(
                            artCorrect * 2,
                            6,
                            `Pha màu chuẩn ${artCorrect}/${artQuestions.length} bức tranh Mĩ Thuật`
                          );
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-semibold text-sm"
                    >
                      {artStep + 1 < artQuestions.length ? 'Thử thách tiếp theo' : 'Hoàn thành'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. MUSIC PIANO MELODY GAME */}
            {roomId === 'music' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-violet-300 font-mono-nums">
                      Giai điệu {musicRound + 1} / {musicRounds.length}
                    </p>
                    <p className="text-sm text-slate-300 mt-0.5">
                      {musicStatus === 'listening'
                        ? 'Đang phát giai điệu mẫu, hãy lắng nghe và quan sát phím sáng...'
                        : musicStatus === 'wrong'
                          ? 'Sai nốt rồi! Nhấn "Nghe lại" hoặc bấm lại từ đầu chuỗi 4 nốt.'
                          : musicStatus === 'ok'
                            ? 'Chính xác tuyệt đối!'
                            : `Lượt bạn đánh lại (${musicInput.length}/4 nốt)`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={musicPlayingDemo}
                    onClick={() => playMelodyRound(musicRound)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Nghe lại</span>
                  </button>
                </div>

                {/* Note progress slots */}
                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((slot) => {
                    const filledNote = musicInput[slot];
                    return (
                      <div
                        key={slot}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center font-display font-bold text-sm ${
                          filledNote !== undefined
                            ? 'bg-violet-500/20 border-violet-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {filledNote !== undefined ? PIANO_NOTES[filledNote].label : slot + 1}
                      </div>
                    );
                  })}
                </div>

                {/* 7-key interactive Piano */}
                <div className="grid grid-cols-7 gap-2">
                  {PIANO_NOTES.map((note, idx) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handlePianoClick(idx)}
                      className={`h-28 rounded-xl font-display font-bold text-slate-950 flex flex-col items-center justify-end pb-3 transition-all ${
                        musicActiveKey === idx ? note.activeBg : note.color
                      }`}
                    >
                      <span className="text-sm">{note.label}</span>
                      <span className="text-[11px] opacity-75">{note.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ENGLISH WORD SCRAMBLE */}
            {roomId === 'english' && curEng && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-nums">
                  <span className="text-emerald-400 font-semibold">English 8 Vocabulary</span>
                  <span>
                    Word {engStep + 1} / {engQuestions.length}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Nghĩa tiếng Việt: <span className="text-emerald-400">{curEng.meaning}</span>
                  </p>
                  <p className="text-xs text-slate-400">Gợi ý: {curEng.hint}</p>
                </div>

                {/* Formed Answer Slots */}
                <div
                  className={`p-4 rounded-xl border min-h-[68px] flex items-center justify-center gap-2 flex-wrap ${
                    engChecked === 'ok'
                      ? 'bg-emerald-950/60 border-emerald-500'
                      : engChecked === 'err'
                        ? 'bg-rose-950/60 border-rose-500'
                        : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {engLetters.map((_, slotIdx) => (
                    <div
                      key={slotIdx}
                      className="w-10 h-11 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-display font-bold text-lg text-white"
                    >
                      {formedWord[slotIdx] || ''}
                    </div>
                  ))}
                </div>

                {/* Letter Tiles */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {engLetters.map((char, idx) => {
                    const used = engPickedIndices.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={used || Boolean(engChecked)}
                        onClick={() => handlePickLetter(idx)}
                        className={`w-11 h-11 rounded-xl font-display font-bold text-base transition-colors ${
                          used
                            ? 'bg-slate-900 text-slate-600 border border-slate-800'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setEngPickedIndices([])}
                    disabled={Boolean(engChecked) || engPickedIndices.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Xếp lại chữ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display text-2xl font-bold text-white">
                Hoàn thành Tiết Học!
              </h4>
              <p className="text-sm text-slate-400 mt-1">{finalStats?.note}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-400">Tiền thưởng tiết học</p>
                <p className="font-mono-nums text-lg font-bold text-amber-400 mt-0.5">
                  +{formatVND(finalStats?.money || 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-400">Kinh nghiệm (XP)</p>
                <p className="font-mono-nums text-lg font-bold text-lime-400 mt-0.5">
                  +{finalStats?.xp || 0} XP
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-400">Nề nếp đồng phục</p>
                <p className={`text-sm font-semibold mt-1 ${uniformOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {uniformOk ? 'Đúng chuẩn (+15 XP)' : 'Chưa đúng thứ'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-display font-bold text-base transition-colors"
            >
              Quay lại Sân Trường 3D
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
