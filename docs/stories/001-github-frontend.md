# 001 — Vincular GitHub e substituir o frontend

**Estado:** implementação, revisão e validação local concluídas; integração real e implantação ficam para a próxima etapa.
**Coordenação:** SINAPSE / Imperator.
**Complexidade:** COMPLEX; redesign de aplicação existente, não criação de produto do zero.

## Auditoria inicial — 19/11/2026

| Dimensão | Evidência |
| --- | --- |
| Documentação | Ausente inicialmente; criada nesta execução |
| Marca | Presente na proposta HTML; em análise |
| Sistema visual | Embutido na proposta; em extração |
| Componentes | Nenhum código de aplicação no checkout |
| Código | Commit vazio `947088e` |
| Testes | Ausentes |
| Infraestrutura | Ausente |
| Git | Branch `luizstay/luiz-feat-link-github`; nenhum remoto |

Maturidade: **PARTIAL**, considerando a referência de design já fornecida. Há outra worktree em `../stingaree`, também inicialmente no commit vazio; não alterá-la incidentalmente.

## Fases e handoffs

| Fase | Responsável | Entrega | Validação para próxima fase |
| --- | --- | --- | --- |
| 1. Origem e escopo | Imperator | URL confirmada, remoto e inventário funcional | Origem inequívoca; histórico e código disponíveis |
| 1b. Referência visual, independente | squad-design / Scaffold, Astra | `front-end-spec.md`, referência e licenças | Tokens, telas e interações identificados no artefato |
| 2. Implementação | squad-design / Scaffold, Opus 5.5 e Astra | Frontend integrado e documentação | Fases 1 e 1b completas; contratos reais preservados |
| 3. Qualidade | squad-design, Fable 5.2 solicitado | Relatório de revisão e evidências | Build, fluxos, comparação visual e acessibilidade verificados |
| 4. Preparação StayCloud | Coordenação técnica | Instruções de execução, deploy e rollback | Stack confirmada e frontend validado; implantação futura |

## Progresso

- [x] Auditar checkout, remotos, histórico e referência fornecida.
- [x] Ativar SINAPSE e definir fases com handoffs.
- [x] Registrar briefing, decisões e restrições WHMCS.
- [x] Consultar GitHub conectado por nome e pedir URL do fork quando não identificado.
- [x] Identificar a URL e confirmar origem/permissões.
- [x] Vincular remoto e importar a base preservando o histórico.
- [x] Extrair e verificar o handoff visual com Astra.
- [x] Inventariar funcionalidades e contratos da base.
- [x] Implementar frontend integrado à base, com diferenças de contrato documentadas.
- [x] Realizar revisão Fable 5.2 e corrigir achados.
- [x] Executar verificações e registrar evidências e limitações.
- [x] Atualizar instruções de execução e preparação para StayCloud.

## Registro de execução

- Auditoria: nenhuma aplicação, dependência, teste, remoto ou arquivo de infraestrutura na pasta; apenas `.git` de uma worktree.
- GitHub: busca por Allberto e Ninja não identificou o fork; acesso via conector é limitado. URL solicitada ao usuário. Nenhum remoto foi configurado por suposição.
- Astra (`gpt-6-astra`) delegado para analisar somente a referência e produzir handoff. Implementação ainda não iniciada.
- Nenhum acesso ao WHMCS, nenhuma alteração em VPS e nenhum push realizados.

## Arquivos entregues

- `AGENTS.md`
- `README.md`
- `.gitignore`
- `docs/project-status.md` (registro inicial; o README upstream será preservado na importação)
- `docs/project-brief.md`
- `docs/architecture.md`
- `docs/stories/001-github-frontend.md`
- `docs/front-end-spec.md`
- `design/README.md`
- `design/proposta-original.html`

Entregas adicionais da implementação:

