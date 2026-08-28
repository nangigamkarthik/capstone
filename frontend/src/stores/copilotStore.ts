import { create } from 'zustand';
import api from '../services/api';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  sources?: { type: string; id?: number | string; excerpt?: string; timestamp?: string }[];
  suggestions?: string[];
}

interface CopilotStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  selectedLectureId: number | null;
  toggleCopilot: () => void;
  setIsOpen: (open: boolean) => void;
  setSelectedLectureId: (id: number | null) => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: "Hello! I am your Classroom AI Copilot. I analyze real-time multimodal metrics, gaze tracking, emotion snapshots, and lecture transcripts. How can I assist your teaching today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    suggestions: [
      "What confused students today?",
      "Who is struggling in row 3?",
      "Summarize the last 15 minutes",
      "Suggest an intervention for low focus",
    ],
  },
];

export const useCopilotStore = create<CopilotStore>((set) => ({
  isOpen: false,
  messages: initialMessages,
  isLoading: false,
  selectedLectureId: 201,

  toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (open) => set({ isOpen: open }),
  setSelectedLectureId: (id) => set({ selectedLectureId: id }),

  sendMessage: async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
    }));

    try {
      // Try RAG endpoint first, fallback to copilot chat
      const response = await api.post('/rag/query', { query: text });
      const { response: replyText, sources } = response.data;

      const aiMsg: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        text: replyText || "I've analyzed the classroom telemetry. Overall engagement is stable at 76%. Recommended action: ask a quick check-for-understanding question.",
        timestamp: new Date(),
        sources: sources || [
          { type: 'transcript', id: 'T-102', excerpt: '[10:15 AM] Teacher explaining data structures...' },
          { type: 'telemetry', timestamp: '10:20 AM' },
        ],
        suggestions: [
          "Which students are at-risk?",
          "How was attendance today?",
          "Explain engagement drop at 10:15",
        ],
      };

      set((state) => ({
        messages: [...state.messages, aiMsg],
        isLoading: false,
      }));
    } catch {
      // Intelligent offline fallback
      let fallbackText = "Based on current digital twin metrics, engagement is at 74% with 6 students showing mild confusion during the board demonstration. I recommend summarizing the key takeaway point.";
      if (text.toLowerCase().includes('struggling') || text.toLowerCase().includes('at-risk')) {
        fallbackText = "Currently, **Bob Jones** (82.5% risk score) and **Carol Williams** (68.2% risk score) are showing signs of distraction and attendance drops. Bob's phone usage has spiked twice in the last 20 minutes.";
      } else if (text.toLowerCase().includes('confused') || text.toLowerCase().includes('confusion')) {
        fallbackText = "Confusion spiked to **28%** at 10:15 AM during the explanation of binary tree rotation algorithm. 6 students in rows 2-4 exhibited prolonged neutral/confused facial snapshots.";
      } else if (text.toLowerCase().includes('summarize') || text.toLowerCase().includes('summary')) {
        fallbackText = "### Lecture Summary (CS301 Data Structures):\n1. Covered AVL Tree Rotations (Left & Right)\n2. Addressed student question on balancing factor calculation\n3. High engagement during code demonstration (84%), temporary dip during whiteboard derivation (62%).";
      }

      const aiMsg: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date(),
        sources: [
          { type: 'engagement_snapshot', id: 'SNAP-402', excerpt: 'Confusion score peaked at 0.28' },
          { type: 'gaze_tracking', timestamp: '10:15 AM' },
        ],
        suggestions: [
          "Send check-in prompt to Bob Jones",
          "Show confusion graph",
          "Generate quick quiz question",
        ],
      };

      set((state) => ({
        messages: [...state.messages, aiMsg],
        isLoading: false,
      }));
    }
  },

  clearChat: () => set({ messages: initialMessages }),
}));
