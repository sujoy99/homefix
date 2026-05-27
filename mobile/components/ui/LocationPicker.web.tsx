import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  autoDetect?: boolean;
}

export function LocationPicker({ latitude, longitude, onLocationChange, autoDetect }: LocationPickerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const hasLocation = latitude !== 0 || longitude !== 0;

  useEffect(() => {
    if (autoDetect) requestGPS();
  }, []);

  const requestGPS = () => {
    if (!navigator.geolocation) {
      alert(t('auth.location_error'));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        alert(t('auth.location_permission_denied'));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <View>
      {/* Web map placeholder — full map available on mobile */}
      <View style={styles.mapPlaceholder}>
        {hasLocation ? (
          <>
            <MapPin size={36} color={theme.colors.primary} />
            <Text style={styles.confirmedText}>{t('auth.location_hint')}</Text>
            <Text style={styles.coordsText}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
          </>
        ) : (
          <>
            <MapPin size={36} color={theme.colors.textMuted} />
            <Text style={styles.placeholderText}>{t('auth.get_location')}</Text>
          </>
        )}
        {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 8 }} />}
      </View>

      <Text style={styles.hint}>{t('auth.location_hint')}</Text>

      <TouchableOpacity style={styles.gpsBtn} onPress={requestGPS} disabled={loading}>
        <Navigation size={18} color={theme.colors.primary} />
        <Text style={styles.gpsBtnText}>{t('auth.get_location')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    height: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  confirmedText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  coordsText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  placeholderText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.layout.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  gpsBtnText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});
