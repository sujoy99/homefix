export interface IPushProvider {
  /** Send to a single FCM token. Resolves on success, rejects on delivery error. */
  send(token: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}
