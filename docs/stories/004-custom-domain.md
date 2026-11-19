# 004 — Domínio próprio na Cloudflare e EasyPanel

**Estado:** publicado em `https://painel.allber.to`, com backend/portal em `https://api.allber.to`. DNS e HTTPS do painel confirmados por resolução local normal; versão, arquivos e preflight aprovados. Apex/www são aliases de transição destinados ao futuro site. A última pendência funcional é o login no Chrome (D8/P4), interrompido por mudança de janela antes de digitar credenciais. O proprietário autorizou DNS, ligação ao EasyPanel e migração do aplicativo.

## Escopo

- Painel administrativo em `painel.allber.to`, conforme orientação posterior do proprietário para reservar a raiz ao futuro site público; API e portal em `api.allber.to`.
- Zona Cloudflare no plano gratuito, com nameservers atribuídos à zona e delegação na Namecheap.
- Preservar registros de e-mail e configurações alheias; trocar somente o destino web necessário.
- Adicionar hosts HTTPS aos serviços existentes, com `www` como host adicional do painel conforme a preferência posterior do proprietário, e manter os hosts temporários disponíveis durante a migração.
- Atualizar `APP_URL` do backend e recompilar o frontend fora da VPS com a nova origem da API, após confirmar DNS e certificados.
- Preservar APP_KEY, credenciais, banco, volumes, versão do backend e transporte de e-mail em log.

Nenhuma nova compra, mudança em outros projetos, configuração de gateway ou envio real está incluído. A homologação e seus limites permanecem conforme a [story 003](003-easypanel-deploy.md).

## Pré-verificação pública

Consulta ao resolvedor `1.1.1.1` em 19/11/2026, antes de qualquer escrita desta tarefa:

| Registro | Resposta |
| --- | --- |
| NS `allber.to` | `dns1.registrar-servers.com`, `dns2.registrar-servers.com` |
| DS `allber.to` | NOERROR, sem resposta DS |
| A `allber.to` | `192.64.119.103` |
| A `api.allber.to` | NXDOMAIN |
| MX `allber.to` | `eforward1` a `eforward5.registrar-servers.com`, prioridades 10/10/10/15/20 |

Essa consulta não comprova propriedade, inventário completo da zona nem funcionamento de encaminhamento de e-mail. A configuração existente será conferida na interface; não substituir nameservers até preparar e revisar os registros na Cloudflare.

## Ordem de execução

1. Confirmar domínio comprado, conta Cloudflare StayCloud e registros existentes.
2. Criar/reutilizar a zona gratuita e configurar apex/API para `192.102.140.18`, com `www` como CNAME do domínio principal e DNS only para emissão direta dos certificados pelo EasyPanel. Conferir se há encaminhamento de e-mail em uso antes de mudar a delegação; preservar MX e SPF não comprova que o serviço continuará funcionando.
3. Salvar na Namecheap os nameservers exatos atribuídos pela Cloudflare; observar DNSSEC antes de alterar delegação.
4. Após a resolução pública apontar para a VPS, adicionar domínios HTTPS no EasyPanel, com apex e `www` no serviço web e API no nginx do backend. Conferir TLS antes de migrar a origem usada pelo app.
5. Atualizar backend preservando segredos e publicar novo pacote frontend com origem da API confirmada; checks, revisão e deploy manual.
6. Conferir autenticação, saúde, versão, links HTTPS e permanência dos dados; documentar o estado final e a reversão para hosts temporários.

O navegador nativo é compartilhado: a outra frente liberou sua reserva antes de o operador deste projeto receber a tarefa. Nenhuma aba ou recurso da VM3064 será alterado.

## Referências de configuração

- [Cloudflare: configuração de zona e nameservers](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).
- [Namecheap: alteração de nameservers](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/).
- [Operação atual do Allberto](../staycloud.md).

Os resultados da operação serão acrescentados após observação; DNS, certificados e migração ainda não estão concluídos.

## Domínio confirmado e preparação da publicação

