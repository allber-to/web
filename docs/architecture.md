# Decisões de integração

## ADR-001 — confirmar a origem antes de implementar

**Data:** 19/11/2026. **Estado:** adotada.

O checkout contém somente um commit vazio. “Ninja” não identifica com segurança a base. A URL do fork precisa ser confirmada antes de escolher stack, importar código ou trocar o frontend.

**Decisão:** manter o design como referência e produzir seu handoff independentemente. Não criar uma aplicação substituta com contratos inventados. Após confirmar a URL, verificar branch padrão, histórico, licença, arquivos de instrução, estrutura e comandos de validação.

**Resolução:** origem identificada na aba do Chrome já aberta e confirmada via GitHub API: `allber-to/web`, fork de `invoiceninja/web`. Configurados `origin` e `upstream` separadamente. Importar `origin/main` com merge de históricos independentes preserva o commit local inicial e o histórico completo do fork.

## ADR-002 — preservar funcionalidades e histórico

**Data:** 19/11/2026. **Estado:** adotada.

Preferir alterações na camada visual da stack existente. Documentar o mapeamento entre telas da proposta e rotas/ações reais. Preservar validação, estados de erro, acessibilidade, autenticação e persistência. Mudanças em contratos exigem atualizar todos os consumidores afetados.

O remoto deverá apontar ao fork do usuário; qualquer upstream será identificado separadamente. Não usar push forçado nem reescrever branches compartilhadas. Verificar as duas worktrees existentes antes de operações que alterem metadados Git comuns.

## ADR-003 — separar preparação de implantação

**Data:** 19/11/2026. **Estado:** adotada.

A VPS StayCloud é etapa posterior ao frontend validado. Dimensionamento, domínio, serviços, persistência, backups, TLS e rollback serão definidos a partir da stack real. Não fornecer comandos de produção com parâmetros presumidos.

## ADR-004 — validar localmente sem simular um backend de produção

**Data:** 19/11/2026. **Estado:** adotada, confirmada pelo proprietário.

Não existe homologação. O harness em `tests/local/` monta páginas e stores reais sobre fixtures explicitamente fictícias, intercepta API e bloqueia rede externa. A configuração Playwright é independente da suíte upstream, cujo global setup reseta contas. O harness e os mocks não entram no build de produção.

Essa validação comprova comportamento local dos componentes e rotas montadas. Autenticação, autorização do servidor, persistência e operações financeiras continuam exigindo homologação real.

## ADR-005 — leitura financeira separada do estado editável

**Data:** 19/11/2026. **Estado:** implementada e revalidada por Fable 5.2.

O editor upstream recalcula e modifica seu clone de fatura. A visão geral somente de leitura recebe `persistedInvoice`, a resposta original da query, em vez desse clone. Não recomputar `paid_to_date`, `balance` ou `line_total` a partir de outros valores; mudanças não salvas não podem aparecer como persistidas.

A regressão descoberta por Fable é coberta por um teste que executa o calculador real sobre o clone e verifica que a tela conserva os valores do snapshot do servidor. Detalhes nos [handoffs de entidades](handoffs/astra-entities.md) e [revisão Fable](reviews/fable-entities.md).

## ADR-006 — validar o backend do fork em ambiente local isolado

**Data:** 19/11/2026. **Estado:** implementada e aceita por Fable 5.2; [revisão final](reviews/fable-local-backend.md).

O proprietário autorizou a integração local antes da VPS. O fork `allber-to/invoiceninja` não difere da release 5.13.49; usar a imagem oficial fixada por digest evita manter um build próprio sem customização. Qualquer futura mudança no fork exige reavaliar essa equivalência.

O projeto Compose `allberto-ninja-local` separa volumes e rede, publica apenas a API em loopback e mantém app, banco e Redis sem saída externa. O frontend real usa a API em uma porta distinta da prévia com fixtures. Segredos ficam em arquivo local ignorado e não são regenerados ao reiniciar.

O smoke próprio verifica contratos reais, valores financeiros persistidos, PDF e e-mail em log, sem chamar resets da suíte upstream. A [arquitetura detalhada](architecture-local-backend.md) registra digests, critérios A1–A10 e limites; o [registro da fase](stories/002-local-backend.md) acompanha a execução. Esse ambiente não constitui uma configuração de produção.
