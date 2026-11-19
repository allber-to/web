# Inventário ao vivo do EasyPanel

Estado mais recente: projeto `allberto` e serviços vazios `web` (App) e `backend` (Compose) criados com autorização posterior. Nenhum deploy iniciado até a conclusão da etapa 2 abaixo. A primeira seção preserva o inventário inicial, antes dessas criações.

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
