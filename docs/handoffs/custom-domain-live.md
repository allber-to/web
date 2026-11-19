# Domínio próprio — operação ao vivo

Data: 19/11/2026. Operador Chrome: `777a7c50-10d2-44c7-a090-a6ec475c5f59`. Coordenador: `ecdf0c57-bcde-43e8-9066-dc595b02857f`.

Estado: **CUA parado após a única retomada limpa autorizada**, por nova interrupção de controle. Domínio **allber.to ativo** e conta Cloudflare **StayCloud** confirmados. **Zona Free allber.to criada e A apex alterado na Cloudflare, ainda sem troca dos NS na Namecheap.** Edição de CNAME www interrompida, resultado incerto; A api ainda ausente. EasyPanel não alterado. Não criar uma segunda zona ao retomar.

## Escopo autorizado

Solicitação `msg_25f5768aaa81` e complemento `msg_ed32caed27a8`; referência técnica `docs/architecture-custom-domain.md`.

- Confirmar na Namecheap o domínio adquirido, esperado `allber.to`, sem registrar detalhes pessoais, financeiros ou do pedido.
- Confirmar conta Cloudflare exatamente **StayCloud**, inventariar zona existente e usar plano Free, sem criar duplicata/conta ou recurso pago.
- Registrar nameservers, DNSSEC/DS, DNS e existência de encaminhamento de email antes da migração. Preservar MX, SPF/TXT e outros registros alheios ao estacionamento web. Se houver encaminhamento configurado ou DNSSEC incompatível, informar antes da troca de NS.
- Configurar A apex e A api para `192.102.140.18`, CNAME www para `allber.to`, todos DNS only e TTL Auto; sem wildcard/AAAA.
- Usar somente os dois NS efetivamente atribuídos pela Cloudflare. Após salvá-los na Namecheap, aguardar confirmação pública de delegação e A pelo coordenador antes dos domínios HTTPS no EasyPanel.
- Manter hosts temporários e serviços/volumes existentes; web para porta 80, backend para Compose nginx:80. Conferir redirecionamento de www para apex preservando caminho; relatar se a UI não oferecer o controle.
- Não modificar ambiente, segredos, APP_URL, TRUSTED_PROXIES, cookies, CORS, SMTP ou logotipo; não iniciar redeploy nesta fase.

## Estado anterior informado pelo coordenador/CTO

Consultas públicas do coordenador/CTO, anteriores à inspeção da UI. A seção de retomada abaixo distingue o que este operador confirmou diretamente.

| Registro | Valor informado |
| --- | --- |
| NS | dns1.registrar-servers.com, dns2.registrar-servers.com |
| A apex | 192.64.119.103 |
| CNAME www | parkingpage.namecheap.com |
| api | ausente |
| MX | cinco hosts eforward*.registrar-servers.com |
| TXT SPF | v=spf1 include:spf.efwd.registrar-servers.com ~all |
| DS / CAA | ausentes nas consultas públicas do coordenador/CTO |

## Primeira tentativa de acesso

O Chrome estava com outra janela em uso. A janela que contém as abas de infraestrutura foi localizada pelo menu nativo **Janela**, preservando as abas existentes. Durante a tentativa de abrir a confirmação Namecheap em uma nova aba, a ferramenta interrompeu a sequência com **The user changed '/Applications/Google Chrome.app'**. Uma observação posterior confirmou alteração humana do foco para outra janela. A navegação de confirmação não foi dada como concluída.

UI interrompida para evitar concorrência com o proprietário; `completion_summary` enviado. Solicitada apenas sinalização de quando o Chrome estiver livre, sem pedir credenciais. Coordenador avisado em `msg_76ab58a5230b`. Não houve erro ScreenCaptureKit, investigação do sistema, acesso a WHMCS, console ou escrita nos serviços autorizados.

Em `msg_4ae4fe26ffca`, o coordenador centralizou a pergunta de disponibilidade no chat principal e determinou manter a UI parada até transmitir a liberação. Não haverá nova pergunta deste operador nem tentativa baseada em tempo decorrido. Nenhum outro agente Allberto usará foco/clipboard durante essa espera.

