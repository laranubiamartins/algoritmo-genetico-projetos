const $ = id => document.getElementById(id);
const DEFAULTS = [['Melhoria da iluminação', '4000', '7'], ['Instalação de bicicletários', '3000', '5'], ['Aquisição de bancos', '2000', '3'], ['Reforma de espaço de convivência', '5000', '8']];
let engine = null, timer = null, dirty = false;

// ---------- Tabela de projetos ----------
function renderProjects(rows) {
  const tb = $('projTable').tBodies[0]; tb.innerHTML = '';
  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${String.fromCharCode(65 + i)}</td><td><input aria-label="Nome" value=""></td><td><input aria-label="Custo" inputmode="decimal"></td><td><input aria-label="Benefício" inputmode="numeric"></td><td><button type="button">Remover</button></td>`;
    const ins = tr.querySelectorAll('input'); ins[0].value = r[0]; ins[1].value = r[1]; ins[2].value = r[2];
    tr.querySelector('button').onclick = () => { const cur = readRows(); cur.splice(i, 1); renderProjects(cur); onChange(); };
    tb.appendChild(tr);
  });
  $('addProj').disabled = rows.length >= 15;
  tb.querySelectorAll('button').forEach(b => b.disabled = rows.length <= 4);
}
const readRows = () => [...$('projTable').tBodies[0].rows].map(tr => [...tr.querySelectorAll('input')].map(i => i.value));
$('addProj').onclick = () => { const r = readRows(); if (r.length < 15) { r.push(['', '', '']); renderProjects(r); onChange(); } };

// ---------- Validação ----------
const RE_MONEY = /^\d+(\.\d{1,2})?$/, RE_INT = /^\d+$/, RE_PCT = /^\d+(\.\d+)?$/;
const normNum = s => s.trim().replace(',', '.');

function readConfig() {
  const errs = [], bad = [];
  const flag = (el, msg) => { errs.push(msg); bad.push(el); };
  const projects = [];
  [...$('projTable').tBodies[0].rows].forEach((tr, i) => {
    const [n, c, b] = [...tr.querySelectorAll('input')], L = String.fromCharCode(65 + i);
    const name = n.value.trim(), cs = normNum(c.value), bs = normNum(b.value);
    if (!name) flag(n, `Projeto ${L}: nome vazio.`);
    if (!RE_MONEY.test(cs) || +cs <= 0) flag(c, `Projeto ${L}: custo deve ser positivo, com até 2 casas decimais.`);
    if (!RE_INT.test(bs) && !RE_PCT.test(bs)) flag(b, `Projeto ${L}: benefício deve ser um número não negativo.`);
    projects.push({ name, cost: Math.round(+cs * 100), benefit: +bs });
  });
  if (projects.length < 4 || projects.length > 15) errs.push('Use entre 4 e 15 projetos.');
  const v = id => normNum($(id).value);
  let budget = 0;
  if (!RE_MONEY.test(v('budget'))) flag($('budget'), 'Orçamento: valor não negativo com até 2 casas decimais.'); else budget = Math.round(+v('budget') * 100);
  const int = (id, lo, hi, nome) => {
    const s = $(id).value.trim();
    if (!RE_INT.test(s) || +s < lo || +s > hi) { flag($(id), `${nome}: inteiro entre ${lo} e ${hi === Infinity ? '∞' : hi}.`); return NaN; }
    return +s;
  };
  const popSize = int('popSize', 2, 100000, 'Tamanho da população');
  const generations = int('generations', 1, 100000, 'Número de gerações');
  const pct = (id, nome) => { const s = v(id); if (!RE_PCT.test(s) || +s > 100) { flag($(id), `${nome}: entre 0 e 100.`); return NaN; } return +s / 100; };
  const crossRate = pct('crossRate', 'Taxa de cruzamento'), mutRate = pct('mutRate', 'Taxa de mutação');
  const tournamentSize = int('tournamentSize', 2, isNaN(popSize) ? 2 : popSize, 'Tamanho do torneio');
  const elite = int('elite', 0, isNaN(popSize) ? 0 : popSize - 1, 'Elite');
  const seed = /^-?\d+$/.test($( 'seed').value.trim()) ? +$('seed').value.trim() : (flag($('seed'), 'Semente: número inteiro.'), NaN);
  document.querySelectorAll('input').forEach(i => i.classList.toggle('bad', bad.includes(i)));
  return { errs, cfg: { projects, budget, popSize, generations, crossRate, mutRate, tournamentSize, elite, seed } };
}

// ---------- Execução ----------
function stop() { clearInterval(timer); timer = null; }
function onChange() {
  stop();
  const { errs } = readConfig();
  $('errors').textContent = errs.join('\n');
  dirty = true; $('status').textContent = 'Parâmetros alterados: clique em Reiniciar para aplicar.';
  updateButtons();
}
function updateButtons() {
  const invalid = readConfig().errs.length > 0, usable = engine && !dirty && !engine.finished;
  $('btnRun').disabled = !usable || !!timer || invalid;
  $('btnStep').disabled = !usable || invalid;
  $('btnPause').disabled = !timer;
  $('btnReset').disabled = invalid;
  $('btnRun').textContent = engine && engine.gen > 0 && !engine.finished ? 'Continuar' : 'Executar';
}
function reset() {
  stop(); const { errs, cfg } = readConfig();
  $('errors').textContent = errs.join('\n');
  if (errs.length) { updateButtons(); return; }
  Anim.cancel(); Anim.clear(); engine = new GA.Engine(cfg); dirty = false; $('log').textContent = ''; $('status').textContent = 'Pronto. Geração 0 criada.';
  logged = 0; render(); updateButtons();
}
function step(animate) {
  engine.step(); render();
  if (animate === true) Anim.play(engine.lastEvents, engine.cfg, engine.gen);
  if (engine.finished) { stop(); $('status').textContent = `Execução encerrada após ${engine.cfg.generations} gerações.`; }
  updateButtons();
}
$('btnRun').onclick = () => { Anim.cancel(); $('status').textContent = 'Executando…'; timer = setInterval(step, 150); updateButtons(); };
$('btnPause').onclick = () => { stop(); $('status').textContent = 'Pausado.'; updateButtons(); };
$('btnStep').onclick = () => { stop(); step(true); if (!engine.finished) $('status').textContent = 'Pausado (uma geração avançada).'; updateButtons(); };
$('btnReset').onclick = reset;
$('btnReplay').onclick = () => { if (engine && engine.lastEvents) Anim.play(engine.lastEvents, engine.cfg, engine.gen); };
$('btnSkip').onclick = Anim.cancel;
document.querySelectorAll('.grid input').forEach(i => i.addEventListener('input', onChange));
$('projTable').addEventListener('input', onChange);
$('btnTests').onclick = () => { $('testsCard').hidden = false; let t; try { t = runTests(); } catch (e) { t = 'Erro ao rodar os testes: ' + e.message + '\nConfira se genetic.js e tests.js são as versões mais recentes e estão na mesma pasta.'; } $('testsOut').textContent = t; $('testsCard').scrollIntoView({ behavior: 'smooth' }); };

// ---------- Exibição ----------
let logged = 0;
function render() {
  const h = engine.history, last = h[h.length - 1], P = engine.cfg.projects, b = engine.best;
  $('sGen').textContent = `${last.gen}/${engine.cfg.generations}`;
  $('sBestGen').textContent = last.bestGen; $('sAvg').textContent = last.avg.toFixed(2); $('sBest').textContent = last.bestSoFar;
  const names = b.chrom.map((g, i) => g ? `${String.fromCharCode(65 + i)} – ${P[i].name}` : null).filter(Boolean);
  $('bestBox').innerHTML = `<p>Cromossomo: ${b.chrom.map(g => `<span class="gene ${g ? 'on' : ''}">${g}</span>`).join('')}</p>
    <p>Projetos: ${names.length ? names.join('; ') : 'nenhum'}</p>
    <p>Custo total: ${GA.brl(b.cost)} · Benefício total: ${b.benefit} · Saldo: ${GA.brl(b.balance)} · ${b.feasible ? 'viável' : 'inviável'}<br>Encontrada na geração ${b.gen}.</p>`;
  const log = $('log'); log.textContent += (logged ? '\n' : '') + engine.logs.slice(logged).join('\n'); logged = engine.logs.length; log.scrollTop = log.scrollHeight;
  $('hist').tBodies[0].innerHTML = h.map(r => `<tr><td>${r.gen}</td><td>${r.bestGen}</td><td>${r.avg.toFixed(2)}</td><td>${r.bestSoFar}</td></tr>`).join('');
  drawChart(h);
}
function drawChart(h) {
  const cv = $('chart'), c = cv.getContext('2d'), W = cv.width, H = cv.height, m = 56;
  c.clearRect(0, 0, W, H);
  const maxY = Math.max(1, ...h.map(r => r.bestSoFar)), G = engine.cfg.generations;
  const X = g => m + (W - 2 * m) * g / G, Y = v => H - m - (H - 2 * m) * v / maxY;

  c.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  c.lineWidth = 2;
  c.font = '20px system-ui, sans-serif';
  c.fillStyle = '#64748b';
  for (let s = 0; s <= 4; s++) {
    const val = (maxY * s) / 4;
    const y = Y(val);
    c.beginPath(); c.moveTo(m, y); c.lineTo(W - m / 2, y); c.stroke();
    c.fillText(Number.isInteger(val) ? val : val.toFixed(1), 10, y + 6);
  }

  c.strokeStyle = '#94a3b8';
  c.beginPath(); c.moveTo(m, m / 2); c.lineTo(m, H - m); c.lineTo(W - m / 2, H - m); c.stroke();
  c.fillText('Geração ' + G, W - 150, H - 16);

  [['avg', '#64748b'], ['bestGen', '#0284c7'], ['bestSoFar', '#ea580c']].forEach(([k, col]) => {
    c.strokeStyle = col; c.lineWidth = 4.5; c.lineJoin = 'round'; c.beginPath();
    h.forEach((r, i) => i ? c.lineTo(X(r.gen), Y(r[k])) : c.moveTo(X(r.gen), Y(r[k])));
    c.stroke();
  });
}
renderProjects(DEFAULTS); reset();
