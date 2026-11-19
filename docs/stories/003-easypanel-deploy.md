# 003 — Publicação no EasyPanel da StayCloud

**Estado:** concluída em 19/11/2026, com [aceite final do CTO para homologação](../reviews/fable-easypanel-runtime.md); PRs #1–#5 mescladas. Frontend corrigido v2 conectado ao backend real por HTTPS. Backup externo/restauração, provedor de e-mail e gateways não estão homologados; condições antes de dados reais no parecer.
**Coordenação:** SINAPSE. **CTO:** Fable 5.2. **Implementação:** Astra. **Operação do painel:** chat com CUA funcional, sob coordenação deste projeto.

| Serviço | Endereço / revisão |
| --- | --- |
| Allberto | https://allberto-web.cxfujw.easypanel.host |
| API e portal | https://allberto-backend.cxfujw.easypanel.host |
| Frontend servido | `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d` — release `web-f5cb28edb112-1` |
| Backend | Invoice Ninja 5.13.49, imagem fixada por digest |

As seções abaixo preservam a ordem das decisões e incidentes. Menções a IP/portas, isolamento total do app ou verificações pendentes descrevem etapas anteriores; o estado atual está no [guia operacional](../staycloud.md) e no encerramento ao fim desta story.

## Autorização e escopo

O proprietário informou o EasyPanel existente em `http://192.102.140.18:3000/` e autorizou configurar e colocar o projeto no ar. Esta autorização substitui a restrição da fase anterior a ambiente local. Nenhuma contratação, exclusão de dados, alteração de aplicações alheias ou acesso ao WHMCS está incluído.

Base validada: `77808e1ec`, PR #1, Invoice Ninja 5.13.49, 345 testes e CI aprovados. Preservar a instância local e criar dados/segredos próprios na VPS. Não levar dados descartáveis nem credenciais locais para o servidor.

## Plano

1. Conferir acesso, recursos e serviços existentes no painel; identificar domínio disponível e versões.
2. Fable definir topologia de produção, isolamento, persistência, restart, domínios/HTTPS, filas/agendamento, backup e rollback.
3. Astra preparar artefatos mínimos de deploy e verificá-los localmente; coordenador configurar o painel após revisão da arquitetura.
4. Validar interface publicada, autenticação, API, PDF e persistência com escopo seguro. Não executar smokes locais nem resets contra a VPS.
5. Documentar URLs, configuração, revisão e limites; publicar artefatos no GitHub.

## Inventário inicial

- Worktree limpa em `77808e1ec` antes desta fase.
- O controle CUA da aba existente retornou indisponibilidade do host; Apple Events para Chrome foi recusado pelo macOS. Permissões não foram alteradas. Tentativa seguinte usa navegador integrado do Orca.
- O proprietário definiu `allber.to` como domínio futuro, ainda não comprado, e pediu acesso provisório pelo IP. Não alterar DNS. A fase publicada por HTTP será identificada como provisória; HTTPS e uso de dados reais ficam para a configuração do domínio.
- E-mail do administrador definido pelo proprietário em 19/11/2026; o endereço será usado na configuração do serviço, sem publicar credenciais no repositório.
- O proprietário autorizou solicitar acesso ao Chrome. O fluxo `orca computer permissions` abriu os Ajustes do macOS e informou que o helper Orca não tinha Acessibilidade. Outro chat validou depois o acesso nativo por CUA; por isso essa concessão não será exigida novamente para o caminho já comprovado. Nenhuma permissão foi habilitada por automação.

## Critérios de aceite

Build de produção do frontend conectado ao backend real por dois domínios temporários HTTPS do EasyPanel, conforme pedido mais recente; nenhuma porta do projeto publicada diretamente; volumes persistentes; segredos fora do Git; versão identificada e rollback documentado; serviços alheios preservados. E-mail real, gateways e backup externo dependem de configurações fornecidas ou disponíveis no ambiente e devem ter status explícito, sem alegar funcionamento antes de teste.

## Arquitetura e progresso

