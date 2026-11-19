# Astra — inventário de publicação EasyPanel

19/11/2026. SOMENTE leitura e proposta; aguardando GO arquitetural do CTO. Não acessei o painel/VPS/WHMCS, não executei smoke remoto, não alterei `src/` ou `local-backend/` e não criei artefatos de deploy. Base informada: `77808e1ec`, branch `luizstay/luiz-feat-link-github`, origem pública `allber-to/web`.

## Menor entrega proposta

Steering confirmado: domínio futuro allber.to ainda não comprado; agora acessar pelo IP 192.102.140.18, HTTP temporário de homologação, sem dados financeiros reais. Proposta atual: um Compose do projeto com frontend nginx como entrada única e proxy para nginx backend, preservando uma só origem para API e portal. O coordenador deve conferir no EasyPanel se consegue rotear Host(IP) pela porta 80 existente, sem conflitar com aplicações alheias; não assumir host port disponível. Reutilizar a imagem oficial 5.13.49 por digest multiarch, os quatro serviços e configurações nginx já validados. Não importar banco, volumes, dados ALB-LOCAL ou `.env` local.

O frontend não requer servidor Node em runtime. Proponho `deploy/easypanel/frontend.Dockerfile` com build context na raiz: Node 22 Debian slim → `npm ci` (dependências dev incluídas para TypeScript/Vite) → `npm run build` → nginx somente com `dist/`. Usar `HUSKY=0` no estágio de build para não depender de `.git` durante prepare. O lockfile existente é a fonte das dependências; nenhuma nova biblioteca.

Arquivos que a implementação deverá alcançar após GO:

| Arquivo | Finalidade |
| --- | --- |
| `.dockerignore` | Excluir `.git`, `node_modules`, `dist`, `.env*`, `local-backend`, artefatos/evidências e arquivos de credenciais do contexto. Não excluir testes indiscriminadamente: tsconfig atual verifica arquivos de teste e aliases `$tests`. |
| `deploy/easypanel/frontend.Dockerfile` | Build multiestágio, argumentos públicos explícitos, revisão em label OCI e arquivo público pequeno de versão. |
| `deploy/easypanel/frontend.conf` | nginx SPA, healthcheck estático e cache correto. |
| `deploy/easypanel/compose.yml` | Frontend + backend adaptados ao roteamento do painel, sem portas publicadas ou container_name salvo decisão explícita sobre exposição por IP. |
| `deploy/easypanel/nginx/*.conf` | Cópias rastreáveis da configuração backend validada, com app:9000 consistente com nome do serviço. |
| `deploy/easypanel/env.example` + instruções | Nomes/valores públicos e placeholders vazios para segredos; nunca valores da instância local. |
| `docs/` | Revisão, parâmetros finais, backup/rollback e checklist de aceite. |

Nenhuma alteração de callers, exports ou contratos de frontend é necessária no desenho proposto. `vite.config.js`, `sentry.config.ts`, `src/common/helpers.ts`, `src/index.tsx` e `tsconfig.json` foram conferidos como consumidores da configuração.

## Build e roteamento frontend

`VITE_API_URL` vazio usa window.location.origin; é a opção preferida no mesmo IP e continua válida ao migrar para domínio. Não injetar URL de API separada nem localhost. Caso CTO opte por origem explícita, ela deve ser pública, sem `/api/v1` nem barra final e injetada em build. `VITE_IS_HOSTED=false`, `VITE_IS_TEST=false`, `VITE_ROUTER=browser`, `VITE_APP_TITLE=allberto`. Desabilitar explicitamente integrações opcionais já desligadas no exemplo (DocuNinja, QuickBooks, feedback); deixar Sentry/social/Pusher/gateways vazios. Não copiar `.env.example` integralmente para produção: ele contém `VITE_IS_TEST=true`. A configuração self-hosted não precisa token de Sentry e não publica sourcemaps.

O EasyPanel passa variáveis do serviço/projeto como build args; declarar apenas argumentos públicos necessários, mais `GIT_SHA`. Segredos pertencem exclusivamente ao runtime do backend. `VITE_*` é conteúdo público do bundle e mudar origem exige rebuild, não apenas restart.

