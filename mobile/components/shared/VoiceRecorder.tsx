import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';

type Mode = 'idle' | 'recording' | 'recorded';

type Props = {
  onRecorded: (uri: string | null) => void;
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceRecorder({ onRecorded }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uri, setUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => null);
      soundRef.current?.unloadAsync().catch(() => null);
    };
  }, []);

  const startRecording = useCallback(async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;

    setDurationMs(0);
    setMode('recording');
    timerRef.current = setInterval(() => setDurationMs((d) => d + 500), 500);
  }, []);

  const stopRecording = useCallback(async () => {
    timerRef.current && clearInterval(timerRef.current);
    const recording = recordingRef.current;
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const fileUri = recording.getURI();
    recordingRef.current = null;

    if (fileUri) {
      setUri(fileUri);
      setMode('recorded');
      onRecorded(fileUri);
    } else {
      setMode('idle');
    }
  }, [onRecorded]);

  const togglePlayback = useCallback(async () => {
    if (!uri) return;

    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }

    // Load fresh if not loaded
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            setIsPlaying(false);
            soundRef.current?.unloadAsync().catch(() => null);
            soundRef.current = null;
          }
        },
      );
      soundRef.current = sound;
    } else {
      await soundRef.current.playAsync();
    }
    setIsPlaying(true);
  }, [uri, isPlaying]);

  const deleteRecording = useCallback(async () => {
    timerRef.current && clearInterval(timerRef.current);
    await soundRef.current?.unloadAsync().catch(() => null);
    soundRef.current = null;
    await recordingRef.current?.stopAndUnloadAsync().catch(() => null);
    recordingRef.current = null;
    setUri(null);
    setIsPlaying(false);
    setDurationMs(0);
    setMode('idle');
    onRecorded(null);
  }, [onRecorded]);

  return (
    <View style={styles.container}>
      <Text variant="body" weight="medium" style={styles.label}>
        {t('booking.voice_label')}
      </Text>

      <View style={styles.row}>
        {/* ── Idle: record button ─────────────────────────────── */}
        {mode === 'idle' && (
          <TouchableOpacity
            style={[styles.iconBtn, styles.btnPrimary]}
            onPress={startRecording}
            accessibilityRole="button"
            accessibilityLabel={t('booking.voice_record')}
            accessibilityHint={t('booking.voice_hint')}
          >
            <Mic size={22} color={theme.colors.textInverse} />
          </TouchableOpacity>
        )}

        {/* ── Recording: stop button + live timer ─────────────── */}
        {mode === 'recording' && (
          <>
            <TouchableOpacity
              style={[styles.iconBtn, styles.btnDanger]}
              onPress={stopRecording}
              accessibilityRole="button"
              accessibilityLabel={t('booking.voice_stop')}
            >
              <Square size={22} color={theme.colors.textInverse} fill={theme.colors.textInverse} />
            </TouchableOpacity>
            <Text variant="body" style={styles.timer}>{formatDuration(durationMs)}</Text>
            <View style={styles.recordingDot} />
          </>
        )}

        {/* ── Recorded: play/pause + duration + delete ─────────── */}
        {mode === 'recorded' && (
          <>
            <TouchableOpacity
              style={[styles.iconBtn, styles.btnSecondary]}
              onPress={togglePlayback}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? t('booking.voice_pause') : t('booking.voice_play')}
            >
              {isPlaying
                ? <Pause size={22} color={theme.colors.primary} />
                : <Play size={22} color={theme.colors.primary} />
              }
            </TouchableOpacity>
            <Text variant="body" style={styles.timer}>{formatDuration(durationMs)}</Text>
            <TouchableOpacity
              style={[styles.iconBtn, styles.btnGhost]}
              onPress={deleteRecording}
              accessibilityRole="button"
              accessibilityLabel={t('booking.voice_delete')}
            >
              <Trash2 size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </>
        )}

        {/* Status label */}
        <Text variant="caption" color="muted" style={styles.statusText}>
          {mode === 'idle' && t('booking.voice_hint')}
          {mode === 'recording' && t('booking.voice_recording')}
          {mode === 'recorded' && t('booking.voice_recorded')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: theme.layout.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnDanger: {
    backgroundColor: theme.colors.error,
  },
  btnSecondary: {
    backgroundColor: theme.colors.raw.gray100,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  btnGhost: {
    backgroundColor: theme.colors.raw.gray100,
  },
  timer: {
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    minWidth: 44,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.error,
  },
  statusText: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
});
