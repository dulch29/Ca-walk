import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { font } from '../theme';
import { styles } from './RecordScreen.styles';

export type Sport = 'walk' | 'run';
export type RunSummary = {
  sport: Sport;
  seconds: number;
  km: number;
  steps: number;
};

type Phase = 'idle' | 'pick' | 'ready' | 'recording' | 'paused';

type Props = {
  onFinish: (summary: RunSummary) => void;
  onCamera: () => void;
};

// shortcut: simulated speed in m/s, replace with GPS + step sensor later
const SPEED: Record<Sport, number> = { walk: 1.4, run: 2.8 };
const STEP_M = 0.75;
export const SPORT_LABEL: Record<Sport, string> = { walk: 'เดิน', run: 'วิ่ง' };
export const SPORT_ICON: Record<Sport, string> = { walk: '🚶', run: '🏃' };

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtTime = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
export const fmtPace = (seconds: number, km: number) => {
  if (km <= 0) {
    return '--:--';
  }
  const p = Math.round(seconds / km);
  return `${Math.floor(p / 60)}:${pad(p % 60)}`;
};

const BUBBLE: Record<Phase, string> = {
  idle: 'เลือกกีฬาก่อนนะ!',
  pick: 'วันนี้เดินหรือวิ่งดี?',
  ready: 'พร้อมแล้ว ไปกันเลย!',
  recording: 'เก่งมากเลย!',
  paused: 'พักก่อนนะ แล้วไปต่อกัน!',
};

export default function RecordScreen({ onFinish, onCamera }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sport, setSport] = useState<Sport | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const km = sport ? (seconds * SPEED[sport]) / 1000 : 0;
  const steps = Math.round((km * 1000) / STEP_M);
  const active = phase === 'recording' || phase === 'paused';

  const choose = (s: Sport) => {
    setSport(s);
    setPhase('ready');
  };
  const finish = () => {
    if (sport) {
      onFinish({ sport, seconds, km, steps });
    }
    setSeconds(0);
    setPhase('ready');
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={font.title}>ออกเดินทาง</Text>
      </View>

      {active && (
        <View style={styles.timerCard}>
          <Text
            style={[styles.status, phase === 'paused' && styles.statusPaused]}
          >
            {phase === 'paused' ? '⏸ หยุดชั่วคราว' : '● กำลังบันทึก...'}
          </Text>
          <Text
            style={styles.timer}
            accessibilityLabel={`เวลา ${fmtTime(seconds)}`}
          >
            {fmtTime(seconds)}
          </Text>
        </View>
      )}

      <View style={styles.map}>
        <View style={[styles.road, styles.roadH]} />
        <View style={[styles.road, styles.roadV]} />
        <View style={[styles.poi, styles.poiCafe]}>
          <Text style={styles.poiIcon}>☕</Text>
          <Text style={font.small}>Cafe</Text>
        </View>
        <View style={[styles.poi, styles.poiShop]}>
          <Text style={styles.poiIcon}>🏪</Text>
          <Text style={font.small}>7-Eleven</Text>
        </View>
        {active && <Text style={styles.gps}>GPS ✓</Text>}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{BUBBLE[phase]}</Text>
        </View>
        <CatAvatar
          size={110}
          mood={
            phase === 'recording'
              ? 'walk'
              : phase === 'paused'
              ? 'sleep'
              : 'sit'
          }
        />
      </View>

      {active && (
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Stat label="ระยะทาง" value={km.toFixed(2)} unit="km" />
            <Stat label="ก้าว" value={steps.toLocaleString()} />
            <Stat label="Pace" value={fmtPace(seconds, km)} unit="/km" />
          </View>
          <Text style={font.small}>📍 Bangkok, Thailand</Text>
        </View>
      )}

      {phase === 'pick' && (
        <View style={styles.controls}>
          {(['walk', 'run'] as Sport[]).map(s => (
            <Ctrl
              key={s}
              label={SPORT_LABEL[s]}
              icon={SPORT_ICON[s]}
              on={sport === s}
              onPress={() => choose(s)}
            />
          ))}
        </View>
      )}

      {(phase === 'idle' || phase === 'ready') && (
        <View style={styles.controls}>
          <Ctrl
            label={sport ? SPORT_LABEL[sport] : 'เลือกกีฬา'}
            icon={sport ? SPORT_ICON[sport] : '🎯'}
            onPress={() => setPhase('pick')}
          />
          <Pressable
            onPress={() => (sport ? setPhase('recording') : setPhase('pick'))}
            accessibilityRole="button"
            accessibilityLabel="เริ่ม"
            style={[styles.big, !sport && styles.bigDisabled]}
          >
            <Text style={styles.pauseText}>เริ่ม</Text>
          </Pressable>
          <Ctrl label="กล้อง" icon="📷" onPress={onCamera} />
        </View>
      )}

      {phase === 'recording' && (
        <View style={styles.controls}>
          <Pressable
            onPress={() => setPhase('paused')}
            accessibilityRole="button"
            accessibilityLabel="หยุดชั่วคราว"
            style={styles.pausePill}
          >
            <Text style={styles.pauseText}>⏸ หยุดชั่วคราว</Text>
          </Pressable>
          <Pressable
            onPress={onCamera}
            accessibilityRole="button"
            accessibilityLabel="กล้อง"
            style={styles.camSquare}
          >
            <Text style={styles.icon}>📷</Text>
          </Pressable>
        </View>
      )}

      {phase === 'paused' && (
        <View style={styles.controls}>
          <Ctrl
            label="ไปต่อ"
            icon="▶"
            on
            onPress={() => setPhase('recording')}
          />
          <Ctrl label="จบ" icon="■" danger onPress={finish} />
        </View>
      )}
    </View>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit ? `${label} (${unit})` : label}</Text>
    </View>
  );
}

type CtrlProps = {
  label: string;
  icon: string;
  on?: boolean;
  danger?: boolean;
  onPress: () => void;
};

function Ctrl({ label, icon, on, danger, onPress }: CtrlProps) {
  const filled = on || danger;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.ctrl}
    >
      <View
        style={[styles.round, on && styles.roundOn, danger && styles.finish]}
      >
        <Text style={filled ? styles.iconOn : styles.icon}>{icon}</Text>
      </View>
      <Text style={on ? styles.labelStrong : styles.label}>{label}</Text>
    </Pressable>
  );
}
