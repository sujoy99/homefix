import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { callService } from '@/services/call.service';
import { toast } from '@/utils/toast';

export interface UseVoiceCallResult {
  startCall: () => Promise<void>;
  isCallLoading: boolean;
}

export function useVoiceCall(jobId: string): UseVoiceCallResult {
  const { t } = useTranslation();
  const [isCallLoading, setIsCallLoading] = useState(false);

  const startCall = async () => {
    setIsCallLoading(true);
    try {
      const config = await callService.createRoom(jobId);
      const url = callService.buildCallUrl(config);
      await WebBrowser.openBrowserAsync(url);
    } catch {
      toast.error(t('call.error_start'));
    } finally {
      setIsCallLoading(false);
    }
  };

  return { startCall, isCallLoading };
}
