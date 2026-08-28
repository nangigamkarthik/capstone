import { create } from 'zustand';
import type { Notification, Toast } from '../types';

interface NotificationStore {
  notifications: Notification[];
  toasts: Toast[];
  panelOpen: boolean;
  unreadCount: number;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, showToast?: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Engagement Drop Alert',
    message: "Student Alice Smith's engagement dropped below 40%",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    read: false,
    category: 'engagement',
    studentId: 101,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Confusion Spike Detected',
    message: '6 students showing confusion in CS301',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    category: 'emotion',
    lectureId: 201,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Attendance Anomaly',
    message: '3 students absent from scheduled lecture',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: true,
    category: 'attendance',
    lectureId: 202,
  },
  {
    id: '4',
    type: 'info',
    title: 'Copilot Suggestion',
    message: 'Try asking an open question to re-engage students',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
    category: 'copilot',
  },
  {
    id: '5',
    type: 'info',
    title: 'Lecture Started',
    message: 'CS301 Data Structures started in Room 204',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
    category: 'system',
    lectureId: 201,
  },
  {
    id: '6',
    type: 'alert',
    title: 'At-Risk Warning',
    message: 'Bob Jones predicted 78% dropout risk',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    category: 'prediction',
    studentId: 102,
  },
  {
    id: '7',
    type: 'success',
    title: 'Intervention Success',
    message: 'Group activity improved avg engagement by 12%',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    category: 'engagement',
  },
  {
    id: '8',
    type: 'info',
    title: 'System Update',
    message: 'AI models updated to v2.4.1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    category: 'system',
  },
];

const computeUnread = (notifications: Notification[]) =>
  notifications.filter((n) => !n.read).length;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: initialNotifications,
  toasts: [],
  panelOpen: false,
  unreadCount: computeUnread(initialNotifications),

  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  setPanelOpen: (open) => set({ panelOpen: open }),

  addNotification: (notification, showToast = true) => {
    const newNotif: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      return { notifications: updated, unreadCount: computeUnread(updated) };
    });

    if (showToast) {
      get().addToast({
        type: newNotif.type,
        title: newNotif.title,
        message: newNotif.message,
      });
    }
  },

  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    return { notifications: updated, unreadCount: computeUnread(updated) };
  }),

  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map((n) => ({ ...n, read: true }));
    return { notifications: updated, unreadCount: 0 };
  }),

  removeNotification: (id) => set((state) => {
    const updated = state.notifications.filter((n) => n.id !== id);
    return { notifications: updated, unreadCount: computeUnread(updated) };
  }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  addToast: (toast) => {
    const newToast: Toast = {
      ...toast,
      id: generateId(),
    };
    set((state) => ({
      toasts: [...state.toasts, newToast].slice(-3),
    }));

    setTimeout(() => {
      get().removeToast(newToast.id);
    }, 5000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
