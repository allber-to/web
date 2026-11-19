# Inventário ao vivo do EasyPanel

Estado final: backend PR 4 e web PR 5/pacote v2 implantados e validados. Saúde, redes, pins, N5, N7, backup e persistência conferidos. Coordenador arquivou reversivelmente somente o cliente e a fatura fictícios, após confirmar total 10. UI atualizada confirmou **zero clientes ativos e zero faturas ativas**; painel em BRL com totais zerados. Allberto deixado aberto no Painel para o proprietário. Operação deste chat encerrada e Chrome liberado, com todas as abas preservadas. As seções anteriores preservam o histórico das verificações.

Data: 19/11/2026. Operador: chat `777a7c50-10d2-44c7-a090-a6ec475c5f59`. Solicitação: `msg_051186d9fbce`, do coordenador `ecdf0c57-bcde-43e8-9066-dc595b02857f`.

Inspeção realizada pela interface nativa do Google Chrome, com `mcp__cua_repl.js` e o objeto `chromeApp` já inicializado por `cua.getApp("com.google.Chrome")`. O acesso continuou funcionando nesta sessão. Não foi necessário reiniciar, autenticar novamente ou corrigir o sistema.

## Observado na interface

| Item | Resultado |
| --- | --- |
| Painel | `http://192.102.140.18:3000/`, sessão autenticada; navegação administrativa e botão Sair visíveis |
| Versão | EasyPanel **2.33.1 (2.33.1)** |
| Licença | Em Configurações → Licença, tanto a licença antiga quanto LemonSqueezy aparecem **INATIVO**. Não foi exibido nome de plano contratado. |
| CPU | **2 cores**, utilização observada de 0–1%, carga 0.00 / 0.00 / 0.00 |
| RAM | **3.8 GB total**, aproximadamente **616–627 MB usados** (15.7–16.0%) durante a inspeção |
| Disco | **47.4 GB total**, **4.3 GB usados**, 9.2% |
| Projetos | Lista vazia, conferida por árvore de acessibilidade e captura visual: somente Novo / Criar Projeto |
| Serviços | Nenhum serviço listado; não há projeto no painel visível desta sessão |
| Domínios cadastrados | Página Domínios vazia, somente Adicionar Domínio |
| Domínio padrão do painel | `cxfujw.easypanel.host`, em Configurações → Geral |
| Domínio padrão de serviços | `*.cxfujw.easypanel.host`, em Configurações → Geral → Service Domain |
| Domínio personalizado global de serviços | UI informa que exige licença; nenhum valor preenchido |
| Servir painel no endereço IP | Opção marcada; não modificada |
| Proxy | Menu Traefik presente em Configurações → Geral; configuração interna não aberta |
| Console do servidor | Caminho visível: Configurações → Geral → menu Servidor → Console. Não aberto e nenhum comando executado. |

Estimativas por subtração dos números arredondados da UI: aproximadamente **3.2 GB de RAM não usada** e **43.1 GB de disco livre**. Não equivalem a medição de `MemAvailable`, swap ou reserva de cache. O total de RAM já é inferior aos 4 GB livres estimados na arquitetura para construir o frontend na VPS. Não iniciar o build sem decisão do coordenador/CTO; não houve build nesta etapa.

## Domínios e HTTPS: controles confirmados, funcionamento ainda não testado

Abri Domínios → Adicionar Domínio apenas para ler o formulário. Não preenchi nem cliquei em Criar. Fechei o formulário ao terminar.

- Aba Detalhes: HTTPS marcado por padrão; campo Host; caminho de origem `/`.
- Destino Serviço ou Personalizado. Em Serviço, seletores Projeto e Serviço; protocolo HTTP; porta de destino 80; caminho de destino `/`.
- Aba SSL: campo Resolvedor de Certificados com placeholder `letsencrypt`; opção Domínio curinga desmarcada.
- Configurações → Geral também mostra configuração de e-mail do Let's Encrypt. O contato não foi incluído neste inventário.

Isso confirma a existência do sufixo temporário e dos controles de HTTPS/proxy no painel instalado. **Não confirma** emissão de certificado, DNS/alcance externo, hostname de cada serviço, conexão do Traefik à rede do Compose ou encaminhamento ao serviço interno `nginx`. Nenhum domínio foi criado ou visitado.

## Limites que dependem de uma próxima etapa

| Pergunta | Estado e motivo |
| --- | --- |
| Arquitetura amd64/arm64 | Não apareceu nas telas inspecionadas. Nenhum shell foi executado. |
| Volumes existentes no Docker/host | Não inventariados. Ausência de projetos na UI não prova ausência de volumes órfãos ou recursos externos ao EasyPanel. |
| Portas existentes/livres e firewall | Não inventariados. A interface do painel está acessível em 3000; não foi feita varredura de rede. Não presumir 80/443 ou portas alternativas livres. |
| Disponibilidade efetiva de Compose/App no plano instalado | Não confirmada. Sem projeto, não há seletor de serviço acessível no fluxo observado. |
| Ports em serviço App | Não confirmado sem serviço. |
| Git, Dockerfile, Build Path e argumentos de build | Não confirmados na UI de serviço. A documentação/arquitetura não foi usada como prova de que esses controles já foram vistos nesta instalação. |
| Proxy HTTPS → `nginx` de Compose | Não confirmado sem serviço Compose. O formulário global permite Projeto/Serviço, mas não foi possível observar seleção de container interno. |
| Terminal por serviço | Não confirmado sem serviço. O Console do servidor é um controle diferente e não substitui essa confirmação. |

