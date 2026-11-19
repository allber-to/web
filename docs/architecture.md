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
