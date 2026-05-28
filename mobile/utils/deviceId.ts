import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'homefix_device_id';

function generateDeviceId(): string {
  return `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Returns a stable device identifier, generating and persisting one on first call.
 */
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}
