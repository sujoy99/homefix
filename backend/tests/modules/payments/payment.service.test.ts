import { ManualPaymentGateway } from '../../../src/modules/payments/gateways/manual.gateway';
import { SslCommerzGateway } from '../../../src/modules/payments/gateways/sslcommerz.gateway';

// Mock ConfigService before importing paymentService so the mock is in place
jest.mock('../../../src/modules/config/config.service', () => ({
  ConfigService: {
    getSetting: jest.fn(),
  },
}));

import { ConfigService } from '../../../src/modules/config/config.service';
import { paymentService } from '../../../src/modules/payments/payment.service';

const mockGetSetting = ConfigService.getSetting as jest.MockedFunction<typeof ConfigService.getSetting>;

describe('paymentService.resolveGateway()', () => {
  it('returns ManualPaymentGateway when platform_settings value is "manual"', async () => {
    mockGetSetting.mockResolvedValueOnce('manual');

    const gateway = await paymentService.resolveGateway();

    expect(gateway).toBeInstanceOf(ManualPaymentGateway);
  });

  it('returns SslCommerzGateway when platform_settings value is "sslcommerz"', async () => {
    mockGetSetting.mockResolvedValueOnce('sslcommerz');

    const gateway = await paymentService.resolveGateway();

    expect(gateway).toBeInstanceOf(SslCommerzGateway);
  });

  it('falls back to ManualPaymentGateway when platform_settings has no gateway row (null)', async () => {
    mockGetSetting.mockResolvedValueOnce(null);

    const gateway = await paymentService.resolveGateway();

    expect(gateway).toBeInstanceOf(ManualPaymentGateway);
  });

  it('falls back to ManualPaymentGateway when platform_settings value is an unknown key', async () => {
    mockGetSetting.mockResolvedValueOnce('unknown_gateway');

    const gateway = await paymentService.resolveGateway();

    expect(gateway).toBeInstanceOf(ManualPaymentGateway);
  });

  it('calls ConfigService.getSetting with the correct platform settings key', async () => {
    mockGetSetting.mockResolvedValueOnce('manual');

    await paymentService.resolveGateway();

    expect(mockGetSetting).toHaveBeenCalledWith('active_payment_gateway');
  });
});
