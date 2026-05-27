# CLAUDE.md — Mobile

This file provides mobile-specific guidance. See root [CLAUDE.md](../CLAUDE.md) for global rules.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 53 + React Native |
| Navigation | Expo Router v4 (file-based) |
| State | Zustand stores |
| Server state | TanStack Query (caching, retry, offline) |
| Forms | React Hook Form + Zod (shared schemas from `packages/shared/`) |
| API | Axios instance in `services/api.ts` with interceptors |
| Auth storage | `expo-secure-store` only — never AsyncStorage for tokens |
| i18n | i18next + react-i18next (Bengali default, English secondary) |
| Animations | react-native-reanimated (not Animated API) |
| Voice | expo-av (recording) + expo-speech (TTS) |

## File-Based Routing (Expo Router)

```
app/
├── _layout.tsx          # Root: providers, theme, auth redirect logic
├── (auth)/              # Unauthenticated group
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx
└── (app)/               # Authenticated group
    ├── _layout.tsx      # Tab navigator
    ├── (home)/
    ├── (bookings)/
    └── (profile)/
```

Screens live in `app/`. Components live in `components/`. Screens never contain business logic — they call hooks/stores.

## Component Pattern

```typescript
// ✅ Good — stateless component using design tokens
import { colors, spacing, typography } from '@/theme';

export function JobCard({ job }: { job: Job }) {
  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.surface }}>
      <Text style={typography.bodyMedium}>{job.title}</Text>
    </View>
  );
}

// ❌ Bad — inline style literals
<View style={{ padding: 16, backgroundColor: '#fff' }}>
```

No inline style numbers or color strings — always use theme tokens from `theme/`.

## State Management

```typescript
// Zustand store pattern
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user, tokens) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// TanStack Query for server data
const { data, isLoading } = useQuery({
  queryKey: ['jobs', categoryId],
  queryFn: () => jobsService.getByCategory(categoryId),
});
```

Zustand: local/persistent client state (auth, preferences, UI).
TanStack Query: all server data (jobs, providers, categories).

## API Service Layer

Screens and hooks **never** import Axios directly. All API calls go through `services/`:

```typescript
// services/auth.service.ts
export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  refresh: (token: string) => api.post<TokenResponse>('/auth/refresh', { refreshToken: token }),
};

// In a hook/screen
const result = await authService.login(data);
```

The Axios instance in `services/api.ts` handles: base URL, auth header injection, 401 → token refresh → retry, `SESSION_EXPIRED` → logout.

## i18n Pattern

```typescript
import { useTranslation } from 'react-i18next';

function LoginScreen() {
  const { t } = useTranslation();
  return <Text>{t('auth.login.title')}</Text>;
}
```

All translation keys live in `i18n/bn.json` (primary) and `i18n/en.json`. Add both keys every time. Currency displays as ৳ (Taka).

## Forms

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@homefix/shared/validation';

const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

Always use shared Zod schemas from `packages/shared/` — never duplicate validation in mobile.

## Accessibility Rules (from SRS)

- Touch targets: minimum 48×48px
- `KeyboardAvoidingView` + `ScrollView` with `flexGrow: 1` on all forms
- No fixed heights on containers — use flex/padding
- Voice CTA (microphone button) always visible on booking screens
- Font sizes must respect system font scale

## Forbidden Patterns

- No inline style literals (use theme tokens)
- No `AsyncStorage` for auth tokens (use `expo-secure-store`)
- No Axios calls in screen components (use `services/`)
- No `Animated` API (use `react-native-reanimated`)
- No hardcoded strings in JSX (use `t('key')`)
- No sensitive data in Zustand persist middleware
