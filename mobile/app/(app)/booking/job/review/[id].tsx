import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { reviewService } from '@/services/review.service';
import { useReviewStore } from '@/store/reviewStore';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

const STAR_COUNT = 5;
const STAR_SIZE = 40;

export default function ReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const markJobReviewed = useReviewStore((s) => s.markJobReviewed);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t('review.error_no_rating'));
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewService.submitReview(id, rating, comment);
      markJobReviewed(id);
      toast.success(t('review.success'));
      router.back();
    } catch (err) {
      const errorCode = (err as { response?: { data?: { error_code?: string } } })
        ?.response?.data?.error_code;
      if (errorCode === 'REVIEW_ALREADY_EXISTS') {
        markJobReviewed(id);
        toast.error(t('review.error_already_submitted'));
        router.back();
      } else if (errorCode === 'REVIEW_NOT_ALLOWED') {
        toast.error(t('review.error_not_allowed'));
        router.back();
      } else {
        toast.error(t('review.error_generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>
          {t('review.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Star rating */}
          <Card style={styles.section}>
            <Text variant="body" weight="semibold" align="center" style={styles.sectionTitle}>
              {t('review.rating_label')}
            </Text>
            <Text variant="caption" color="muted" align="center">
              {t('review.rating_hint')}
            </Text>
            <View style={styles.starsRow}>
              {Array.from({ length: STAR_COUNT }, (_, i) => {
                const starValue = i + 1;
                const filled = starValue <= rating;
                return (
                  <TouchableOpacity
                    key={starValue}
                    onPress={() => setRating(starValue)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={t('review.star_label', { n: starValue })}
                    style={styles.starBtn}
                  >
                    <Star
                      size={STAR_SIZE}
                      color={filled ? theme.colors.secondary : theme.colors.border}
                      fill={filled ? theme.colors.secondary : 'transparent'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            {rating > 0 && (
              <Text variant="caption" color="muted" align="center">
                {t(`review.rating_${rating}`)}
              </Text>
            )}
          </Card>

          {/* Comment */}
          <Card style={styles.section}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              {t('review.comment_label')}
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder={t('review.comment_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
              accessibilityLabel={t('review.comment_label')}
            />
            <Text variant="caption" color="muted" align="right">
              {comment.length}/1000
            </Text>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={isSubmitting ? t('review.submitting') : t('review.submit')}
            variant="primary"
            disabled={isSubmitting || rating === 0}
            isLoading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },
  section: { padding: theme.spacing.md, gap: theme.spacing.sm },
  sectionTitle: { marginBottom: 2 },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  starBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    padding: theme.spacing.md,
    minHeight: 100,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