O formulário Novo/Criar Projeto contém apenas Nome e Criar. Abri e fechei sem preencher. Portanto, a próxima forma concreta de inspecionar tipos e opções de serviço é o coordenador autorizar explicitamente a criação do projeto `allberto`, ainda sem deploy, e orientar o operador a prosseguir. Esta etapa respeitou a solicitação de aguardar instrução do coordenador antes de qualquer mutação no servidor.

## Estado preservado e encerramento

- Nenhum projeto, serviço, domínio, volume, usuário ou licença foi criado, modificado ou excluído; nenhuma configuração foi salva.
- Nenhum segredo foi digitado, revelado deliberadamente, copiado, exportado ou incluído neste documento. Não foram lidos cookies nem tokens de sessão.
- Nenhuma aba foi fechada; abas Proxmox/JSON/login de outro trabalho permaneceram abertas e não foram acessadas. Nenhum acesso WHMCS ou Proxmox foi iniciado.
- Nenhum aviso de segurança do navegador foi clicado.
- Chrome deixado na aba EasyPanel, página principal, com modais fechados; inventário de projetos segue vazio.
- `completion_summary` de UI enviado. A reserva do Chrome para Allberto permanece conforme a coordenação recebida; não houve liberação para outro agente.
- Evidências nesta etapa: árvores de acessibilidade e uma captura visual no retorno da ferramenta. Não salvei captura adicional no repositório para evitar registrar abas ou dados alheios ao inventário.

Os segredos futuros pertencem somente ao serviço **backend**; nunca ao ambiente do projeto nem ao **web**, conforme revisão Fable. Nenhum segredo foi necessário para este inventário.

## Etapa 2 — projeto, serviços vazios e inventário mínimo do host

Autorização posterior do coordenador: `msg_6efb48befcb2`. Criados somente projeto `allberto`, App `web` e Compose `backend`. Sem fonte salva, variáveis de ambiente, build ou deploy.

### Hosts gerados automaticamente

| Serviço | Host HTTPS real exibido | Destino inicial exibido |
| --- | --- | --- |
| web | `https://allberto-web.cxfujw.easypanel.host/` | `http://allberto_web:80/` |
| backend | `https://allberto-backend.cxfujw.easypanel.host/` | `http://allberto_backend:80/` |

O domínio de backend → Editar tem HTTPS marcado, protocolo HTTP, porta 80, caminho `/` e campo de texto **Serviço Compose** com seletor **Select service**. O campo está vazio e o seletor não lista nada enquanto o Compose está vazio. A UI permite indicar o nome interno, que deverá ser `nginx`; **a configuração não foi salva nesta etapa**. A comunicação efetiva com `nginx` depende do deploy.

O coordenador informou por `msg_fa6974b93c0b` que sua consulta externa validou TLS em ambos os hosts (`certificate_verify=0`, sem ignorar TLS) e recebeu HTTP 502 antes dos containers. É evidência dele, não um teste adicional executado por este operador.

### Capacidades efetivamente observadas

- Catálogo oferece **Aplicativo** e **Compose BETA**, e ambos puderam ser criados com as licenças inativas.
- App oferece Upload, GitHub, Imagem Docker, Git e Dockerfile.
- GitHub: Repositório `owner/repo`, Ramo, Caminho de Build (padrão `/`). Git: URL, Ramo e Caminho de Build.
- Imagem Docker: imagem `nome:tag` de qualquer registro público; usuário/senha opcionais para privado. Não preenchidos.
- App sem fonte redireciona para `init/source`, inclusive ao tentar a URL observada de Domínios. O host foi lido em Domínios global. Builder e Ports em Avançado ainda não foram inspecionados após configurar fonte.
- Compose: fonte inline `docker-compose.yml` ou Git. Git tem URL, Ramo, Caminho de Build (padrão `/`) e Arquivo Docker Compose (padrão `docker-compose.yml`). Nenhum desses valores foi salvo nesta etapa.
- Nas telas de serviço há botão **Console**, separado de Logs/Implantar; no Compose ele está acessível sem deploy. Não executei comandos de serviço vazio.

### Host: comandos autorizados e resultados

Executados no Console GLOBAL, pela UI, apenas `uname -m`, `free -m`, `df -h /`, `docker ps --format '{{.Names}} {{.Image}} {{.Ports}}'`, `docker network ls` e `docker volume ls`.

