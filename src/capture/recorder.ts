import { Chunker, downsample, encodeWav, RATE, rms, toBase64 } from './wav';

export type Clip = { audio: string; offsetMs: number; durationMs: number; loudest: number };
type Events = { onClip: (clip: Clip) => void; onLevel: (level: number) => void; onInterrupted: () => void };

export class MicError extends Error {}

/** Microphone → 16 kHz WAV clips. Create and start from a tap so iOS allows audio. */
export class Recorder {
  private context: AudioContext;
  private stream?: MediaStream;
  private node?: AudioWorkletNode;
  private chunker = new Chunker();
  private sent = 0; // samples already handed out, for caption timing
  private stopped = false;
  constructor(private events: Events, private startOffsetMs = 0) {
    // Created synchronously inside the tap handler; iOS refuses to start audio otherwise.
    this.context = new AudioContext();
    void this.context.resume().catch(() => {});
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new MicError('This browser cannot use the microphone. Open the site in Safari or Chrome over https.');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (error) {
      void this.context.close().catch(() => {});
      const name = (error as DOMException)?.name;
      throw new MicError(name === 'NotAllowedError' || name === 'SecurityError'
        ? 'Microphone access is off. In Safari, tap aA in the address bar → Website Settings → Microphone → Allow, then try again.'
        : name === 'NotFoundError' ? 'No microphone was found on this device.' : 'The microphone could not start. Close other apps using it and try again.');
    }
    if (this.stopped) { this.release(); return; }
    await this.context.audioWorklet.addModule('/pcm-worklet.js');
    await this.context.resume();
    const source = this.context.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.context, 'pcm-tap');
    const rate = this.context.sampleRate;
    this.node.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      const samples = downsample(data, rate);
      this.events.onLevel(rms(samples));
      const clip = this.chunker.push(samples);
      if (clip) this.emit(clip);
    };
    // Keep the graph pulling audio without playing it back.
    const mute = this.context.createGain(); mute.gain.value = 0;
    source.connect(this.node).connect(mute).connect(this.context.destination);
    this.stream.getAudioTracks()[0]?.addEventListener('ended', () => this.events.onInterrupted());
    this.context.addEventListener('statechange', () => {
      if (!this.stopped && (this.context.state as string) !== 'running') this.events.onInterrupted();
    });
  }

  private emit({ samples, loudest }: { samples: Float32Array; loudest: number }) {
    const offsetMs = this.startOffsetMs + Math.round(this.sent / RATE * 1000);
    this.sent += samples.length;
    this.events.onClip({ audio: toBase64(encodeWav(samples)), offsetMs, durationMs: Math.round(samples.length / RATE * 1000), loudest });
  }

  /** Stop recording and hand out the last partial clip. */
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    const rest = this.chunker.flush();
    if (rest && rest.samples.length > RATE * 0.3) this.emit(rest);
    this.release();
  }

  private release() {
    this.node?.port.close();
    this.stream?.getTracks().forEach(track => track.stop());
    void this.context.close().catch(() => {});
  }
}
