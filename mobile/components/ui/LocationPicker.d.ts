export interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  autoDetect?: boolean;
}

declare const LocationPicker: React.FC<LocationPickerProps>;
export { LocationPicker };
