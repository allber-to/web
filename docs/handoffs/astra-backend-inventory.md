# Astra — inventário para backend local

Data: 19/11/2026. Estado: somente leitura concluída; pronto para implementar após decisão do CTO. Nenhum container, imagem, configuração ou código de aplicação alterado. Preview em 4178 preservado.

## Contratos que a arquitetura precisa atender

- `src/common/helpers.ts`: self-hosted usa `VITE_API_URL` como origem, concatenada com `/api/v1/...`; configurar sem sufixo `/api/v1` e sem barra final. Sem variável usa origem do frontend. `VITE_IS_HOSTED=false`; Sentry/DocuNinja/integradores ficam desabilitados. `vite.config.js` não configura proxy; origem separada exige CORS real no backend. Variáveis Vite entram no build e nunca devem conter segredos.
- `src/pages/authentication/Login.tsx` e `common/hooks.ts`: **POST `/api/v1/login/precheck` é obrigatório**, com email; resposta fornece `methods` e `secret_required`. Depois POST `/api/v1/login`, email/password e opcional `X-API-SECRET`. Ausência de precheck impede chegar à senha; não assumir compatibilidade de imagem antiga.
- Login retorna `data[]` de CompanyUser, incluindo account/default_company_id, company, user e `token.token`. `src/common/stores/slices/user.ts` persiste token por empresa. `src/common/helpers/company-session.ts` usa localStorage normalmente e sessionStorage em aba fixada por empresa; `useAuthenticated.ts` restaura por POST `/api/v1/refresh?updated_at=...`. Reload deve testar esse caminho real.
- `src/common/queries/common/headers.ts`: `X-Api-Token`, `X-Requested-With`, `X-React`; requisições JSON também precisam de Content-Type no preflight. Secret opcional e headers de ações específicas devem ser permitidos conforme uso. `request.ts` não liga `withCredentials`; API usa token, sem introduzir autenticação alternativa por cookie. CORS deve alcançar também a rota de download abaixo.
- `src/common/queries/statics.ts`: GET `/api/v1/statics` fornece dados necessários a moeda/idioma. Selecionar BRL e português brasileiro pelos registros retornados, sem inventar IDs. Persistir configuração de empresa e verificar herança no cliente.
- Clientes/faturas/pagamentos usam GET `/api/v1/{clients,invoices,payments}/create`, POST de criação, GET por id com includes e PUT de edição. Recorrentes usam `/api/v1/recurring_invoices`; preservar ações `/bulk` existentes.
- `src/pages/payments/create/hooks/useSave.ts`: POST `/api/v1/payments?email_receipt=false` com `idempotency_key` e vínculos às faturas. Validar valor pago/saldo retornados; não recalcular no frontend para esconder divergência.
- `src/pages/invoices/common/hooks/useGeneratePdfUrl.ts`: PDF salvo usa **GET `/client/invoice/{invitation.key}/download_pdf`**, exigindo invitation existente; editor usa `/api/v1/live_preview`. Permitir acesso local do renderer ao hostname correto. Link por invitation é sensível: não registrar chave em evidência pública.
- Painel: POST `/api/v1/charts/analytics_totals`, `/charts/totals_v2`, `/charts/chart_summary_v2`, GET `/api/v1/activities?reactv2`, listagens de vencidos/recorrentes. `src/pages/dashboard/hooks/useAllbertoQueries.ts` e `helpers/allberto-dashboard.ts` definem consumo; preservar semântica por moeda e dados persistidos da ADR-005.

## Escopo mínimo de implementação posterior

Adicionar ambiente Docker isolado/reproduzível e exemplo de configuração local sem credenciais; documentar start/stop, volumes, versão e smoke. Frontend deve inicialmente precisar apenas de configuração local de origem. Não há justificativa atual para alterar contratos, componentes, fixtures visuais, dependências ou exports. Se compatibilidade exigir código, revisar todos os consumidores acima antes da alteração. Manter harness `tests/local/`, `playwright.allberto-local.config.ts` e servidor 4178 intactos.

Docker read-only confirmou Engine 29.4.3/arm64 no contexto explícito `desktop-linux`, sem containers ativos. Não foi executado pull/build/up. Fonte backend indicada pela coordenação: `allber-to/invoiceninja`, `v5-stable`, commit `15ea35ea63f367eba33c04b7acd9ab1227853537` (v5.13.49). Comparação do fork e seleção imagem/fonte permanecem responsabilidade do handoff CTO; este inventário não afirma que upstream seja equivalente. Debian/Chrome e manifesto arm64 precisam ser confirmados antes de selecionar renderer.

## Smoke real mínimo, sem reset global

1. Instância descartável com DB e storage próprios, bindings loopback, credenciais ignoradas pelo Git e transporte de email local/log. Verificar readiness e migrações sem tocar outros projetos.
2. Login pela UI real (precheck + login), acesso ao painel, reload/refresh autenticado e logout/login. Nenhum mock/intercept de resposta de negócio.
3. Configurar pt_BR/BRL; criar um cliente fictício com contato local; recarregar e conferir GET persistido.
4. Criar uma fatura de R$ 123,45 com uma linha, salvar e verificar detalhe/lista e resposta. Gerar PDF e conferir arquivo PDF real, texto/valor/acentos; registrar resultado de preview separadamente.
5. Criar recorrente mensal de R$ 123,45 com envio para destino local; conferir persistência e listagem. Iniciar/parar somente sob cron/worker e transporte local definidos pelo CTO; conferir próxima emissão, sem alegar geração agendada se não executada.
6. Registrar pagamento manual de R$ 23,45 com recibo desmarcado; recarregar fatura e verificar `paid_to_date=23.45`, `balance=100.00`, vínculo do pagamento e indicadores do painel coerentes. Não usar gateway real.
7. Reiniciar somente os serviços deste Compose sem apagar volumes e confirmar os mesmos IDs/saldos. Isso demonstra persistência além do cache e reload.

## Testes reutilizáveis e riscos

`tests/e2e/{clients,invoices,payments,recurring-invoices,settings-company-localization-defaults}.spec.ts` e `api-helpers.ts` fornecem seletores/payloads/fluxos úteis. **Não executar diretamente:** `global-setup.ts` reseta contas e cada spec acima chama `resetAccountBeforeAll()` (`fixtures.ts`), independentemente de `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1`. O teste `login.spec.ts` intercepta precheck/login e não comprova backend real. Criar smoke isolado pequeno ou execução controlada sem importar fixtures destrutivas; usar dados exclusivos e origem loopback validada antes de escrever.

Riscos concretos: versão backend sem precheck; CORS funcionando para API mas não PDF; renderer sem arm64 ou sem acesso ao APP_URL; credenciais/APP_KEY regeneradas entre boots; perda de DB/storage em down -v; cron/email acionando destinos externos; suíte upstream alterando contas fora do ambiente; token de uma instância reutilizado em outra origem de frontend. Cobrir explicitamente por configuração e smoke, sem alterar o frontend por antecipação.

Não foram executados testes de integração, acesso WHMCS, commit/push ou deploy. Opção menor recomendada: Compose local + configuração Vite + smoke isolado, sem reescrever API nem adicionar serviços opcionais antes da decisão CTO.