| Medida | Resultado |
| --- | --- |
| Arquitetura | `x86_64` (amd64) |
| Memória (`free -m`, MiB) | total 3915; usada 638; livre 939; shared 1; buff/cache 2602; **available 3277** |
| Swap | total/usada/livre **0** |
| Raiz (`df -h /`) | `/dev/vda1`, 48G total, 4.4G usados, **44G disponíveis**, 10% |
| Volumes (`docker volume ls`) | Somente cabeçalho; nenhum volume listado |

Containers em execução observados:

| Nome ou prefixo | Imagem | Portas |
| --- | --- | --- |
| `focused_grothendieck` | `easypanel/busybox:latest` | nenhuma; observado enquanto o Console GLOBAL estava aberto |
| `easypanel-traefik.1.*` | `traefik:3.6.7` | 80→80/tcp e 443→443/tcp, IPv4/IPv6 em todos os endereços |
| `easypanel.1.*` | `easypanel/easypanel:2.33.1` | 3000→3000/tcp, IPv4/IPv6 em todos os endereços |

Redes observadas:

| Nome | Driver | Escopo |
| --- | --- | --- |
| bridge | bridge | local |
| docker_gwbridge | bridge | local |
| easypanel | overlay | swarm |
| easypanel-allberto | overlay | swarm |
| host | host | local |
| ingress | overlay | swarm |
| none | null | local |

A rede `easypanel-allberto` foi observada depois da criação do projeto. Não foram consultados IPAM, containers associados, variáveis, `inspect` completo ou logs. Não se pode derivar a faixa confiável do proxy apenas dos nomes de rede. Não foi feita varredura de portas nem alteração de firewall.

Nota operacional: `typeText` em comandos sequenciais perdeu espaços numa tentativa de `df -h /`, causando somente erro de comando inexistente. Repeti o comando correto usando `paste`, conferindo a saída. As consultas seguintes usaram `paste` e uma por vez. Repeti `docker network ls` após limpar visualmente a tela com Ctrl+L porque o fim da primeira saída estava fora da área visível.

Console fechado pela UI ao final. Chrome permaneceu no EasyPanel, Configurações → Geral. Nenhuma aba alheia acessada/fechada, nenhum WHMCS/Proxmox, licença ou firewall alterado. `completion_summary` da etapa enviado. Exclusividade do Chrome continua com Allberto.

## Etapa 3 — configuração e primeira implantação manual do backend

Autorização do coordenador: `msg_46eca7aaef63`, após CI/merge da PR 2. HEAD local conferido: `1ee50c75292023cb193beafa328a56bf1127e5a7`. O backend foi revisado localmente antes da operação: `REQUIRE_HTTPS=true`, `TRUSTED_PROXIES` configurável, nenhum `ports`, `app/mysql/redis` somente na rede `backend` interna, nginx em `backend` e `edge`.

Configuração salva pela UI:

- Fonte Git: `https://github.com/allber-to/web.git`, ramo `main`, Build Path `/deploy/easypanel`, arquivo `compose.yml`.
- Ambiente somente do serviço `backend`, com **Criar arquivo .env** marcado. Valores públicos: `APP_URL=https://allberto-backend.cxfujw.easypanel.host`, `TRUSTED_PROXIES=*`. Os demais campos são segredos novos e contato do administrador definido privadamente pelo proprietário.
- Novos segredos gerados com o módulo `secrets` do Python: APP_KEY com 32 bytes aleatórios em base64; senhas distintas com 24 bytes aleatórios codificados em 48 caracteres hexadecimais. Cópia local em `~/.config/allberto/easypanel-backend.env`, arquivo 0600, diretório 0700. Não sobrescrevi arquivo existente, não reutilizei ambiente local e não imprimi valores.
- Transferência do arquivo pelo Editor de Texto e clipboard nativos. Conteúdo de AX omitido durante a transferência; editor fechado sem modificar arquivo e clipboard substituído por URL pública ao terminar. Nenhuma captura dos valores foi produzida.
- Domínio HTTPS do backend atualizado para serviço Compose `nginx`, HTTP, porta 80, caminho `/`. Confirmação da UI: `http://allberto_backend_nginx:80/` e notificação **Domínio atualizado**.
- Compose não apresentou toggle de autodeploy nas telas Fonte/Implantações. Nenhum webhook foi configurado/acionado. A URL do gatilho existente não foi copiada nem registrada.

O aviso inicial do Compose era somente falta de variável obrigatória, antes do ambiente ser preenchido; desapareceu após salvá-lo. Histórico de Implantação estava vazio antes da ação. Botão **Implantar** acionado uma vez; surgiu **Deploy service**, com ação Encerrar/Visualizar. Acompanhamento em andamento; isso ainda não comprova implantação concluída ou backend saudável.

### Resultado da etapa 3

Implantação concluída, sem nova tentativa. Ação da UI identificou **Merge pull request #3** e duração de **2 minutos**; o botão Implantar voltou a ficar disponível e o botão Encerrar desapareceu. O coordenador confirmou que a PR 3 não mudou o Compose aprovado na PR 2, apenas publicou o frontend leve. `main` passou a `aa9b976c0014ce6a445ddc53286488a1f4c95067` durante a preparação; não houve reinício por causa dessa atualização.