Fable entregou [arquitetura EasyPanel](../architecture-easypanel.md), com GO para artefatos e pré-condições P1–P6 para execução. A decisão mantém duas origens por IP, como no teste local: um serviço App para o frontend estático e um serviço Compose para o backend, com nginx, PHP-FPM, MySQL e Redis. As portas sugeridas 8090/8012 só serão adotadas após verificar disponibilidade e firewall. O backend mantém a versão 5.13.49 fixada por digest, redes/volumes próprios e restart automático; não haverá proxy parcial de caminhos entre frontend e portal.

- [x] Autorização do proprietário para configurar/publicar na VPS existente.
- [x] Definir IP provisório e domínio futuro `allber.to`.
- [x] Inventário do código pelo Astra e arquitetura pelo Fable.
- [x] Preparar e verificar artefatos de deploy localmente.
- [x] Acessar sessão autenticada do painel e conferir recursos, arquitetura, versão/plano, serviços existentes, hosts e administrador.
- [x] Revisar artefatos e publicar no GitHub.
- [x] Configurar serviços e segredos novos no projeto `allberto`.
- [x] Implantar e executar as verificações na VPS, incluindo bloqueio de signup adicional, PDF e persistência; registrar a cobertura e os limites de cada critério no parecer final.
- [x] Registrar URLs, revisão final, backup e limites.

A tentativa no navegador integrado mostrou a tela de login. O conector CUA de navegador retornou host indisponível; a alternativa nativa inicialmente falhou ao iniciar. Outro chat confirmou depois o procedimento funcional: sessão nova de `mcp__cua_repl` cuja primeira chamada é somente `cua.getApp("com.google.Chrome")`; observou EasyPanel autenticado, sem novo login. O coordenador aguarda a liberação exclusiva do Chrome pelo agente que testa firewall em outra VM, sem tocar em foco, abas ou clipboard. Nenhuma sessão foi extraída nem permissão alterada por automação.

Fable revisou os artefatos e pediu remover do build o arquivo público inativo de DocuNinja com destinos localhost:8000, além de registrar uma verificação reproduzível de E5. As duas correções foram aplicadas e revalidadas, junto com gzip para JS/CSS/JSON/SVG. O [aceite final](../reviews/fable-easypanel-artifacts.md) não deixou achado pendente nos arquivos. O critério agora distingue destinos locais de rede de textos inertes em bibliotecas; os 11 contextos restantes foram lidos e aceitos pelo CTO.

Build final, autoteste/verificador E5, `nginx -t`, rotas profundas, cache, 404 de asset ausente, versão e gzip passaram. A imagem de prova usa uma origem reservada para documentação; o build definitivo usará a origem real confirmada e será compilado fora da VPS. A proteção de signup selfhost foi confirmada na fonte; o runtime ainda precisa responder aos testes de signup sem credenciais e `/setup`.

Os segredos novos deverão ser configurados **somente no serviço Compose backend**, nunca no ambiente do projeto ou do serviço web. Isso evita que sejam disponibilizados ao build do frontend pelo EasyPanel. O web recebe apenas a origem pública da API e, se necessário, o SHA completo da revisão. Segredos reais da VPS ainda não foram gerados.

## Atualização de publicação e acesso

O proprietário autorizou explicitamente aprovar/mesclar a PR e publicar usando, por enquanto, o domínio temporário do EasyPanel. Essa preferência substitui a exigência anterior de usar apenas IP. Os endereços e o HTTPS devem ser confirmados no painel antes de configurar `APP_URL` e `VITE_API_URL`; a topologia será ajustada a essa decisão, mantendo frontend e API separados.

PR #1 mesclada em 19/11/2026, commit de merge `96b1a1c907f33048849473250571da74ae5c0082`, preservando o histórico. O commit de artefatos `5912c52c0adbc98ee3aa3bdb12299aac63aacaa8` passou no CI e no hook de publicação. A branch de trabalho foi avançada por fast-forward para o merge; nenhuma branch foi apagada.

O agente da outra VM liberou o Chrome, com suas abas preservadas. A tentativa nova deste coordenador, iniciada diretamente por `cua.getApp("com.google.Chrome")`, ainda falhou ao iniciar o canal nativo. Foi solicitado ao chat que comprovou esse acesso realizar somente o inventário no EasyPanel, como único operador da janela. O coordenador mantém a revisão e só autorizará a configuração remota após fechar as pré-condições. Não há novo pedido de permissão de deploy ao proprietário.

