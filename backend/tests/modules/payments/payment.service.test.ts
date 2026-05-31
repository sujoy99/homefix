import { ManualPaymentGateway } from '../../../src/modules/payments/gateways/manual.gateway';
import { SslCommerzGateway } from '../../../src/modules/payments/gateways/sslcommerz.gateway';
import { ConfigService } from '../../../src/modules/config/config.service';
import { paymentService } from '../../../src/modules/payments/payment.service';

let spyGetSetting: jest.SpyInstance;

beforeEach(() => {
  spyGetSetting = jest.spyOn(ConfigService, 'getSetting');
});

afterEach(() => jest.restoreAllMocks());

describe('paymentService.resolveGateway()', () => {
  it('returns ManualPaymentGateway when platform_settings value is "manual"', async () => {
    spyGetSetting.mockResolvedValueOnce('manual');
    const gateway = await paymentService.resolveGateway();
    expect(gateway).toBeInstanceOf(ManualPaymentGateway);
  });

  it('returns SslCommerzGateway when platform_settings value is "sslcommerz"', async () => {
    spyGetSetting.mockResolvedValueOnce('sslcommerz');
    const gateway = await paymentService.resolveGateway();
    expect(gateway).toBeInstanceOf(SslCommerzGateway);
  });

  it('falls back to ManualPaymentGateway when platform_settings has no gateway row (null)', async () => {
    spyGetSetting.mockResolvedValueOnce(null);
    const gateway = await paymentService.resolveGateway();
    expect(gateway).toBeInstanceOf(ManualPaymentGateway);
  });

  it('falls back to ManualPaymentGateway when platform_settings value is an unknown key', async () => {
    spyGetSetting.mockResolvedValueOnce('unknown_gateway');
    const gateway = await paymentService.resolveGateway();
    expect(gateway).toBeInstanceOf(ManualPaymentGateway);
  });

  it('calls ConfigService.getSetting with the correct platform settings key', async () => {
    spyGetSetting.mockResolvedValueOnce('manual');
    await paymentService.resolveGateway();
    expect(spyGetSetting).toHaveBeenCalledWith('active_payment_gateway');
  });
});
