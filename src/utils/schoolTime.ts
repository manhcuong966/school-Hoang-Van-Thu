import { DayOfWeek } from '../types/game';

export type PeriodOfDay = 'morning' | 'afternoon' | 'evening';

export interface SchoolClockInfo {
  dayOfWeek: DayOfWeek;
  dateStr: string;
  weekKey: string;
  timeFormatted: string;
  periodOfDay: PeriodOfDay;
  periodOfDayLabel: string;
  classPeriodLabel: string;
  isOfficialClassTime: boolean;
  countdownFormatted: string;
}

function getIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

interface BellSlot {
  startMin: number;
  endMin: number;
  label: string;
  isClass: boolean;
}

const SCHOOL_BELL_SLOTS: BellSlot[] = [
  { startMin: 7 * 60, endMin: 7 * 60 + 45, label: 'Tiết 1 (Buổi Sáng)', isClass: true },
  { startMin: 7 * 60 + 45, endMin: 7 * 60 + 50, label: 'Ra chơi giữa tiết', isClass: false },
  { startMin: 7 * 60 + 50, endMin: 8 * 60 + 35, label: 'Tiết 2 (Buổi Sáng)', isClass: true },
  { startMin: 8 * 60 + 35, endMin: 8 * 60 + 50, label: 'Ra chơi sân trường', isClass: false },
  { startMin: 8 * 60 + 50, endMin: 9 * 60 + 35, label: 'Tiết 3 (Buổi Sáng)', isClass: true },
  { startMin: 9 * 60 + 35, endMin: 9 * 60 + 40, label: 'Ra chơi giữa tiết', isClass: false },
  { startMin: 9 * 60 + 40, endMin: 10 * 60 + 25, label: 'Tiết 4 (Buổi Sáng)', isClass: true },
  { startMin: 10 * 60 + 25, endMin: 10 * 60 + 30, label: 'Chuyển tiết', isClass: false },
  { startMin: 10 * 60 + 30, endMin: 11 * 60 + 15, label: 'Tiết 5 (Buổi Sáng)', isClass: true },
  { startMin: 13 * 60 + 30, endMin: 14 * 60 + 15, label: 'Tiết 1 (Buổi Chiều)', isClass: true },
  { startMin: 14 * 60 + 15, endMin: 14 * 60 + 25, label: 'Ra chơi buổi chiều', isClass: false },
  { startMin: 14 * 60 + 25, endMin: 15 * 60 + 10, label: 'Tiết 2 (Buổi Chiều)', isClass: true },
  { startMin: 15 * 60 + 10, endMin: 15 * 60 + 25, label: 'Ra chơi buổi chiều', isClass: false },
  { startMin: 15 * 60 + 25, endMin: 16 * 60 + 10, label: 'Tiết 3 (Buổi Chiều)', isClass: true },
  { startMin: 16 * 60 + 10, endMin: 16 * 60 + 55, label: 'Tiết 4 (Buổi Chiều)', isClass: true },
];

export function getRealSchoolClock(now: Date = new Date()): SchoolClockInfo {
  const jsDay = now.getDay(); // 0=Sun, 1=Mon..6=Sat
  const dayOfWeek: DayOfWeek = jsDay === 0 ? 8 : ((jsDay + 1) as DayOfWeek);

  const dateStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const weekKey = getIsoWeekKey(now);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const timeFormatted = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

  let periodOfDay: PeriodOfDay = 'evening';
  let periodOfDayLabel = 'Buổi Tối';
  if (h >= 5 && h < 12) {
    periodOfDay = 'morning';
    periodOfDayLabel = 'Buổi Sáng';
  } else if (h >= 12 && h < 18) {
    periodOfDay = 'afternoon';
    periodOfDayLabel = 'Buổi Chiều';
  }

  const totalSec = h * 3600 + m * 60 + s;
  const currentMin = h * 60 + m;

  let classPeriodLabel =
    periodOfDay === 'evening' ? 'Tự học Buổi Tối (Mở cửa)' : 'Giờ Tự Luyện / Ngoại Khóa';
  let isOfficialClassTime = false;
  let remainingSec = (45 - (m % 45)) * 60 - s;

  if (dayOfWeek !== 8) {
    const matched = SCHOOL_BELL_SLOTS.find(
      (slot) => currentMin >= slot.startMin && currentMin < slot.endMin
    );
    if (matched) {
      classPeriodLabel = matched.label;
      isOfficialClassTime = matched.isClass;
      remainingSec = matched.endMin * 60 - totalSec;
    }
  }

  const remMin = Math.max(0, Math.floor(remainingSec / 60));
  const remSec = Math.max(0, remainingSec % 60);
  const countdownFormatted = `${pad2(remMin)}:${pad2(remSec)}`;

  return {
    dayOfWeek,
    dateStr,
    weekKey,
    timeFormatted,
    periodOfDay,
    periodOfDayLabel,
    classPeriodLabel,
    isOfficialClassTime,
    countdownFormatted,
  };
}
