// Algoritmo Genético para seleção de projetos com orçamento limitado.
// Valores monetários são tratados em CENTAVOS (inteiros) para evitar erros de ponto flutuante.
const GA = (() => {
  // PRNG com semente (mulberry32)
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const str = c => c.join('');
  const brl = cents => 'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // P = [{name, cost (centavos), benefit}], B = orçamento (centavos)
  function evaluate(c, P, B) {
    let cost = 0, benefit = 0;
    c.forEach((g, i) => { if (g) { cost += P[i].cost; benefit += P[i].benefit; } });
    return { cost, benefit, balance: B - cost, feasible: cost <= B };
  }

  // Reparação: remove o selecionado de menor benefício/custo (empate: menor índice)
  function repair(c, P, B) {
    const ch = c.slice(), steps = [str(ch)], removed = [];
    while (evaluate(ch, P, B).cost > B) {
      let w = -1;
      for (let i = 0; i < ch.length; i++) {
        if (!ch[i]) continue;
        if (w < 0 || P[i].benefit * P[w].cost < P[w].benefit * P[i].cost) w = i;
      }
      ch[w] = 0; removed.push(w); steps.push(str(ch));
    }
    return { chrom: ch, steps, removed };
  }

  // Torneio: k candidatos distintos; vence maior aptidão; empate → menor índice
  function tournament(fit, k, rng) {
    const idx = fit.map((_, i) => i);
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(rng() * (idx.length - i));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    let w = idx[0];
    for (let i = 1; i < k; i++) {
      const c = idx[i];
      if (fit[c] > fit[w] || (fit[c] === fit[w] && c < w)) w = c;
    }
    return w;
  }

  // Cruzamento de um ponto: cut = nº de genes antes do corte (1..n-1)
  function crossover(a, b, cut) {
    return [a.slice(0, cut).concat(b.slice(cut)), b.slice(0, cut).concat(a.slice(cut))];
  }
  function flip(c, positions) { const r = c.slice(); positions.forEach(i => r[i] = 1 - r[i]); return r; }

  class Engine {
    constructor(cfg) { this.cfg = cfg; this.reset(); }
    reset() {
      const { projects: P, budget: B, popSize, seed } = this.cfg, n = P.length;
      this.rng = mulberry32(seed); this.gen = 0; this.logs = []; this.history = []; this.best = null;
      this.pop = []; this.fit = [];
      for (let i = 0; i < popSize; i++) {
        const raw = Array.from({ length: n }, () => (this.rng() < 0.5 ? 1 : 0));
        const r = repair(raw, P, B);
        this.pop.push(r.chrom);
        if (r.removed.length) this.logs.push(`Geração 0 – indivíduo ${i}: reparação ${r.steps.join(' → ')}`);
      }
      this.logs.push(`Geração 0: população inicial aleatória de ${popSize} indivíduos.`);
      this.record();
    }
    get finished() { return this.gen >= this.cfg.generations; }
    record() {
      const { projects: P, budget: B } = this.cfg;
      this.fit = this.pop.map(c => evaluate(c, P, B).benefit);
      let bi = 0;
      this.fit.forEach((f, i) => { if (f > this.fit[bi]) bi = i; });
      if (!this.best || this.fit[bi] > this.best.benefit)
        this.best = { chrom: this.pop[bi].slice(), gen: this.gen, ...evaluate(this.pop[bi], P, B) };
      const avg = this.fit.reduce((s, x) => s + x, 0) / this.fit.length;
      this.history.push({ gen: this.gen, bestGen: this.fit[bi], avg, bestSoFar: this.best.benefit });
    }
    step() {
      if (this.finished) return false;
      const { projects: P, budget: B, popSize, crossRate, mutRate, tournamentSize, elite } = this.cfg, n = P.length;
      const g = this.gen + 1, L = [];
      const next = [], evPairs = [], evElite = [];
      if (elite > 0) {
        const order = this.fit.map((_, i) => i).sort((a, b) => this.fit[b] - this.fit[a] || a - b).slice(0, elite);
        order.forEach(i => { next.push(this.pop[i].slice()); evElite.push(this.pop[i].slice()); });
        L.push(`Elitismo: preservados ${order.map(i => `${str(this.pop[i])} (aptidão ${this.fit[i]})`).join(', ')}`);
      }
      let pair = 1;
      while (next.length < popSize) {
        const i1 = tournament(this.fit, tournamentSize, this.rng), i2 = tournament(this.fit, tournamentSize, this.rng);
        const a = this.pop[i1], b = this.pop[i2];
        let dropped = false, cutUsed = 0, c1 = a.slice(), c2 = b.slice(), msg = `Par ${pair}: pais ${str(a)} (#${i1}) e ${str(b)} (#${i2}); `;
        if (this.rng() < crossRate) {
          const cut = 1 + Math.floor(this.rng() * (n - 1)); cutUsed = cut;
          [c1, c2] = crossover(a, b, cut);
          msg += `corte após o gene ${cut}; filhos: ${str(c1)} e ${str(c2)}; `;
        } else msg += `sem cruzamento (filhos copiam os pais); `;
        const info = [];
        const kids = [c1, c2].map((c, k) => {
          const pos = []; c.forEach((_, i) => { if (this.rng() < mutRate) pos.push(i); });
          let out = flip(c, pos);
          if (pos.length) msg += `mutação no(s) gene(s) ${pos.map(p => p + 1).join(',')} do filho ${k + 1}: ${str(c)} → ${str(out)}; `;
          const r = repair(out, P, B);
          if (r.removed.length) msg += `reparação do filho ${k + 1}: ${r.steps.join(' → ')}; `;
          info.push({ crossed: c, mut: pos, mutated: out, steps: r.steps, removed: r.removed, final: r.chrom });
          return r.chrom;
        });
        next.push(kids[0]);
        if (next.length < popSize) next.push(kids[1]);
        else { msg += 'segundo filho descartado (vaga única restante); '; dropped = true; }
        evPairs.push({ i1, i2, a, b, cut: cutUsed, kids: info, dropped });
        L.push(msg.trim()); pair++;
      }
      this.pop = next; this.gen = g; this.lastEvents = { elite: evElite, pairs: evPairs };
      this.logs.push(`Geração ${g}:`, ...L);
      this.record();
      return true;
    }
  }

  const api = { mulberry32, evaluate, repair, tournament, crossover, flip, Engine, str, brl };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();
