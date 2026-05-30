import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../components/ui/LanguageToggle';

const SLIDE_KEYS = [
  {
    id: '1',
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    image: require('../../assets/images/onboarding_1.png'),
  },
  {
    id: '2',
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    image: require('../../assets/images/onboarding_2.png'),
  },
  {
    id: '3',
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    image: require('../../assets/images/onboarding_3.png'),
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const { t } = useTranslation();

  const handleNext = () => {
    if (currentIndex < SLIDE_KEYS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <LanguageToggle />
        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
          hitSlop={8}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDE_KEYS}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image
              source={item.image}
              style={[styles.image, { width: width * 0.85, height: height * 0.45 }]}
              resizeMode="cover"
            />
            <View style={styles.content}>
              <Text style={styles.title}>{t(item.titleKey)}</Text>
              <Text style={styles.description}>{t(item.descKey)}</Text>
            </View>
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDE_KEYS.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={currentIndex === SLIDE_KEYS.length - 1 ? t('onboarding.get_started') : t('onboarding.next')}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDE_KEYS.length - 1
              ? t('onboarding.get_started')
              : t('onboarding.next')}
          </Text>
          <ChevronRight color={theme.colors.textInverse} size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  skipText: {
    ...theme.typography.body1,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
  },
  image: {
    borderRadius: theme.layout.radius.xl,
    marginTop: theme.spacing.xl,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body1,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.layout.radius.full,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginRight: theme.spacing.xs,
    fontWeight: '700',
  },
});
