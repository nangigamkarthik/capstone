import { create } from 'zustand';

export interface DashboardWidget {
  id: string;
  label: string;
  group: 'stat' | 'chart' | 'panel';
  visible: boolean;
  /** Grid column span hint: 1 = normal, 2 = wide */
  colSpan: 1 | 2;
}

interface DashboardStore {
  widgets: DashboardWidget[];
  editMode: boolean;
  toggleEditMode: () => void;
  toggleWidget: (id: string) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  resetLayout: () => void;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'stat-students',    label: 'Total Students',       group: 'stat',  visible: true,  colSpan: 1 },
  { id: 'stat-active',      label: 'Active Classes',       group: 'stat',  visible: true,  colSpan: 1 },
  { id: 'stat-engagement',  label: 'Avg Engagement',       group: 'stat',  visible: true,  colSpan: 1 },
  { id: 'stat-attention',   label: 'Avg Attention',        group: 'stat',  visible: true,  colSpan: 1 },
  { id: 'stat-attendance',  label: 'Attendance Rate',      group: 'stat',  visible: true,  colSpan: 1 },
  { id: 'stat-alerts',      label: 'Active Alerts',        group: 'stat',  visible: true,  colSpan: 1 },
  { id: 'chart-engagement', label: 'Engagement Timeline',  group: 'chart', visible: true,  colSpan: 2 },
  { id: 'chart-emotions',   label: 'Emotion Distribution', group: 'chart', visible: true,  colSpan: 1 },
  { id: 'chart-attendance', label: 'Weekly Attendance',     group: 'chart', visible: true,  colSpan: 1 },
  { id: 'panel-risk',       label: 'At-Risk Students',     group: 'panel', visible: true,  colSpan: 1 },
];

const STORAGE_KEY = 'dt_dashboard_layout';

function loadPersistedWidgets(): DashboardWidget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const saved: DashboardWidget[] = JSON.parse(raw);
    // Merge: keep saved order & visibility, but ensure every default widget exists
    const savedMap = new Map(saved.map(w => [w.id, w]));
    const merged: DashboardWidget[] = [];
    // First add saved widgets that still exist in defaults
    for (const sw of saved) {
      const def = DEFAULT_WIDGETS.find(d => d.id === sw.id);
      if (def) merged.push({ ...def, visible: sw.visible });
    }
    // Then add any new default widgets not in saved
    for (const dw of DEFAULT_WIDGETS) {
      if (!savedMap.has(dw.id)) merged.push(dw);
    }
    return merged;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function persist(widgets: DashboardWidget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch { /* ignore quota errors */ }
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  widgets: loadPersistedWidgets(),
  editMode: false,

  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  toggleWidget: (id) =>
    set((s) => {
      const widgets = s.widgets.map(w =>
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      persist(widgets);
      return { widgets };
    }),

  reorderWidgets: (fromIndex, toIndex) =>
    set((s) => {
      if (fromIndex === toIndex) return s;
      const widgets = [...s.widgets];
      const [moved] = widgets.splice(fromIndex, 1);
      widgets.splice(toIndex, 0, moved);
      persist(widgets);
      return { widgets };
    }),

  resetLayout: () =>
    set(() => {
      persist(DEFAULT_WIDGETS);
      return { widgets: [...DEFAULT_WIDGETS] };
    }),
}));
