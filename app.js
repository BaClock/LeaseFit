'use strict';

const objects = [
  { name: 'А', area: 42, rent: 85000, extra: 15000, sales: 90, technical: 'ok' },
  { name: 'Б', area: 36, rent: 68000, extra: 10000, sales: 82, technical: 'unknown' },
  { name: 'В', area: 54, rent: 95000, extra: 18000, sales: 105, technical: 'blocked' }
];
const multipliers = { weak: 0.8, base: 1, strong: 1.2 };
const money = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, ' ');
const byId = id => document.getElementById(id);
let selectedObject = 0;
let selectedScenario = 'base';

function calculate(object, scenario) {
  const sales = object.sales * multipliers[scenario];
  const contribution = sales * 300 * 30 * 0.6;
  const limit = Math.round(contribution - 310000 - object.extra - 60000);
  const cash = Math.round(contribution - 310000 - object.extra - object.rent);
  const breakEven = Math.ceil((310000 + object.extra + object.rent) / (300 * 30 * 0.6));
  return { sales, limit, cash, breakEven };
}

function render() {
  const object = objects[selectedObject];
  const result = calculate(object, selectedScenario);
  byId('object-title').innerHTML = `Помещение ${object.name} <span>${object.area} м²</span>`;
  byId('object-panel').setAttribute('aria-labelledby', `object-tab-${selectedObject}`);
  document.querySelectorAll('[data-object]').forEach(button => {
    const active = Number(button.dataset.object) === selectedObject;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-scenario]').forEach(button => {
    const active = button.dataset.scenario === selectedScenario;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  byId('rent-limit').innerHTML = `${money(result.limit)} <small>₽/мес.</small>`;
  byId('cash-left').innerHTML = `${money(result.cash)} <small>₽/мес.</small>`;
  byId('rent-limit').classList.toggle('negative', result.limit < 0);
  byId('cash-left').classList.toggle('negative', result.cash < 0);
  byId('break-even').innerHTML = `${result.breakEven} <small>покупок/день</small>`;
  byId('sales-assumption').textContent = `в сценарии заложено ${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(result.sales)}`;
  byId('asking-value').textContent = `${money(object.rent)} ₽`;
  byId('limit-value').textContent = `${money(Math.max(0, result.limit))} ₽`;
  const max = Math.max(object.rent, result.limit, 100000) * 1.1;
  byId('asking-bar').style.width = `${object.rent / max * 100}%`;
  byId('limit-bar').style.width = `${Math.max(0, result.limit) / max * 100}%`;
  const status = byId('technical-status');
  const power = byId('power-check');
  status.className = 'analysis-status';
  const entry = document.querySelector('.checklist > span:first-child');
  entry.innerHTML = '<i class="check-dot">✓</i> Отдельный вход';
  power.innerHTML = '<i class="check-dot">✓</i> Мощность задана';
  if (object.technical === 'blocked') {
    status.textContent = 'Есть технический блокер';
    status.classList.add('blocked');
    entry.innerHTML = '<i class="block-dot">×</i> Нет отдельного входа';
  } else if (object.technical === 'unknown') {
    status.textContent = 'Нужно уточнить мощность';
    status.classList.add('warning');
    power.innerHTML = '<i class="question-dot">?</i> Мощность неизвестна';
  } else {
    status.textContent = 'Параметры в примере заданы';
  }
  let title, copy, type = '', icon = '↗';
  if (object.technical === 'blocked') {
    title = 'Сначала — техническое ограничение';
    copy = 'В этом примере отдельный вход обязателен, а у помещения его нет. Положительная экономика не отменяет блокер: нужно проверить возможность его устранения.';
    type = 'blocked'; icon = '×';
  } else if (result.cash < 0) {
    title = 'Сценарий не покрывает расходы';
    copy = `Операционный дефицит — ${money(-result.cash)} ₽ в месяц. При заложенных продажах текущая аренда не укладывается в экономику. Пересмотрите условия и предпосылки.`;
    type = 'warning'; icon = '!';
  } else if (result.limit < object.rent) {
    title = 'Есть повод обсудить ставку';
    copy = `Для целевого остатка 60 000 ₽ аренда должна быть ниже на ${money(object.rent - result.limit)} ₽ в месяц.${object.technical === 'unknown' ? ' До рекомендации также подтвердите мощность.' : ' Проверьте возможность изменения условий.'}`;
    type = 'warning'; icon = '!';
  } else if (object.technical === 'unknown') {
    title = 'Экономика сходится, мощность неизвестна';
    copy = `Аренда ниже расчётного предела на ${money(result.limit - object.rent)} ₽. Подтвердите мощность под оборудование: без этого рано рекомендовать помещение.`;
    type = 'warning'; icon = '?';
  } else {
    title = 'Есть запас для обсуждения';
    copy = `Аренда ниже расчётного предела на ${money(result.limit - object.rent)} ₽. Проверьте предпосылки продаж${selectedScenario !== 'weak' ? ' и слабый сценарий' : ''} перед рекомендацией клиенту.`;
  }
  byId('decision-box').className = `decision-box ${type}`.trim();
  byId('decision-title').textContent = title;
  byId('decision-copy').textContent = copy;
  byId('decision-icon').textContent = icon;
}

document.querySelectorAll('[data-object]').forEach(button => {
  button.addEventListener('click', () => { selectedObject = Number(button.dataset.object); render(); });
  button.addEventListener('keydown', event => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') selectedObject = 0;
    else if (event.key === 'End') selectedObject = objects.length - 1;
    else selectedObject = (selectedObject + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + objects.length) % objects.length;
    render();
    document.querySelector(`[data-object="${selectedObject}"]`).focus();
  });
});
document.querySelectorAll('[data-scenario]').forEach(button => {
  button.addEventListener('click', () => { selectedScenario = button.dataset.scenario; render(); });
});
document.querySelectorAll('[aria-controls="rent-explanation"], [aria-controls="demo-method"]').forEach(button => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    byId(button.getAttribute('aria-controls')).hidden = !expanded;
    if (button.classList.contains('method-toggle')) button.querySelector('span').textContent = expanded ? '−' : '+';
  });
});
const menuButton = document.querySelector('.menu-toggle');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); byId('mobile-nav').hidden = true; }
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
  byId('mobile-nav').hidden = !expanded;
});
document.querySelectorAll('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !byId('mobile-nav').hidden) { closeMenu(); menuButton.focus(); } });
window.matchMedia('(min-width: 651px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
render();
