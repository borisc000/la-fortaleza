export class PreviewState {
  phase: 'loading' | 'ready' | 'active' | 'paused' | 'choosing' | 'shopping' | 'results' | 'error' = 'loading';
  loaded() { if (this.phase === 'loading') this.phase = 'ready'; }
  resume() { if (this.phase === 'ready' || this.phase === 'paused') this.phase = 'active'; }
  pause() { if (this.phase === 'active') this.phase = 'paused'; }
  choose() { if (this.phase === 'active') this.phase = 'choosing'; }
  resumeChoice() { if (this.phase === 'choosing') this.phase = 'active'; }
  shop() { if (this.phase === 'active') this.phase = 'shopping'; }
  resumeShop() { if (this.phase === 'shopping') this.phase = 'active'; }
  pauseShop() { if (this.phase === 'shopping') this.phase = 'paused'; }
  finish() { if (this.phase === 'active') this.phase = 'results'; }
  restart() { if (this.phase === 'results' || this.phase === 'paused') this.phase = 'ready'; }
  fail() { this.phase = 'error'; }
  get active() { return this.phase === 'active'; }
}
