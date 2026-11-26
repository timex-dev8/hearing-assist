// Forwards raw microphone samples (first channel) to the page in small batches.
class PcmTap extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(2048); this.size = 0; }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.size++] = channel[i];
        if (this.size === this.buffer.length) { this.port.postMessage(this.buffer.slice(0)); this.size = 0; }
      }
    }
    return true;
  }
}
registerProcessor('pcm-tap', PcmTap);
