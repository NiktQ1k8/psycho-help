export const FEATURE_FLAGS = {
  // false — локальные моки; true — API из VITE_REACT_APP_API_URL.
  newsFromBackend: false,
} satisfies Record<string, boolean>;
