# 004 — Domínio próprio na Cloudflare e EasyPanel

**Estado:** em andamento. Compra de `allber.to` e conta Cloudflare **StayCloud** confirmadas na interface. Zona gratuita criada e destino do apex atualizado na zona ainda pendente de delegação; demais registros, nameservers e domínios EasyPanel em configuração. O proprietário autorizou DNS, ligação ao EasyPanel e migração do aplicativo.

## Escopo

- Painel Allberto no domínio principal; API e portal em `api.allber.to`.
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
