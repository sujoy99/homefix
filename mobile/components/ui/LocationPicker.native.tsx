import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, MapPinOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';

// Catches native crashes from MapView when the Google Maps API key is absent.
// Without the key, Maps SDK throws at render time on Android; this boundary
// downgrades to a "Map unavailable" placeholder so the rest of the form still works.
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) {
      return (
        <View style={mapFallbackStyles.box}>
          <MapPinOff size={32} color={theme.colors.textMuted} />
          <Text style={mapFallbackStyles.title}>Map unavailable</Text>
          <Text style={mapFallbackStyles.hint}>
            Google Maps API key not configured.{'\n'}
            Use the GPS button or type your address below.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const mapFallbackStyles = StyleSheet.create({
  box: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.body2,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  autoDetect?: boolean;
}

const DHAKA_REGION: Region = {
  latitude: 23.8103,
  longitude: 90.4125,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function LocationPicker({ latitude, longitude, onLocationChange, autoDetect }: LocationPickerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(DHAKA_REGION);

  const hasLocation = latitude !== 0 || longitude !== 0;

  useEffect(() => {
    if (autoDetect) requestGPS();
  }, []);

  const requestGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('auth.location_permission_denied'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      onLocationChange(lat, lng);
      setMapRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      Alert.alert(t('common.error'), t('auth.location_error'));
    } finally {
      setLoading(false);
    }
  };

  const markerCoords = hasLocation
    ? { latitude, longitude }
    : { latitude: DHAKA_REGION.latitude, longitude: DHAKA_REGION.longitude };

  return (
    <View>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('auth.location_loading')}</Text>
        </View>
      ) : (
        <MapErrorBoundary>
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={(region) => setMapRegion(region)}
            onPress={(e) => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
              onLocationChange(lat, lng);
            }}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={markerCoords}
              draggable
              onDragEnd={(e) => {
                const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                onLocationChange(lat, lng);
              }}
              pinColor={theme.colors.primary}
            />
          </MapView>
        </MapErrorBoundary>
      )}

      {hasLocation && (
        <Text style={styles.coords}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
      )}

      <Text style={styles.hint}>{t('auth.location_hint')}</Text>

      <TouchableOpacity
        style={styles.gpsBtn}
        onPress={requestGPS}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t('auth.get_location')}
        accessibilityHint={t('auth.location_hint')}
      >
        <Navigation size={18} color={theme.colors.primary} />
        <Text style={styles.gpsBtnText}>{t('auth.get_location')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  map: {
    height: 240,
    borderRadius: theme.layout.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  coords: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
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