## Retomada autorizada e inventário confirmado

Em `msg_88aa2c85b90d`, o coordenador transmitiu a resposta do proprietário **Chrome livre agora** e autorizou a retomada exclusiva. A confirmação Namecheap foi aberta em nova aba, sem captura da tela de compra ou registro de dados pessoais/financeiros neste documento.

| Item | Evidência direta na UI |
| --- | --- |
| Domínio adquirido | **allber.to**, compra concluída; gerenciador do domínio com status **ACTIVE** |
| Nameservers atuais | seletor **Namecheap BasicDNS**; os dois nomes específicos constam da consulta pública anterior |
| Encaminhamento de email | seção Redirect Email informa **You haven’t defined any Email Redirect yet**; nenhum encaminhador ou catch-all configurado |
| DNSSEC | Advanced DNS, Status com caixa de seleção **0/desmarcada** |
| www | CNAME Record → `parkingpage.namecheap.com.`, TTL **30 min** |
| Apex | URL Redirect Record `@` → `http://www.allber.to/`, **Unmasked** |
| Mail Settings | **Email Forwarding** selecionado |
| SPF | TXT `@` → `v=spf1 include:spf.efwd.registrar-servers.com ~all`, TTL **Automatic**, bloqueado pela configuração de redirecionamento |
| Conta Cloudflare | seletor aberto, busca StayCloud; captura visual mostrou **StayCloud** selecionada com check, distinta de **Enterprise StayCloud** |
| Zona aberta na Cloudflare | `staycloud.com` preexistente; nenhuma alteração nela |

A Namecheap não exibiu destinatários de encaminhamento; isso permite seguir a migração dentro do escopo aprovado quando o controle estiver disponível. Não se conclui funcionamento de email apenas pelos MX/SPF; os registros serão preservados. Nenhuma alteração de DNSSEC foi feita.

Ao tentar sair do seletor de conta Cloudflare, o CUA retornou novamente **The user changed '/Applications/Google Chrome.app'**. Foi feita uma nova leitura completa de acessibilidade, que ainda mostrou a mesma aba Cloudflare, seguida de uma tentativa de Escape; essa tentativa recebeu a mesma interrupção. A causa desta segunda ocorrência não foi determinada: a mensagem da ferramenta, isolada, não comprova ação humana concorrente.

Operação da UI interrompida sem novas tentativas, troca de tecnologia, reset ou remendo do sistema. `completion_summary` enviado e resultado comunicado em `msg_094485078d11`. Não foram criados zona, registros ou nameservers. Não houve escrita na zona alheia exibida; a única entrada na Cloudflare foi a pesquisa do nome da conta.

Em `msg_2bbd515f4ec1`, o coordenador assumiu uma única leitura de diagnóstico pelo CUA dele e determinou **parada total deste operador**, sem pergunta repetida ao proprietário nem novos cliques. A exclusividade segue reservada ao trabalho Allberto, com controle agora sob coordenação dele; este operador aguarda devolução explícita.

## Única retomada limpa — zona criada, configuração parcial

Autorização `msg_2d8427680f58`, após falha de acesso do CUA do coordenador. O proprietário também respondeu diretamente neste chat **Chrome livre agora**. Executado `cua.getApp("com.google.Chrome")` novamente, leitura AX atual e ação pelo índice atualizado. Selecionada a janela Cloudflare existente pelo menu Janela, sem modificar outras janelas. A retomada funcionou inicialmente; coordenador informado em `msg_4e60c6c0b88e`.

Na conta **StayCloud**, aberta a lista de domínios e pesquisado exatamente `allber.to`: **Nenhuma ocorrência foi encontrada**. Somente então iniciado **Adicionar domínio → Conectar um domínio**, com importação automática dos registros. Mantidas as políticas padrão de bots e desmarcado o recurso opcional Bot Preference Sync, evitando acrescentar alterações automáticas ao robots.txt. Selecionado explicitamente **Gratuito / US$ 0**. Nenhum plano pago ou transferência de registro.

