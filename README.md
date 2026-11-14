# Simulador de Algoritmo Genético – Seleção de Projetos do Campus

Atividade Prática de **Inteligência Artificial** – Universidade Federal do Piauí (UFPI) – Período 2026.2.

- **Aplicação publicada (GitHub Pages):** https://laranubiamartins.github.io/algoritmo-genetico-projetos/
- **Repositório no GitHub:** https://github.com/laranubiamartins/algoritmo-genetico-projetos

## Autores
- Ana Beatriz dos Santos Sousa Costa
- Késsia Letícia da Silva Lima
- Lara Nubia Martins Ribeiro

## Descrição da solução
O programa usa um algoritmo genético para escolher projetos de melhoria de um campus com orçamento limitado. Cada projeto tem nome, custo em reais e benefício em pontos. O objetivo é maximizar a soma dos benefícios sem ultrapassar o orçamento. Os benefícios são aditivos, não há dependências entre projetos e cada projeto pode ser escolhido no máximo uma vez. A aplicação aceita de 4 a 15 projetos e já inicia com o exemplo da seção 6.1 da atividade.

**Representação.** Cada solução é um cromossomo binário: cada posição é um projeto, `1` indica seleção e `0` indica exclusão (por exemplo, `1010` seleciona o primeiro e o terceiro projetos). Os genes seguem a ordem A, B, C, D… da tabela de projetos.

**Valores monetários.** Os valores em reais são convertidos para **centavos inteiros** dentro do programa, para evitar erros de ponto flutuante na comparação do custo com o orçamento.

**Operadores implementados:**
- **População inicial:** aleatória; cada gene é sorteado de forma independente, com 50% de chance de ser 0 ou 1. A reparação é aplicada em seguida. A população inicial é a geração 0.
- **Aptidão:** benefício total da solução já reparada. A seleção vazia é válida e tem aptidão zero.
- **Reparação:** enquanto o custo ultrapassar o orçamento, remove o projeto selecionado de menor razão benefício/custo. Em caso de empate, remove o de menor índice. É aplicada à população inicial e aos descendentes antes da avaliação.
- **Seleção por torneio:** cada pai vem de um torneio independente. Os candidatos de um torneio são distintos, vence o de maior aptidão e, em empate, o de menor índice na população.
- **Cruzamento de um ponto:** aplicado por par de pais, com a taxa de cruzamento. O corte é sorteado entre o primeiro e o penúltimo gene, isto é, após o gene 1, 2, …, n−1. Sem cruzamento, os filhos copiam os pais.
- **Mutação:** inversão de bits, aplicada de forma independente a cada gene dos descendentes, com a taxa de mutação.
- **Elitismo:** os melhores indivíduos são copiados sem modificação para a geração seguinte (com quantidade zero, nada é preservado). As demais vagas são preenchidas com descendentes, sempre com pais escolhidos na população anterior. Se sobrar uma única vaga, só o primeiro filho do último par é mantido. O tamanho da população é constante e indivíduos repetidos são permitidos.
- **Encerramento:** após o número de gerações configurado. O resultado final é a melhor solução encontrada durante toda a execução (incluindo a geração 0), mostrada com cromossomo, projetos escolhidos, custo total, benefício total e saldo do orçamento.

**Reprodutibilidade.** O gerador pseudoaleatório com semente (`mulberry32`) foi implementado em `genetic.js`. Com os mesmos dados, parâmetros e semente, a execução se repete igual.

## Instruções de uso
1. Abra a página publicada (ou o arquivo `index.html` em qualquer navegador moderno). Não é preciso login nem instalação.
2. Em **Projetos**, edite os dados, use **Adicionar projeto** ou **Remover** (mínimo de 4 e máximo de 15 projetos).
3. Em **Parâmetros**, ajuste os valores. Campos inválidos ficam destacados em vermelho, uma mensagem explica o erro e os botões de execução ficam bloqueados.
4. Qualquer alteração nos dados ou parâmetros exige clicar em **Reiniciar** para ser aplicada.
5. Controles:
   - **Executar / Continuar:** roda as gerações em sequência até o limite configurado.
   - **Pausar:** interrompe a execução e preserva o estado; **Executar** (que vira "Continuar") retoma de onde parou.
   - **Avançar uma geração:** produz exatamente uma nova geração, permanece pausado e toca a animação.
   - **Reiniciar:** limpa o histórico e restabelece a semente configurada.
   - **Rodar testes:** executa na própria página os testes da seção 6 e mostra o resultado.