Estado consultado por `docker ps`, `docker inspect --format` limitado aos quatro containers, `docker network inspect --format` limitado a nome/Internal e `docker stats --no-stream`:

| Container | Estado | Redes | PortBindings / reinícios / OOM |
| --- | --- | --- | --- |
| allberto_backend-app-1 | healthy | allberto_backend_backend | `{}` / 0 / false |
| allberto_backend-mysql-1 | healthy | allberto_backend_backend | `{}` / 0 / false |
| allberto_backend-redis-1 | healthy | allberto_backend_backend | `{}` / 0 / false |
| allberto_backend-nginx-1 | Up, sem healthcheck próprio | allberto_backend_backend, allberto_backend_default, allberto_backend_edge, easypanel | `{}` / 0 / false |

`allberto_backend_backend` tem **Internal=true**. As redes `default`, `edge` e `easypanel` têm Internal=false e somente o nginx participa delas entre os quatro containers. Portanto app, MySQL e Redis permaneceram exclusivamente na rede interna. Nenhum dos quatro publica porta no host; `80/tcp`, `9000/tcp`, `6379/tcp`, `3306/tcp` e `33060/tcp` que aparecem em `docker ps` são portas expostas internamente, sem mapeamento para o host.

Medição pontual: app 605.3 MiB / CPU 0.08%; MySQL 532.3 MiB / 5.39%; nginx 8.602 MiB / 0%; Redis 6.758 MiB / 0.34%. Não é medição de pico durante PDF. Painel posteriormente mostrou 1.5 GB no agregado do serviço.

Imagens reportadas como **linux/amd64**, com os seguintes RepoDigests observados (não foi extraído o descriptor filho do índice multiarch):

| Imagem | Digest reportado |
| --- | --- |
| invoiceninja/invoiceninja-debian | sha256:05efd0913eb0d72d0246ec96d6cb6adf5ac3d3e59b9b91514b9f64b892f21c92 |
| mysql:8 | sha256:a81d043930e51745522bd5c430961cf8286f0a23f0a9a2a6e0108f7ea71b0902 |
| redis:alpine | sha256:7958cfbb9d152f87dadfbc89f1b0b15938f0b81ff8982feb327476f4911935c3 |
| allberto_backend-nginx:latest | sha256:83abe23924b35b04e3cf6cad5298eb26a899f62b8163cd9f0d9eb094d16a4685 |

Criados os quatro volumes locais esperados: `allberto_backend_app_public`, `allberto_backend_app_storage`, `allberto_backend_mysql_data`, `allberto_backend_redis_data`. Nenhum volume removido/resetado. Containers de infraestrutura EasyPanel e Traefik permaneceram ativos com as portas originais.

Console fechado; UI deixada no histórico de implantações do backend; `completion_summary` enviado. Não houve leitura de env dos containers nem de logs brutos.

Validação externa comunicada pelo coordenador em `msg_e13869a0537e`: HTTPS raiz 200, versão **5.13.49**, HTTP redireciona 301 para HTTPS, `/health` 200/ok, `/setup` 302 para raiz HTTPS sem wizard, signup vazio recusado (403 sem Accept; 401 com Accept JSON conforme fonte). Evidência dele em `/tmp/allberto-easypanel-release/initial-runtime-checks.json`. Esse resultado autorizou a próxima etapa do web.

## Etapa 4 — web publicado e login real

Autorização `msg_e13869a0537e`. Fonte salva pela UI: Git público `https://github.com/allber-to/web.git`, ramo `main`, Build Path `/deploy/easypanel`; builder Dockerfile, arquivo `Dockerfile`. Ambiente vazio e criação de `.env` desmarcada. Avançado → Ports sem entradas. Nenhum webhook ou AutoDeploy configurado.

Domínio existente confirmado: `https://allberto-web.cxfujw.easypanel.host/` → `http://allberto_web:80/`. Implantação manual acionada uma vez, concluída em **9 segundos**, identificando o merge da PR 3 (`aa9b976c0014ce6a445ddc53286488a1f4c95067`). Dockerfile conferido: nginx:alpine, download da release pública, verificação SHA-256, extração do frontend pré-compilado e healthcheck `/healthz`. Nenhuma compilação Node/npm na VPS.

Console global: container `allberto_web.1.*`, imagem `easypanel/allberto/web:latest`, **healthy**, somente `80/tcp`, `PortBindings={}`, reinícios 0, OOMKilled=false. Consultas limitadas a `docker ps` filtrado e `docker inspect --format` desses três campos, sem ambiente/logs completos. Console fechado após consulta.

