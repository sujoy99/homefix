import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, Mic } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';

type Props = {
  uri: string;
};

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceNotePlayer({ uri }: Props) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => null);
    };
  }, []);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis);
    if (status.durationMillis) setDurationMs(status.durationMillis);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
      soundRef.current?.setPositionAsync(0).catch(() => null);
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatus,
      );
      soundRef.current = sound;
      setIsPlaying(true);
      return;
    }

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [uri, onPlaybackStatus]);

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Mic size={16} color={theme.colors.primary} />
        <Text variant="body" weight="medium" style={styles.label}>
          {t('job_detail.voice_note')}
        </Text>
      </View>

      <View style={styles.player}>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={togglePlayback}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('job_detail.voice_pause') : t('job_detail.voice_play')}
        >
          {isPlaying
            ? <Pause size={20} color={theme.colors.textInverse} fill={theme.colors.textInverse} />
            : <Play size={20} color={theme.colors.textInverse} fill={theme.colors.textInverse} />
          }
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={[styles.progressEmpty, { flex: 1 - progress }]} />
        </View>

        <Text variant="caption" color="muted" style={styles.time}>
          {durationMs > 0
            ? `${formatMs(positionMs)} / ${formatMs(durationMs)}`
            : formatMs(positionMs)
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.raw.gray100,
    borderRadius: theme.layout.radius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    flexDirection: 'row',
    borderRadius: theme.layout.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    minWidth: 0,
  },
  progressEmpty: {
    backgroundColor: theme.colors.border,
    minWidth: 0,
  },
  time: {
    minWidth: 70,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
