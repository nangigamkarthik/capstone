import { create } from 'zustand';

export type ThemeVariant = 'light' | 'dark' | 'midnight' | 'sepia';
export type ThemeMode = ThemeVariant | 'system';

const ACCENT_PRESETS = [
  { name: 'Indigo',  hue: 239 },
  { name: 'Violet',  hue: 270 },
  { name: 'Blue',    hue: 217 },
  { name: 'Cyan',    hue: 180 },
  { name: 'Emerald', hue: 152 },
  { name: 'Rose',    hue: 350 },
  { name: 'Amber',   hue: 38  },
  { name: 'Orange',  hue: 25  },
] as const;

export { ACCENT_PRESETS };

interface ThemeStore {
  mode: ThemeMode;
  resolvedTheme: ThemeVariant;
  accentHue: number;
  setMode: (mode: ThemeMode) => void;
  setAccentHue: (hue: number) => void;
  /** Legacy toggle for Header button — cycles: dark → light → midnight → sepia → dark */
  toggleTheme: () => void;
  /** Alias for backward compat */
  theme: ThemeVariant;
}

function getSystemPreference(): ThemeVariant {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ThemeVariant {
  return mode === 'system' ? getSystemPreference() : mode;
}

function applyTheme(variant: ThemeVariant) {
  const el = document.documentElement;
  el.classList.remove('dark', 'midnight', 'sepia');
  if (variant !== 'light') el.classList.add(variant);
}

function applyAccent(hue: number) {
  document.documentElement.style.setProperty('--accent-hue', String(hue));
}

const CYCLE: ThemeVariant[] = ['dark', 'light', 'midnight', 'sepia'];

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: (localStorage.getItem('theme-mode') as ThemeMode) || 'dark',
  resolvedTheme: resolveTheme((localStorage.getItem('theme-mode') as ThemeMode) || 'dark'),
  accentHue: parseInt(localStorage.getItem('accent-hue') || '239', 10),

  get theme() {
    return get().resolvedTheme;
  },

  setMode: (mode) => {
    const resolved = resolveTheme(mode);
    localStorage.setItem('theme-mode', mode);
    // Keep legacy key in sync for components that read it
    localStorage.setItem('theme', resolved);
    applyTheme(resolved);
    set({ mode, resolvedTheme: resolved });
  },

  setAccentHue: (hue) => {
    localStorage.setItem('accent-hue', String(hue));
    applyAccent(hue);
    set({ accentHue: hue });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    get().setMode(next);
  },
}));

// Initialize on load
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  applyTheme(store.resolvedTheme);
  applyAccent(store.accentHue);

  // Listen for system preference changes when in "system" mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const s = useThemeStore.getState();
    if (s.mode === 'system') {
      const resolved = getSystemPreference();
      applyTheme(resolved);
      useThemeStore.setState({ resolvedTheme: resolved });
    }
  });
}