O coordenador confirmou em `msg_198b5a39eff8`: `/healthz` 200/ok, `/version.json` 200 com no-store e SHA **52db1b5423eafac06d43c38b710f23b6a5fdc6c4**; `/`, `/invoices`, `/clients` retornando HTML 200 por HTTPS; login/precheck/refresh/CORS da API aprovados. Trata-se de evidência dele, sem repetir consultas externas neste chat.

Login real na nova aba Chrome do host web usando somente credenciais protegidas em memória, sem imprimir senha ou capturá-la. Sugestão do 1Password para salvar acesso dispensada. Painel exibiu empresa **Allberto**, menu português e BRL; conta criada concluída, primeiro cliente/gateway/recorrente pendentes, totais financeiros zerados. Clientes e Faturas inicialmente exibiam **0 resultados**. Alguns rótulos do assistente de faturas permanecem em inglês (por exemplo Review and Send e Product Catalog).

## Etapa 5 — fixture E8 interrompida por divergência de valor

Autorização específica `msg_198b5a39eff8`: criar um cliente fictício e uma fatura rascunho de R$ 10,00 pela interface, abrir PDF/portal e preservar registros para persistência. Não enviar email, cobrar ou marcar como enviada/paga.

- Cliente criado uma vez: **VALIDAÇÃO Allberto - teste**, contato **Teste**, email fictício `validacao@example.test`, número **0001**, id `VolejRejNm`. Tela confirmou estado Ativo, BRL, Brasil e saldos zerados.
- Na opção Nova fatura desse cliente, assistente exibiu quantidade **1**. Descrição preenchida por `setValue` com **Teste de implantação** e campo Preço com **10**; avançou-se pelas etapas sem email/gateway. O resumo intermediário após sair dessa etapa não reapresentou o valor.
- Clicado somente **Salvar Rascunho** na etapa 5/5. Toast **Fatura criada com sucesso**. Lista passou a **1 resultado**, número **0001**, id `VolejRejNm`, cliente correto e estado **Rascunho**, mas mostrou **valor R$ 0,00 e saldo R$ 0,00**.
- Interrompido nessa evidência, sem repetir criação, editar, enviar, marcar pago/enviado ou abrir PDF/portal. Causa ainda não determinada: não se conclui defeito da aplicação apenas a partir da entrada por automação nativa. Coordenador avisado por resposta `msg_f56b33272ccf` para investigar persistência de item/preço via API somente leitura.

PDF/portal e medição de memória posterior ao PDF permanecem pendentes. Nenhum convite/URL privado foi registrado neste documento. `completion_summary` da etapa enviado. Chrome permanece reservado, aba web na lista de faturas; abas alheias preservadas. Nenhum redeploy adicional, reset ou remoção de volumes.

Diagnóstico adicional somente leitura: `StepItems.tsx` passa `changeOverride` ao campo Preço; `NumberInputField.tsx` propaga mudanças por `useDebounce` de **500 ms**. A chamada nativa preencheu preço e clicou Continuar no mesmo lote, sem conferir o Total antes de avançar. Hipótese comunicada ao coordenador: a saída da etapa pode ter ocorrido antes da propagação do preço. Ainda não comprova defeito da API nem foi tentada correção do registro. Não houve alteração de código.

### Retomada autorizada: correção única, PDF e portal

Em `msg_0ba31d13749e`, o coordenador confirmou por API somente leitura: descrição correta, cost=0, quantity=1, amount/balance=0, status=1, um único cliente e uma única fatura. Autorizou editar somente o preço do mesmo rascunho, observar o total antes de salvar e continuar E8. A correção de código da janela de debounce ficou com o coordenador/CTO; este operador não alterou código.

Na UI Editar do mesmo rascunho, preenchido Preço **10** e pressionado Tab para sair do campo. Primeira AX confirmou Preço=10; observação seguinte confirmou **linha, subtotal e total R$ 10,00**. Somente então clicado **Salvar**, com toast **Fatura atualizada com sucesso**. Lista e resumo reabertos confirmaram **Rascunho**, descrição original, quantidade **1** e total **R$ 10,00**. Saldo da lista/resumo administrativo permaneceu R$ 0,00, pagamento R$ 0,00 e data do último envio vazia. Nenhum registro adicional criado.

**PDF:** Ver PDF abriu `Fatura_0001`, uma página, com descrição, custo unitário R$ 10,00, quantidade 1 e total R$ 10,00. A captura visual confirmou o documento renderizado. Há uma falha visual específica: imagem de logotipo quebrada e texto alternativo "Allberto logo". Além disso, o visualizador Chrome informou na árvore de acessibilidade falha no download de arquivos de extração de texto, apesar de disponibilizar texto e página. Nenhuma repetição do PDF; ressalvas comunicadas ao coordenador em `msg_11d245d555c5`. Não se atribuiu causa a URL, rede ou servidor sem diagnóstico. O documento foi exibido como blob HTTPS do frontend; esta observação isolada não revela a URL de origem da geração.

