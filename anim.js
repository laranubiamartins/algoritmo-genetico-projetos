// Animação passo a passo da última geração, baseada nos eventos reais registrados pelo motor (engine.lastEvents).
const Anim = (() => {
  let id = 0;
  const L = i => String.fromCharCode(65 + i);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $a = x => document.getElementById(x);
  const row = r => `<div class="arow"><b>${r.label}</b>${r.bits.map((b, i) =>
    `<span class="g ${(r.cls && r.cls[i]) || ''}"><small>${L(i)}</small>${b}</span>` + (r.cut === i + 1 ? '<span class="cut"></span>' : '')).join('')}</div>`;
  function show(text, rows) { $a('animCap').textContent = text; $a('stage').innerHTML = rows.map(row).join(''); }
  const cancel = () => { id++; };
  const clear = () => { $a('animCap').textContent = 'Avance uma geração para ver os pais, o corte, a mutação e a reparação.'; $a('stage').innerHTML = ''; };

  async function play(ev, cfg, gen) {
    if (!ev) return;
    const my = ++id, P = cfg.projects, n = P.length;
    const wait = async k => { await sleep(+$a('animSpeed').value * k); return my === id; };
    const fill = c => Array(n).fill(c);
    const fit = bits => bits.reduce((s, g, i) => s + (g ? P[i].benefit : 0), 0);
    const list = pos => pos.length ? 'genes ' + pos.map(p => L(p)).join(', ') : 'nenhum';
    if (ev.elite.length) {
      show(`Geração ${gen}: elitismo – indivíduos copiados sem modificação`, ev.elite.map((e, i) => ({ label: `Elite ${i + 1}`, bits: e, cls: fill('elite') })));
      if (!await wait(1.5)) return;
    }
    for (let p = 0; p < ev.pairs.length; p++) {
      const e = ev.pairs[p], pre = `Geração ${gen}, par ${p + 1}/${ev.pairs.length}: `, [k1, k2] = e.kids;
      const parents = [{ label: `Pai 1 (#${e.i1})`, bits: e.a, cls: fill('p1') }, { label: `Pai 2 (#${e.i2})`, bits: e.b, cls: fill('p2') }];
      show(pre + 'pais escolhidos por torneio', parents); if (!await wait(1.3)) return;
      if (e.cut) {
        show(pre + `ponto de corte após o gene ${L(e.cut - 1)}`, parents.map(r => ({ ...r, cut: e.cut }))); if (!await wait(1.3)) return;
        const c1 = Array.from({ length: n }, (_, i) => i < e.cut ? 'p1' : 'p2'), c2 = Array.from({ length: n }, (_, i) => i < e.cut ? 'p2' : 'p1');
        show(pre + 'troca das caudas: filhos gerados', [{ label: 'Filho 1', bits: k1.crossed, cls: c1, cut: e.cut }, { label: 'Filho 2', bits: k2.crossed, cls: c2, cut: e.cut }]);
      } else show(pre + 'sem cruzamento: filhos copiam os pais', [{ label: 'Filho 1', bits: k1.crossed, cls: fill('p1') }, { label: 'Filho 2', bits: k2.crossed, cls: fill('p2') }]);
      if (!await wait(1.3)) return;
      if (k1.mut.length || k2.mut.length) {
        const mk = (k, t) => ({ label: `Filho ${t}`, bits: k.mutated, cls: Array.from({ length: n }, (_, i) => k.mut.includes(i) ? 'mut' : '') });
        show(pre + `mutação – filho 1: ${list(k1.mut)}; filho 2: ${list(k2.mut)}`, [mk(k1, 1), mk(k2, 2)]); if (!await wait(1.3)) return;
      }
      for (let k = 0; k < 2; k++) {
        const kid = e.kids[k];
        for (let s = 0; s < kid.removed.length; s++) {
          const cls = Array(n).fill(''); cls[kid.removed[s]] = 'rem';
          show(pre + `reparação do filho ${k + 1}: removendo ${L(kid.removed[s])} (menor benefício/custo)`, [{ label: `Filho ${k + 1}`, bits: kid.steps[s].split('').map(Number), cls }]);
          if (!await wait(1.1)) return;
        }
      }
      show(pre + 'filhos finais' + (e.dropped ? ' (o filho 2 foi descartado: só havia uma vaga)' : ''),
        e.kids.map((k, i) => ({ label: `Filho ${i + 1} (aptidão ${fit(k.final)})`, bits: k.final, cls: [] })));
      if (!await wait(1.3)) return;
    }
    $a('animCap').textContent = `Geração ${gen} concluída.`;
  }
  return { play, cancel, clear };
})();
