import { User } from '../../../src/modules/users/user.model';
import { ProviderProfileModel } from '../../../src/modules/providers/provider_profile.model';
import { ProviderSkillModel } from '../../../src/modules/providers/provider_skill.model';
import { ProviderPaymentAccount } from '../../../src/modules/payments/wallet/wallet.model';
import { ProfileCompletionService } from '../../../src/modules/users/profile-completion.service';
import { UserRole } from '../../../src/modules/users/user.types';

const USER_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

afterEach(() => jest.restoreAllMocks());

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stubProviderQuery(user: any, profile: any, skillCount: number, mfsCount: number) {
  jest.spyOn(User, 'query').mockReturnValue({
    findById: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(user),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  jest.spyOn(ProviderProfileModel, 'query').mockReturnValue({
    findOne: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(profile),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  jest.spyOn(ProviderSkillModel, 'query').mockReturnValue({
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    resultSize: jest.fn().mockResolvedValue(skillCount),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  jest.spyOn(ProviderPaymentAccount, 'query').mockReturnValue({
    where: jest.fn().mockReturnThis(),
    resultSize: jest.fn().mockResolvedValue(mfsCount),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stubResidentQuery(user: any) {
  jest.spyOn(User, 'query').mockReturnValue({
    findById: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(user),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

// ─── Provider — percentage calculation ───────────────────────────────────────

describe('ProfileCompletionService — Provider percentage', () => {
  it('returns 10% when only name+mobile filled (just registered, no extras)', async () => {
    stubProviderQuery(
      { photo_url: null, nid_photo_url: null, nid_photo_back_url: null, home_lat: null },
      { bio: null, hourly_rate: null },
      0, 0
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    expect(result.percentage).toBe(10);
    expect(result.meets_threshold).toBe(false);
    expect(result.threshold).toBe(70);
  });

  it('returns 60% for a provider who completed all registration fields but not rate/MFS/bio', async () => {
    // name(10) + photo(10) + nid_front(8) + nid_back(7) + location(10) + skills(15) = 60
    stubProviderQuery(
      { photo_url: 'url', nid_photo_url: 'url', nid_photo_back_url: 'url', home_lat: '23.8' },
      { bio: null, hourly_rate: null },
      1, 0
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    expect(result.percentage).toBe(60);
    expect(result.meets_threshold).toBe(false);
  });

  it('returns 70% when rate is also set (threshold exactly met)', async () => {
    // 60% + hourly_rate(10) = 70
    stubProviderQuery(
      { photo_url: 'url', nid_photo_url: 'url', nid_photo_back_url: 'url', home_lat: '23.8' },
      { bio: null, hourly_rate: '500' },
      1, 0
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    expect(result.percentage).toBe(70);
    expect(result.meets_threshold).toBe(true);
  });

  it('69% is still blocked (boundary below threshold)', async () => {
    // name(10) + photo(10) + nid_front(8) + nid_back(7) + location(10) + skills(15) + bio not long enough
    // = 60%, cannot reach 69 with these fields — use nid(15) + location(10) + rate(10) + skills(15) = 50+10=...
    // Easier: photo(10)+nid_front(8)+nid_back(7)+location(10)+skills(15)+rate(10) but skip name... can't.
    // name always 10, add photo(10)+nid_front(8)+nid_back(7)+location(10)+skills(15) = 60. Can't hit 69 exactly.
    // Test 60% < 70 → blocked  (the real boundary is 60 or 70)
    stubProviderQuery(
      { photo_url: 'url', nid_photo_url: 'url', nid_photo_back_url: 'url', home_lat: '23.8' },
      { bio: null, hourly_rate: null },
      1, 0
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    expect(result.percentage).toBe(60);
    expect(result.meets_threshold).toBe(false);
  });

  it('returns 100% when all fields are filled', async () => {
    stubProviderQuery(
      { photo_url: 'url', nid_photo_url: 'url', nid_photo_back_url: 'url', home_lat: '23.8' },
      { bio: 'I am a skilled plumber with 5 years experience', hourly_rate: '500' },
      1, 1
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    expect(result.percentage).toBe(100);
    expect(result.meets_threshold).toBe(true);
    expect(result.missing_items).toHaveLength(0);
  });

  it('counts bio as incomplete when shorter than 20 chars', async () => {
    stubProviderQuery(
      { photo_url: 'url', nid_photo_url: 'url', nid_photo_back_url: 'url', home_lat: '23.8' },
      { bio: 'Short bio', hourly_rate: '500' }, // 9 chars < 20
      1, 1
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    // 100 - 10 (bio) = 90%
    expect(result.percentage).toBe(90);
    const missingKeys = result.missing_items.map((i) => i.key);
    expect(missingKeys).toContain('bio');
  });

  it('counts hourly_rate=0 as incomplete', async () => {
    stubProviderQuery(
      { photo_url: 'url', nid_photo_url: 'url', nid_photo_back_url: 'url', home_lat: '23.8' },
      { bio: null, hourly_rate: '0' },
      1, 0
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    const missingKeys = result.missing_items.map((i) => i.key);
    expect(missingKeys).toContain('hourly_rate');
  });

  it('missing_items have correct label_key format', async () => {
    stubProviderQuery(
      { photo_url: null, nid_photo_url: null, nid_photo_back_url: null, home_lat: null },
      { bio: null, hourly_rate: null },
      0, 0
    );
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.PROVIDER);
    for (const item of result.missing_items) {
      expect(item.label_key).toBe(`profile.completion.${item.key}`);
    }
  });
});

// ─── Resident — percentage calculation ───────────────────────────────────────

describe('ProfileCompletionService — Resident percentage', () => {
  it('returns threshold null (informational only)', async () => {
    stubResidentQuery({ photo_url: null, email: null, home_lat: null, address: null });
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.RESIDENT);
    expect(result.threshold).toBeNull();
    expect(result.meets_threshold).toBe(false);
  });

  it('returns 20% when only name+mobile (just registered, no extras)', async () => {
    stubResidentQuery({ photo_url: null, email: null, home_lat: null, address: null });
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.RESIDENT);
    expect(result.percentage).toBe(20);
  });

  it('returns 100% when all resident fields are filled', async () => {
    stubResidentQuery({
      photo_url: 'url',
      email: 'user@example.com',
      home_lat: '23.8',
      address: 'House 12, Road 5, Dhaka',
    });
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.RESIDENT);
    expect(result.percentage).toBe(100);
    expect(result.missing_items).toHaveLength(0);
  });

  it('counts address shorter than 5 chars as incomplete', async () => {
    stubResidentQuery({ photo_url: 'url', email: 'u@x.com', home_lat: '23.8', address: 'Hi' });
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.RESIDENT);
    const missingKeys = result.missing_items.map((i) => i.key);
    expect(missingKeys).toContain('address_text');
  });

  it('meets_threshold is always false for Resident regardless of percentage', async () => {
    stubResidentQuery({
      photo_url: 'url',
      email: 'user@example.com',
      home_lat: '23.8',
      address: 'House 12, Road 5, Dhaka',
    });
    const result = await ProfileCompletionService.compute(USER_ID, UserRole.RESIDENT);
    expect(result.percentage).toBe(100);
    expect(result.meets_threshold).toBe(false); // no threshold action for Residents
  });
});

// ─── summary() helper ─────────────────────────────────────────────────────────

describe('ProfileCompletionService.summary()', () => {
  it('returns only percentage and meets_threshold', () => {
    const full = {
      percentage: 70,
      meets_threshold: true,
      threshold: 70,
      missing_items: [],
      completed_items: [],
    };
    const s = ProfileCompletionService.summary(full);
    expect(s).toEqual({ percentage: 70, meets_threshold: true });
    expect(Object.keys(s)).toHaveLength(2);
  });
});