**Portal:** o link do contato abriu o portal geral em português, sem faturas listadas para esse rascunho. Ação específica **Ações → Portal do Cliente** da fatura abriu **Visualizar fatura**, número **0001**, cliente fictício correto e valor devido/saldo **R$ 10,00**. Prefixo **HTTPS do domínio da API** confirmado pela barra de endereço, com conteúdo privado omitido das saídas. Não foram acionados pagamento, envio ou formulário de cobrança. Após retornar, lista administrativa ainda mostrou **um único Rascunho**, total R$ 10,00. Links privados/chaves não foram registrados neste documento.

**Recursos após PDF/portal:** uma execução de `docker stats --no-stream`, limitada aos cinco containers do projeto:

| Container | Memória | CPU |
| --- | --- | --- |
| backend app | 1019 MiB | 5.96% |
| MySQL | 538.7 MiB | 0.82% |
| Redis | 8.816 MiB | 0.38% |
| nginx backend | 8.906 MiB | 0.00% |
| web | 3.855 MiB | 0.00% |

`docker inspect --format` restrito a State.Status, RestartCount e OOMKilled confirmou os cinco **running**, **0 reinícios**, **OOMKilled=false**. Medição pontual após a geração, não captura de pico nem teste de carga. Console fechado. Resultado enviado ao coordenador em `msg_fe8338fec6ba`; `completion_summary` enviado. Chrome preservado/reservado, web na lista de faturas, abas de portal abertas para conferência. Sem E9, redeploy, backup ou arquivamento nesta retomada.

## Etapa 6 — backup manual E9 antes do próximo redeploy

Autorização específica `msg_c716aa6006b1`. Executado uma única vez no Console GLOBAL o corpo exato da seção **Pins observados na VPS e procedimento E9**, em `docs/handoffs/astra-easypanel.md`, dentro de `sh` isolado; um `printf` externo informou o código de saída. Não habilitado `set -x`; não exibidos ambiente, SQL ou conteúdo do arquivo compactado. Nenhuma edição de registros nem redeploy durante esta etapa.

Resultado observado: **E9 exit=0**, `ninja.sql: OK`, `storage.tar.gz: OK`. O script validou ambos os arquivos não vazios, a leitura do tar silenciosamente e os hashes contra `SHA256SUMS`, antes de apagar apenas o staging próprio.

Caminho no container app, volume persistente **app_storage**:
`/var/www/html/storage/app/backups/20261119T163258Z`

| Arquivo | Bytes | SHA-256 |
| --- | ---: | --- |
| ninja.sql | 504900 | dad78b785949c8039a67aa1a0d0bd3b26b21a4b3371a428781e314acbe1db363 |
| storage.tar.gz | 382466 | 394876eea7970f6a5fea59943355e038d9ef822912b937cfc85cc7f84891dbb5 |

Total dos dois arquivos: **887366 bytes**. Manifesto `SHA256SUMS` gravado no mesmo diretório. O tar exclui `./app/backups`. Proteção inicial definida pelo procedimento: diretórios 0700 e arquivos 0600; o init/redeploy da imagem altera storage para www-data e 0755/0644. O backup fica fora de `storage/app/public`, mas é acessível pelo processo da aplicação após esse init e está na **mesma VPS**. Não comprova restauração nem substitui cópia externa.

A saída inicialmente estava fora da área visível da janela; a janela foi ajustada e o zoom temporário restaurado para 100%, sem repetir o comando. Console fechado e `completion_summary` enviado. Resultado comunicado ao coordenador em `msg_6ccb43a85fbd`. Cliente/fatura `VolejRejNm`, total R$ 10,00, preservados; nenhuma alteração de rede, licença, firewall ou aplicação alheia. Aguardando próximo SHA revisado antes de qualquer redeploy.

## Etapa 7 — redeploy backend PR 4 e verificações N1/N2/N5

Autorização específica `msg_e44a7a1db67a`: PR 4 com CI aprovado e merge em `c6737c2e32297d0c20ff1156f5769e43c7e9dfc9`, fonte revisada `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`. Botão **Implantar** do backend acionado uma única vez. Histórico identificou **Merge pull request #4**, concluído em **36 segundos**. Nenhuma edição do ambiente, APP_KEY, segredos ou volumes. Web não reimplantado.

Consultas no Console GLOBAL limitadas a campos selecionados de estado, redes, imagens e mounts, configuração Laravel autorizada, metadata do backup e duas verificações HTTPS sem corpos de resposta.

| Container | Estado | Redes | PortBindings / reinícios / OOM |
| --- | --- | --- | --- |
| allberto_backend-app-1 | running / healthy | allberto_backend_backend, allberto_backend_egress | `{}` / 0 / false |
| allberto_backend-mysql-1 | running / healthy | allberto_backend_backend | `{}` / 0 / false |
| allberto_backend-redis-1 | running / healthy | allberto_backend_backend | `{}` / 0 / false |
| allberto_backend-nginx-1 | running / sem healthcheck próprio | allberto_backend_backend, allberto_backend_default, allberto_backend_edge, easypanel | `{}` / 0 / false |

