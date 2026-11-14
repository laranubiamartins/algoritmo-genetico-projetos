// Testes de validação (seção 6). Roda no navegador (botão "Rodar testes") ou no Node: node tests.js
const GAlib = (typeof require !== 'undefined' && typeof GA === 'undefined') ? require('./genetic.js') : GA;
function runTests() {
  const { evaluate, repair, tournament, crossover, flip, Engine, str, brl, mulberry32 } = GAlib;
  const out = [], ok = (c, t) => out.push((c ? '[OK] ' : '[FALHOU] ') + t);
  const mk = (arr, B) => ({ P: arr.map(([name, c, b]) => ({ name, cost: c * 100, benefit: b })), B: B * 100 });
  const D = mk([['A', 4000, 7], ['B', 3000, 5], ['C', 2000, 3], ['D', 5000, 8]], 7000);
  const bits = s => s.split('').map(Number);

  let e = evaluate(bits('1100'), D.P, D.B);
  out.push(`6.2 Avaliação 1100: custo ${brl(e.cost)}, benefício ${e.benefit}, saldo ${brl(e.balance)}, viável ${e.feasible}`);
  ok(e.cost === 700000 && e.benefit === 12 && e.balance === 0 && e.feasible, '6.2 coincide com o esperado');
  const tab = { '0000': [0, 0], '1000': [4000, 7], '0100': [3000, 5], '0010': [2000, 3], '0001': [5000, 8], '1100': [7000, 12], '1010': [6000, 10], '0110': [5000, 8], '0011': [7000, 11] };
  ok(Object.entries(tab).every(([k, [c, b]]) => { const r = evaluate(bits(k), D.P, D.B); return r.cost === c * 100 && r.benefit === b && r.feasible; }), '6.2 tabela das 9 soluções viáveis confere');

  const r = repair(bits('1111'), D.P, D.B);
  out.push('6.3 Reparação de 1111: ' + r.steps.join(' → '));
  ok(r.steps.join() === '1111,1101,1100', '6.3 sequência exata 1111 → 1101 → 1100');

  const [c1, c2] = crossover(bits('1100'), bits('0011'), 2);
  const m1 = flip(c1, [0]);
  const r1 = repair(m1, D.P, D.B), r2 = repair(c2, D.P, D.B);
  out.push(`6.4 Cruzamento: filho1=${str(c1)}, filho2=${str(c2)}; mutação: filho1=${str(m1)}; reparação filho1: ${r1.steps.join(' → ')}; filho2: ${str(r2.chrom)}`);
  const f1 = evaluate(r1.chrom, D.P, D.B), f2 = evaluate(r2.chrom, D.P, D.B);
  ok(str(c1) === '1111' && str(c2) === '0000' && str(m1) === '0111' && r1.steps.join() === '0111,0101,0100' && str(r2.chrom) === '0000' && f1.cost === 300000 && f1.benefit === 5 && f2.benefit === 0, '6.4 coincide com o esperado');
  ok(str(flip(bits('0110'), [0, 1, 2, 3])) === '1001', '6.4 mutação 100% inverte todos os genes');

  const rng = mulberry32(1);
  ok(tournament([7, 11, 12], 3, rng) === 2, '6.4 torneio {1000,0011,1100}: vence 1100');
  ok(tournament([8, 8], 2, rng) === 0, '6.4 empate de aptidão: vence o menor índice');

  const z = new Engine({ projects: D.P, budget: 0, popSize: 10, generations: 1, crossRate: .8, mutRate: .05, tournamentSize: 2, elite: 1, seed: 1 });
  ok(z.pop.every(c => str(c) === '0000'), '6.6 orçamento 0: toda a população é 0000');
  const e14 = evaluate(bits('1111'), D.P, 1400000);
  ok(e14.cost === 1400000 && e14.benefit === 23 && e14.balance === 0 && e14.feasible, '6.6 orçamento 14.000: 1111 → custo 14.000, benefício 23, saldo 0');

  const base = { projects: D.P, budget: D.B, popSize: 20, generations: 50, crossRate: .8, mutRate: .05, tournamentSize: 2, elite: 1, seed: 42 };
  const eng = new Engine(base); while (eng.step());
  const h = eng.history, b = eng.best;
  ok(h.length === 51, '6.5 histórico com 51 registros');
  ok(h.every((x, i) => i === 0 || (x.bestSoFar >= h[i - 1].bestSoFar && x.bestGen >= h[i - 1].bestGen)), '6.5 melhor acumulado e melhor da geração não diminuem (elitismo 1)');
  ok(b.cost <= D.B && b.benefit <= 12 && evaluate(b.chrom, D.P, D.B).benefit === b.benefit, '6.5 solução final consistente');
  out.push(`6.5 Semente 42: melhor ${str(b.chrom)}, custo ${brl(b.cost)}, benefício ${b.benefit}, saldo ${brl(b.balance)} (achada na geração ${b.gen})`);

  [0.01, 0.2].forEach(mr => {
    const res = [1, 2, 3, 4, 5].map(s => { const g = new Engine({ ...base, mutRate: mr, seed: s }); while (g.step()); return g.best.benefit; });
    out.push(`6.5 Mutação ${mr * 100}%: benefícios finais [${res}] | média ${(res.reduce((a, x) => a + x, 0) / 5).toFixed(2)} | atingiram 12: ${res.filter(x => x === 12).length}/5`);
  });
  return out.join('\n');
}
if (typeof module !== 'undefined' && require.main === module) console.log(runTests());