O [inventário ao vivo](../handoffs/easypanel-live-inventory.md) confirmou EasyPanel 2.33.1 autenticado, 2 CPUs, 3,8 GB de RAM total, aproximadamente 43,1 GB de disco livre e nenhum projeto listado. O sufixo de serviços é `*.cxfujw.easypanel.host`; ainda faltam os hosts concretos e a prova de roteamento/certificado. Como a memória total está abaixo da folga estimada para o build Node, o frontend será compilado fora da VPS, com distribuição do artefato definida pelo CTO.

O operador recebeu autorização para criar `allberto` e, se necessário, serviços vazios `web` e `backend`, inspecionar App/Compose, domínios e fonte de imagem, e realizar inventário mínimo somente leitura no console do servidor. Nenhum build ou deploy foi autorizado nessa etapa de inspeção. Astra implementa os ajustes HTTPS da seção 14 da arquitetura: sem porta publicada, `REQUIRE_HTTPS=true` e proxies confiáveis, mantendo o backend interno. As abas e recursos da frente de firewall continuam reservados à outra equipe.

Fable aprovou a distribuição do frontend por release pública de pré-lançamento no GitHub (§15): o Dockerfile existente compila localmente com o host real da API e identifica o commit; o pacote `dist` recebe SHA-256. Um Dockerfile leve na VPS somente baixa, confere e extrai o pacote sobre nginx. A URL e o hash ficarão versionados; nenhum registry novo é necessário. Astra concluiu os ajustes HTTPS e validou a configuração efetiva com valores fictícios; a revisão desse delta ocorre antes de publicá-lo. O pacote definitivo ainda depende do hostname real da API.

O operador criou o projeto `allberto` e os serviços vazios `web` (App) e `backend` (Compose). Hosts gerados e observados na interface: `https://allberto-web.cxfujw.easypanel.host` e `https://allberto-backend.cxfujw.easypanel.host`. O formulário de domínio do Compose tem campo para o serviço interno; o destino será `nginx:80`. Uma consulta externa a cada host aceitou o certificado (`ssl_verify_result=0`) e retornou 502, esperado enquanto os serviços ainda estavam vazios; isso confirma TLS, não a aplicação nem o roteamento ao container.

PR #2 mesclada com revisão Fable e CI aprovados, merge `1ee50c75292023cb193beafa328a56bf1127e5a7` (conteúdo do delta `52db1b5423eafac06d43c38b710f23b6a5fdc6c4`). Lint, TypeScript e build passaram no hook. O operador foi autorizado a configurar e implantar primeiro o backend a partir dessa main após concluir o inventário mínimo, com segredos novos exclusivos do serviço. Astra prepara o pacote frontend local a partir do commit `52db1b5423eafac06d43c38b710f23b6a5fdc6c4` e da origem real da API. Ainda não há validação de runtime.

O inventário mínimo confirmou amd64, 3.277 MiB de memória disponível, nenhum swap e 44 GB disponíveis na raiz. Antes do deploy, havia apenas EasyPanel, Traefik e o container transitório do console, sem volumes. O operador não encontrou conflito visível e iniciou a preparação da configuração do backend.

O pacote frontend local foi gerado de um `git archive` do commit acima, com 15.276.656 bytes e SHA-256 `5f9d3b717d30706d82c8d4ba66e7cf8ebcb49fa0ef695c1630dce4b94e351f02`. Build e verificação sobre o pacote extraído passaram; a origem real HTTPS está embutida, sem o endereço de prova anterior. O novo Dockerfile leve também recusou checksum incorreto e aceitou a fixture íntegra, com `nginx -t` aprovado. A release pública, os defaults versionados e o deploy web ainda dependem da primeira validação do backend.

