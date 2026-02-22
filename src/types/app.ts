export enum AppState {
  IDLE = "idle",
  LOADING = "loading",
  LISTENING = "listening",
  SPEAKING = "speaking",
  PROCESSING = "processing",
  ERROR = "error",
}

export interface VoiceRefs {
  inputAudioContext: AudioContext | null;
  outputAudioContext: AudioContext | null;
  sessionPromise: Promise<any> | null;
  stream: MediaStream | null;
  processor: ScriptProcessorNode | null;
  nextStartTime: number;
  sources: Set<AudioBufferSourceNode>;
  shouldSendAudio: boolean;
}