nginx frontend deverá atender `/invoices/:id`, `/clients/:id/edit` e demais rotas com fallback `/index.html`. `index.html` sem cache persistente; `/react/` contém assets com hash gerados pelo Vite e admite cache imutável. Arquivo ausente em `/react/` deve responder 404, nunca HTML do fallback. Fontes/TinyMCE e demais arquivos públicos sem hash não recebem cache imutável genérico. `public/` atual tem cerca de 16 MB; `dist/` validado cerca de 56 MB. Não há service worker registrado pelo frontend no código consultado.

A entrada única precisa de proxy explícito de namespace, sem transformar erros API em fallback SPA. Auditoria de `routes/web.php`, `routes/client.php`, layouts Blade do portal e callers frontend identificou:

| Destino backend | Evidência/uso |
| --- | --- |
| `/api/` | Login, refresh, CRUD, preview e demais endpoints. |
| `/client` e `/client/`, `/vendor/` | Login/portal, convite e PDF/download. Exatos e prefixos separados para não capturar `/clients` SPA. |
| `/documents/{hash}` e variante `/hashed` | Downloads chamados por DocumentsTable e telas de documentos; distinguir do módulo frontend `/documents` e possíveis rotas DocuNinja. |
| `/password/`, `/user/confirm/`, `/set_password` | Recuperação/ativação/convite backend. |
| `/build/`, `/css/`, recursos backend em `/images/`, `/storage/` | Layouts portal usam `@vite(resources/js/app.js)`, `@vite(resources/sass/app.scss)` e fonte `asset(css/...woff2)`; manifest do backend deve confirmar `/build/` antes de fixar. |
| `/auth/`, `/calendar_connection/`, `/nordigen/`, `/quickbooks/` e callbacks de gateways | Fora do aceite funcional inicial; registrar limites ou mapear após conferência, sem afirmar integrações funcionais. |

Allberto mantém `/react/`, `/allberto/`, arquivos públicos existentes e fallback SPA. Não usar proxy de todos os arquivos `.js`/`.css`: isso conflitaria com assets Allberto. Também não encaminhar `/login`, `/invoices`, `/clients` ao backend, pois são rotas da SPA. O backend traz muitos bundles da UI upstream na raiz de public; não é necessário publicar essa UI por acidente. Conferir colisões em imagens/favicon antes do nginx final. Proposta executável de roteamento precisa do GO CTO, conforme pedido do coordenador.

No HTTP temporário, `APP_URL=http://192.102.140.18` e `REQUIRE_HTTPS=false` apenas se essa for realmente a porta pública escolhida. Depois, migrar APP_URL para HTTPS/domínio e REQUIRE_HTTPS=true; o frontend same-origin não precisa rebuild por troca de hostname. Tratar esta etapa como homologação, não como produção com dados financeiros reais.

## Adaptação backend proposta ao CTO

