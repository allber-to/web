# 001 — Vincular GitHub e substituir o frontend

**Estado:** em andamento; origem confirmada, importação e handoff visual em execução.
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
- [ ] Inventariar funcionalidades e contratos da base.
- [ ] Implementar frontend fiel com integração funcional.
- [ ] Realizar revisão Fable 5.2 e corrigir achados.
- [ ] Executar verificações e registrar evidências e limitações.
- [ ] Atualizar instruções de execução e preparação para StayCloud.

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

Atualizar esta lista e os checkboxes conforme os handoffs forem validados.

## Verificações

Auditoria Git: `git status --short --branch`, `git remote -v`, `git log -5 --oneline`, `git worktree list`. Nenhum teste de aplicação aplicável antes da disponibilização do código.

- Origem encontrada na aba do Chrome: `allber-to/web`, fork público de `invoiceninja/web`; GitHub CLI confirmou permissões admin/push e branch `main`. Remotos `origin` e `upstream` configurados. Fetch de `main` iniciado sem baixar tags.
- Importação concluída por merge `70ec097c0`, preservando `origin/main` (`5001924`) como ancestral. Nenhum push ou alteração na branch remota `main`.
- Stack confirmada: React 18, TypeScript 7, Vite 8, Tailwind 3, Ant Design 5, TanStack Query 5, Recharts e Vitest. Node local `v22.22.3`; npm `10.9.8`.
- `npm ci --no-audit --no-fund`: sucesso, 916 pacotes, lockfile preservado. Foram emitidos avisos de dependências obsoletas do upstream, sem atualização indiscriminada.
- Baseline antes do redesign: `npm test` passou com **39 arquivos / 295 testes**; `npx tsc --noEmit` sem diagnósticos. Logs temporários em `/tmp/allberto-baseline-tests.log` e `/tmp/allberto-baseline-types.log`.
- Handoff Astra validado por inspeção do documento e captura desktop; referência original byte a byte preservada. Lacunas do protótipo (viewport, Escape, simulações financeiras, máscara incompleta) registradas no handoff.
- Os testes E2E upstream resetam contas; não foram executados sem backend descartável. Perguntado ao usuário se existe homologação, sem solicitar senhas.
