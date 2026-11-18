import type { DamageTally } from '../app/damage-tally.ts';
import type { CombatSource } from '../domain/combat.ts';
import { fillTiles, renderBuild } from './build-summary.ts';
import type { UiContext } from './context.ts';
import { clockLabel, element } from './dom.ts';

const SOURCE_NAMES: Record<string, string> = {
  ability: 'Habilidades', 'ability-extra': 'Efectos de habilidades', burn: 'Quemadura', splash: 'Salpicadura',
  explosion: 'Explosión', quake: 'Temblor', gust: 'Ráfaga', enemy: 'Otros',
};

/** Pause summary: time, kills, level, coins and current build. */
export function renderPauseSummary(ctx: UiContext) {
  const run = ctx.run;
  fillTiles(element('pause-grid'), [['Tiempo', clockLabel(run.combat.time)], ['Abatidos', run.combat.kills], ['Nivel', run.progression.level], ['Monedas', run.exploration.coins]]);
  renderBuild(element('pause-build'), run, ctx.definition);
}

/** End-of-expedition screen: outcome, statistics, damage by source and final build. */
export function renderResults(ctx: UiContext, tally: DamageTally) {
  const { run, definition } = ctx, combat = run.combat, p = run.progression, victory = combat.status === 'victory';
  element('result-title').textContent = victory ? 'El Castellano ha caído' : 'Has caído';
  element('result-description').textContent = victory
    ? 'Sobreviviste al asedio y derrotaste al señor de la fortaleza.'
    : 'La fortaleza conserva a su señor. Esquiva los disparos lateralmente y abandona las líneas y círculos antes del impacto.';
  fillTiles(element('result-grid'), [
    ['Abatidos', combat.kills], ['Tiempo', clockLabel(combat.time)], ['Oleada', run.wave], ['Nivel', p.level],
    ['Esencia', p.totalEssence], ['Vida', `${Math.ceil(combat.hp)} / ${combat.maxHp}`], ['Monedas', run.exploration.coins], ['Gastadas', run.shop.spent],
  ], !ctx.quiet());
  const sourceName = (source: CombatSource) => source === 'basic' || source === 'spell' || source === 'arrow' ? 'Ataque básico'
    : source === 'whirlwind' || source === 'cataclysm' || source === 'rain' ? definition.skill.name : SOURCE_NAMES[source];
  const damage = element('result-damage'), rows = tally.rows(sourceName), heading = document.createElement('p');
  heading.className = 'section-label';
  heading.textContent = `Daño infligido ${Math.round(tally.dealt).toLocaleString('es-CL')} · recibido ${Math.round(tally.taken).toLocaleString('es-CL')}`;
  damage.replaceChildren(...(rows.length ? [heading] : []), ...rows.map(row => {
    const line = document.createElement('div'), name = document.createElement('span'), bar = document.createElement('i'), value = document.createElement('b');
    line.className = 'damage-row'; name.textContent = row.name; bar.style.setProperty('--share', row.share.toFixed(3));
    value.textContent = `${Math.round(row.amount).toLocaleString('es-CL')} · ${Math.round(row.share * 100)} %`;
    line.append(name, bar, value);
    return line;
  }));
  renderBuild(element('result-build'), run, definition);
  element('results').dataset.outcome = victory ? 'victory' : 'defeat';
  element('result-stats').textContent = `${run.exploration.chestsOpened} cofres · ${run.capture.state === 'completed' ? 'Puesto asegurado' : 'Puesto sin asegurar'}`;
}