- Manter app `invoiceninja/invoiceninja-debian@sha256:05efd0913eb0d72d0246ec96d6cb6adf5ac3d3e59b9b91514b9f64b892f21c92`. Confirmar arquitetura real da VPS antes de afirmar o digest de plataforma; o digest arm64 local não deve ser imposto em amd64.
- Retirar `127.0.0.1:8012:80`; o painel deve rotear a entrada pública por IP ao frontend nginx porta 80, que encaminha os namespaces backend ao nginx interno. MySQL, Redis e PHP-FPM sem host ports. Sem `container_name`, sem nome de projeto global que conflite com o gerenciamento EasyPanel.
- Usar restart de produção definido pelo CTO (proposta: `unless-stopped` em Compose), healthchecks/dependências existentes e volumes nomeados estáveis para public/storage/mysql/redis. Uma réplica app mantém o cron/worker embutido já validado; não criar cron ou workers duplicados.
- `APP_URL` e `REQUIRE_HTTPS` conforme a etapa HTTP/IP ou HTTPS/domínio acima; manter `APP_ENV=production`, `APP_DEBUG=false` para não publicar debug. Encaminhamento TLS futuro pelo proxy EasyPanel. Conferir headers forwarded e geração de links; TRUSTED_PROXIES deve ser definido pelo CTO conforme a rede do proxy.
- Gerar APP_KEY e senhas novos, administrador com email fornecido pelo proprietário; guardar no ambiente/segredos do serviço. Bootstrap não deve ser repetido com chaves diferentes sobre volumes existentes.
- Mail inicial em log enquanto não houver transporte autorizado/configurado. Não alegar SMTP ou entrega real. A7 local já demonstrou PDF e log sem egress; decisão sobre egress de produção cabe ao CTO conforme integrações reais desejadas. Se manter rede backend internal, nginx precisa estar na rede pela qual EasyPanel consegue alcançá-lo; verificar comportamento da versão instalada do painel, sem inventar nome de rede externa.
- Backend aceita token e headers atuais; validar a mesma origem no proxy real e PDF via `/client/invoice/{invitation}/download_pdf`, sem expor invitation keys em evidência. Não introduzir cookies cross-origin.
- Confirmar política de cadastro de novas contas e primeira configuração da empresa antes de disponibilizar credenciais. Não adivinhar variável de hardening não conferida na versão 5.13.49.

## Backup, identificação e rollback

Identificar release por SHA Git completo, digest da imagem frontend construída, digest backend e snapshot dos parâmetros públicos. Preferir revisão fixa ao deploy automático da branch móvel; trigger automático não é necessário para primeira publicação. OCI revision e `/version.json` público podem conter somente SHA/versão, nunca variáveis inteiras.

Rollback frontend: reconstruir/reimplantar SHA anterior com a mesma origem API e manter imagem anterior disponível até aceite. Rollback backend não é simples troca de tag depois de migração: antes de upgrade, precisa dump MySQL consistente, storage/public e APP_KEY preservada em cofre; restauração é decisão operacional específica. Nesta fase a versão backend fica 5.13.49. Não prometer backup automático de volumes de Compose com base apenas no recurso de backup de bancos gerenciados do painel; confirmar suporte/rotina, destino, retenção e pelo menos uma restauração antes de alegar backup validado.

## Checks após GO

Localmente: build Docker sem segredos; `nginx -t`; health estático; `/` e rota profunda 200/HTML; asset real com cache imutável e asset ausente 404; index sem cache persistente; versão correta; ausência de localhost/fixtures/segredos no bundle final; validação sintática Compose sem imprimir configuração expandida. Usar projeto/porta de verificação próprios, preservando os serviços locais atuais.

Remotamente, somente coordenador: versão/arquitetura/recursos e inventário antes/depois; HTTP temporário no IP e plano HTTPS posterior; precheck/login/refresh real; listas vazias normais, empresa BRL/pt_BR/Brasil; PDF com dado autorizado e sem envio externo implícito; persistência após redeploy controlado. Não reutilizar `local-backend/smoke.mjs` contra VPS: suas travas locais são intencionais e o dataset não é de produção.

Pendências concretas: GO CTO, roteamento público pelo IP no painel (e domínio/TLS posterior), email administrador, arquitetura/capacidade e versão/recursos efetivos do EasyPanel, política de egress e backup. Não bloqueiam preparar a proposta; impedem fixar configuração final sem inventar valores.

## Fontes oficiais consultadas

- [Compose Service](https://easypanel.io/docs/services/compose): serviço Git com build path, roteamento a serviço/porta interna, ambiente e avisos para host ports/container_name.
- [Builders](https://easypanel.io/docs/builders): Dockerfile relativo ao Build Path, contexto restrito àquele diretório e build args públicos incluindo GIT_SHA.
- [App Service](https://easypanel.io/docs/services/app): build/deploy de um container e domínio pelo proxy do painel.

Não foi feito deploy, build novo ou alteração de runtime nesta tarefa. Opção menor alinhada ao steering: um Compose com frontend estático/proxy e backend existente, uma origem no IP, sem trocar imagem ou criar outra aplicação.
