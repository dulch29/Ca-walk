import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import CatAvatar from '../components/CatAvatar';
import { useAppContext } from '../context/AppContext';
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
  const {
    activeSession,
    startRunSession,
    endRunSession,
    speedFraudActive,
    trackingError,
    addMockDistance,
  } = useAppContext();

  const [phase, setPhase] = useState<Phase>(() =>
    activeSession ? 'recording' : 'idle',
  );
  const [sport, setSport] = useState<Sport | null>('walk');

  const seconds = activeSession?.durationSeconds ?? 0;
  const km = activeSession?.distanceKm ?? 0;
  const steps = activeSession?.steps ?? 0;
  const pace = activeSession?.currentPace ?? '--:--';
  const active = phase === 'recording' || phase === 'paused';

  const choose = (s: Sport) => {
    setSport(s);
    setPhase('ready');
  };

  const handleStart = async () => {
    try {
      if (!activeSession) {
        await startRunSession();
      }
      setPhase('recording');
    } catch (e) {
      Alert.alert(
        'ขออภัย',
        e instanceof Error ? e.message : 'ไม่สามารถเริ่มการบันทึกได้',
      );
    }
  };

  const handlePause = () => {
    setPhase('paused');
  };

  const handleResume = () => {
    setPhase('recording');
  };

  const handleFinish = () => {
    const completed = endRunSession();
    const finalSeconds = completed?.durationSeconds ?? seconds;
    const finalKm = completed?.distanceKm ?? km;
    const finalSteps = completed?.steps ?? steps;

    onFinish({
      sport: sport ?? 'walk',
      seconds: finalSeconds,
      km: finalKm,
      steps: finalSteps,
    });
    setPhase('ready');
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={font.title}>ออกเดินทาง</Text>
      </View>

      {speedFraudActive && (
        <View style={[styles.timerCard, styles.fraudCard]}>
          <Text style={[styles.status, styles.fraudText]}>
            🚨 ความเร็วเกิน 18 km/h! น้องแมววิ่งตามไม่ทัน
          </Text>
          <Text style={font.small}>
            ระบบระงับการสะสมระยะทางชั่วคราวเพื่อป้องกันการขับขี่ยานพาหนะ
          </Text>
        </View>
      )}

      {trackingError && !speedFraudActive && (
        <View style={[styles.timerCard, styles.warningCard]}>
          <Text style={[styles.status, styles.warningText]}>
            ⚠️ {trackingError}
          </Text>
        </View>
      )}

      {active && (
        <View style={styles.timerCard}>
          <Text
            style={[styles.status, phase === 'paused' && styles.statusPaused]}
          >
            {phase === 'paused' ? '⏸ หยุดชั่วคราว' : '● กำลังบันทึกจริง...'}
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
        {active && <Text style={styles.gps}>GPS Track ✓</Text>}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            {speedFraudActive ? 'เมี้ยว! วิ่งเร็วเกินไปแล้ว~' : BUBBLE[phase]}
          </Text>
        </View>
        <Pressable
          onPress={() => active && addMockDistance(0.2)}
          accessibilityRole="button"
          accessibilityLabel="เร่งระยะทางแมวสำหรับเดโม"
        >
          <CatAvatar
            size={110}
            mood={
              speedFraudActive
                ? 'jump'
                : phase === 'recording'
                ? 'walk'
                : phase === 'paused'
                ? 'sleep'
                : 'sit'
            }
          />
        </Pressable>
      </View>

      {active && (
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Stat label="ระยะทาง" value={km.toFixed(2)} unit="km" />
            <Stat label="ก้าว" value={steps.toLocaleString()} />
            <Stat label="Pace" value={pace} />
          </View>
          <Text style={font.small}>
            📍 บันทึกพิกัด GPS และตัวนับก้าว Accelerometer จริง
          </Text>
        </View>
      )}

      {phase === 'pick' && (
        <View style={styles.controls}>
          {(['walk', 'run'] as Sport[]).map((s) => (
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
            onPress={sport ? handleStart : () => setPhase('pick')}
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
            onPress={handlePause}
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
          <Ctrl label="ไปต่อ" icon="▶" on onPress={handleResume} />
          <Ctrl label="จบ" icon="■" danger onPress={handleFinish} />
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