Após a revisão final do CTO, o coordenador publicou a [release de pré-lançamento `web-52db1b5423ea-1`](https://github.com/allber-to/web/releases/tag/web-52db1b5423ea-1), vinculada ao commit de origem do pacote. Uma nova transferência anônima por HTTPS confirmou o mesmo tamanho e SHA-256 (W1). A release registra que `/version.json` identifica o commit de compilação `52db1b5`, que difere do commit de merge. Astra insere os defaults reais no Dockerfile e verifica o build leve com o pacote público; o deploy web continua condicionado à validação inicial do backend.

## Runtime publicado — verificações do coordenador

PR #3 mesclada com CI aprovado, merge `aa9b976c0014ce6a445ddc53286488a1f4c95067`. O operador implantou backend e web manualmente, sem webhook configurado. Confirmou app/MySQL/Redis healthy, nginx ativo, nenhuma porta publicada, `RestartCount=0` e `OOMKilled=false`. App, banco e Redis estão exclusivamente na rede interna; só nginx alcança a rede do proxy. Consumo inicial dos quatro containers: aproximadamente 1,13 GiB, antes do teste de PDF.

Consultas externas do coordenador, com validação TLS normal:

| Verificação | Resultado |
| --- | --- |
| Raiz HTTPS da API | 200, sem redirecionamento, versão 5.13.49 |
| Raiz HTTP da API | 301 para a origem HTTPS |
| `/health` | 200, `status=ok` |
| `/setup` | 302 para a raiz HTTPS, sem assistente |
| Signup vazio, sem credenciais nem Accept | 403 |
| Signup vazio com Accept JSON | 401; `Handler.php:231–232` da versão 5.13.49 traduz AuthorizationException para 401 nesse caso |
| Precheck, login e refresh da conta administrativa | 200, versão 5.13.49, CORS permitido para o frontend |
| Web `/healthz` | 200, `ok` |
| Web `/version.json` | 200, no-store, revisão `52db1b5423eafac06d43c38b710f23b6a5fdc6c4` |
| Web `/`, `/clients`, `/invoices` | 200 HTML, no-store |

A conta tinha zero clientes e zero faturas antes da configuração inicial. Com essa condição verificada, o coordenador definiu somente nome Allberto, país Brasil, moeda BRL e idioma pt_BR na companhia/usuário, confirmando os valores por refresh. Nenhum dado fiscal, endereço, gateway ou registro financeiro foi inventado. O operador validará um cliente fictício e uma fatura de rascunho pela interface; nenhum envio/cobrança é autorizado por esse teste.

Evidências sanitizadas em `/tmp/allberto-easypanel-release/`: `initial-runtime-checks.json`, `api-login-check.json`, `bootstrap-locale-check.json` e `web-runtime-checks.json`. Credenciais permaneceram fora dos relatórios e do Git. PDF, portal, redeploy, dump e restauração ainda não foram validados nesta etapa.

## E8 — incidente de entrada numérica e validação do PDF

O login pela interface exibiu o Painel Allberto em português. O operador criou somente o cliente fictício `VALIDAÇÃO Allberto - teste` e o rascunho nº 0001, sem envio, pagamento ou cobrança. Ao preencher preço 10 e avançar imediatamente, o total persistiu como zero. A leitura pela API confirmou descrição correta, quantidade 1 e custo 0. O CTO identificou a causa no componente compartilhado: `changeOverride` só entregava o valor depois de 500 ms, sem entrega na saída do foco; desmontar a etapa antes disso descartava o preço. É defeito herdado do upstream e também atinge outros campos financeiros. [Parecer e requisitos](../reviews/fable-number-input.md).

Astra reproduziu a falha em teste e prepara a correção com entrega ao sair do foco, cancelamento da pendência e preservação do debounce durante digitação, sem gravar valores no desmonte. A versão publicada ainda precisa receber esse ajuste antes do aceite final.

O operador corrigiu **o mesmo rascunho**, conferindo R$ 10,00 na tela antes de salvar. A API confirmou custo 10, quantidade 1 e total 10; status continuou rascunho. Portal específico e PDF abriram em HTTPS e exibiram item/valor corretos, sem envio. O PDF é válido, uma página, mas apresenta imagem de logotipo quebrada e outro marcador de imagem vazio; a empresa não possui logo configurado. Diagnóstico separado em andamento, sem abrir saída de rede do app. A falha de download de dados de extração de texto informada pelo visualizador do Chrome não impediu que o Poppler extraísse o texto localmente.

Medição pontual após PDF: app 1.019 MiB, MySQL 538,7 MiB, Redis 8,816 MiB, nginx 8,906 MiB e web 3,855 MiB. Os cinco serviços continuaram ativos, sem OOM e sem reinícios. Não é medição do pico de geração. Persistência por redeploy e backup continuam pendentes.

## Correções e cópia anterior ao redeploy

O CTO confirmou que o PDF tenta buscar duas URLs: o logo vazio da empresa vira uma imagem em branco no próprio host da API, e a marca obrigatória do Invoice Ninja vem de `invoicing.co`. Ambas foram impedidas pela rede sem saída. A seção 16 da arquitetura aprova uma rede própria `egress` para o app, sem portas e sem rede do proxy; banco e Redis continuam internos. É saída normal para internet, não uma lista de destinos permitidos. A configuração deve fixar `SENTRY_LARAVEL_DSN` vazio e `DISABLE_AUTO_UPDATE=true`, preservando versão e desativando telemetria de erros. Não haverá licença paga, remoção de atribuição ou patch PHP.

O operador executou uma vez o procedimento manual de backup revisado pelo CTO, antes de qualquer redeploy, com exit 0. Pasta persistente `storage/app/backups/20261119T163258Z` no volume app_storage, fora de public:

| Arquivo | Tamanho | SHA-256 |
| --- | --- | --- |
| `ninja.sql` | 504.900 bytes | `dad78b785949c8039a67aa1a0d0bd3b26b21a4b3371a428781e314acbe1db363` |
| `storage.tar.gz` | 382.466 bytes | `394876eea7970f6a5fea59943355e038d9ef822912b937cfc85cc7f84891dbb5` |

Checksums conferidos e tar validado sem imprimir conteúdo. Staging removido somente após sucesso. Essa cópia permanece **na mesma VPS**; não comprova restauração nem protege contra perda do servidor. As permissões iniciais 0700/0600 serão normalizadas para www-data/0755/0644 pelo init da imagem após redeploy, ficando legível pelo PHP, embora fora da raiz pública. O cliente e o rascunho de teste foram preservados para E9.

## Revisão final do código e redeploy do backend

Fable encontrou e Astra corrigiu também uma regressão de arredondamento na primeira proposta: no modo changeOverride, o blur deve entregar o valor interno, não reler o texto arredondado exibido. O aceite final cobriu 9 testes focados e clique real do assistente em 43,4 ms, com preço 10 no request e nenhuma requisição externa. O coordenador rodou a suíte completa: **354 testes, 49 arquivos aprovados**. TypeScript, lint e build passaram no hook; CI aprovado.

PR #4 mesclada, merge `c6737c2e32297d0c20ff1156f5769e43c7e9dfc9`, fonte `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`. O operador redeployou o backend uma vez após a cópia verificada. Configuração ativa comprovada como www-data: Sentry vazio, autoatualização desabilitada e transporte mail `log`. A chamada de autoatualização N6 foi dispensada por recomendação do CTO; não foi arriscada uma atualização real apenas para obter status de teste.

App nas redes backend + egress; MySQL/Redis só na rede interna; nginx e volumes preservados; nenhuma porta publicada, OOM ou reinício inesperado. App alcançou a marca externa e sua própria API com TLS válido; o MySQL, com curl disponível e sem rota default, não resolveu o destino externo. Os pins correspondem às imagens aprovadas. As duas cópias mantiveram tamanhos e checksums após recriar o app; permissões normalizadas conforme a ressalva anterior.

O coordenador confirmou por API, após o redeploy: conta/configuração pt_BR/BRL preservada; mesmo cliente e rascunho, um registro de cada, custo 10, quantidade 1, total 10 e status rascunho; login/precheck/refresh, CORS e os dois endpoints de indicadores retornaram 200. Método de envio da companhia permanece `default`.

PDF regenerado: 200, 96.526 bytes, uma página, origem HTTPS da API. Inspeção visual por Poppler confirmou **sem imagens quebradas**, valor e texto corretos, marca Invoice Ninja preservada. O topo usa a imagem em branco válida, pois não há logotipo personalizado cadastrado; upload de logotipo não foi testado. Não houve compra de licença ou alteração do PHP. Evidência privada: `/tmp/allberto-easypanel-release-v2/invoice-after-egress.pdf` e PNG correspondente; relatório sanitizado `backend-redeploy-check.json`.

Release [web-f5cb28edb112-1](https://github.com/allber-to/web/releases/tag/web-f5cb28edb112-1) publicada e download anônimo conferido: 15.274.255 bytes, SHA-256 `fcbf81bcbb622efab348a218b8524f4c5af62a7225321777af019ca6351d1ac5`. Build leve sem argumentos, checksum e nginx aprovados. PR #5 mesclada com CI verde, merge `32c777a0c2c186b1b4c3a581255682cd53c189d3`; o operador recebeu autorização para redeployar somente web e conferir a correção pela interface. A versão esperada é o SHA de fonte `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`, não o SHA do merge.

## Encerramento — v2 no ar e homologação aprovada

O web foi reimplantado manualmente uma vez a partir da PR #5, em 6 segundos, sem build Node na VPS. `/version.json` retornou o SHA esperado `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`. `/`, `/clients` e `/invoices` responderam 200 com o HTML idêntico ao pacote público; o asset que contém a origem da API também teve SHA-256 idêntico. A origem efetiva é HTTPS do backend. Todos os serviços permaneceram sem portas publicadas diretamente.

Após recarga completa no Chrome, Painel, Clientes e Faturas renderizaram em português, preservando a sessão. No mesmo rascunho, o operador alterou preço 10 → 11, salvou e reabriu para conferir; depois restaurou 10 e conferiu novamente. A automação nativa levou 917 ms entre preencher e sair do campo, portanto **não comprova o caso abaixo de 500 ms no servidor publicado**. A prova estrita continua sendo o teste local com clique real a 43,4 ms, sobre a mesma fonte cujo pacote foi servido e conferido por hash.

N7 foi executado uma vez, com guard confirmando `mail.default=log` e a classe `LogTransport` antes da mensagem fictícia. Resultado `LOG_MAIL_PROBE_OK`, contagem 1, exit 0. Nenhuma fatura enviada, cobrança ou pagamento. O transporte também espelhou a mensagem fictícia na saída do tinker; nenhum conteúdo de log foi anexado. Entrega externa e eventos de provedor continuam fora do aceite.

O coordenador confirmou a persistência final dos mesmos registros (rascunho 0001, quantidade 1, custo/total 10, pago 0) após ambos os redeploys. Em seguida arquivou reversivelmente **somente o cliente e a fatura fictícios**, com `archived_at>0` e `is_deleted=false`. API e interface confirmaram zero clientes/faturas ativos. Não houve exclusão definitiva, reset ou alteração de registros reais. O histórico e o número 0001 consumido permanecem; a etapa histórica de primeiro cliente continua concluída.

A última medição pontual mostrou app 677,6 MiB, MySQL 479,8 MiB, Redis 10,6 MiB, nginx 3,828 MiB e web 4,234 MiB. Cinco containers ativos, quatro healthy (nginx sem healthcheck), zero reinícios e zero OOM. Não representa teste de carga ou pico de geração de PDFs.

Fable aprovou a entrega de homologação sem bloqueio no [parecer final](../reviews/fable-easypanel-runtime.md), distinguindo evidência própria e relatos. H6 não possui relatório de rede do navegador; N4 (logotipo personalizado) não foi exercitado; N6 foi dispensado em favor da configuração efetiva N5. Não declarar homologados gateway, usuários não administradores, envio real, carga ou restauração. Antes de dados reais, atender às condições do parecer, especialmente backup externo com restauração testada e restrição dos proxies confiáveis. `APP_KEY` e senha estão na cópia privada local do proprietário, fora do Git; a guarda durável dessa cópia faz parte da operação.

O operador deixou o app aberto e autenticado no Painel e liberou o Chrome, preservando todas as abas alheias. A frente de firewall foi avisada; não houve qualquer acesso ou alteração em WHMCS/VM3064. O [handoff do operador](../handoffs/easypanel-live-inventory.md) está estável. Nenhum novo deploy é necessário para este fechamento documental.

Evidências adicionais privadas em `/tmp/allberto-easypanel-release-v2/`: `web-final-check.json`, `post-egress-public-checks.json`, `backend-redeploy-check.json`, `final-persistence-cleanup.json` e PDF renderizado. Os resultados necessários estão transcritos nesta story e no handoff; o PDF e URLs privadas não foram publicados.
