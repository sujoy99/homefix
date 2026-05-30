import { PlatformSettingKey } from '@homefix/shared';
import { IPaymentGateway } from './payment.interface';
import { ManualPaymentGateway } from './gateways/manual.gateway';
import { SslCommerzGateway } from './gateways/sslcommerz.gateway';
import { ConfigService } from '@modules/config/config.service';

type GatewayKey = 'manual' | 'sslcommerz';

const GATEWAY_REGISTRY: Record<GatewayKey, () => IPaymentGateway> = {
  manual: () => new ManualPaymentGateway(),
  sslcommerz: () => new SslCommerzGateway(),
};

/**
 * Reads the active gateway key from platform_settings at request time.
 * No redeploy needed to switch gateways — admin updates the DB row.
 */
async function resolveGateway(): Promise<IPaymentGateway> {
  const key = ((await ConfigService.getSetting(PlatformSettingKey.ACTIVE_PAYMENT_GATEWAY)) ?? 'manual') as GatewayKey;
  const factory = GATEWAY_REGISTRY[key] ?? GATEWAY_REGISTRY['manual'];
  return factory();
}

export const paymentService = { resolveGateway };