**N1:** `allberto_backend_backend` continua com **Internal=true**. Egress, edge, default e easypanel têm Internal=false. App participa somente de backend+egress, sem ingressar na rede do proxy; MySQL e Redis somente de backend. Redes do nginx permaneceram iguais às observadas antes da PR 4. Nenhum PortBinding no host.

**N5:** executado o comando revisado de `docs/reviews/fable-easypanel-artifacts.md`, por `runuser -u www-data -- php artisan tinker`, com diretório `/var/www/html`. Saída selecionada: `{"sentry_vazio":true,"autoupdate_off":true,"mail":"log"}`; **exit=0**. Não consultado ambiente completo. N6/self-update não executado e N7/mail não iniciado.

**N2:** curl do app executado como www-data, com validação TLS ativa e sem proxy: `https://invoicing.co/images/new_logo.png` retornou **HTTP 200**, TLS verify **0**, **9391 bytes**. A raiz HTTPS da API retornou **200**, TLS verify **0** e `X-APP-VERSION=5.13.49`; comando terminou em **exit=0**. Isso comprova alcance do recurso externo pelo app; o PDF ainda precisa do reteste do coordenador.

No MySQL, `/proc/net/route` não apresentou rota IPv4 default. `curl` está presente. Uma única consulta ao mesmo logotipo retornou **HTTP 000 / curl exit 6**, com falha de resolução do host, coerente com o isolamento observado. Não se atribuiu o resultado à ausência do binário; a evidência combina rede Internal=true, associação exclusiva e ausência de rota default, sem tentar instalar ferramentas ou modificar rede.

**Pins e persistência:** imagens configuradas do app, MySQL e Redis usam os três digests já registrados na etapa 3, agora fixados na configuração. Os quatro volumes continuam montados nos destinos originais: app_public/public, app_storage/storage, mysql_data/var/lib/mysql e redis_data/data. Nenhum reset ou remoção. A persistência dos registros será conferida pelo coordenador via API; este operador não editou nem reabriu o rascunho nesta etapa.

**Backup após init:** `sha256sum -c SHA256SUMS` em `/var/www/html/storage/app/backups/20261119T163258Z` confirmou `ninja.sql: OK` e `storage.tar.gz: OK`; **exit=0**. Hashes e tamanhos dos dois arquivos idênticos aos da etapa 6. Metadata observada:

| Item | Permissões | Proprietário | Bytes |
| --- | --- | --- | ---: |
| diretório 20261119T163258Z | 0755 | www-data:www-data | 4096 |
| ninja.sql | 0644 | www-data:www-data | 504900 |
| storage.tar.gz | 0644 | www-data:www-data | 382466 |
| SHA256SUMS | 0644 | www-data:www-data | 157 |

A mudança de permissões pelo init corresponde à ressalva prévia. Backup continua fora de public, no mesmo volume/VPS, acessível ao processo da aplicação; sem cópia externa nem teste de restauração nesta etapa.

Console fechado e `completion_summary` enviado. Resultado comunicado ao coordenador em `msg_a0d94f832e90`, liberando seus retestes API/PDF. Chrome permanece reservado; abas alheias preservadas. Nenhum comando self-update, prova de email, edição financeira, redeploy web ou consulta a aplicações alheias.

## Etapa 8 — web v2, revalidação de preço e N7

Autorização `msg_79ccbaf589a9`. O coordenador comunicou PASS pós-redeploy backend: login/precheck/refresh/CORS, companhia Allberto/pt_BR/BRL preservada, um cliente e um rascunho `VolejRejNm` com total 10 e quantidade 1, endpoints charts/analytics/totals 200. PDF regenerado por ele retornou 200, 96526 bytes; inspeção Poppler confirmou marca Invoice Ninja, fallback branco no topo sem imagem quebrada e total correto. Evidências dele: `/tmp/allberto-easypanel-release-v2/invoice-after-egress.{pdf,png,txt}` e `backend-redeploy-check.json`.

### Implantação web

PR 5 CI PASS/merge comunicado: `main=32c777a0c2c186b1b4c3a581255682cd53c189d3`. Fonte/configuração existente mantida. Uma única ação manual **Implantar** no web; histórico confirmou **Merge pull request #5**, concluído em **6 segundos**. Backend não reimplantado.

Novo container `allberto_web.1.hp6f5kzz61asbo6n9an5wrznx`: running/healthy, reinícios 0, OOMKilled=false, PortBindings={}. Consulta HTTPS a `/version.json` confirmou `revision=f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`, exit=0. Dockerfile local conferido com release v2 e SHA-256 fixado, mantendo download/verificação/extração no nginx, sem Node/npm na VPS. Resultado inicial enviado em `msg_17b22f6053fd`.

### Interface e ciclo no mesmo rascunho

Recarga completa pelo Chrome (`Cmd+Shift+R`). Após a recarga, sessão continuou autenticada; não foi necessário novo login. Painel, Clientes e Faturas renderizaram em português. Antes de editar, lista de clientes exibiu exatamente um cliente fictício e lista de faturas exatamente um rascunho, id original, total R$ 10,00.

