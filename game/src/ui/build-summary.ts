import { abilityData } from '../content/ranged-abilities.ts';
import { GENERAL_STATS } from '../content/warrior-abilities.ts';
import { RELICS } from '../content/relics.ts';
import { ELEMENTS } from '../content/elements.ts';
import { UPGRADES, UPGRADE_IDS } from '../content/progression.ts';
import { classAffinity } from '../content/class-definition.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import type { Run } from '../domain/run.ts';
import { techniqueSummary } from '../app/techniques.ts';
import { createIcon, iconPath } from '../app/icons.ts';

/** Turns "3 → 4" inside a rank line into a before/after step so the change reads at a glance. */
export function rankNodes(text: string) {
  return text.split(/(\d+ → \d+)/).map((part, index) => {
    if (index % 2 === 0) return document.createTextNode(part);
    const [from, to] = part.split(' → '),
      step = document.createElement('span'),
      before = document.createElement('i'),
      after = document.createElement('b');
    step.className = 'rank-step';
    before.textContent = from;
    after.textContent = to;
    step.append(before, '→', after);
    return step;
  });
}

/** Label/value tiles; with countUp, numeric values roll up from zero. */
export function fillTiles(
  container: HTMLElement,
  tiles: ReadonlyArray<readonly [string, string | number]>,
  countUp = false,
) {
  container.replaceChildren(
    ...tiles.map(([label, value]) => {
      const tile = document.createElement('div'),
        term = document.createElement('dt'),
        data = document.createElement('dd');
      term.textContent = label;
      data.textContent = String(value);
      tile.append(term, data);
      if (countUp && typeof value === 'number' && value > 0) {
        const started = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - started) / 800);
          data.textContent = String(Math.round(value * (1 - (1 - t) ** 3)));
          if (t < 1 && data.isConnected) requestAnimationFrame(step);
        };
        data.textContent = '0';
        requestAnimationFrame(step);
      }
      return tile;
    }),
  );
}

function buildChip(path: string | undefined, text: string, detail = '', affinity = '') {
  const item = document.createElement('li'),
    name = document.createElement('span');
  item.className = 'build-chip';
  item.dataset.element = affinity;
  if (path) item.append(createIcon(path));
  name.textContent = text;
  item.append(name);
  if (detail) {
    const value = document.createElement('b');
    value.textContent = detail;
    item.append(value);
  }
  return item;
}

/** Current configuration as icon chips, shared by the pause and results screens. */
export function renderBuild(container: HTMLElement, run: Run, definition: ClassDefinition) {
  const p = run.progression,
    groups: Array<[string, HTMLElement[]]> = [];
  if (p.development)
    groups.push([
      'Habilidades',
      p.development.book.snapshot.map(s => buildChip(iconPath(s.id), abilityData(s.id).name, `${s.level}/10`)),
    ]);
  else groups.push(['Técnicas', [buildChip(undefined, techniqueSummary(p))]]);
  const affinity: HTMLElement[] = [];
  if (p.element)
    affinity.push(buildChip(iconPath(p.element), ELEMENTS[p.element].name, `${p.affinityRank}/3`, p.element));
  if (p.element && p.mastery)
    affinity.push(buildChip(iconPath('mastery'), classAffinity(definition, p.element).mastery, '', p.element));
  if (p.secondaryElement)
    affinity.push(
      buildChip(
        iconPath(p.secondaryElement),
        `Apoyo: ${ELEMENTS[p.secondaryElement].name}`,
        `${p.secondaryRank}/3`,
        p.secondaryElement,
      ),
    );
  if (affinity.length) groups.push(['Afinidad', affinity]);
  if (p.relics.length) groups.push(['Reliquias', p.relics.map(id => buildChip(iconPath(id), RELICS[id].name))]);
  const stats = p.development
    ? Object.entries(p.development.ranks(p))
        .filter(([, rank]) => rank)
        .map(([id, rank]) =>
          buildChip(iconPath(`stat:${id}`), GENERAL_STATS[id as keyof typeof GENERAL_STATS][0], `${rank}/4`),
        )
    : UPGRADE_IDS.filter(id => p.ranks[id]).map(id => buildChip(iconPath(id), UPGRADES[id].name, String(p.ranks[id])));
  if (stats.length) groups.push(['Estadísticas', stats]);
  container.replaceChildren(
    ...groups.map(([label, chips]) => {
      const row = document.createElement('div'),
        heading = document.createElement('p'),
        list = document.createElement('ul');
      heading.className = 'section-label';
      heading.textContent = label;
      list.append(...chips);
      row.append(heading, list);
      return row;
    }),
  );
}
