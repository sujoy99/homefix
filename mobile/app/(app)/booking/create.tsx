import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ArrowLeft, ChevronRight, Camera, CheckCircle, X, Home, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { VoiceRecorder } from '@/components/shared/VoiceRecorder';
import { Card } from '@/components/ui/Card';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { categoryService, Category } from '@/services/category.service';
import { jobService, CreateJobPayload } from '@/services/job.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/utils/toast';
import { getApiError } from '@/utils/apiError';
import { theme } from '@/theme';

// ─── Address normaliser: trim + UPPERCASE (Bengali is unaffected; only English chars change) ──
function normalizeAddr(str: string): string {
  return str.trim().toUpperCase();
}

// ─── Step constants ───────────────────────────────────────────────────────────
const STEP_CATEGORY = 0;
const STEP_DESCRIBE = 1;
const STEP_MEDIA = 2;
const STEP_ADDRESS = 3;
const STEP_BUDGET = 4;
const TOTAL_STEPS = 5;

// ─── Local draft type ─────────────────────────────────────────────────────────
type BookingDraft = {
  category_id: string;
  category?: Category;
  title: string;
  description: string;
  photos: ImagePicker.ImagePickerAsset[];
  voiceNote: string | null;
  square_footage: string;
  house: string;
  flat: string;
  road: string;
  area: string;
  estimated_budget: string;
  service_lat: number | null;
  service_lon: number | null;
};

const EMPTY_DRAFT: BookingDraft = {
  category_id: '',
  title: '',
  description: '',
  photos: [],
  voiceNote: null,
  square_footage: '',
  house: '',
  flat: '',
  road: '',
  area: '',
  estimated_budget: '',
  service_lat: null,
  service_lon: null,
};

// ─── Field-level error type ───────────────────────────────────────────────────
type FieldErrors = Partial<Record<keyof BookingDraft | 'budget_invalid' | 'sq_ft_invalid', string>>;

