import type { CombatEvent } from '../domain/combat.ts';
import type { Run } from '../domain/run.ts';
import { WARRIOR } from '../content/classes/warrior.ts';

export type Cue = 'hit' | 'hurt' | 'whirlwind' | 'coin' | 'heal' | 'upgrade' | 'purchase' | 'warning' | 'capture' | 'secured' | 'low' | 'victory' | 'defeat' | 'spell' | 'cataclysm' | 'arrow' | 'rain' | 'stone' | 'gust' | 'tick' | 'select' | 'menu';
type Tone = { notes: number[]; duration: number; gain: number; type: OscillatorType; cooldown: number };
const TONES: Record<Cue, Tone> = {
  // Interface: deliberately quieter and shorter than anything in the world.
  tick: { notes: [1250], duration: .03, gain: .035, type: 'sine', cooldown: .04 },
  select: { notes: [520, 780], duration: .09, gain: .09, type: 'triangle', cooldown: .08 },
  menu: { notes: [330, 247], duration: .16, gain: .1, type: 'sine', cooldown: .2 },
  stone: { notes: [90, 60], duration: .2, gain: .2, type: 'triangle', cooldown: .35 },
  gust: { notes: [380, 640, 300], duration: .18, gain: .1, type: 'sine', cooldown: .4 },
  arrow: { notes: [900, 220], duration: .09, gain: .1, type: 'triangle', cooldown: .15 },
  rain: { notes: [450, 300, 200], duration: .4, gain: .18, type: 'triangle', cooldown: 1 },
  spell: { notes: [620, 410], duration: .14, gain: .12, type: 'sine', cooldown: .25 },
  cataclysm: { notes: [130, 196, 294], duration: .5, gain: .2, type: 'triangle', cooldown: 1 },
  hit: { notes: [180, 90], duration: .08, gain: .16, type: 'triangle', cooldown: .13 },
  hurt: { notes: [105, 55], duration: .18, gain: .32, type: 'triangle', cooldown: .3 },
  whirlwind: { notes: [120, 240, 160], duration: .3, gain: .2, type: 'sine', cooldown: 1 },
  coin: { notes: [740, 990], duration: .1, gain: .09, type: 'sine', cooldown: .3 },
  heal: { notes: [330, 440, 550], duration: .3, gain: .16, type: 'sine', cooldown: .4 },
  upgrade: { notes: [294, 440, 587], duration: .45, gain: .21, type: 'triangle', cooldown: .3 },
  purchase: { notes: [440, 660], duration: .18, gain: .15, type: 'sine', cooldown: .15 },
  warning: { notes: [110, 147, 110], duration: .6, gain: .26, type: 'triangle', cooldown: 1 },
  capture: { notes: [196, 147], duration: .3, gain: .18, type: 'triangle', cooldown: 1 },
  secured: { notes: [262, 330, 392, 523], duration: .55, gain: .2, type: 'triangle', cooldown: 1 },
  low: { notes: [82, 65, 82], duration: .5, gain: .26, type: 'sine', cooldown: 5 },
  victory: { notes: [262, 330, 392, 523], duration: .8, gain: .24, type: 'triangle', cooldown: 1 },
  defeat: { notes: [196, 147, 98], duration: .7, gain: .22, type: 'triangle', cooldown: 1 },
};

/** Short procedural cues. No context until a user gesture; no queued sounds after pause. */
export class GameAudio {
  enabled = true;
  volume = .25;
  private playing = false;
  private disposed = false;
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Map<OscillatorNode, GainNode>();
  private last = new Map<Cue, number>();
  private factory: () => AudioContext;
  constructor(factory: () => AudioContext = () => new AudioContext()) { this.factory = factory; }
  async unlock() {
    if (this.disposed || !this.enabled) return;
    try {
      if (!this.context) { this.context = this.factory(); this.master = this.context.createGain(); this.master.gain.value = this.volume; this.master.connect(this.context.destination); }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional; rejected activation must not stop the game. */ }
  }
  setPlaying(value: boolean) { this.playing = value; if (!value) this.silence(); }
  setEnabled(value: boolean) { this.enabled = value; if (!value) this.silence(); }
  setVolume(value: number) { this.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : .25; if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, .02); if (!this.volume) this.silence(); }
  cue(id: Cue, menu = false) {
    const ctx = this.context, tone = TONES[id];
    if (this.disposed || !this.enabled || this.volume <= 0 || !ctx || !this.master || ctx.state !== 'running' || (!this.playing && !menu)) return;
    if (ctx.currentTime - (this.last.get(id) ?? -Infinity) < tone.cooldown || this.voices.size >= 8) return;
    this.last.set(id, ctx.currentTime);
    const osc = ctx.createOscillator(), envelope = ctx.createGain(), start = ctx.currentTime;
    osc.type = tone.type;
    tone.notes.forEach((note, index) => osc.frequency.setValueAtTime(note, start + index * tone.duration / tone.notes.length));
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(tone.gain, start + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + tone.duration);
    osc.connect(envelope); envelope.connect(this.master); this.voices.set(osc, envelope);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); this.voices.delete(osc); };
    osc.start(start); osc.stop(start + tone.duration + .01);
  }
  silence() {
    for (const [osc, gain] of this.voices) { osc.onended = null; try { osc.stop(); } catch { /* already stopped */ } osc.disconnect(); gain.disconnect(); }
    this.voices.clear();
  }
  reset() { this.silence(); this.last.clear(); }
  dispose() { this.disposed = true; this.silence(); this.master?.disconnect(); void this.context?.close().catch(() => {}); }
}

/** Read simulation changes, never derive game rules from audio playback. */
export class AudioFeedback {
  private coins = 0;
  private hp: number;
  constructor(initialHp: number = WARRIOR.stats.hp) { this.hp = initialHp; }
  private low = false;
  private capture = 'idle';
  private elite = false;
  private boss = false;
  update(run: Run, events: readonly CombatEvent[], play: (cue: Cue) => void) {
    const nowLow = run.combat.hp > 0 && run.combat.hp / run.combat.maxHp <= .3;
    if (nowLow && !this.low) play('low');
    if (events.some(e => e.type === 'hit' && e.target === 0)) play('hurt');
    else if (events.some(e => e.type === 'hit' && e.target > 0 && e.source === 'basic')) play('hit');
    if (events.some(e => e.type === 'stone-guard' || e.type === 'guard-block' || e.type === 'quake')) play('stone');
    if (events.some(e => e.type === 'gust')) play('gust');
    if (events.some(e => e.type === 'whirlwind-start')) play('whirlwind');
    if (events.some(e => e.type === 'arrow-shot')) play('arrow');
    if (events.some(e => e.type === 'rain-start')) play('rain');
    if (events.some(e => e.type === 'spell-cast')) play('spell');
    if (events.some(e => e.type === 'cataclysm-start')) play('cataclysm');
    if (run.capture.state !== this.capture && run.capture.state === 'completed') play('secured');
    else if (run.exploration.coins > this.coins) play('coin');
    if (run.capture.state === 'warning' && this.capture === 'idle') play('capture');
    if (run.combat.hp > this.hp) play('heal');
    if (run.eliteSpawned && !this.elite || run.bossSpawned && !this.boss) play('warning');
    this.coins = run.exploration.coins; this.hp = run.combat.hp; this.low = nowLow;
    this.capture = run.capture.state; this.elite = run.eliteSpawned; this.boss = run.bossSpawned;
  }
}
