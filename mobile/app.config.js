const { withAndroidManifest } = require('@expo/config-plugins');
const base = require('./app.json');

// react-native-maps@1.20.1 ships no app.plugin.js, so we inject the Android
// Google Maps API key ourselves by writing the <meta-data> tag directly.
function withGoogleMapsAndroid(config) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? '';
  return withAndroidManifest(config, (cfg) => {
    const mainApp = cfg.modResults.manifest.application?.[0];
    if (!mainApp) return cfg;
    if (!mainApp['meta-data']) mainApp['meta-data'] = [];
    // Remove stale entry if present, then re-add with the current key.
    mainApp['meta-data'] = mainApp['meta-data'].filter(
      (item) => item.$?.['android:name'] !== 'com.google.android.geo.API_KEY',
    );
    if (apiKey) {
      mainApp['meta-data'].push({
        $: { 'android:name': 'com.google.android.geo.API_KEY', 'android:value': apiKey },
      });
    }
    return cfg;
  });
}

module.exports = {
  ...base.expo,
  extra: {
    eas: { projectId: '5cacb7d0-0871-4264-b6df-f2a051e08421' },
  },
  android: {
    ...base.expo.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#2563EB',
        sounds: [],
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'HomeFix uses your location to set your home address and help providers find you.',
        locationAlwaysAndWhenInUsePermission:
          'HomeFix uses your location in the background to track active service visits.',
      },
    ],
    'expo-web-browser',
    // Injects GOOGLE_MAPS_API_KEY into AndroidManifest.xml at build time.
    // iOS uses Apple Maps (MapKit) by default — no key needed.
    withGoogleMapsAndroid,
  ],
};