export default function CreateBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(params.categoryId ? STEP_DESCRIBE : STEP_CATEGORY);
  const [draft, setDraft] = useState<BookingDraft>({
    ...EMPTY_DRAFT,
    category_id: params.categoryId ?? '',
    // Pre-fill map from the user's registered home location (populated at login)
    service_lat: user?.homeLat ?? null,
    service_lon: user?.homeLon ?? null,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  // Resolve the selected category object when categoryId is pre-set from params
  const selectedCategory: Category | undefined =
    draft.category
    ?? categories.find((c) => c.id === draft.category_id);

  const requiresArea = selectedCategory?.requires_area ?? false;

  // ── Derived active step (skip area step if not required) ──────────────────
  // We always render STEP_MEDIA but show the sq-footage field conditionally
  // within that step, so no step-skipping logic is needed.

  const patch = (fields: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...fields }));
    // Clear errors for changed fields
    const keys = Object.keys(fields) as (keyof BookingDraft)[];
    if (keys.length) {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  // ── Validation per step ───────────────────────────────────────────────────
  const validateStep = (): boolean => {
    const newErrors: FieldErrors = {};

    if (step === STEP_CATEGORY) {
      if (!draft.category_id) {
        newErrors.category_id = t('booking.select_category_first');
      }
    }

    if (step === STEP_DESCRIBE) {
      if (!draft.description.trim()) {
        newErrors.description = t('booking.description_required');
      } else if (draft.description.trim().length < 10) {
        newErrors.description = t('booking.description_min');
      }
    }

    if (step === STEP_MEDIA && requiresArea) {
      if (!draft.square_footage.trim()) {
        newErrors.square_footage = t('booking.square_footage_required');
      } else if (isNaN(Number(draft.square_footage)) || Number(draft.square_footage) <= 0) {
        newErrors.square_footage = t('booking.square_footage_invalid');
      }
    }

    if (step === STEP_ADDRESS) {
      if (!draft.house.trim()) newErrors.house = t('booking.house_required');
      if (!draft.road.trim()) newErrors.road = t('booking.road_required');
      if (!draft.area.trim()) newErrors.area = t('booking.area_required');
    }

    if (step === STEP_BUDGET) {
      if (draft.estimated_budget.trim() && (
        isNaN(Number(draft.estimated_budget)) || Number(draft.estimated_budget) <= 0
      )) {
        newErrors.estimated_budget = t('booking.budget_invalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Reverse-geocode a coordinate and fill the area field ──────────────────
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      const place = results[0];
      if (place) {
        const area = place.district ?? place.subregion ?? place.city ?? place.name ?? '';
        if (area) patch({ area: normalizeAddr(area) });
      }
    } catch {
      // silently ignore — user can type the area manually
    }
  }, []);

  const handleLocationChange = useCallback((lat: number, lon: number) => {
    patch({ service_lat: lat, service_lon: lon });
    reverseGeocode(lat, lon);
  }, [reverseGeocode]);

  // ── Forward-geocode: "Find on Map" button → Nominatim/OSM ────────────────
  // Strategy: try (road + area), then area-only, then road-only.
  // OSM Bangladesh has good area/thana coverage but sparse road/building data,
  // so the fallback puts the pin in the right neighbourhood even when the
  // specific road isn't indexed (e.g. "Lucas More, Farmgate" → falls back to
  // "Farmgate, Bangladesh" which OSM knows).
  const handleFindOnMap = async () => {
    const road = draft.road.trim();
    const area = draft.area.trim();
    if (!road && !area) {
      toast.error(t('booking.geocode_needs_address'));
      return;
    }
    setIsGeocoding(true);

    const nominatim = async (q: string): Promise<{ lat: string; lon: string } | null> => {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}&format=json&countrycodes=bd&limit=1`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'HomeFix-App/1.0' } });
      const data: { lat: string; lon: string }[] = await resp.json();
      return data[0] ?? null;
    };

    try {
      // Attempt 1 — full address
      let hit = road && area ? await nominatim(`${road}, ${area}, Bangladesh`) : null;
      // Attempt 2 — area only (most reliable for BD neighbourhoods)
      if (!hit && area) hit = await nominatim(`${area}, Bangladesh`);
      // Attempt 3 — road only
      if (!hit && road) hit = await nominatim(`${road}, Bangladesh`);

      if (hit) {
        patch({ service_lat: parseFloat(hit.lat), service_lon: parseFloat(hit.lon) });
      } else {
        toast.info(t('booking.geocode_not_found'));
      }
    } catch {
      toast.error(t('booking.geocode_error'));
    } finally {
      setIsGeocoding(false);
    }
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > (params.categoryId ? STEP_DESCRIBE : STEP_CATEGORY)) {
      setStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  // ── Photo picker ──────────────────────────────────────────────────────────
  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error(t('common.error'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      patch({ photos: result.assets.slice(0, 5) });
    }
  };

  const removePhoto = (index: number) => {
    patch({ photos: draft.photos.filter((_, i) => i !== index) });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep()) return;

    // Guard: verify all required fields are present regardless of which step
    // the user navigated through (e.g. deep-link entry, back-navigation edge cases)
    const allErrors: FieldErrors = {};
    if (!draft.category_id) allErrors.category_id = t('booking.select_category_first');
    if (!draft.description.trim()) allErrors.description = t('booking.description_required');
    else if (draft.description.trim().length < 10) allErrors.description = t('booking.description_min');
    if (!draft.house.trim()) allErrors.house = t('booking.house_required');
    if (!draft.road.trim()) allErrors.road = t('booking.road_required');
    if (!draft.area.trim()) allErrors.area = t('booking.area_required');
    if (requiresArea && !draft.square_footage.trim()) allErrors.square_footage = t('booking.square_footage_required');

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Navigate back to the first step that has an error
      const errorStep =
        allErrors.category_id                                   ? STEP_CATEGORY :
        allErrors.description                                    ? STEP_DESCRIBE :
        allErrors.square_footage                                 ? STEP_MEDIA   :
        (allErrors.house || allErrors.road || allErrors.area)   ? STEP_ADDRESS  :
        STEP_BUDGET;
      setStep(errorStep);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateJobPayload = {
        category_id: draft.category_id,
        description: draft.description.trim(),
        service_address: {
          house: normalizeAddr(draft.house),
          flat: normalizeAddr(draft.flat) || undefined,
          road: normalizeAddr(draft.road),
          area: normalizeAddr(draft.area),
        },
        service_lat: draft.service_lat ?? undefined,
        service_lon: draft.service_lon ?? undefined,
      };
      if (draft.title.trim()) payload.title = normalizeAddr(draft.title);
      if (draft.estimated_budget.trim()) payload.estimated_budget = Number(draft.estimated_budget);
      if (requiresArea && draft.square_footage.trim()) payload.square_footage = Number(draft.square_footage);

      const job = await jobService.createJob(payload);

      // Upload photos if any (separate try so a photo failure doesn't lose the job)
      if (draft.photos.length > 0) {
        try {
          await jobService.uploadMedia(job.id, draft.photos);
        } catch {
          toast.error(t('booking.error_media'));
        }
      }

      // Upload voice note if recorded (separate try so failure doesn't lose the job)
      if (draft.voiceNote) {
        try {
          await jobService.uploadVoiceNote(job.id, draft.voiceNote);
        } catch {
          toast.error(t('booking.error_voice'));
        }
      }

      toast.success(t('booking.success_title'));
      router.replace('/(app)/(tabs)/bookings' as never);
    } catch (err) {
      toast.error(getApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderStepCategory = () => (
    <View style={styles.stepContent}>
      <Text variant="h4" weight="semibold" style={styles.stepHeading}>
        {t('booking.category_hint')}
      </Text>
      {loadingCategories ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : categories.length === 0 ? (
        <Text variant="body" color="muted" align="center">{t('booking.no_categories')}</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = draft.category_id === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                onPress={() => patch({ category_id: item.id, category: item })}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  variant="body"
                  weight={isSelected ? 'semibold' : 'regular'}
                  color={isSelected ? 'primary' : 'default'}
                  style={styles.categoryName}
                >
                  {item.name}
                </Text>
                {isSelected && (
                  <CheckCircle color={theme.colors.primary} size={20} />
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      {errors.category_id ? (
        <Text variant="caption" color="error" style={styles.fieldError}>
          {errors.category_id}
        </Text>
      ) : null}
    </View>
  );

  const renderStepDescribe = () => (
    <View style={styles.stepContent}>
      {/* Optional title */}
      <Text variant="body" weight="medium" style={styles.fieldLabel}>
        {t('booking.title_label')}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={t('booking.title_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={draft.title}
        onChangeText={(v) => patch({ title: v })}
        maxLength={200}
        returnKeyType="next"
      />

      {/* Description */}
      <Text variant="body" weight="medium" style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
        {t('booking.description_label')}
        <Text variant="body" color="error"> *</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
        placeholder={t('booking.description_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={draft.description}
        onChangeText={(v) => patch({ description: v })}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        maxLength={2000}
      />
      {errors.description ? (
        <Text variant="caption" color="error" style={styles.fieldError}>{errors.description}</Text>
      ) : null}

      {/* Voice note — always visible per design mandate (REQ-011) */}
      <VoiceRecorder onRecorded={(uri) => patch({ voiceNote: uri })} />
    </View>
  );

  const renderStepMedia = () => (
    <View style={styles.stepContent}>
      {/* Area input — only if requires_area */}
      {requiresArea && (
        <>
          <View style={styles.areaHintRow}>
            <Text variant="body" weight="medium" style={styles.fieldLabel}>
              {t('booking.square_footage_label')}
              <Text variant="body" color="error"> *</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, errors.square_footage ? styles.inputError : null]}
            placeholder={t('booking.square_footage_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={draft.square_footage}
            onChangeText={(v) => patch({ square_footage: v })}
            keyboardType="numeric"
            returnKeyType="done"
          />
          {errors.square_footage ? (
            <Text variant="caption" color="error" style={styles.fieldError}>{errors.square_footage}</Text>
          ) : null}
          <View style={styles.divider} />
        </>
      )}

      {/* Photo picker */}
      <Text variant="body" weight="medium" style={styles.fieldLabel}>
        {t('booking.add_photos')}
      </Text>
      <Text variant="caption" color="muted" style={styles.hintText}>
        {t('booking.add_photos_hint')}
      </Text>

      {draft.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {draft.photos.map((photo, idx) => (
            <View key={photo.uri} style={styles.photoThumb}>
              <Image source={{ uri: photo.uri }} style={styles.thumbImage} />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => removePhoto(idx)}
                hitSlop={16}
                accessibilityRole="button"
                accessibilityLabel={t('booking.remove_photo', { index: idx + 1 })}
              >
                <X color={theme.colors.textInverse} size={14} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {draft.photos.length < 5 && (
        <TouchableOpacity
          style={styles.photoPickerBtn}
          onPress={pickPhotos}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('booking.add_photos')}
          accessibilityHint={t('booking.add_photos_hint')}
        >
          <Camera color={theme.colors.primary} size={22} />
          <Text variant="body" color="primary" weight="medium" style={styles.photoPickerText}>
            {draft.photos.length === 0
              ? t('booking.add_photos')
              : t('booking.photo_added', { count: draft.photos.length })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStepAddress = () => (
    <View style={styles.stepContent}>
      {/* Map picker */}
      <Text variant="body" weight="medium" style={styles.fieldLabel}>
        {t('booking.map_label')}
      </Text>
      <Text variant="caption" color="muted" style={styles.hintText}>
        {t('booking.map_hint')}
      </Text>

      {/* "Use my home address" shortcut */}
      {user?.homeLat && user?.homeLon && (
        <TouchableOpacity
          style={styles.homeAddressBtn}
          onPress={() => {
            patch({ service_lat: user.homeLat!, service_lon: user.homeLon! });
            reverseGeocode(user.homeLat!, user.homeLon!);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('booking.use_home_address')}
        >
          <Home color={theme.colors.primary} size={15} />
          <Text variant="caption" weight="semibold" color="primary" style={styles.homeAddressBtnText}>
            {t('booking.use_home_address')}
          </Text>
        </TouchableOpacity>
      )}

      <LocationPicker
        latitude={draft.service_lat ?? 0}
        longitude={draft.service_lon ?? 0}
        onLocationChange={handleLocationChange}
        autoDetect={draft.service_lat === null && draft.service_lon === null}
      />

      <View style={styles.divider} />

      {/* House */}
      <Text variant="body" weight="medium" style={styles.fieldLabel}>
        {t('booking.house_label')}<Text variant="body" color="error"> *</Text>
      </Text>
      <TextInput
        style={[styles.input, errors.house ? styles.inputError : null]}
        placeholder={t('booking.house_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={draft.house}
        onChangeText={(v) => patch({ house: v })}
        returnKeyType="next"
      />
      {errors.house ? (
        <Text variant="caption" color="error" style={styles.fieldError}>{errors.house}</Text>
      ) : null}

      {/* Flat */}
      <Text variant="body" weight="medium" style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
        {t('booking.flat_label')}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={t('booking.flat_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={draft.flat}
        onChangeText={(v) => patch({ flat: v })}
        returnKeyType="next"
      />

      {/* Road */}
      <Text variant="body" weight="medium" style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
        {t('booking.road_label')}<Text variant="body" color="error"> *</Text>
      </Text>
      <TextInput
        style={[styles.input, errors.road ? styles.inputError : null]}
        placeholder={t('booking.road_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={draft.road}
        onChangeText={(v) => patch({ road: v })}
        returnKeyType="next"
      />
      {errors.road ? (
        <Text variant="caption" color="error" style={styles.fieldError}>{errors.road}</Text>
      ) : null}

      {/* Area — updated by reverse geocoding but also manually editable */}
      <Text variant="body" weight="medium" style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
        {t('booking.area_label')}<Text variant="body" color="error"> *</Text>
      </Text>
      <TextInput
        style={[styles.input, errors.area ? styles.inputError : null]}
        placeholder={t('booking.area_placeholder')}
        placeholderTextColor={theme.colors.textMuted}
        value={draft.area}
        onChangeText={(v) => patch({ area: v })}
        returnKeyType="done"
      />
      {errors.area ? (
        <Text variant="caption" color="error" style={styles.fieldError}>{errors.area}</Text>
      ) : null}

      {/* Find on Map button — forward geocodes road+area → moves map marker */}
      <TouchableOpacity
        style={[styles.findOnMapBtn, isGeocoding && styles.findOnMapBtnDisabled]}
        onPress={handleFindOnMap}
        disabled={isGeocoding}
        activeOpacity={0.7}
      >
        {isGeocoding
          ? <ActivityIndicator size="small" color={theme.colors.primary} />
          : <MapPin color={theme.colors.primary} size={16} />
        }
        <Text variant="body" weight="semibold" color="primary" style={styles.findOnMapText}>
          {isGeocoding ? t('booking.geocoding') : t('booking.find_on_map')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepBudget = () => {
    const catName = selectedCategory?.name ?? draft.category_id;
    const addressLine = [
      draft.house,
      draft.flat,
      draft.road,
      draft.area,
    ].filter(Boolean).join(', ');

    return (
      <View style={styles.stepContent}>
        {/* Budget input */}
        <Text variant="body" weight="medium" style={styles.fieldLabel}>
          {t('booking.budget_label')}
        </Text>
        <TextInput
          style={[styles.input, errors.estimated_budget ? styles.inputError : null]}
          placeholder={t('booking.budget_placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={draft.estimated_budget}
          onChangeText={(v) => patch({ estimated_budget: v })}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {errors.estimated_budget ? (
          <Text variant="caption" color="error" style={styles.fieldError}>{errors.estimated_budget}</Text>
        ) : null}

        {/* Review summary */}
        <View style={styles.divider} />
        <Text variant="h4" weight="semibold" style={styles.reviewTitle}>
          {t('booking.review_title')}
        </Text>

        <Card style={styles.reviewCard}>
          <ReviewRow label={t('booking.review_category')} value={catName} />
          {draft.title.trim() ? (
            <ReviewRow label={t('booking.title_label')} value={draft.title.trim()} />
          ) : null}
          <ReviewRow label={t('booking.review_description')} value={draft.description.trim()} multiline />
          {requiresArea && draft.square_footage.trim() ? (
            <ReviewRow
              label={t('booking.review_area')}
              value={`${draft.square_footage} ${t('booking.sq_ft')}`}
            />
          ) : null}
          <ReviewRow label={t('booking.review_address')} value={addressLine} />
          {draft.photos.length > 0 ? (
            <ReviewRow
              label={t('booking.review_photos')}
              value={t('booking.review_photos_count', { count: draft.photos.length })}
            />
          ) : null}
          <ReviewRow
            label={t('booking.review_budget')}
            value={
              draft.estimated_budget.trim()
                ? `৳${draft.estimated_budget.trim()}`
                : t('booking.review_budget_tbd')
            }
          />
        </Card>
      </View>
    );
  };

  const stepTitle = [
    t('booking.step_category'),
    t('booking.step_describe'),
    t('booking.step_media'),
    t('booking.step_address'),
    t('booking.step_budget'),
  ][step];

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    // KeyboardAvoidingView wraps the full screen so the footer rises above the keyboard
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft color={theme.colors.text} size={22} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text variant="h4" weight="bold" numberOfLines={1}>{t('booking.title')}</Text>
            <Text variant="caption" color="muted">
              {t('booking.step_of', { current: step + 1, total: TOTAL_STEPS })}
            </Text>
          </View>
          <View style={styles.headerBtn} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((step + 1) / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>

        {/* Step heading chip */}
        <View style={styles.stepLabelRow}>
          <Text variant="caption" weight="semibold" color="primary">{stepTitle}</Text>
        </View>

        {/* Scrollable step content */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === STEP_CATEGORY && renderStepCategory()}
          {step === STEP_DESCRIBE && renderStepDescribe()}
          {step === STEP_MEDIA && renderStepMedia()}
          {step === STEP_ADDRESS && renderStepAddress()}
          {step === STEP_BUDGET && renderStepBudget()}
        </ScrollView>

        {/* Footer CTA — in normal flex flow so it rises above keyboard */}
        <View style={styles.footer}>
          {isLastStep ? (
            <Button
              label={isSubmitting ? t('booking.submitting') : t('booking.submit')}
              variant="secondary"
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          ) : (
            <Button
              label={t('common.next')}
              variant="primary"
              onPress={goNext}
              rightIcon={<ChevronRight color={theme.colors.textInverse} size={18} />}
            />
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Small helper component ───────────────────────────────────────────────────
function ReviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={reviewStyles.row}>
      <Text variant="caption" color="muted" style={reviewStyles.label}>{label}</Text>
      <Text
        variant="body"
        weight="medium"
        style={reviewStyles.value}
        numberOfLines={multiline ? undefined : 2}
      >
        {value}
      </Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: { marginBottom: 2 },
  value: {},
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: theme.colors.primary,
  },
  stepLabelRow: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
    paddingBottom: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    marginBottom: theme.spacing.md,
  },
  // Category list
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.layout.radius.md,
  },
  categoryRowSelected: {
    backgroundColor: theme.colors.raw.primaryLight + '22',
  },
  categoryName: { flex: 1 },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  loader: { marginTop: theme.spacing.xl },
  // Form fields
  fieldLabel: {
    marginBottom: theme.spacing.xs,
  },
  fieldLabelSpaced: {
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body1,
    color: theme.colors.text,
    minHeight: 48,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    minHeight: 120,
    paddingTop: theme.spacing.sm,
  },
  fieldError: {
    marginTop: 4,
    color: theme.colors.error,
  },
  // Photos
  areaHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    marginBottom: theme.spacing.sm,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: theme.layout.radius.md,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: 80,
    height: 80,
    borderRadius: theme.layout.radius.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.layout.radius.md,
    borderStyle: 'dashed',
    marginTop: theme.spacing.xs,
  },
  photoPickerText: {
    flex: 1,
  },
  homeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  homeAddressBtnText: {
    marginLeft: 2,
  },
  findOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.layout.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  findOnMapBtnDisabled: {
    opacity: 0.6,
  },
  findOnMapText: {
    flex: 1,
    textAlign: 'center',
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  // Review
  reviewTitle: {
    marginBottom: theme.spacing.md,
  },
  reviewCard: {
    padding: theme.spacing.md,
  },
  // Footer
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