- `src/components/layouts/`, `src/components/datatables/StatusTabs.tsx`, componentes compartilhados e tokens em `src/resources/css/allberto.css`.
- `src/pages/dashboard/`, `src/common/hooks/useRefetch.tsx` e traduções `en`/`pt_BR`.
- Páginas de clientes, faturas, recorrentes e pagamentos; nova visão geral em `src/pages/invoices/overview/` e estilos em `src/pages/allberto-entities.css`.
- Fontes/licenças/favicon em `public/allberto/`, título em `index.html` e `.env.example`.
- Testes `tests/unit/allberto-*.test.ts`, configuração `playwright.allberto-local.config.ts`, harness `tests/local/` e fixture de inspeção `tests/browser/fixtures/allberto-shell/`.
- Handoffs em `docs/handoffs/`, revisões em `docs/reviews/`, [validação](../validation.md) e [preparação StayCloud](../staycloud.md).

O diff Git contém a lista completa de arquivos alterados. Capturas e traces de execução locais ficam ignorados; evidências selecionadas nos handoffs são versionadas com sua fase identificada.

## Verificações

Auditoria Git: `git status --short --branch`, `git remote -v`, `git log -5 --oneline`, `git worktree list`. Nenhum teste de aplicação aplicável antes da disponibilização do código.

