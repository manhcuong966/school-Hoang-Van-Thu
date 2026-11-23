import { TrafficLightPhase } from '../types/game';

export interface TrafficLightStatus {
  phase: TrafficLightPhase;
  label: string;
  secondsRemaining: number;
}

const GREEN_MS = 10000;
const YELLOW_MS = 3000;
const RED_MS = 11000;
const CYCLE_MS = GREEN_MS + YELLOW_MS + RED_MS; // 24s synchronized across all players

export function getTrafficLightState(nowMs: number = Date.now()): TrafficLightStatus {
  const pos = ((nowMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  if (pos < GREEN_MS) {
    return {
      phase: 'green',
      label: 'Đèn Xanh · Được qua đường',
      secondsRemaining: Math.ceil((GREEN_MS - pos) / 1000),
    };
  }
  if (pos < GREEN_MS + YELLOW_MS) {
    return {
      phase: 'yellow',
      label: 'Đèn Vàng · Giảm tốc độ',
      secondsRemaining: Math.ceil((GREEN_MS + YELLOW_MS - pos) / 1000),
    };
  }
  return {
    phase: 'red',
    label: 'Đèn Đỏ · DỪNG LẠI trước vạch!',
    secondsRemaining: Math.ceil((CYCLE_MS - pos) / 1000),
  };
}
