// Web Speech API Voice Assistant Service for CogniClass

export interface VoiceCommandRule {
  phrases: string[];
  description: string;
  action: (matchedPhrase: string, speechResult: string) => void;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'unsupported';

type VoiceStateListener = (state: VoiceState, lastTranscript: string) => void;

class VoiceAssistantService {
  private recognition: any = null;
  private isListening = false;
  private state: VoiceState = 'idle';
  private lastTranscript = '';
  private rules: VoiceCommandRule[] = [];
  private stateListeners: Set<VoiceStateListener> = new Set();
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.initListeners();
      } else {
        this.state = 'unsupported';
      }
    }
  }

  private initListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.setState('listening');
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = (final || interim).toLowerCase().trim();
      this.lastTranscript = text;
      this.notifyListeners();

      if (final) {
        this.processVoiceText(final.toLowerCase().trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('Voice Assistant error:', event.error);
      }
    };

    this.recognition.onend = () => {
      // Auto restart if still supposed to be listening
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch {
          this.isListening = false;
          this.setState('idle');
        }
      } else {
        this.setState('idle');
      }
    };
  }

  public registerCommand(rule: VoiceCommandRule) {
    this.rules.push(rule);
  }

  private processVoiceText(text: string) {
    this.setState('processing');

    // Wake word check: "hey cogni", "cogni", or direct command
    const cleanText = text.replace(/^(hey cogni|cogni|ok cogni|alexa|siri|computer)[,\s]*/i, '');

    for (const rule of this.rules) {
      for (const phrase of rule.phrases) {
        if (cleanText.includes(phrase) || text.includes(phrase)) {
          rule.action(phrase, text);
          this.setState('listening');
          return;
        }
      }
    }

    this.setState('listening');
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) utterance.voice = preferredVoice;

    this.setState('speaking');
    utterance.onend = () => {
      if (onEnd) onEnd();
      this.setState(this.isListening ? 'listening' : 'idle');
    };

    this.synth.speak(utterance);
  }

  public toggleListening() {
    if (this.state === 'unsupported') return;

    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.isListening = true;
      this.recognition.start();
      this.speak("Voice Assistant listening. Say a command or ask a question.");
    } catch {
      this.isListening = false;
      this.setState('idle');
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
    }
    if (this.synth) this.synth.cancel();
    this.setState('idle');
  }

  public onStateChange(listener: VoiceStateListener) {
    this.stateListeners.add(listener);
    listener(this.state, this.lastTranscript);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.stateListeners.forEach(fn => fn(this.state, this.lastTranscript));
  }

  public getState() {
    return { state: this.state, lastTranscript: this.lastTranscript, isListening: this.isListening };
  }
}

export const voiceService = new VoiceAssistantService();