- Origem encontrada na aba do Chrome: `allber-to/web`, fork público de `invoiceninja/web`; GitHub CLI confirmou permissões admin/push e branch `main`. Remotos `origin` e `upstream` configurados. Fetch de `main` iniciado sem baixar tags.
- Importação concluída por merge `70ec097c0`, preservando `origin/main` (`5001924`) como ancestral. Nenhum push ou alteração na branch remota `main`.
- Stack confirmada: React 18, TypeScript 7, Vite 8, Tailwind 3, Ant Design 5, TanStack Query 5, Recharts e Vitest. Node local `v22.22.3`; npm `10.9.8`.
- `npm ci --no-audit --no-fund`: sucesso, 916 pacotes, lockfile preservado. Foram emitidos avisos de dependências obsoletas do upstream, sem atualização indiscriminada.
- Baseline antes do redesign: `npm test` passou com **39 arquivos / 295 testes**; `npx tsc --noEmit` sem diagnósticos. Logs temporários em `/tmp/allberto-baseline-tests.log` e `/tmp/allberto-baseline-types.log`.
- Handoff Astra validado por inspeção do documento e captura desktop; referência original byte a byte preservada. Lacunas do protótipo (viewport, Escape, simulações financeiras, máscara incompleta) registradas no handoff.
- Os testes E2E upstream resetam contas; não foram executados sem backend descartável. Perguntado ao usuário se existe homologação, sem solicitar senhas.
- Usuário confirmou `https://github.com/allber-to/web` e que ainda não existe backend de homologação: **validar localmente primeiro**. Nenhuma integração remota está autorizada como substituto desse ambiente. Testes de navegador terão fixtures e interceptação de rede locais, sem global-setup/reset de contas upstream.
- Primeira entrega de entidades concluída por Astra em `docs/handoffs/astra-entities.md`: listas existentes preservadas, detalhe cliente reorganizado, overview de fatura com dados persistidos. Cinco testes focados passaram; validação integrada e revisão ainda pendentes.
- Opus 5.5 em execução via Orca, dispatch `ctx_91d93c4c5dea`, tarefa `task_cdce80620190`, responsável pelo shell, componentes compartilhados e dashboard.
- Fable 5.2 concluiu a revisão independente das entidades (`docs/reviews/fable-entities.md`, dispatch `ctx_530da9ecb07b`). Veredito: **requer correções**. O teste isolado não detectava que a visão geral recebia o átomo editável, mutado pelo cálculo do editor; valores persistidos podiam ser substituídos e mudanças não salvas aparecer na tela de leitura. Astra recebeu correção prioritária e teste de regressão com o cálculo real, além do ajuste de cache de atividades por tipo de entidade e correções menores. Aceite final pendente de nova revisão.
- Harness de navegador isolado em preparação por Astra, com páginas/stores reais, fixtures locais e bloqueio de rede externa, sem o global-setup destrutivo da suíte upstream. Relatórios temporários ficam ignorados em `tests/local/artifacts/`.
- Correção Astra do bloqueio financeiro concluída: snapshot persistido separado do draft; regressão com `InvoiceSum` real reproduziu falha antes e passou depois. Cache de atividade e achados menores tratados no handoff. Revalidação independente solicitada.
- Opus entregou shell, componentes e painel, com 317 testes unitários passando naquele estado. Checagem TypeScript integrada confirmou somente três erros em fixtures/config locais de teste; diagnósticos repassados a Astra para correção. Build ainda não executado.
- Finalização Opus solicitada para traduções, controles de rodapé acessíveis, conta nova e classificação de 403/404 da consulta analytics. O helper HTTP upstream resolve esses erros como `undefined`; a nova consulta precisa usar o padrão existente de preservação dos erros para não perder o status HTTP.
- Finalização Opus concluída (`ctx_604300ade26f`): 55 chaves em en/pt_BR, classificação HTTP preservada, conta nova verificada por permissões e totais, controles de ajuda acessíveis, KPIs em coluna até 360px e listas em cartões no mobile. Seus 25 testes focados passaram, lint dos arquivos limpo e TypeScript exit 0; detalhes em `docs/handoffs/opus-shell-dashboard.md` §8. Build e suíte completa ainda pendentes.
- Fonte Opus congelada; Astra recebeu os dois acabamentos restantes (chip vazio de Ações no mobile e mensagem de atividade vazia) e execução final de dez testes Playwright, incluindo pt_BR/plurais. Fable será retomado para revisão integrada. Nenhuma evidência de fixture equivale a validação contra servidor real.
- Fable identificou três médias no Painel (moeda, máscara de estorno, invalidação de analytics). Opus corrigiu as três e as semânticas dos indicadores; Fable revalidou e aprovou no escopo de leitura. Registro final em `docs/reviews/fable-integrated.md`; 43 testes focados passaram na revalidação.
- Checks do coordenador: 343 testes em 47 arquivos passaram, lint global limpo, build TypeScript/Vite passou após corrigir narrowing em teste. Mais 22 testes de regressão passaram após o acabamento da gaveta. Bundle não contém marcadores das fixtures e inclui as quatro fontes locais.
- A investigação visual reproduziu sobreposição de foco da gaveta com o modal de alterações não salvas; Astra corrigiu o fechamento imediato ao navegar e verificou continuar editando/descartar. Recorte de Combobox não foi reproduzido. A matriz final ampliada para 12 casos identificou overflow desktop em recorrentes, em correção; ainda não concluído o aceite visual.
- Overflow corrigido posicionando o cabeçalho Ações que contém texto `sr-only`. A inspeção das capturas também levou ao valor ativo correto nas abas mobile (`href`) e à correção compartilhada de filhos condicionais inválidos em `SelectField`. Suplemento de navegação entre abas passou; Fable aceitou os quatro diffs finais por leitura. Unitários completos (343), lint global e build passaram novamente com essa fonte.
- Uma rodada de 12 casos passou nas verificações, mas exigiu encerramento manual do worker: registrada como execução não limpa. A matriz definitiva de 13 casos, incluindo abas, está em execução; não atribuir aceite final ao encerramento forçado.
- **Fechamento:** matriz definitiva **13/13 passou em 1,9 min, exit 0 natural**, sem intervenção de encerramento. Treze auditorias confirmam 418 leituras locais, zero chamadas externas/não mapeadas e zero erros JavaScript não tratados. Trinta e três capturas geradas; quatro selecionadas em `docs/evidence/allberto/`. Suplemento Fable aceitou os últimos diffs sem novos achados. Toda a fonte foi congelada antes da entrega.