6. Acompanhe a evolução em **Evolução** (geração atual, melhor aptidão da geração, aptidão média, melhor acumulado e gráfico), em **Melhor solução encontrada**, no **Log das etapas** e no **Histórico por geração**.

**Log das etapas.** Registra os eventos que de fato ocorreram: indivíduos preservados pelo elitismo, pais escolhidos (com seus índices), ponto de corte, filhos, bits alterados pela mutação e cada passo da reparação. Exemplo: `Par 1: pais 1100 (#3) e 0011 (#7); corte após o gene 2; filhos: 1111 e 0000; mutação no(s) gene(s) 1 do filho 1: 1111 → 0111; reparação do filho 1: 0111 → 0101 → 0100;`

**Animação.** O painel "Animação da última geração" reproduz, par a par, os eventos reais registrados pelo algoritmo (não é uma simulação à parte): pais escolhidos pelo torneio, linha tracejada no ponto de corte, troca das caudas (azul = genes do pai 1, laranja = genes do pai 2), bits mutados em vermelho, projeto removido na reparação em roxo e indivíduos da elite em verde. A animação toca ao usar "Avançar uma geração". Durante "Executar" ela fica desligada, e o botão "Reproduzir última geração" permite rever a última geração. A velocidade é ajustável.

## Parâmetros e validação
| Campo | Regra de validação | Valor inicial |
|---|---|---|
| Nome do projeto | não vazio | – |
| Custo do projeto (R$) | positivo, até 2 casas decimais | – |
| Benefício do projeto | número não negativo | – |
| Orçamento disponível (R$) | não negativo, até 2 casas decimais | 7000 |
| Tamanho da população | inteiro ≥ 2 | 20 |
| Número de gerações | inteiro ≥ 1 | 50 |
| Taxa de cruzamento (%) | de 0 a 100, aplicada por par de pais | 80 |
| Taxa de mutação por gene (%) | de 0 a 100, aplicada por gene dos descendentes | 5 |
| Tamanho do torneio | inteiro de 2 até o tamanho da população | 2 |
| Indivíduos de elite | inteiro de 0 até o tamanho da população − 1 | 1 |
| Semente aleatória | número inteiro | 42 |

Campos vazios são considerados inválidos. A vírgula é aceita como separador decimal.

## Bibliotecas e tecnologias
O projeto usa apenas **HTML, CSS e JavaScript puros**, executados no navegador, sem servidor. **Nenhuma biblioteca externa foi utilizada**: o algoritmo genético, o gerador pseudoaleatório com semente, a interface, o gráfico (`<canvas>`) e a animação foram implementados pelos autores.

## Estrutura dos arquivos
- `index.html`: estrutura da página.
- `style.css`: estilos.
- `genetic.js`: algoritmo genético (avaliação, reparação, torneio, cruzamento, mutação, elitismo e gerador com semente).
- `app.js`: interface, validação, controles, gráfico, log e histórico.
- `anim.js`: animação didática.
- `tests.js`: testes da seção 6 (também executável com `node tests.js`).

## Testes de validação (seção 6)

### Dados e configurações usados
- **Projetos (nesta ordem):** A – Melhoria da iluminação (R$ 4.000; benefício 7); B – Instalação de bicicletários (R$ 3.000; benefício 5); C – Aquisição de bancos (R$ 2.000; benefício 3); D – Reforma de espaço de convivência (R$ 5.000; benefício 8).
- **Orçamento:** R$ 7.000.
- **Execução completa:** população 20, 50 gerações, cruzamento 80%, mutação por gene 5%, torneio 2, elite 1, semente 42.

