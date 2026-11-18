import { ABILITY_CATALOG, ABILITY_MAX_LEVEL, ABILITY_SLOTS, BRANCHES } from '../content/ability-schema.ts';
import type { Branch, PlayableClass } from '../content/ability-schema.ts';

export type AbilityState = Readonly<{
  id: string;
  level: number;
  branches: Readonly<Record<Branch, number>>;
  mutation?: 0 | 1;
  finisher?: 0 | 1;
}>;
export type AbilityOperation = Readonly<
  { id: string } & (
    | { kind: 'learn' }
    | { kind: 'branch'; branch: Branch }
    | { kind: 'mutation' | 'finisher'; option: 0 | 1 }
  )
>;
const fresh = (id: string): AbilityState =>
  Object.freeze({ id, level: 1, branches: Object.freeze({ power: 0, expansion: 0, specialization: 0, rhythm: 0 }) });
export function operationKey(op: AbilityOperation) {
  return `${op.id}/${op.kind}/${op.kind === 'branch' ? op.branch : op.kind === 'learn' ? '' : op.option}`;
}

/** The owning level-choice transaction supplies the revision; no XP or effects live here. */
export class AbilityBook {
  readonly classId: PlayableClass;
  private entries = new Map<string, AbilityState>();
  private generation = 0;
  private closed = false;
  constructor(classId: PlayableClass) {
    if (!ABILITY_CATALOG.some(d => d.classId === classId)) throw new Error('Clase sin repertorio');
    this.classId = classId;
    this.reset();
  }
  get revision() {
    return this.generation;
  }
  get snapshot(): readonly AbilityState[] {
    return Object.freeze([...this.entries.values()]);
  }
  get slotsUsed() {
    return this.snapshot.filter(s => ABILITY_CATALOG.find(d => d.id === s.id)!.kind === 'skill').length;
  }
  options(): readonly AbilityOperation[] {
    if (this.closed) return Object.freeze([]);
    const result: AbilityOperation[] = [];
    for (const definition of ABILITY_CATALOG.filter(d => d.classId === this.classId)) {
      const state = this.entries.get(definition.id),
        id = definition.id;
      if (!state) {
        if (definition.kind === 'skill' && this.slotsUsed < ABILITY_SLOTS) result.push({ id, kind: 'learn' });
        continue;
      }
      if (state.level >= ABILITY_MAX_LEVEL) continue;
      if (state.level === 4 || state.level === 9) {
        const kind = state.level === 4 ? 'mutation' : 'finisher';
        result.push({ id, kind, option: 0 }, { id, kind, option: 1 });
      } else for (const branch of BRANCHES) if (state.branches[branch] < 3) result.push({ id, kind: 'branch', branch });
    }
    return Object.freeze(result.map(op => Object.freeze(op)));
  }
  apply(expectedRevision: number, operation: AbilityOperation): boolean {
    if (expectedRevision !== this.generation) return false;
    // Resolve to the canonical legal operation instead of trusting caller-supplied fields.
    const legal = this.options().find(op => operationKey(op) === operationKey(operation));
    if (!legal) return false;
    if (legal.kind === 'learn') this.entries.set(legal.id, fresh(legal.id));
    else {
      const before = this.entries.get(legal.id)!;
      const after = { ...before, level: before.level + 1 };
      if (legal.kind === 'branch')
        after.branches = Object.freeze({ ...before.branches, [legal.branch]: before.branches[legal.branch] + 1 });
      else if (legal.kind === 'mutation') after.mutation = legal.option;
      else after.finisher = legal.option;
      this.entries.set(legal.id, Object.freeze(after));
    }
    this.generation++;
    return true;
  }
  stop() {
    this.closed = true;
    this.generation++;
  }
  reset() {
    this.entries.clear();
    this.closed = false;
    this.generation++;
    for (const d of ABILITY_CATALOG) if (d.classId === this.classId && d.initial) this.entries.set(d.id, fresh(d.id));
  }
}
