import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_ROOT } from '@/api/client';
import { messageService, Message } from '@/services/message.service';

const POLL_INTERVAL_MS = 5_000;

interface UseChatOptions {
  jobId: string;
}

interface UseChatResult {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  hasMore: boolean;
  isConnected: boolean;
  sendText: (content: string) => Promise<void>;
  sendImage: (url: string) => Promise<void>;
  sendAudio: (url: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChat({ jobId }: UseChatOptions): UseChatResult {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSending, setIsSending]   = useState(false);
  const [hasMore, setHasMore]       = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef  = useRef<Socket | null>(null);
  const cursorRef  = useRef<string | undefined>(undefined);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef  = useRef<string | undefined>(undefined);

  const prependMessages = useCallback((incoming: Message[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const novel = incoming.filter((m) => !existingIds.has(m.id));
      return novel.length ? [...prev, ...novel] : prev;
    });
  }, []);

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [msg, ...prev];
    });
    latestIdRef.current = msg.id;
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const result = await messageService.list(jobId);
      // API returns newest-first; inverted FlatList renders index-0 at the bottom,
      // so newest-first array = newest at bottom (correct chat ordering).
      setMessages(result.items);
      setHasMore(result.next_cursor !== null);
      cursorRef.current = result.next_cursor ?? undefined;
      if (result.items.length) latestIdRef.current = result.items[0]?.id;
    } catch {
      // silently ignore — UI shows empty state
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // ── Load older messages ─────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursorRef.current) return;
    try {
      const result = await messageService.list(jobId, cursorRef.current);
      // Older page also comes newest-first; appending to array end puts them
      // at the visual top of the inverted FlatList (older history above).
      prependMessages(result.items);
      setHasMore(result.next_cursor !== null);
      cursorRef.current = result.next_cursor ?? undefined;
    } catch {
      // ignore
    }
  }, [hasMore, jobId, prependMessages]);

  // ── Polling — runs when socket is disconnected ──────────────────────────────
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(async () => {
      try {
        const result = await messageService.list(jobId);
        // Novel messages are newer → prepend to front so inverted list shows them at bottom
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const novel = result.items.filter((m) => !existingIds.has(m.id));
          return novel.length ? [...novel, ...prev] : prev;
        });
      } catch {
        // ignore poll failures
      }
    }, POLL_INTERVAL_MS);
  }, [jobId]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // ── Socket.IO ───────────────────────────────────────────────────────────────
  useEffect(() => {
    void refresh();

    const socket = io(SERVER_ROOT, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      stopPolling();
      socket.emit('join_job', jobId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      startPolling();
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      startPolling();
    });

    socket.on('message', (msg: Message) => {
      appendMessage(msg);
    });

    // If socket doesn't connect quickly, start polling immediately
    const connectTimeout = setTimeout(() => {
      if (!socket.connected) startPolling();
    }, 3_000);

    return () => {
      clearTimeout(connectTimeout);
      socket.emit('leave_job', jobId);
      socket.disconnect();
      socketRef.current = null;
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // ── Send helpers ────────────────────────────────────────────────────────────
  const sendText = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      const msg = await messageService.send(jobId, content.trim(), 'text');
      // Optimistic: socket echo will de-dup, but append immediately for sender
      appendMessage(msg);
    } finally {
      setIsSending(false);
    }
  }, [jobId, appendMessage]);

  const sendImage = useCallback(async (url: string) => {
    setIsSending(true);
    try {
      const msg = await messageService.send(jobId, url, 'image');
      appendMessage(msg);
    } finally {
      setIsSending(false);
    }
  }, [jobId, appendMessage]);

  const sendAudio = useCallback(async (url: string) => {
    setIsSending(true);
    try {
      const msg = await messageService.send(jobId, url, 'audio');
      appendMessage(msg);
    } finally {
      setIsSending(false);
    }
  }, [jobId, appendMessage]);

  return { messages, isLoading, isSending, hasMore, isConnected, sendText, sendImage, sendAudio, loadMore, refresh };
}