O operador confirmou registro `allber.to` ACTIVE na Namecheap, sem destinatários/catch-all de encaminhamento de e-mail, DNSSEC desligado e conta Cloudflare StayCloud selecionada (distinta da conta Enterprise StayCloud). Busca prévia não encontrou zona duplicada. Criada a zona no plano gratuito; a importação encontrou o apex/`www` de estacionamento, cinco MX e SPF. O A do apex foi salvo como `192.102.140.18`, DNS only. Não houve alteração na Namecheap ou EasyPanel nessa etapa; estado detalhado e reconciliação de alterações interrompidas no [handoff do operador](../handoffs/custom-domain-live.md).

Como preparação independente da migração de runtime, o coordenador publicou a [release de pré-lançamento web-d8a873829cbb-1](https://github.com/allber-to/web/releases/tag/web-d8a873829cbb-1). Download anônimo por HTTPS confirmou o tamanho e SHA-256 do pacote local (`public-download-check.json`). Astra atualizou apenas URL/hash do Dockerfile leve. O build leve local pós-pin não iniciou porque o socket Docker local estava ausente; isso não foi registrado como aprovação. Nenhum serviço foi reimplantado com esse pacote; merge/deploy continuam condicionados a DNS, TLS e revisão.

## Revisão do CTO e preparação

O [plano de migração](../architecture-custom-domain.md) foi aprovado pelo Fable, sem acesso ao navegador/VPS. Os ajustes incluem preservar MX/SPF e verificar destinatários do encaminhamento, redirecionar `www` para evitar sessões independentes por origem, manter o proxy Cloudflare desligado nesta fase e preservar os hosts temporários para reversão. A condição de homologação continua: domínio próprio não substitui backup externo/restauração nem valida gateways ou envio real.

Astra prepara localmente um pacote com a origem esperada `https://api.allber.to`, a partir de `d8a873829cbbc2ba1f71df71b0022829e2568443`. Essa preparação não publica nem altera o ambiente; o uso do pacote depende da confirmação do domínio e da configuração HTTPS.

## Retomada e linha de base

A primeira tentativa de navegador foi interrompida quando a janela mudou por ação humana; nenhuma escrita DNS/NS/EasyPanel ocorreu nessa tentativa. O proprietário confirmou depois **Chrome livre agora**, e o coordenador transmitiu a retomada exclusiva ao operador, preservando as abas da outra frente.

Antes de qualquer migração do backend, a leitura autenticada da API temporária confirmou empresa Allberto, BRL/Brasil, cliente e fatura fictícios originais arquivados (não excluídos), rascunho 0001 com total 10/pago 0 e zero clientes/faturas ativos. Evidência sanitizada: `/tmp/allberto-custom-domain-release/before-migration.json`. Esses mesmos identificadores e valores serão comparados após o redeploy; não foi criado ou alterado registro financeiro.

Pacote local preparado e verificado: `allberto-web-d8a873829cbb.tar.gz`, 15.271.381 bytes, SHA-256 `7a893ca6a434f7f4344ba816b619009ada06b6519b9abce288bfac21033812f6`. O coordenador recalculou o checksum e confirmou o valor do [handoff Astra](../handoffs/astra-custom-domain.md). A origem `https://api.allber.to` está no bundle; publicação e testes do domínio continuam dependentes da operação nas contas.

O [CTO aceitou os artefatos do domínio](../reviews/fable-custom-domain-artifacts.md), conferindo os dois hashes, versão, extração e ausência da origem temporária no JavaScript. Autorizou preparar PR em rascunho e comprovar o build leve no deploy: a receita não mudou e download/hash/extração já foram verificados por outros caminhos. Isso não libera deploy antecipado do web; a nova API deve responder com TLS válido antes da troca. Nenhum aplicativo local foi aberto para recuperar Docker durante o controle do Chrome.

## Zona preparada, delegação aguardando Save

A zona Cloudflare terminou com nove registros: A apex/API para `192.102.140.18`, CNAME `www` para `allber.to` (três em DNS only/TTL Auto), cinco MX e SPF preservados. Os nameservers atribuídos são **`jerry.ns.cloudflare.com`** e **`melinda.ns.cloudflare.com`**.

O coordenador consultou os autoritativos da Cloudflare e confirmou os destinos A/CNAME e os cinco MX/SPF esperados. A consulta recursiva pública ainda devolveu os NS da Namecheap; isso não foi tratado como delegação concluída.

Na Namecheap, o operador abriu Custom DNS, mas o controle nativo expirou durante o primeiro preenchimento e novamente na recuperação. **Save não foi acionado por ele.** O coordenador solicitou ao proprietário preencher os dois NS acima e salvar, sem pedir senha ou nova autorização de configuração. Nenhuma mudança EasyPanel/APP_URL/deploy ocorreu nessa etapa. O estado incerto do primeiro campo será reconciliado por observação/confirmacão; não repetir a criação da zona.

O proprietário confirmou ter salvo os dois nameservers. Na verificação imediatamente posterior (19/11/2026, cerca de 17:54 UTC), o autoritativo `.to` `ns01.trs-dns.com` ainda devolvia os NS da Namecheap; os resolvedores 1.1.1.1/8.8.8.8 também mostravam a delegação antiga. Isso foi registrado como atualização ainda não observada, sem atribuir falha ao Save ou somente a cache. O operador recebeu instrução para confirmar os valores salvos por leitura e inspecionar o redirect do EasyPanel, sem repetir Save ou emitir certificados antes de D1.

## Delegação confirmada e preferência de hosts

Em 19/11/2026 às 17:56–17:57 UTC, o autoritativo `.to` e os resolvedores 1.1.1.1/8.8.8.8 passaram a anunciar os nameservers Cloudflare. A leitura pública confirmou A apex/API `192.102.140.18`, CNAME www `allber.to`, cinco MX e SPF preservados: **D1 aprovado**, evidência `/tmp/allberto-custom-domain-release/dns-check.json`. O operador confirmou também que os dois NS persistem na Namecheap após recarga.

O proprietário orientou diretamente o operador a cadastrar domínios, sem redirecionamento. Essa preferência substitui a recomendação anterior para www; a arquitetura e D9 foram atualizados pelo coordenador. Apex e www servirão o mesmo frontend por HTTPS, com sessões independentes por origem. Nenhuma mudança em `frontend.conf` ou regra de redirect será feita. Após D1, o operador recebeu autorização para cadastrar os três hosts HTTPS, preservando os temporários e sem alterar APP_URL/deploy até a verificação dos certificados.

## HTTPS do painel

O operador cadastrou `allber.to` e `www.allber.to` no web, destino HTTP porta 80, mantendo o host temporário e sem redirect. Às 18:00 UTC, o coordenador confirmou 200 e certificado válido nos dois hosts usando resolução explícita para `192.102.140.18`, mantendo validação normal de hostname/TLS (`ssl_verify_result=0`). Ambos ainda servem a versão anterior `f5cb28e`, esperado antes do deploy. A tentativa com resolução local padrão encontrou timeout/reset, compatível com caminho/cache DNS local ainda divergente; não foi alegada disponibilidade em todos os caches.

A criação de `api.allber.to` foi interrompida antes de selecionar o serviço Compose e clicar Criar. A API ainda apresentou o certificado padrão não confiável; nenhuma credencial foi enviada para essa origem. O coordenador aguarda retomar o formulário em controle exclusivo ou confirmação de conclusão pelo proprietário. D2 permanece parcial; APP_URL e versão publicada ainda não foram trocados.


## Backend migrado e domínio persistido do portal

D2 foi concluído após o cadastro de `api.allber.to`: TLS válido, raiz/health 200, HTTP para HTTPS e setup para a nova raiz, sem laço. O operador aplicou somente `APP_URL=https://api.allber.to` no ambiente do backend, preservando as demais variáveis por comparação com a cópia privada anterior, e fez um deploy manual. D11 confirmou a nova URL, Sentry vazio, autoatualização desligada e e-mail em log; containers sem reinício/OOM, volumes e ausência de portas publicadas preservados.

A API nova passou precheck/login/refresh e CORS. A comparação dos mesmos IDs confirmou empresa Allberto/BRL/Brasil, cliente e fatura fictícios arquivados, total 10/pago 0/status rascunho e zero registros ativos. Porém o link calculado do convite ainda tinha o host temporário. O CTO confirmou na fonte 5.13.49 que `ninja:create-account` persiste `company.portal_domain` na criação e `Inviteable::getLink` prioriza esse campo; mudar apenas APP_URL não migra os links existentes.

Aplicado um único `PUT /api/v1/companies/VolejRejNm` com somente `portal_domain=https://api.allber.to` e `portal_mode=domain`. O segundo campo, com o mesmo valor anterior, ativa a validação de URL do backend. Não foi enviada a chave `settings`: além de desnecessária, a fonte tem um ramo que pode remover o logotipo quando ela é enviada incompleta. Comparação integral antes/depois mostrou somente `portal_domain` e `updated_at` diferentes; settings, modo/subdomínio, chaves de convite e itens da fatura permaneceram iguais. O link calculado passou para `https://api.allber.to`. Evidência sanitizada: `/tmp/allberto-custom-domain-release/backend-after-domain.json`.

O primeiro download sem token retornou 403. O CTO confirmou depois na fonte que essa rota exige `token_auth`; o arquivamento não causou a resposta. Nenhum novo registro, envio ou pagamento foi feito.


D5 concluído pelo fluxo autenticado usado pelo frontend: `useDownloadPdf` envia o token administrativo na mesma rota pública de download. Com esse cabeçalho, a fatura arquivada retornou HTTP 200/application-pdf, sem restaurar cliente ou fatura. PDF de uma página renderizado e inspecionado: item correto, quantidade 1, total R$ 10,00, marca upstream preservada e nenhuma imagem quebrada. O 403 anterior foi a tentativa anônima; não foi contornado por mudança de dados. O arquivo privado e a imagem não foram adicionados ao Git.


A PR [#7](https://github.com/allber-to/web/pull/7) foi retirada de rascunho e mesclada em `631de138629c07afdca9f770a2184d81f7520682`, após CI verde no head exato `2251e1b81749fef690eec3d8042b964a7992141c` e D3–D5. O operador recebeu autorização para um único deploy manual do web e login de leitura na nova origem. Nenhum novo deploy backend é necessário para a configuração de portal persistida.


## Frontend publicado — versão e arquivos conferidos

O operador acionou uma única implantação manual do web; histórico PR7, conclusão em 5 segundos, sem novos ambientes/argumentos. D6, D9 e D10 passaram em 14 verificações externas: apex e www entregam `version.json` com revisão `d8a873829cbbc2ba1f71df71b0022829e2568443`, healthz responde 200 e raiz/dashboard/clients entregam o mesmo HTML do pacote, sem redirect entre hosts. O JavaScript de entrada e o chunk que contém a origem da API têm SHA-256 igual aos arquivos locais; a origem é `https://api.allber.to`, sem referência temporária nesse chunk. Os dois hosts temporários continuam respondendo; o frontend temporário entrega o pacote novo. Evidência: `/tmp/allberto-custom-domain-release/frontend-final-check.json`.

A verificação de apex/www usou `curl --resolve` para `192.102.140.18` com validação TLS normal, sem `-k`. O resolvedor local do Mac ainda retornava estacionamento, apesar de autoritativos e resolvedores públicos já corretos. Essa prova confirma o serviço/certificado na VPS, não a expiração de todos os caches; o login real no Chrome é registrado separadamente. Nenhuma alteração global de DNS, hosts ou resolução do computador foi feita.


## D8 pendente — navegador e resolução local

O operador conferiu no novo container web `healthz=ok` e `version.json` com revisão esperada, sem repetir o inspect completo dos cinco containers. A primeira navegação do Chrome para `https://allber.to` terminou em `ERR_CONNECTION_TIMED_OUT`; não carregou aplicativo ou estacionamento. Nenhuma credencial foi digitada e não houve reload ou novo deploy.

Às 18:25 UTC o `dig` padrão já consultava a resposta correta da 1.1.1.1, assim como a 8.8.8.8, mas `getaddrinfo` do macOS continuava devolvendo o estacionamento e o curl sem resolução explícita falhou. Uma limpeza não privilegiada por `dscacheutil -flushcache` não mudou a resposta; o comando de sinalização do resolvedor com `sudo -n` foi recusado por exigir senha, sem executar a operação privilegiada. Não foram alterados DNS global, hosts, VPN ou configurações de navegador. O proprietário recebeu a opção de limpar o cache local autenticando apenas no Terminal ou aguardar sua expiração.

D8 continua pendente, sem inferir defeito ou sucesso do aplicativo desse timeout. A [revisão do CTO](../reviews/fable-custom-domain-runtime.md) aceita os demais critérios e distingue saúde dos endpoints, inspeção dos containers e propagação. Não há necessidade de refazer DNS, certificado ou implantação.


## Alteração de escopo — endereço administrativo `painel.allber.to`

Após informar que executou a limpeza de cache, o proprietário solicitou um subdomínio `dash` ou `painel` porque o domínio principal terá o site, autorizando alterações na Cloudflare. Adotado `painel.allber.to` como único novo endereço administrativo. O primeiro assert local do apex após essa confirmação ainda não resolveu para a VPS; a limpeza não foi declarada bem-sucedida e nenhuma ação global adicional foi feita.

O operador recebeu autorização para reconciliar/criar A `painel` → `192.102.140.18`, DNS only/TTL Auto, na mesma zona StayCloud; o domínio HTTPS no web será cadastrado depois da verificação DNS pública. Não precisa novo pacote: a origem compilada da API permanece `https://api.allber.to`, e o nginx atende o host adicional. Sem nova implantação, ambiente ou serviço. Apex/www permanecem aliases de transição até haver o site público substituto; o site em si não foi solicitado para implementação nesta etapa.

D8 passa a ser o login no endereço administrativo `painel.allber.to`. O CTO registrou critérios P1–P5 no [adendo de revisão](../reviews/fable-custom-domain-runtime.md): DNS, TLS, revisão/HTML, login e preservação dos hosts existentes. As origens mantêm sessões independentes.


P1 aprovado às 18:31:55 UTC: os dois autoritativos Cloudflare, 1.1.1.1, 8.8.8.8 e a resolução local do macOS retornaram `192.102.140.18` para `painel.allber.to`. O operador cadastrou o host HTTPS uma única vez no web existente; lista confirmou destino `http://allberto_web:80/`, sem implantação/ambiente/redirect adicionais.

P2–P3 aprovados usando DNS local normal, **sem `--resolve`**: certificado válido e HTTP 200 em sete caminhos (versão, raiz, dashboard, clients, healthz e dois chunks). Revisão `d8a873829cbbc2ba1f71df71b0022829e2568443`; HTML e JavaScript idênticos ao pacote verificado. Evidências `/tmp/allberto-custom-domain-release/painel-dns-check.json` e `painel-https-check.json`. Operador liberado para login somente depois dessa confirmação.


P5 aprovado: os quatro hosts existentes continuam HTTP 200/TLS válido e os três hosts do frontend entregam o mesmo HTML do pacote; apex/www conferidos com resolução explícita devido ao histórico de cache local. Preflight `OPTIONS /api/v1/refresh` com origem `https://painel.allber.to` aceita POST e os cabeçalhos do cliente, incluindo X-API-TOKEN. Evidência `/tmp/allberto-custom-domain-release/painel-hosts-preflight-check.json`. O sucesso desse preflight por script não substitui o login no navegador.

O operador confirmou na Visão Geral da zona Cloudflare **Configuração de DNS: Completo**, sem botão/pendência de verificação; não precisou acionar novo check nem ligar proxy. Ao iniciar a abertura do painel no Chrome, a observação retornou outra janela, de reunião. Interrompeu imediatamente antes de digitar a URL ou qualquer credencial. Nenhuma tentativa de login falhou: P4 ainda não foi executado. O proprietário recebeu a escolha de liberar a janela para concluir ou encerrar com essa limitação explícita. Handoff do operador está estável, sem nova implantação necessária.


O [CTO aceitou P1, P2, P3 e P5](../reviews/fable-custom-domain-runtime.md), mantendo P4/D8 não executado. Os detalhes ausentes no JSON de preflight foram completados por uma nova leitura (200, URL/origem/método/cabeçalhos explícitos); API própria também relida com raiz 200/TLS válido/versão 5.13.49. A asserção original de zero redirects do painel foi explicitada no arquivo de evidência. Nenhuma mudança de runtime resultou dessa precisão documental.
