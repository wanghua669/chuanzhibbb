// ============================================================================
// WebAudio 芯片级八音盒与赛博音效合成器 (无需外部音频文件依赖)
// ============================================================================

class CyberSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlayingMusic = false;
  private musicTimer: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playCoinSound() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playKickSound() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playGiftDropSound() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  public toggleLofiMusicBox(forceState?: boolean): boolean {
    const next = forceState !== undefined ? forceState : !this.isPlayingMusic;
    if (!next) {
      this.stopMusicBox();
      return false;
    }
    this.startMusicBox();
    return true;
  }

  public getMusicState(): boolean {
    return this.isPlayingMusic;
  }

  private startMusicBox() {
    if (this.isPlayingMusic) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.isPlayingMusic = true;

    // 治愈系五声音阶八音盒旋律
    const melody = [
      523.25, 659.25, 783.99, 987.77, 783.99, 659.25,
      587.33, 659.25, 783.99, 659.25, 523.25, 440.0,
      523.25, 659.25, 880.0, 783.99, 659.25, 587.33,
    ];
    let step = 0;

    const playTick = () => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const freq = melody[step % melody.length];
      step++;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    };

    playTick();
    this.musicTimer = window.setInterval(playTick, 520);
  }

  public stopMusicBox() {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new CyberSoundEngine();
