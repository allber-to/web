# 004 — Domínio próprio na Cloudflare e EasyPanel

**Estado:** em andamento. Compra de `allber.to` e conta Cloudflare **StayCloud** confirmadas na interface. Zona gratuita criada e destino do apex atualizado na zona ainda pendente de delegação; demais registros, nameservers e domínios EasyPanel em configuração. O proprietário autorizou DNS, ligação ao EasyPanel e migração do aplicativo.

## Escopo

- Painel Allberto no domínio principal; API e portal em `api.allber.to`.
- Zona Cloudflare no plano gratuito, com nameservers atribuídos à zona e delegação na Namecheap.
- Preservar registros de e-mail e configurações alheias; trocar somente o destino web necessário.
- Adicionar hosts HTTPS aos serviços existentes, redirecionar `www` ao domínio principal e manter os hosts temporários disponíveis durante a migração.
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
4. Após a resolução pública apontar para a VPS, adicionar domínios HTTPS no EasyPanel e redirecionamento de `www` ao domínio principal. Conferir TLS antes de migrar a origem usada pelo app.
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
