import { create } from 'zustand';
import type { ClassroomState, StudentState, TeacherState, Lecture } from '../types';

interface ClassroomStore {
  activeLecture: Lecture | null;
  classroomState: ClassroomState | null;
  students: StudentState[];
  teacher: TeacherState | null;
  sidebarCollapsed: boolean;
  setActiveLecture: (lecture: Lecture | null) => void;
  updateState: (state: ClassroomState) => void;
  toggleSidebar: () => void;
}

export const useClassroomStore = create<ClassroomStore>((set) => ({
  activeLecture: null,
  classroomState: null,
  students: [],
  teacher: null,
  sidebarCollapsed: false,
  setActiveLecture: (lecture) => set({ activeLecture: lecture }),
  updateState: (state) => set({ classroomState: state, students: state.students, teacher: state.teacher }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
