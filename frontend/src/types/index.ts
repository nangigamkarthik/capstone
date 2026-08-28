export interface Student { id: number; studentCode: string; fullName: string; createdAt: string; }
export interface Teacher { id: number; employeeCode: string; fullName: string; department: string; }
export interface Lecture { id: number; courseId: number; roomId: number; teacherId: number; title: string; startTime: string; endTime: string | null; status: 'scheduled' | 'active' | 'completed' | 'cancelled'; }
export interface EngagementScore { studentId: number; timestamp: string; attention: number; engagement: number; participation: number; distraction: number; confusion: number; collaboration: number; overallScore: number; }
export type EmotionType = 'happy' | 'neutral' | 'confused' | 'interested' | 'bored' | 'frustrated' | 'surprised';
export interface EmotionSnapshot { studentId: number; timestamp: string; emotions: Record<EmotionType, number>; dominantEmotion: EmotionType; }
export type ActivityType = 'writing' | 'reading' | 'listening' | 'sleeping' | 'talking' | 'using_phone' | 'raising_hand' | 'standing' | 'walking' | 'collaborating' | 'using_laptop';
export type GazeTarget = 'teacher' | 'board' | 'laptop' | 'phone' | 'away' | 'other_student';
export interface ExplanationFactor { factor: string; weight: number; description: string; }
export interface Prediction { studentId: number; predictionType: string; value: number; confidence: number; explanations: ExplanationFactor[]; }
export interface DashboardStats { totalStudents: number; activeClasses: number; avgEngagement: number; avgAttention: number; attendanceRate: number; alertCount: number; }
export interface CopilotSuggestion { id: number; lectureId: number; timestamp: string; suggestionText: string; reasoning: string; priority: 'low' | 'medium' | 'high' | 'critical'; category: string; }
export interface StudentState { id: number; name: string; position: { x: number; y: number; z: number }; rotation: { yaw: number; pitch: number; roll: number }; engagement: number; emotion: EmotionType; activity: ActivityType; gazeTarget: GazeTarget; }
export interface TeacherState { id: number; name: string; position: { x: number; y: number; z: number }; isSpeaking: boolean; boardUsage: boolean; }
export interface EnvironmentState { lighting: number; noise: number; occupancy: number; capacity: number; }
export interface ClassroomState { lectureId: number; timestamp: string; students: StudentState[]; teacher: TeacherState; environment: EnvironmentState; }
export interface TranscriptSegment { startTime: number; endTime: number; speakerType: 'teacher' | 'student' | 'unknown'; text: string; }
export interface TrendData { labels: string[]; datasets: { label: string; data: number[]; color?: string }[]; }
export interface WSMessage<T = unknown> { type: string; data: T; timestamp: string; }

export interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'engagement' | 'attendance' | 'emotion' | 'system' | 'copilot' | 'prediction';
  studentId?: number;
  lectureId?: number;
  actionUrl?: string;
}

export interface Toast {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}