Página resultante **Revise seus registros de DNS**, zona `allber.to`, encontrou **8 registros**, antes das alterações:

| Tipo | Nome | Conteúdo | Prioridade | Proxy inicial |
| --- | --- | --- | ---: | --- |
| A | allber.to | 192.64.119.103 | — | Com proxy |
| CNAME | www | parkingpage.namecheap.com | — | Com proxy |
| MX | allber.to | eforward1.registrar-servers.com | 10 | Somente DNS |
| MX | allber.to | eforward2.registrar-servers.com | 10 | Somente DNS |
| MX | allber.to | eforward3.registrar-servers.com | 10 | Somente DNS |
| MX | allber.to | eforward4.registrar-servers.com | 15 | Somente DNS |
| MX | allber.to | eforward5.registrar-servers.com | 20 | Somente DNS |
| TXT | allber.to | v=spf1 include:spf.efwd.registrar-servers.com ~all | — | Somente DNS |

Nenhum MX/TXT editado. Nenhum registro adicional ou AAAA/wildcard importado nessa lista.

**Alteração confirmada na UI:** conteúdo do A apex preenchido com `192.102.140.18`, blur com Tab; AX seguinte mostrou o novo conteúdo. Switch do proxy desligado, AX confirmou **off / Somente DNS**. TTL não foi modificado: era Auto antes de desligar proxy; após isso a AX expõe o seletor como `1`, devendo-se reconferir visualmente Auto antes de concluir.

**Ação interrompida:** chamada contendo `setValue` do conteúdo do CNAME www para `allber.to` e Tab retornou **The user changed '/Applications/Google Chrome.app'**. Não se sabe se o preenchimento foi aplicado antes da interrupção. Nenhuma nova leitura, clique, reset ou repetição após esse retorno, conforme o limite explícito do coordenador. Último estado confirmado do proxy do www era **on**; portanto não considerar www concluído.

O A `api` **ainda não foi criado**. O botão **Continue para ativação** não foi acionado, os dois NS reais da Cloudflare ainda não foram lidos e a delegação na Namecheap **continua inalterada por este operador**. Nenhum domínio adicionado ao EasyPanel, ambiente/segredo modificado ou deploy iniciado. `completion_summary` enviado; estado parcial reportado em `msg_4814aaede6f1`. CUA deste operador totalmente parado até nova instrução.

## Pendências

Após eventual devolução autorizada, retomar a **zona já existente** e conferir persistência do apex, conteúdo/proxy do www e TTL Auto. Concluir www DNS only, criar A api DNS only, conferir novamente os cinco MX/SPF, obter os dois NS reais e só então salvar delegação na Namecheap. Aguardar validação pública do coordenador antes de HTTPS no EasyPanel. Inspeção de redirecionamento www e domínios do painel ainda pendentes. **Migração não concluída; DNS público não foi mudado por este operador.**

## Leitura de reconciliação — possível controle paralelo

Em `msg_d732a816b0b7`, o coordenador autorizou nova leitura por `getApp` e continuidade estritamente observada, uma mutação por chamada, com parada caso houvesse concorrência. A única chamada realizada selecionou novamente Chrome e retornou a aba **Namecheap Advanced DNS**, enquanto a última aba deixada por este operador era Cloudflare. A UI exibiu a barra **“Claude” começou a depurar esse navegador**, além de um grupo **⌛Claude** aberto com aba Proxmox.

Não houve clique no aviso, cancelamento da depuração, acesso à aba Proxmox ou investigação do sistema. A barra, isoladamente, não comprova operação simultânea, mas a exclusividade não foi presumida. Operador parou após essa leitura, enviou `completion_summary` e comunicou o coordenador para reconciliar a reserva do Chrome. Nenhuma nova escrita ou leitura da zona Cloudflare; CNAME www continua com estado incerto conforme a etapa anterior.
