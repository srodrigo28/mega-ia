# Plano de Analise - Mega-Javascript (Mega-Sena)

## 1) Diagnostico completo do projeto atual

### Estrutura encontrada
- Frontend estatico: `index.html`, `css/`, `js/`
- Foco atual: simular aposta da Mega-Sena com selecao manual e sorteio local

### Pontos positivos
- Interface simples e direta para selecionar dezenas
- Regras de preco da aposta (6 a 15 numeros) implementadas
- Dark mode com persistencia em `localStorage`

### Problemas tecnicos que impactam resultado/confiabilidade
1. Script principal da aposta nao esta sendo carregado no HTML.
- `index.html` nao importa `js/processaJogo.js`, entao funcoes como `selecionarNumeros()` e `apostar()` podem falhar no navegador.
2. Sorteio com bug de repeticao e vies de distribuicao.
- Em `sortearNumeros()`, o `while` recria `numeroSorteado` com `let` interno e nao atualiza a variavel externa.
- Uso de `Math.round(Math.random() * 59 + 1)` gera distribuicao nao uniforme; o correto e `Math.floor(Math.random() * 60) + 1`.
3. Variaveis de loop globais.
- `i` e `j` sao usadas sem `let/const`, o que pode gerar efeitos colaterais.
4. Logica de estado sem reset robusto.
- `qtdAcertos` pode acumular em cenarios de reuso de estado.
5. Script de tema com duplicidade de funcao.
- `switchTheme()` aparece duas vezes em `js/toogleScript.js`.

## 2) Dados da web (oficiais) usados na analise

Fontes:
- Pagina oficial Mega-Sena: https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx
- API oficial (ultimo concurso): https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena
- Download oficial de historico (XLSX): `https://servicebus2.caixa.gov.br/portaldeloterias/api/resultados/download?modalidade=MEGA_SENA`

Base analisada:
- Concursos `1` a `2981` (ultimo concurso retornado pela API em **07/03/2026**).
- Planilha oficial ate concurso `2964` + complemento via API (`2965` a `2981`).

## 3) Tabela - dezenas que mais saem (historico completo ate concurso 2981)

Legenda:
- Frequencia esperada por dezena em 2981 concursos: `298,1`
- Cada dezena tem probabilidade teorica igual por concurso (10% de aparecer em um sorteio de 6/60).

| Ranking | Dezena | Frequencia | Desvio vs esperado |
|---|---:|---:|---:|
| 1 | 10 | 352 | +18,08% |
| 2 | 53 | 340 | +14,06% |
| 3 | 37 | 325 | +9,02% |
| 4 | 05 | 323 | +8,35% |
| 5 | 34 | 321 | +7,68% |
| 6 | 33 | 319 | +7,01% |
| 7 | 38 | 319 | +7,01% |
| 8 | 27 | 318 | +6,68% |
| 9 | 32 | 317 | +6,34% |
| 10 | 46 | 315 | +5,67% |

## 4) Analise estatistica para melhorar acerto (de forma realista)

### Verdade matematica principal
- Na Mega-Sena, **historico nao muda a probabilidade base futura** de cada dezena.
- Numeros "quentes" podem ser usados como criterio de estrategia, mas nao garantem aumento real da chance teorica da Sena.

### Sinais observados na base
- Qui-quadrado global: `80,78` (dispersao historica existe, mas dentro do comportamento de serie longa aleatoria).
- Distribuicao impar/par por concurso:
  - 2 impares / 4 pares: `722`
  - 3 impares / 3 pares: `920` (mais comum)
  - 4 impares / 2 pares: `718`
- Repeticao em relacao ao concurso anterior:
  - 0 repetidas: `1553`
  - 1 repetida: `1158`
  - 2 repetidas: `244`
  - 3+ repetidas: raro
- Soma das 6 dezenas:
  - Media: `183,16`
  - Desvio padrao: `40,00`

### Como usar isso para "melhor acerto"
1. Balancear jogos em padroes mais frequentes.
- Priorizar combinacoes com `2/4`, `3/3` ou `4/2` entre impares e pares.
2. Evitar extremos pouco provaveis.
- Evitar jogos com soma muito baixa ou muito alta (faixa pratica: media +/- 1 desvio, aprox. `143` a `223`).
3. Misturar historico longo + janela recente.
- Longo prazo (ranking total) para estabilidade.
- Curto prazo (ultimos 100 concursos) para tendencia local.
4. Reduzir chance de premio dividido.
- Evitar sequencias obvias (1-2-3-4-5-6), dezenas em coluna/diagonal comum e datas.
5. Aumentar cobertura combinatoria quando o objetivo for acerto.
- Mais jogos ou apostas de 7-15 dezenas aumentam a chance de acerto porque cobrem mais combinacoes.

## 5) Plano de execucao recomendado (roadmap pratico)

### Fase 1 - Correcao tecnica do app (prioridade alta)
1. Corrigir carga de scripts no `index.html`.
2. Corrigir RNG (`Math.floor`) e remocao correta de repetidas.
3. Corrigir escopo de variaveis (`let/const`) e reset de estado.
4. Padronizar codigo (ESLint + formatacao).

### Fase 2 - Motor de estatistica
1. Criar rotina que atualiza dados oficiais automaticamente (API + planilha).
2. Gerar tabela de frequencia por dezena (global e ultimos N concursos).
3. Calcular metricas: impar/par, soma, repeticao, distribuicao por faixas.

### Fase 3 - Gerador de jogos com criterio
1. Gerar jogos respeitando filtros estatisticos configuraveis.
2. Permitir perfis: conservador, equilibrado, agressivo.
3. Exibir score de cada jogo (aderencia aos filtros).

### Fase 4 - Backtest e melhoria continua
1. Simular concursos passados e medir taxa de quadra/quina/sena por estrategia.
2. Comparar contra baseline aleatorio.
3. Ajustar pesos dos filtros com base no resultado historico.

## 6) Metas objetivas de resultado

- Curto prazo: app tecnicamente correto e reproduzivel.
- Medio prazo: dashboard com estatisticas atualizadas por concurso.
- Longo prazo: estrategia validada por backtest para melhorar consistencia de acertos menores (principalmente quadra/quina), sem prometer ganho garantido.