### Saída obtida
Saída do botão "Rodar testes" (equivalente a `node tests.js`):

```
6.2 Avaliação 1100: custo R$ 7.000,00, benefício 12, saldo R$ 0,00, viável true
[OK] 6.2 coincide com o esperado
[OK] 6.2 tabela das 9 soluções viáveis confere
6.3 Reparação de 1111: 1111 → 1101 → 1100
[OK] 6.3 sequência exata 1111 → 1101 → 1100
6.4 Cruzamento: filho1=1111, filho2=0000; mutação: filho1=0111; reparação filho1: 0111 → 0101 → 0100; filho2: 0000
[OK] 6.4 coincide com o esperado
[OK] 6.4 mutação 100% inverte todos os genes
[OK] 6.4 torneio {1000,0011,1100}: vence 1100
[OK] 6.4 empate de aptidão: vence o menor índice
[OK] 6.6 orçamento 0: toda a população é 0000
[OK] 6.6 orçamento 14.000: 1111 → custo 14.000, benefício 23, saldo 0
[OK] 6.5 histórico com 51 registros
[OK] 6.5 melhor acumulado e melhor da geração não diminuem (elitismo 1)
[OK] 6.5 solução final consistente
6.5 Semente 42: melhor 1100, custo R$ 7.000,00, benefício 12, saldo R$ 0,00 (achada na geração 0)
6.5 Mutação 1%: benefícios finais [12,12,12,12,12] | média 12.00 | atingiram 12: 5/5
6.5 Mutação 20%: benefícios finais [12,12,12,12,12] | média 12.00 | atingiram 12: 5/5
```

### Conclusões por teste
- **6.2 – Avaliação:** o cromossomo `1100` resultou em projetos A e B, custo R$ 7.000, benefício 12, saldo R$ 0, solução viável e aptidão 12. As nove soluções viáveis da instância coincidem com a tabela de referência.
- **6.3 – Reparação:** `1111` (custo R$ 14.000; benefício 23) → remove C → `1101` (R$ 12.000; benefício 20) → remove D → `1100` (R$ 7.000; benefício 12). A sequência é exatamente a esperada, pois a regra é determinística.
- **6.4 – Operadores controlados:** com pais `1100` e `0011` e corte após o segundo gene, os filhos são `1111` e `0000`. Com inversão apenas do primeiro gene do filho 1, ficam `0111` e `0000`. A reparação leva o filho 1 a `0111 → 0101 → 0100` (custo R$ 3.000; aptidão 5) e mantém o filho 2 em `0000` (aptidão 0). A mutação em 100% inverte todos os genes. O torneio entre `1000` (7), `0011` (11) e `1100` (12) escolhe `1100`, e em empate de aptidão vence o menor índice.
- **6.5 – Execução completa:** o histórico tem 51 registros (geração 0 e as 50 gerações produzidas). O melhor benefício acumulado e a melhor aptidão da geração nunca diminuem, pois há 1 indivíduo de elite. A solução final é consistente com o cromossomo (custo dentro do orçamento e benefício não superior a 12).
- **6.5 – Efeito da mutação (1% × 20%, sementes 1 a 5):** nas duas configurações as cinco execuções atingiram benefício 12 (média 12,00; 5 de 5 no ótimo). Isso não indica que as taxas sejam equivalentes em geral. O espaço de busca tem apenas 2⁴ = 16 combinações e a população tem 20 indivíduos, então o ótimo costuma aparecer já na geração inicial, e o elitismo o preserva. Em instâncias maiores (até 15 projetos), uma taxa muito baixa tende a explorar pouco o espaço de busca, enquanto uma taxa alta amplia a exploração, mas pode desfazer boas combinações nos descendentes antes da reparação. Qual funciona melhor depende da instância e das sementes.
- **6.6 – Limites de orçamento:** com orçamento R$ 0, toda a população reparada é `0000` (custo, benefício e aptidão zero). Com orçamento R$ 14.000, a avaliação de `1111` retorna custo R$ 14.000, benefício 23 e saldo R$ 0.
