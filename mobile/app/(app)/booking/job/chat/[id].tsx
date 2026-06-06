import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  Mic,
  Square,
  Play,
  Pause,
  X,
} from 'lucide-react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useChat } from '@/hooks/useChat';
import { messageService } from '@/services/message.service';
import type { Message } from '@/services/message.service';
import { Text } from '@/components/ui/Text';
import { resolveMediaUrl } from '@/utils/media';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

type RecordMode = 'idle' | 'recording' | 'uploading';

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: jobId } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user!.id);

  const { messages, isLoading, isSending, hasMore, isConnected, sendText, sendImage, sendAudio, loadMore } =
    useChat({ jobId });


  // ── Text input state ────────────────────────────────────────────────────────
  const [inputText, setInputText]     = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ── Voice recording state ───────────────────────────────────────────────────
  const [recordMode, setRecordMode]   = useState<RecordMode>('idle');
  const [recordMs, setRecordMs]       = useState(0);
  const recordingRef  = useRef<Audio.Recording | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => null);
    };
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    try {
      await sendText(text);
    } catch {
      toast.error(t('chat.error_send'));
    }
  }, [inputText, isSending, sendText, t]);

  const handleAttachImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(t('booking.photo_permission_required'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const url = await messageService.uploadImage(result.assets[0]);
      await sendImage(url);
    } catch {
      toast.error(t('chat.error_send'));
    } finally {
      setIsUploading(false);
    }
  }, [sendImage, t]);

  const handleStartRecording = useCallback(async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      toast.error(t('chat.error_mic_permission'));
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setRecordMs(0);
    setRecordMode('recording');
    recordTimerRef.current = setInterval(() => setRecordMs((ms) => ms + 500), 500);
  }, [t]);

  const handleStopAndSend = useCallback(async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const recording = recordingRef.current;
    if (!recording) return;

    setRecordMode('uploading');
    try {
      // Capture URI before stopping — some Android versions clear it on unload
      const fileUri = recording.getURI();
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;

      if (!fileUri) throw new Error('no uri');

      const asset = { uri: fileUri, fileName: `voice_${Date.now()}.m4a`, mimeType: 'audio/mp4' } as ImagePicker.ImagePickerAsset;
      const url = await messageService.uploadImage(asset);
      await sendAudio(url);
    } catch (err) {
      console.error('[Chat] voice send failed:', err);
      toast.error(t('chat.error_send'));
    } finally {
      setRecordMode('idle');
      setRecordMs(0);
    }
  }, [sendAudio, t]);

  const handleCancelRecording = useCallback(async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    await recordingRef.current?.stopAndUnloadAsync().catch(() => null);
    recordingRef.current = null;
    setRecordMode('idle');
    setRecordMs(0);
  }, []);

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble message={item} isMine={item.sender_id === userId} />
  ), [userId]);

  const renderLoadMore = () =>
    hasMore ? (
      <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn} accessibilityRole="button">
        <Text variant="caption" color="muted">{t('chat.load_more')}</Text>
      </TouchableOpacity>
    ) : null;

  const isIdle = recordMode === 'idle';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>{t('chat.title')}</Text>
        <View style={styles.iconBtn}>
          {isConnected
            ? <Wifi color={theme.colors.success} size={16} />
            : <WifiOff color={theme.colors.textMuted} size={16} />}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Message list ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <Text variant="body" weight="semibold" align="center">{t('chat.empty_title')}</Text>
            <Text variant="caption" color="muted" align="center" style={styles.emptyDesc}>
              {t('chat.empty_desc')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            inverted
            style={styles.flex}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderLoadMore}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
          />
        )}

        {/* ── Input bar ────────────────────────────────────────────────────── */}
        <View style={styles.inputBar}>
          {isIdle ? (
            // Normal mode: image attach + text input + mic/send
            <>
              <TouchableOpacity
                onPress={handleAttachImage}
                style={styles.iconBtn}
                disabled={isUploading || isSending}
                accessibilityRole="button"
                accessibilityLabel={t('chat.attach_image')}
              >
                {isUploading
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <ImageIcon color={theme.colors.primary} size={22} />}
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={2000}
                accessibilityLabel={t('chat.placeholder')}
              />

              {inputText.trim() ? (
                <TouchableOpacity
                  onPress={handleSend}
                  style={[styles.roundBtn, styles.roundBtnPrimary, isSending && styles.roundBtnDisabled]}
                  disabled={isSending}
                  accessibilityRole="button"
                  accessibilityLabel={t('chat.send')}
                >
                  {isSending
                    ? <ActivityIndicator size="small" color={theme.colors.textInverse} />
                    : <Send color={theme.colors.textInverse} size={18} />}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleStartRecording}
                  style={[styles.roundBtn, styles.roundBtnPrimary]}
                  disabled={isSending || isUploading}
                  accessibilityRole="button"
                  accessibilityLabel={t('chat.record_voice')}
                >
                  <Mic color={theme.colors.textInverse} size={18} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            // Recording / uploading mode
            <>
              <TouchableOpacity
                onPress={handleCancelRecording}
                style={styles.iconBtn}
                disabled={recordMode === 'uploading'}
                accessibilityRole="button"
                accessibilityLabel={t('chat.cancel_recording')}
              >
                <X color={theme.colors.error} size={22} />
              </TouchableOpacity>

              <View style={styles.recordingRow}>
                {recordMode === 'recording' && <View style={styles.recordDot} />}
                <Text variant="body" style={styles.recordTimer}>
                  {recordMode === 'uploading' ? t('chat.uploading') : formatMs(recordMs)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStopAndSend}
                style={[styles.roundBtn, styles.roundBtnDanger]}
                disabled={recordMode === 'uploading'}
                accessibilityRole="button"
                accessibilityLabel={t('chat.stop_and_send')}
              >
                {recordMode === 'uploading'
                  ? <ActivityIndicator size="small" color={theme.colors.textInverse} />
                  : <Square color={theme.colors.textInverse} size={18} fill={theme.colors.textInverse} />}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const time = new Date(message.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {message.type === 'image' && (
          <Image
            source={{ uri: resolveMediaUrl(message.content) }}
            style={styles.bubbleImage}
            resizeMode="cover"
            accessibilityLabel="chat image"
          />
        )}
        {message.type === 'audio' && (
          <AudioBubble uri={resolveMediaUrl(message.content)} isMine={isMine} />
        )}
        {message.type === 'text' && (
          <Text variant="body" style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
            {message.content}
          </Text>
        )}
        <Text
          variant="caption"
          style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

// ─── Inline audio player bubble ───────────────────────────────────────────────

function AudioBubble({ uri, isMine }: { uri: string; isMine: boolean }) {
  const [isPlaying, setIsPlaying]   = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => null); };
  }, []);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis);
    if (status.durationMillis) setDurationMs(status.durationMillis);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
      soundRef.current?.setPositionAsync(0).catch(() => null);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true }, onStatus);
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
  }, [uri, onStatus]);

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const iconColor = isMine ? theme.colors.primary : theme.colors.primary;
  const trackFill = isMine ? 'rgba(255,255,255,0.9)' : theme.colors.primary;
  const trackEmpty = isMine ? 'rgba(255,255,255,0.3)' : theme.colors.border;
  const timeColor = isMine ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted;

  return (
    <View style={audioBubble.row}>
      <TouchableOpacity
        onPress={togglePlay}
        style={[audioBubble.playBtn, isMine ? audioBubble.playBtnMine : audioBubble.playBtnTheirs]}
        accessibilityRole="button"
      >
        {isPlaying
          ? <Pause size={18} color={iconColor} fill={iconColor} />
          : <Play size={18} color={iconColor} fill={iconColor} />}
      </TouchableOpacity>

      <View style={audioBubble.trackWrap}>
        <View style={audioBubble.track}>
          <View style={[audioBubble.fill, { flex: progress, backgroundColor: trackFill }]} />
          <View style={[audioBubble.empty, { flex: 1 - progress, backgroundColor: trackEmpty }]} />
        </View>
        <Text style={[audioBubble.time, { color: timeColor }]}>
          {durationMs > 0
            ? `${formatMs(positionMs)} / ${formatMs(durationMs)}`
            : formatMs(positionMs)}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emptyDesc: { marginTop: theme.spacing.sm },

  messageList: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },

  // ── Bubbles ──
  bubbleRow: { flexDirection: 'row', marginVertical: 2 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: theme.layout.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  bubbleMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleImage: { width: 200, height: 150, borderRadius: theme.layout.radius.md },
  bubbleTextMine: { color: theme.colors.textInverse },
  bubbleTextTheirs: { color: theme.colors.text },
  bubbleTime: { fontSize: 10, marginTop: 2 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  bubbleTimeTheirs: { color: theme.colors.textMuted, textAlign: 'left' },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundBtnPrimary: { backgroundColor: theme.colors.primary },
  roundBtnDanger: { backgroundColor: theme.colors.error },
  roundBtnDisabled: { backgroundColor: theme.colors.border },

  // ── Recording bar ──
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
  },
  recordTimer: {
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
});

const audioBubble = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, minWidth: 180 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnMine: { backgroundColor: 'rgba(255,255,255,0.2)' },
  playBtnTheirs: { backgroundColor: theme.colors.raw.gray100 },
  trackWrap: { flex: 1, gap: 4 },
  track: { height: 4, flexDirection: 'row', borderRadius: 2, overflow: 'hidden' },
  fill: { minWidth: 0 },
  empty: { minWidth: 0 },
  time: { fontSize: 10, fontVariant: ['tabular-nums'] },
});
