import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  selectedCity: string | null;
  isDetecting: boolean;
  setSelectedCity: (city: string) => void;
  detectLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedCity: null,
      isDetecting: false,
      setSelectedCity: (city) => set({ selectedCity: city }),
      detectLocation: async () => {
        set({ isDetecting: true });
        try {
          if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by your browser');
          }

          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch location details');
          }

          const data = await response.json();
          // Extract city from address
          const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown';
          
          if (city && city !== 'Unknown') {
            set({ selectedCity: city });
          } else {
            console.warn('Could not determine city from coordinates');
          }
        } catch (error: any) {
          // Geolocation is blocked on HTTP (non-HTTPS) connections in modern browsers.
          // This is expected when testing on local network. Fall back silently.
          const code = error?.code;
          if (code === 1) {
            console.warn('Location permission denied by user.');
          } else if (code === 2) {
            console.warn('Location unavailable (may be blocked on HTTP).');
          } else if (code === 3) {
            console.warn('Location request timed out.');
          } else {
            console.warn('Location detection failed:', error?.message || error);
          }
        } finally {
          set({ isDetecting: false });
        }
      },
    }),
    {
      name: 'location-storage',
    }
  )
);
