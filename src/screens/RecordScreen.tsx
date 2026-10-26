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

      {active ? (
        <>
          {/* Big Distance Display (Wireframe Screen 16) */}
          <View style={styles.bigKmDisplay}>
            <Text style={styles.bigKmValue}>{km.toFixed(2)}</Text>
            <Text style={styles.bigKmUnit}>กิโลเมตร</Text>
          </View>

          {/* 3-Column Stats Card (Pace, Steps, Time) */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statColValue}>{steps.toLocaleString()}</Text>
              <Text style={styles.statColLabel}>ก้าว</Text>
            </View>
            <View style={styles.statColDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statColValue}>{pace}</Text>
              <Text style={styles.statColLabel}>Pace (/km)</Text>
            </View>
            <View style={styles.statColDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statColValue}>{fmtTime(seconds)}</Text>
              <Text style={styles.statColLabel}>เวลา</Text>
            </View>
          </View>
        </>
      ) : (
        /* Sport Selector (Wireframe Screen 15) */
        <View style={styles.sportSelectorRow}>
          <Pressable
            onPress={() => choose('walk')}
            accessibilityRole="button"
            accessibilityLabel="เลือกเดิน"
            style={[
              styles.sportPill,
              sport === 'walk' && styles.sportPillActive,
            ]}
          >
            <Text style={styles.icon}>🚶</Text>
            <Text
              style={[
                styles.sportPillText,
                sport === 'walk' && styles.sportPillTextActive,
              ]}
            >
              เดิน
            </Text>
          </Pressable>

          <Pressable
            onPress={() => choose('run')}
            accessibilityRole="button"
            accessibilityLabel="เลือกวิ่ง"
            style={[
              styles.sportPill,
              sport === 'run' && styles.sportPillActive,
            ]}
          >
            <Text style={styles.icon}>🏃</Text>
            <Text
              style={[
                styles.sportPillText,
                sport === 'run' && styles.sportPillTextActive,
              ]}
            >
              วิ่ง
            </Text>
          </Pressable>
        </View>
      )}

      {/* Visual Track Area with Cat & Route */}
      <View style={styles.map}>
        <View style={[styles.road, styles.roadH]} />
        <View style={[styles.road, styles.roadV]} />
        <View style={[styles.poi, styles.poiCafe]}>
          <Text style={styles.poiIcon}>☕</Text>
          <Text style={font.small}>Cafe</Text>
        </View>
        <View style={[styles.poi, styles.poiShop]}>
          <Text style={styles.poiIcon}>🏪</Text>
          <Text style={font.small}>ร้านค้า</Text>
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
            size={115}
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

      {/* Controls based on Phase */}
      {!active && (
        <View style={styles.controlsBottom}>
          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="เริ่มออกเดินทาง"
            style={styles.startActionBtn}
          >
            <Text style={styles.startActionText}>
              เริ่มออกเดินทาง ({sport === 'walk' ? 'เดิน' : 'วิ่ง'})
            </Text>
          </Pressable>
        </View>
      )}

      {phase === 'recording' && (
        <View style={styles.activeControlsRow}>
          <Pressable
            onPress={handlePause}
            accessibilityRole="button"
            accessibilityLabel="หยุดชั่วคราว"
            style={[styles.activeBtn, styles.activeBtnPause]}
          >
            <Text style={styles.activeBtnText}>⏸ พักชั่วคราว</Text>
          </Pressable>
          <Pressable
            onPress={onCamera}
            accessibilityRole="button"
            accessibilityLabel="ถ่ายรูปกิจกรรม"
            style={styles.camCircle}
          >
            <Text style={styles.icon}>📷</Text>
          </Pressable>
        </View>
      )}

      {phase === 'paused' && (
        <View style={styles.activeControlsRow}>
          <Pressable
            onPress={handleResume}
            accessibilityRole="button"
            accessibilityLabel="ไปต่อ"
            style={[styles.activeBtn, styles.activeBtnResume]}
          >
            <Text style={styles.activeBtnText}>▶ ไปต่อ</Text>
          </Pressable>
          <Pressable
            onPress={handleFinish}
            accessibilityRole="button"
            accessibilityLabel="จบกิจกรรม"
            style={[styles.activeBtn, styles.activeBtnFinish]}
          >
            <Text style={styles.activeBtnText}>⏹ จบกิจกรรม</Text>
          </Pressable>
          <Pressable
            onPress={onCamera}
            accessibilityRole="button"
            accessibilityLabel="ถ่ายรูปกิจกรรม"
            style={styles.camCircle}
          >
            <Text style={styles.icon}>📷</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