No editor guiado da mesma fatura, preenchido **Preço=11**, pressionado **Tab** e clicado **Salvar** na mesma chamada, sem espera deliberada ou observação intermediária. Medição `Date.now()` em torno das chamadas nativas: setValue+Tab **917 ms**, chamada do clique Salvar **103 ms**. Esses intervalos incluem a automação nativa e não medem os eventos internos do DOM; **não comprovam uma execução inferior a 500 ms**. Lista e resumo reabertos confirmaram **Rascunho / R$ 11,00 / quantidade 1**.

Em seguida, restaurado **Preço=10** no mesmo editor, saído com Tab e conferidos subtotal/total **R$ 10,00** antes de Salvar. Lista e resumo novamente reabertos confirmaram **um único rascunho**, descrição original, quantidade 1 e total **R$ 10,00**. Pago R$ 0,00, nenhum pagamento e data do último envio vazia. Não criado outro cliente/fatura; não enviado email, marcado como pago/enviado, cobrado ou arquivado. A prévia embutida do PDF renderizou texto e valores; o aviso anterior do Chrome sobre arquivos de extração de texto continuou aparecendo, sem impedir a leitura disponível.

### N7 — transporte em log

Arquivo `/tmp/allberto-n7-log-probe.command` lido e validado com `sh -n` (exit 0). Corpo exato executado uma única vez em `sh` isolado, sem alterar fatura ou ambiente. Guard verificou `mail.default=log` e a classe `Illuminate\\Mail\\Transport\\LogTransport` antes da mensagem fictícia. Resultado: **LOG_MAIL_PROBE_OK**, contagem **1**, **N7 exit=0**. Nenhum envio externo.

Observação operacional: o próprio transporte de log espelhou a mensagem fictícia na saída do tinker, além de gravá-la no arquivo. O log completo não foi consultado e seu conteúdo não foi reproduzido neste relato. A prova não foi repetida. Console fechado após conferir o resultado; somente marcador, contagem e código de saída foram reportados ao coordenador.

### Recursos ao término

Uma execução de `docker stats --no-stream` limitada aos cinco containers, seguida de inspeção selecionada de estado/reinícios/OOM:

| Container | Memória | CPU |
| --- | --- | --- |
| app | 677.6 MiB | 0.12% |
| MySQL | 479.8 MiB | 0.84% |
| Redis | 10.6 MiB | 0.26% |
| nginx backend | 3.828 MiB | 0.00% |
| web | 4.234 MiB | 0.00% |

Todos running, reinícios **0**, OOMKilled **false**. App, MySQL, Redis e web healthy; nginx sem healthcheck próprio. Medição pontual, sem avaliação de pico/carga. Console fechado e `completion_summary` enviado; resultado final da etapa comunicado em `msg_4ae6d471bd42`. Chrome e abas preservados, fixture mantida para conferência final do coordenador. Backup externo/restauração não testados nesta etapa.

## Encerramento — conferência após arquivamento e liberação do Chrome

Em `msg_733daf779447`, o coordenador confirmou PASS de `/tmp/allberto-easypanel-release-v2/final-persistence-cleanup.json`: mesmos registros e total 10 preservados antes de arquivar reversivelmente apenas cliente/fatura `VolejRejNm`, ambos com `archived_at>0`, `is_deleted=false` e contagem ativa zero. O arquivamento foi realizado pelo coordenador; não houve exclusão definitiva ou purge.

Este operador realizou somente atualização/leitura da interface:

- **Faturas**, após recarga do navegador, filtro **Vida útil: Ativo**, status **Todos**: **Nenhum registro encontrado / Resultados totais: 0**.
- **Clientes**, filtro **Vida útil: Ativo**: **Nenhum registro encontrado / Resultados totais: 0**.
- **Painel**: empresa Allberto, português/BRL, receita recorrente, recebido, a receber e em atraso em **R$ 0,00**; **0 faturas em aberto**, nenhuma vencida com saldo ou recorrente ativa. Atividade recente registra o arquivamento da fatura e do cliente. A etapa histórica “Cadastrar o primeiro cliente” permanece concluída, embora a lista ativa esteja vazia.

`completion_summary` enviado ao observar o resultado final. Aplicativo deixado aberto e autenticado em `https://allberto-web.cxfujw.easypanel.host/dashboard`. Nenhuma mutação, console, novo deploy ou alteração de abas alheias nesta etapa. **Chrome liberado por este operador**; encerrada a reserva exclusiva de Allberto. Coordenação de eventual próxima frente fica com o coordenador.

Registro estável de encerramento: **`docs/handoffs/easypanel-live-inventory.md`** (este arquivo). O JSON em `/tmp` é a evidência adicional do coordenador; os resultados necessários foram registrados aqui sem credenciais. Limites anteriores mantidos: backup somente na mesma VPS, sem restauração/cópia externa testada; recursos medidos pontualmente; tempo nativo não comprova janela inferior a 500 ms.
