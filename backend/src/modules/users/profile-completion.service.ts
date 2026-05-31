import { UserRole } from './user.types';
import { User } from './user.model';
import { ProviderProfileModel } from '@modules/providers/provider_profile.model';
import { ProviderSkillModel } from '@modules/providers/provider_skill.model';
import { ProviderPaymentAccount } from '@modules/payments/wallet/wallet.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompletionItem {
  key: string;
  label_key: string;
  weight: number;
}

export interface ProfileCompletionResult {
  percentage: number;
  meets_threshold: boolean;
  threshold: number | null;
  missing_items: CompletionItem[];
  completed_items: CompletionItem[];
}

export interface ProfileCompletionSummary {
  percentage: number;
  meets_threshold: boolean;
}

// ─── Provider weight table (9 fields, threshold 70%) ─────────────────────────

const PROVIDER_THRESHOLD = 70;

// ─── Resident weight table (5 fields, threshold null = informational) ─────────

const RESIDENT_THRESHOLD = null;

// ─── Service ─────────────────────────────────────────────────────────────────

async function compute(userId: string, role: UserRole): Promise<ProfileCompletionResult> {
  if (role === UserRole.PROVIDER) {
    return computeProvider(userId);
  }
  return computeResident(userId);
}

async function computeProvider(userId: string): Promise<ProfileCompletionResult> {
  const [user, profile, skillCount, mfsCount] = await Promise.all([
    User.query().findById(userId).select(
      'photo_url',
      'nid_photo_url',
      'nid_photo_back_url',
      User.raw('ST_Y(area::geometry) as home_lat'),
    ),
    ProviderProfileModel.query().findOne({ user_id: userId }).select('bio', 'hourly_rate'),
    ProviderSkillModel.query()
      .join('provider_profiles', 'provider_skills.provider_id', 'provider_profiles.id')
      .where('provider_profiles.user_id', userId)
      .resultSize(),
    ProviderPaymentAccount.query().where('user_id', userId).resultSize(),
  ]);

  const checks: Array<{ key: string; weight: number; done: boolean }> = [
    {
      key: 'name_mobile',
      weight: 10,
      done: true, // always filled after registration
    },
    {
      key: 'profile_photo',
      weight: 10,
      done: !!(user?.photo_url),
    },
    {
      key: 'nid_front',
      weight: 8,
      done: !!(user?.nid_photo_url),
    },
    {
      key: 'nid_back',
      weight: 7,
      done: !!(user?.nid_photo_back_url),
    },
    {
      key: 'home_location',
      weight: 10,
      // home_lat is null when area IS NULL
      done: !!(user as unknown as { home_lat: string | null } | undefined)?.home_lat,
    },
    {
      key: 'skills',
      weight: 15,
      done: skillCount >= 1,
    },
    {
      key: 'hourly_rate',
      weight: 10,
      done: !!(profile?.hourly_rate && Number(profile.hourly_rate) > 0),
    },
    {
      key: 'mfs_account',
      weight: 20,
      done: mfsCount >= 1,
    },
    {
      key: 'bio',
      weight: 10,
      done: !!(profile?.bio && profile.bio.length >= 20),
    },
  ];

  return buildResult(checks, PROVIDER_THRESHOLD);
}

async function computeResident(userId: string): Promise<ProfileCompletionResult> {
  const user = await User.query().findById(userId).select(
    'photo_url',
    'email',
    'address',
    User.raw('ST_Y(area::geometry) as home_lat'),
  );

  const checks: Array<{ key: string; weight: number; done: boolean }> = [
    {
      key: 'name_mobile',
      weight: 20,
      done: true,
    },
    {
      key: 'profile_photo',
      weight: 20,
      done: !!(user?.photo_url),
    },
    {
      key: 'home_location',
      weight: 20,
      done: !!(user as unknown as { home_lat: string | null } | undefined)?.home_lat,
    },
    {
      key: 'email',
      weight: 20,
      done: !!(user?.email),
    },
    {
      key: 'address_text',
      weight: 20,
      done: !!(user?.address && (user.address as string).length >= 5),
    },
  ];

  return buildResult(checks, RESIDENT_THRESHOLD);
}

function buildResult(
  checks: Array<{ key: string; weight: number; done: boolean }>,
  threshold: number | null,
): ProfileCompletionResult {
  const completed_items: CompletionItem[] = [];
  const missing_items: CompletionItem[] = [];
  let percentage = 0;

  for (const { key, weight, done } of checks) {
    const item: CompletionItem = {
      key,
      label_key: `profile.completion.${key}`,
      weight,
    };
    if (done) {
      completed_items.push(item);
      percentage += weight;
    } else {
      missing_items.push(item);
    }
  }

  const meets_threshold = threshold !== null ? percentage >= threshold : false;

  return { percentage, meets_threshold, threshold, missing_items, completed_items };
}

function summary(result: ProfileCompletionResult): ProfileCompletionSummary {
  return { percentage: result.percentage, meets_threshold: result.meets_threshold };
}

export const ProfileCompletionService = { compute, summary };
