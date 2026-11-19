# Arquitetura — publicação no EasyPanel (story 003)

Data: 19/11/2026. Decisão técnica: Fable 5.2 (CTO). Implementação: Astra. Operação do painel: coordenador. Base: `77808e1ec`.

**Decisão: GO para os artefatos.** A execução no painel depende das pré-condições da seção 2, que só o inventário do coordenador pode fechar.

> **Atualização de 19/11/2026:** o proprietário autorizou publicar com os domínios temporários do EasyPanel em HTTPS. A seção 14 passa a ser o caminho principal e ajusta as seções 1, 3, 4, 6 e 10. A publicação por IP e portas fica como alternativa, só se as condições da seção 14 não se confirmarem.

Este documento vem de leitura de fontes públicas e do repositório. Não acessei o painel, a VPS nem alterei nada em execução. O que não foi possível confirmar está marcado como **não confirmado**; nesses pontos não assumo comportamento do EasyPanel.

## 1. Decisão central: duas portas dedicadas, duas origens

A publicação provisória usa o IP com **duas portas publicadas**:

| Origem | Conteúdo |
| --- | --- |
| `http://192.102.140.18:<PORTA_WEB>` | Frontend allberto (arquivos estáticos em nginx) |
| `http://192.102.140.18:<PORTA_API>` | Backend Invoice Ninja completo (nginx oficial + PHP-FPM) |

É a mesma topologia validada na story 002: frontend numa origem, API em outra, autenticação por token em cabeçalho e CORS aberto no backend (150 respostas sem erro no navegador).

### Por que não uma origem única com proxy por caminho

O Astra propôs um nginx de entrada servindo o frontend e encaminhando ao backend só alguns prefixos. Avaliei e não adoto nesta fase:

- **A lista de prefixos é longa e incerta.** O backend usa `/api/`, `/client/`, `/vendor/`, `/documents/`, `/password/`, `/build/`, `/css/`, `/images/`, `/storage/` e outros. O frontend usa `/clients`, `/vendors`, `/documents`, `/react/` e seus próprios arquivos na raiz. Um prefixo esquecido ou largo demais quebra portal do cliente, PDF ou arquivos do portal sem erro evidente. O próprio inventário do Astra lista itens "a confirmar".
- **Depende de o EasyPanel rotear por IP na porta 80.** A documentação descreve domínios por nome de host; roteamento por endereço IP não está documentado. **Não confirmado**, e não vou supor.
- **Com portas dedicadas o roteamento do backend é o oficial, sem alteração.** Portal, PDF, arquivos e redirecionamentos funcionam como na imagem, que é o que já foi testado.

Custo aceito: quando o domínio chegar, o frontend precisa de um rebuild com o novo endereço da API (seção 9). É um passo único e documentado.

### Por que publicar portas, se o EasyPanel prefere domínios

A documentação do Compose avisa que `ports` pode conflitar, porque cada porta publicada precisa ser única no servidor, e recomenda domínios para HTTP. Sem DNS não há domínio a configurar. A porta publicada é o mecanismo documentado para tráfego fora do proxy; o risco de conflito é tratado pela pré-condição P4.

## 2. Pré-condições para executar no painel

O coordenador confirma e registra antes do primeiro deploy. Nenhuma tem valor presumido.

| # | Pré-condição | Se falhar |
| --- | --- | --- |
| P1 | Versão do EasyPanel e disponibilidade de serviço **Compose** e de **Ports** em serviço App no plano instalado | Parar e me reportar. Não confirmado se o plano em uso restringe algum dos dois. |
| P2 | Arquitetura da VPS (`amd64` ou `arm64`) | Nenhuma: a imagem é referenciada pelo digest do índice, que cobre as duas. Registrar qual manifesto foi usado. |
| P3 | Recursos livres: memória e disco | Ver mínimos na seção 5. Abaixo deles, não fazer o build do frontend na VPS. |
| P4 | Duas portas TCP livres no host e liberadas no firewall da VPS | Escolher outras. Sugestão inicial: `8090` (web) e `8012` (API), só se livres. Não usar 80, 443 nem 3000. |
| P5 | Lista de projetos, serviços, volumes e portas existentes, antes de qualquer alteração | Sem esse registro não há como demonstrar que os serviços alheios ficaram intactos. |
| P6 | E-mail do administrador definido pelo proprietário | Sem ele o backend não sobe: a inicialização exige e-mail e senha. Não usar endereço inventado nem o padrão da imagem. |

## 3. Serviços no EasyPanel

Um projeto novo, `allberto`, com dois serviços. Nada é criado ou alterado em projetos existentes.

### 3.1 Serviço Compose `backend`

- **Fonte:** Git, repositório `https://github.com/allber-to/web`, branch `luizstay/luiz-feat-link-github`.
- **Build Path:** `/deploy/easypanel`. **Compose file:** `compose.yml`.
- **Ambiente:** valores no editor do EasyPanel, com "Create .env file" ligado. O arquivo é gravado no Build Path, que é o diretório do projeto Compose.

Motivo do Build Path próprio: a documentação resolve contextos de build e arquivos a partir dele, e é nele que o `.env` é gravado. Mantendo o Compose e tudo o que ele referencia dentro de `deploy/easypanel/`, não dependo de como o painel trata caminhos fora desse diretório.

| Serviço interno | Imagem | Porta publicada | Redes | Volume |
| --- | --- | --- | --- | --- |
| `app` | `invoiceninja/invoiceninja-debian@sha256:05efd0913eb0d72d0246ec96d6cb6adf5ac3d3e59b9b91514b9f64b892f21c92` | nenhuma | `backend` | `app_public`, `app_storage` |
| `nginx` | build local: `nginx:alpine` + os dois `.conf` oficiais copiados para dentro | `${API_PORT}:80` | `backend`, `edge` | `app_public` e `app_storage`, somente leitura |
| `mysql` | `mysql:8` | nenhuma | `backend` | `mysql_data` |
| `redis` | `redis:alpine` | nenhuma | `backend` | `redis_data` |

Regras:
- **Sem `container_name`.** A documentação aponta como fonte de colisão.
- **Sem bind mount.** Os arquivos do nginx entram por `build` (um `Dockerfile` de duas linhas em `deploy/easypanel/nginx/`). Assim não dependo de onde o painel mantém o checkout no servidor.
- **`ports` só no `nginx`**, com a porta vinda de variável. MySQL, Redis e PHP-FPM nunca publicados. A porta 9000 do `app` é FastCGI, não HTTP: nada externo aponta para ela.
- **Rede `backend` com `internal: true`**, como na validação local: `app`, `mysql` e `redis` sem saída para a internet. Enquanto for homologação, isso impede envio real de e-mail e chamadas a terceiros por construção.
- **`restart: unless-stopped`** nos quatro.
- **Uma réplica do `app`.** A imagem já roda PHP-FPM, dois workers de fila e o agendador sob supervisor. Não criar serviço de cron nem worker adicional: duplicaria envios e recorrências.
- Healthchecks e `depends_on` como no Compose local aprovado.
- Variáveis passadas ao `app` por `environment:` com interpolação explícita (`${APP_KEY}` etc.), não por `env_file`. Fica visível no arquivo quais chaves o container recebe.

Digests da imagem `app` (consulta ao Docker Hub em 19/11/2026):
- índice: `sha256:05efd0913eb0d72d0246ec96d6cb6adf5ac3d3e59b9b91514b9f64b892f21c92`
- amd64: `sha256:a21d9a26db5273b983a14c89034816e1b5943b2122db7d04e0b4fe65b25e276c`
- arm64: `sha256:c0dadfee7ca70cd7407bffc353597f27c07cca815564e35ec0570c13ccd1437f`

Só o manifesto arm64 foi executado até aqui. O amd64 está confirmado como existente, não como testado.

### 3.2 Serviço App `web`

- **Fonte:** GitHub, `allber-to/web`, mesma branch, Build Path `/`. Repositório público: sem token.
- **Builder:** Dockerfile, caminho `deploy/easypanel/frontend.Dockerfile`.
- **Ports (Advanced):** publicada `<PORTA_WEB>`, alvo `80`.
- **Auto Deploy desligado.** Deploy manual, por decisão registrada.
- Sem volume: o container é descartável.

O frontend fica em serviço próprio porque seu build precisa do repositório inteiro como contexto, e o Compose do backend está restrito a `deploy/easypanel/`.

`frontend.Dockerfile`:
1. `node:22-bookworm-slim` (o `package.json` exige Node ≥ 22). `HUSKY=0`, `npm ci`.
2. **`npx vite build`**, sem o `tsc` do script `build`. A checagem de tipos já roda no CI; repeti-la na VPS só aumenta memória e tempo.
3. Estágio final `nginx:alpine` com `dist/` e uma configuração de SPA.

Argumentos de build, todos públicos (vão para o bundle):

```
VITE_API_URL=http://192.102.140.18:<PORTA_API>
VITE_IS_HOSTED=false
VITE_IS_TEST=false
VITE_ROUTER=browser
VITE_APP_TITLE=allberto
```

`VITE_API_URL` sem barra final e sem `/api/v1`. Não copiar o `.env.example` do repositório: ele define `VITE_IS_TEST=true`. Sentry, login social, Pusher e demais integrações ficam vazios.

Configuração do nginx do frontend:
- rotas da aplicação caem em `/index.html`;
- `index.html` sem cache persistente;
- arquivos com hash em `/react/` com cache longo; arquivo inexistente ali responde 404, não o HTML;
- nenhum `proxy_pass`. Este nginx não conhece o backend.

## 4. Configuração do backend

Valores no editor de ambiente do serviço Compose. **Gerados novos, na hora, pelo operador.** Nenhum valor do `.env` local é reaproveitado.

| Chave | Valor |
| --- | --- |
| `APP_KEY` | `base64:` + 32 bytes aleatórios em base64 |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | aleatórios, 48 caracteres hexadecimais |
| `IN_USER_EMAIL` | o e-mail definido em P6 |
| `IN_PASSWORD` | aleatória, 48 caracteres hexadecimais |
| `API_PORT` | a porta de P4 |
| `APP_URL` | `http://192.102.140.18:<PORTA_API>` |

Fixos:

```
APP_ENV=production
APP_DEBUG=false
REQUIRE_HTTPS=false
IS_DOCKER=true
PDF_GENERATOR=snappdf
PHANTOMJS_PDF_GENERATION=false
FILESYSTEM_DISK=debian_docker
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=redis
DB_HOST=mysql
DB_CONNECTION=mysql
DB_DATABASE=ninja
DB_USERNAME=ninja
MAIL_MAILER=log
MAIL_HOST=
SCOUT_DRIVER=null
```

Pontos que costumam dar errado, com a decisão:

- **`APP_URL` é o endereço público exato da API**, com IP e porta. Nunca `localhost`, nunca nome de serviço Docker. Links de portal, PDF e redirecionamentos saem dele.
- **`TRUSTED_PROXIES` não é definido nesta fase.** A porta é publicada direto, sem proxy na frente; confiar em cabeçalhos encaminhados permitiria ao cliente forjá-los. Passa a ser definido quando o tráfego vier pelo proxy do painel (seção 9).
- **`APP_DEBUG=false` sempre.** Em servidor público, depuração expõe configuração.
- **`REQUIRE_HTTPS=false`** só enquanto durar o HTTP provisório.
- **CORS:** nenhuma configuração. O backend já responde com origem aberta e aceita os cabeçalhos do frontend.
- **Sem `API_SECRET`**, gateways, chaves bancárias, Sentry ou login social.

### Inicialização

O script da imagem roda as migrações a cada subida e cria a conta só quando não existe nenhuma. Redeploy com os volumes existentes não recria nem apaga dados.

- A senha inicial é a de `IN_PASSWORD`. Depois do primeiro login, o proprietário troca a senha pela interface; o valor no ambiente deixa de ter uso.
- **Nunca trocar `APP_KEY` nem as senhas do banco com os volumes existentes.** Isso inutiliza a instância. A `APP_KEY` precisa de cópia guardada fora do painel pelo proprietário.

## 5. Recursos mínimos

Estimativas minhas, a confrontar com P3:

- **Execução:** cerca de 2 GB de memória livre para os quatro containers (o Chromium do PDF é o pico) e 10 GB de disco (imagem de 1 GB comprimida, banco, arquivos).
- **Build do frontend na VPS:** cerca de 4 GB de memória livre durante o build.

Se não houver memória para o build, não insistir: reportar. A alternativa é construir a imagem do frontend fora e publicá-la num registro, o que é uma decisão nova (envolve publicar artefato) e volta para mim e para o coordenador.

## 6. Exposição e segurança no período HTTP

O período por IP é **homologação**. Regras:

- **Proibido cadastrar dados financeiros ou pessoais reais** enquanto não houver HTTPS. Login e token trafegam em claro.
- Só dados de teste, criados à mão pela interface.
- Sem gateway de pagamento e sem envio real de e-mail (`MAIL_MAILER=log`, rede sem saída).
- Se o firewall da VPS permitir restringir as duas portas aos endereços de quem vai homologar, fazer. **Não confirmado** se há essa possibilidade.
- A porta da API também serve a interface React original do Invoice Ninja na raiz. É esperado; a homologação usa a porta web.

Criação de conta por API: conferido depois na fonte da 5.13.49 que `CreateAccountRequest::authorize()` só permite quando o ambiente é `hosted`. O Compose fixa `NINJA_ENVIRONMENT: selfhost`, então o cadastro fica recusado. O critério E7 confirma isso no ar; se a resposta não for 403, é bloqueio para manter a porta aberta.

## 7. Backup e restauração

Não afirmo que o EasyPanel faz backup de volumes de um serviço Compose: a documentação descreve backup de volumes na aba Storage de serviço App. **Não confirmado** para Compose.

Procedimento mínimo, manual, pelo terminal do serviço no painel:

1. **Banco:** `mysqldump` de dentro do container `mysql` (`--single-transaction`, banco `ninja`), gravado em arquivo com data.
2. **Arquivos:** cópia compactada do volume `app_storage`.
3. **Chave:** `APP_KEY` guardada pelo proprietário. Sem ela o dump não é utilizável.

Regras:
- Executar uma vez após a homologação inicial, para provar que o procedimento funciona (critério E9).
- **Antes de qualquer dado real:** rotina com destino fora da VPS, retenção definida e **uma restauração testada**. Até lá, não chamar isso de backup validado.
- Antes de qualquer mudança de versão do backend ou de definição de volume: dump novo.

## 8. Identificação e rollback

Registrar a cada deploy, em `docs/stories/003-easypanel-deploy.md`: SHA do commit, digest da imagem do backend em uso, portas e data. O frontend publica `/version.json` só com SHA e data de build.

- **Frontend:** rollback é redeploy do commit anterior. Como a branch é móvel, criar uma tag Git no commit publicado; o rollback aponta o serviço para a tag anterior. Não há dado no container.
- **Backend:** a versão fica fixa em 5.13.49. Rollback de configuração é restaurar os valores de ambiente anteriores e redeployar. Não há troca de versão prevista; se houver, só com dump prévio, porque migrações não são desfeitas trocando a imagem.
- **Retirada total:** parar os dois serviços (`Stop`). Destruir o serviço Compose apaga os volumes — só com pedido explícito do proprietário e dump feito.

## 9. Migração para o domínio

Quando `allber.to` existir. Não executar nada disto agora.

1. Criar dois registros apontando para a VPS, por exemplo `app.allber.to` e `api.allber.to`.
2. No painel, adicionar domínio com HTTPS ao serviço `web` (porta 80) e ao serviço interno `nginx` do Compose (porta 80).
3. Backend: `APP_URL=https://api.allber.to`, `REQUIRE_HTTPS=true`, definir `TRUSTED_PROXIES` para a rede do proxy do painel; redeploy.
4. Frontend: rebuild com `VITE_API_URL=https://api.allber.to`.
5. Remover as duas portas publicadas e fechá-las no firewall.
6. Conferir login, PDF e um link de portal, que agora devem sair com o domínio.
7. Só então liberar dados reais, com o backup da seção 7 em vigor.

O passo 3 exige que o `nginx` do Compose esteja numa rede que o proxy do painel alcance. Como o EasyPanel conecta o proxy a serviços Compose **não está confirmado** por mim; resolver na hora, com o painel à vista.

Unificar tudo numa origem só (`allber.to` servindo frontend e API) continua possível depois, mas é outro projeto: exige o mapa de prefixos que esta fase evita.

## 10. Critérios de aceite

| # | Critério | Evidência |
| --- | --- | --- |
| E1 | Inventário P5 antes e depois idêntico para tudo que não é do projeto `allberto` | as duas listas |
| E2 | Só as duas portas do projeto publicadas; MySQL, Redis e 9000 inacessíveis de fora | teste de conexão externo às portas |
| E3 | API responde `X-APP-VERSION: 5.13.49`; imagem em uso com o digest do índice e o manifesto da arquitetura da VPS | cabeçalho e inspeção da imagem |
| E4 | Frontend na porta web mostra a shell allberto; `/version.json` com o SHA publicado; rota profunda (ex.: `/invoices`) abre direto | captura e resposta |
| E5 | No que é servido: nenhuma ocorrência de `127.0.0.1` nem de `localhost` seguido de porta; `localhost` sem porta só em comentário, analisador de URL ou valor de reserva para ambiente sem `window`; a origem de API efetiva é exatamente o IP e a porta de `VITE_API_URL`; nenhum padrão de segredo. Revisado em 19/11/2026: ver `docs/reviews/fable-easypanel-artifacts.md` | contagem e lista de ocorrências com contexto |
| E6 | Login real (precheck, login, refresh) com o administrador de P6; Painel carrega sem erro de rede ou CORS | relatório de rede só com método, caminho e status |
| E7 | Criação de conta por API recusada: `POST /api/v1/signup` **sem corpo, sem token e sem senha** responde 403 (a rota grava cabeçalhos e corpo em log antes de autorizar, por isso nada sensível é enviado e nenhum cadastro real é tentado). `GET /setup` não oferece o assistente de instalação | status das duas respostas |
| E8 | Um cliente e uma fatura de teste criados pela interface; PDF abre; o link do PDF e do portal usa o IP e a porta da API | captura, sem expor a chave do convite |
| E9 | Redeploy dos dois serviços preserva conta, cliente e fatura; dump do banco gerado e não vazio | antes/depois e tamanho do arquivo |
| E10 | Nenhum segredo no Git, em documento, log anexado ou captura; `env.example` só com valores públicos e segredos vazios | revisão do diff e das evidências |

Falha em E1, E2, E7 ou E10 é bloqueio. Não rodar `local-backend/smoke.mjs` nem as specs upstream contra a VPS: o primeiro tem travas para só rodar em `localhost`, as segundas resetam conta.

## 11. Escopo do Astra

Criar, sem tocar em `src/`, `tests/` ou `local-backend/`:

| Arquivo | Conteúdo |
| --- | --- |
| `deploy/easypanel/compose.yml` | Seção 3.1 |
| `deploy/easypanel/nginx/Dockerfile` e os dois `.conf` | Cópia dos arquivos já validados, com a origem anotada |
| `deploy/easypanel/env.example` | Todas as chaves da seção 4; segredos e portas vazios |
| `deploy/easypanel/frontend.Dockerfile` | Seção 3.2 |
| `deploy/easypanel/frontend.conf` | nginx do frontend |
| `.dockerignore` | Excluir `.git`, `node_modules`, `dist`, `.env*`, `local-backend/`, evidências e artefatos de teste |
| `docs/handoffs/astra-easypanel.md` | O que foi feito, como verificar, passos do painel na ordem |

Verificação local antes de entregar, em projeto e portas próprios, sem interferir no backend local em execução:
- `docker compose config` do novo Compose com valores fictícios, sem imprimir a configuração expandida em documento;
- build do frontend com um `VITE_API_URL` de teste; `nginx -t`; rota profunda devolve HTML; arquivo inexistente em `/react/` devolve 404; `index.html` sem cache persistente;
- busca por `localhost` e por padrões de segredo no `dist` gerado;
- build da imagem do nginx do backend.

Não fazer: deploy, acesso ao painel, publicação de imagem em registro, geração de segredos reais, proxy por caminho.

## 12. Limites

- Não vi o painel: versão, plano, arquitetura, recursos, projetos e portas são pré-condições abertas.
- Só o manifesto arm64 do backend foi executado; a VPS provavelmente é amd64.
- O período por IP é HTTP. Serve para homologar a interface e os fluxos com dados de teste, não para operar.
- Sem e-mail real, gateway, cobrança automática, usuário não administrador, backup automatizado ou monitoramento.
- As estimativas de recursos são minhas, sem medição.

## 13. Fontes

- EasyPanel, documentação oficial, lida em 19/11/2026: [Compose Service](https://easypanel.io/docs/services/compose) (fonte Git, Build Path, avisos de `ports` e `container_name`, `.env`, `docker compose up --build -d`, domínios, persistência) e [App Service](https://easypanel.io/docs/services/app) (fonte GitHub pública, builder Dockerfile, ambiente no build, Ports em Advanced, backup de volumes na aba Storage).
- Docker Hub, `invoiceninja/invoiceninja-debian:5.13.49` — digests do índice, amd64 e arm64.
- `invoiceninja/dockerfiles@84cc592`, pasta `debian/` — `init.sh`, Compose e supervisor oficiais.
- `allber-to/invoiceninja@15ea35ea` — middleware de CORS e configuração.
- Repositório: `docs/architecture-local-backend.md`, `docs/reviews/fable-local-backend.md`, `docs/handoffs/astra-easypanel-inventory.md`, `docs/stories/003-easypanel-deploy.md`, `package.json`.

## 14. Adendo — domínios temporários do EasyPanel em HTTPS

Data: 19/11/2026. Base: `main` em `96b1a1c907f33048849473250571da74ae5c0082` (PR #1 mesclada, CI aprovado).

O pedido novo substitui a exigência de acesso por IP. Frontend e API continuam em **duas origens separadas**, agora dois nomes de host HTTPS servidos pelo proxy do painel, em vez de duas portas.

O aceite dos artefatos (`docs/reviews/fable-easypanel-artifacts.md`) continua válido para o frontend, sem mudança. O Compose do backend precisa dos ajustes da seção 14.3, que **ainda não foram implementados nem validados**.

### 14.1 O que conferi na fonte do backend 5.13.49

- **Proxies confiáveis:** `TrustProxies` só confia em proxy quando `TRUSTED_PROXIES` está definido (`config/ninja.php:52`, padrão `false`). Os cabeçalhos aceitos são `X-Forwarded-For`, `-Host`, `-Port` e `-Proto`.
- **`REQUIRE_HTTPS`:** é usado em um único ponto, `BaseController.php:1384`, a entrada da interface embutida: se a requisição não é vista como segura, redireciona para HTTPS.
- **nginx do backend:** não informa ao PHP que a conexão é segura. O PHP só sabe pelo cabeçalho `X-Forwarded-Proto`, e só o considera se o proxy for confiável.
- **Quem o PHP enxerga como cliente:** o nginx repassa o endereço de quem se conectou a ele, que passa a ser o proxy do painel.

Consequência: com TLS terminado no proxy, **`TRUSTED_PROXIES` é obrigatório**. Sem ele, o backend acha que tudo chega por HTTP: com `REQUIRE_HTTPS=true` a raiz entra em laço de redirecionamento, e os links gerados a partir da requisição saem com `http://`.

### 14.2 Condições a observar no painel antes do deploy

O chat que opera o painel traz estes valores junto com P1–P5. Nenhum é presumido.

| # | Condição | Se não se confirmar |
| --- | --- | --- |
| D1 | Dois nomes de host reais, um para o serviço `web` e um para o `nginx` do Compose `backend` | Sem os dois, voltar ao plano por IP e portas |
| D2 | Os dois servidos em HTTPS com certificado que o navegador aceita | Não publicar com `REQUIRE_HTTPS=true`; reportar |
| D3 | O painel permite adicionar domínio a um serviço Compose, escolhendo o serviço interno `nginx` e a porta 80 | A documentação descreve; se o plano instalado não permitir, reportar |
| D4 | Depois de adicionado o domínio, o proxy alcança o `nginx` | Se responder erro de gateway, parar e reportar. Não inventar nome de rede externa no Compose |

Não observado por mim e sem valor assumido: o formato do domínio temporário, se ele é gerado para serviço Compose ou só para App, como o painel conecta o proxy aos containers do Compose, e a faixa de endereços dessa rede. A documentação diz que serviços App novos recebem domínio automático "quando domínios automáticos estão configurados no servidor", e que o recurso de domínio personalizado automático exige licença paga; não sei qual é o caso desta instalação.

### 14.3 Ajustes no Compose do backend (Astra)

1. **Remover `ports` do serviço `nginx`** e a variável `API_PORT`. Nenhuma porta do projeto é publicada no host.
2. **`REQUIRE_HTTPS: "true"`**, fixo.
3. **`TRUSTED_PROXIES: ${TRUSTED_PROXIES:-*}`**. O valor `*` confia no par imediato do nginx.
4. **`APP_URL`** continua variável obrigatória; passa a ser `https://<host da API>`, sem barra final.
5. Manter a rede `backend` com `internal: true` e o serviço `app` só nela. **Não abrir saída para o `app`.**
6. Manter `nginx` em `backend` e `edge`. Não declarar rede externa do painel pelo nome.
7. Atualizar `env.example` e o handoff. Nenhuma mudança em `frontend.Dockerfile`, `frontend.conf` ou `verify-bundle.mjs`: uma origem `https://` já passa na validação.

Por que `*` em `TRUSTED_PROXIES` é aceitável aqui, e quando deixa de ser:
- Sem porta publicada, só chega ao `nginx` quem está numa rede Docker em comum com ele: o proxy do painel e os containers do próprio projeto.
- Não conheço a faixa de endereços do proxy, então não há valor mais restrito que eu possa escrever sem inventar.
- Se o inventário mostrar essa faixa, trocar `*` por ela pelo editor de ambiente, sem mudar o arquivo.
- Se algum dia uma porta voltar a ser publicada direto, `*` passa a permitir forjar esses cabeçalhos e precisa sair.

Sobre o isolamento: adicionar o domínio liga só o `nginx` ao proxy. O `app` continua sem rota de saída, então envio real de e-mail e chamadas a terceiros seguem impossíveis por construção.

### 14.4 Frontend

- `VITE_API_URL=https://<host da API>`, sem barra final. É obrigatório ser HTTPS: página HTTPS chamando API HTTP é bloqueada pelo navegador.
- Domínio do painel no serviço `web`, porta interna 80. Sem porta publicada.
- CORS não muda: o backend já aceita qualquer origem com token em cabeçalho.
- Os segredos continuam só no ambiente do serviço Compose `backend`. Nada no nível do projeto. O `web` recebe apenas `VITE_API_URL` e, se necessário, `GIT_SHA`.

### 14.5 Ordem

1. Fechar P1–P5 e D1–D4.
2. Deploy do `backend` com `APP_URL` em HTTPS; adicionar o domínio ao `nginx`.
3. Verificar H1–H4 abaixo. Só então seguir.
4. Deploy do `web` com `VITE_API_URL` apontando para o host da API.
5. Verificar o restante.

Trocar `APP_URL` depois é possível, mas todo link já emitido (portal, PDF enviado) deixa de valer. Isso pesa na passagem do domínio temporário para `allber.to`.

### 14.6 Critérios de aceite ajustados

Valem E1 e E3–E10 da seção 10, lendo "IP e porta" como "host HTTPS". E2 e os novos:

| # | Critério | Evidência |
| --- | --- | --- |
| E2 | Nenhuma porta do projeto publicada no host; MySQL, Redis e 9000 inalcançáveis de fora | inspeção dos containers e teste externo |
| H1 | Os dois hosts respondem em HTTPS com certificado válido | resposta e dados do certificado |
| H2 | `GET https://<host da API>/` não entra em laço: no máximo um redirecionamento | sequência de status |
| H3 | A mesma URL em `http://` redireciona para `https://` | status e cabeçalho de destino |
| H4 | Uma resposta da API traz `X-APP-VERSION: 5.13.49` | cabeçalho |
| H5 | Depois do login, o link de PDF e o de portal de uma fatura de teste começam com `https://<host da API>` | o prefixo do link, sem a chave do convite |
| H6 | Console do navegador sem bloqueio por conteúdo misto e sem erro de CORS | relatório de rede só com método, caminho e status |

H2 e H5 são os que provam que `TRUSTED_PROXIES` e os cabeçalhos do proxy funcionam. Falha em qualquer um deles, em E2 ou em E7 é bloqueio.

### 14.7 Dados reais

HTTPS remove o impedimento de tráfego em claro. Continuam valendo, antes de cadastrar dado financeiro ou pessoal real:
- backup com destino fora da VPS e **uma restauração testada** (seção 7);
- `APP_KEY` guardada pelo proprietário fora do painel;
- ciência de que o domínio é temporário e que a troca posterior invalida links já enviados.

Sem gateway e sem envio real de e-mail nesta fase, como antes.

### 14.8 Fontes deste adendo

- `allber-to/invoiceninja@15ea35ea`: `app/Http/Middleware/TrustProxies.php`, `config/ninja.php` (linhas 26 e 52), `app/Http/Controllers/BaseController.php` (linha 1384), `app/Http/Kernel.php`.
- `deploy/easypanel/nginx/laravel.conf` (cópia do arquivo oficial).
- EasyPanel, documentação oficial lida em 19/11/2026: [Compose Service](https://easypanel.io/docs/services/compose), [App Service](https://easypanel.io/docs/services/app), [Custom Service Domain](https://easypanel.io/docs/guides/custom-service-domain).

## 15. Adendo — frontend pré-compilado fora da VPS

Data: 19/11/2026. Motivo: o inventário real (`docs/handoffs/easypanel-live-inventory.md`) mostra 3,8 GB de memória **total** e 2 CPUs. A seção 5 pedia cerca de 4 GB livres só para o build do frontend. **O build com Node não roda na VPS.**

### 15.1 Decisão

**Compilar localmente, publicar o `dist` como arquivo de uma release pública do GitHub e, na VPS, construir uma imagem leve que só baixa, confere o hash e extrai.** É a proposta do coordenador, que adoto.

Por que não imagem pronta no GHCR:
- **Credencial:** o acesso disponível ao GitHub tem os escopos `repo` e `workflow`, sem `write:packages`. Publicar imagem exigiria credencial nova; publicar release usa a que já existe.
- **Arquitetura:** a arquitetura da VPS ainda não foi observada. Um `tar.gz` de arquivos estáticos serve em qualquer uma; uma imagem teria de ser construída para a plataforma certa.
- **Visibilidade:** um pacote novo no GHCR pode nascer privado e exigir ajuste manual. Não verifiquei esse comportamento; a release em repositório público dispensa a dúvida.

O que se perde: a VPS ainda faz um build, mas trivial (baixar e extrair sobre `nginx:alpine`), sem Node e sem memória relevante.

### 15.2 Como fica

**Fora da VPS (Astra prepara, coordenador publica):**

1. Com o host real da API conhecido (condição D1), construir o estágio `build` do `frontend.Dockerfile` já aceito, com `VITE_API_URL=https://<host da API>` e `GIT_SHA` igual ao commit publicado. O `verify-bundle.mjs` roda dentro desse build, como antes.
2. Extrair `/app/dist` e empacotar em `allberto-web-<sha curto>.tar.gz`, com os arquivos na raiz do pacote.
3. Calcular o SHA-256 do pacote.
4. Criar uma release no repositório `allber-to/web`, marcada como pré-lançamento, com tag própria (por exemplo `web-<sha curto>-1`) apontando para o commit publicado, e anexar o pacote. Na descrição: commit, origem de API embutida, SHA-256.
5. Gravar a URL do arquivo e o SHA-256 como valores padrão em `deploy/easypanel/Dockerfile` (abaixo) e fazer o commit.

**Novo artefato `deploy/easypanel/Dockerfile`:**

- base `nginx:alpine`;
- `ARG DIST_URL` e `ARG DIST_SHA256`, **com os valores padrão versionados no arquivo**;
- baixa o pacote, confere com `sha256sum -c` e **falha se o hash não bater**; extrai em `/usr/share/nginx/html`; apaga o pacote;
- copia `frontend.conf`, o mesmo já aceito;
- mesmo `HEALTHCHECK` do `frontend.Dockerfile`.

Os valores ficam no arquivo, e não só no painel, por dois motivos: a publicação fica reproduzível a partir do Git, e não dependo de como esta instalação do EasyPanel entrega variáveis ao build, que ainda não foi observado. O painel pode sobrescrever os dois argumentos, mas não precisa.

O arquivo se chama `Dockerfile` porque a documentação diz que o EasyPanel escolhe o builder Dockerfile sozinho quando o Build Path contém um arquivo com esse nome. O campo de caminho de Dockerfile ainda não foi visto nesta instalação.

**Serviço `web` no painel:**

- fonte GitHub `allber-to/web`, branch `main`, **Build Path `/deploy/easypanel`**;
- nenhuma variável obrigatória; nenhum segredo;
- domínio temporário apontando para a porta 80; Auto Deploy desligado.

O `frontend.Dockerfile` original permanece no repositório: é o que gera o `dist` e continua sendo o caminho para quem tiver memória para o build completo.

### 15.3 O que não muda

- A seção 14 inteira: HTTPS, duas origens, ajustes do Compose do backend.
- O critério E5: o verificador roda no build local, com a origem real. O pacote publicado é o resultado desse build.
- O pacote contém só o que o navegador já receberia. O host da API é público por natureza. Nenhum segredo entra, e o verificador reprova se entrar.

### 15.4 Ordem

1. Operador confirma no painel os hosts reais (D1–D4) com os serviços vazios.
2. Deploy do `backend`; verificar H1–H4.
3. Build local com o host real da API; release; commit do `Dockerfile` com URL e hash.
4. Deploy do `web`; verificar o restante.

Trocar o host da API (por exemplo, na passagem para `allber.to`) exige repetir o passo 3: novo pacote, nova release, novo commit.

### 15.5 Critérios de aceite adicionais

| # | Critério | Evidência |
| --- | --- | --- |
| W1 | O SHA-256 do arquivo baixado da release é o que está no `Dockerfile` | cálculo independente sobre o arquivo público |
| W2 | `verify-bundle.mjs` passa sobre o conteúdo extraído do pacote, com a origem real | saída do verificador |
| W3 | O build do `web` na VPS mostra o hash conferido e não instala Node | saída do deploy |
| W4 | `/version.json` publicado traz o commit que gerou o pacote | resposta |
| W5 | Com hash errado, o build falha | teste local do `Dockerfile` com hash trocado |

### 15.6 Rollback e limites

- **Rollback do frontend:** reverter o commit do `Dockerfile` para a URL e o hash anteriores e redeployar. As releases antigas não são apagadas.
- **Memória do backend:** a VPS tem cerca de 3,2 GB livres pela estimativa do inventário, e eu estimei 2 GB para os quatro containers. A margem existe, mas é estimativa sobre estimativa: observar o consumo depois do primeiro deploy, sobretudo ao gerar PDF.
- O build da VPS depende de alcançar `github.com` e o Docker Hub. Não foi testado.
- Não observado: arquitetura da VPS, forma de entrega de variáveis ao build, e se o plano com licença inativa permite serviço App com fonte GitHub e builder Dockerfile.
- Publicar a release é um ato público no repositório do projeto. Faz parte do deploy já autorizado; quem publica é o coordenador.

## 16. Adendo — saída de rede para o `app`

Data: 19/11/2026. Motivo: o PDF oficial traz a marca do Invoice Ninja por uma URL externa (`docs/reviews/fable-pdf-runtime.md`). Sem saída, toda fatura sai com imagem quebrada. A marca deve ser preservada e não haverá licença white-label.

### 16.1 Decisão

**Dar saída de rede ao serviço `app`, e só a ele.** O isolamento total foi decisão minha para a fase local e de homologação, não exigência do proprietário. Mantê-lo agora obrigaria a esconder a atribuição, comprar licença ou alterar o backend, e nenhuma dessas é aceitável.

Avaliei embutir a marca sem rede por meio suportado: não existe. A URL é fixa no código (`HtmlEngine.php:816`) e o elemento só some com a licença.

O que isto é e o que não é:
- **É saída normal para a internet**, como numa instalação padrão do Invoice Ninja.
- **Não é lista de destinos permitidos.** Não há filtro por host. Não afirmar isso em nenhum documento.
- MySQL e Redis continuam sem saída e sem porta. O `nginx` não muda. Nenhuma porta é publicada.

### 16.2 Diff mínimo no Compose (Astra)

```yaml
services:
  app:
    networks: [backend, egress]     # antes: [backend]
    environment:
      SENTRY_LARAVEL_DSN: ""        # novo, fixo
      DISABLE_AUTO_UPDATE: "true"   # novo, fixo
networks:
  egress: {}                        # nova; não interna; só o app
```

- A rede `egress` é própria: não é a `edge` do `nginx` nem a rede do proxy do painel.
- `backend` continua `internal: true`.
- `MAIL_MAILER: log` e a ausência de gateways permanecem.
- Atualizar `env.example`, o handoff e o script de verificação do Compose: `app` em `backend` e `egress`; `mysql` e `redis` só em `backend`; zero portas; as duas variáveis novas com o valor exato.

### 16.3 Por que as duas variáveis — efeitos externos que a saída destrava

Li na fonte 5.13.49 o script de entrada, as rotinas agendadas e o tratamento de erros. Com saída liberada:

| Efeito | Fonte | Tratamento |
| --- | --- | --- |
| **Envio de erros ao Sentry do upstream.** O DSN padrão aponta para `sentry2.invoicing.co`, e em instalação própria toda exceção reportável é enviada. O campo `report_errors` da conta só muda a identificação do usuário, não impede o envio | `config/ninja.php:55`, `Exceptions/Handler.php` | **`SENTRY_LARAVEL_DSN: ""`** desliga. Sem isso, mensagens de erro da aplicação, que podem conter dados, iriam para terceiros |
| **Autoatualização pelo painel.** Um administrador pode acionar o download de uma versão nova, que sobrescreve o código no container e roda migrações. O banco ficaria num esquema mais novo que a imagem fixada por digest | `SelfUpdateController.php:53` | **`DISABLE_AUTO_UPDATE: "true"`** faz a rota responder 403 |
| Consulta diária da versão mais recente (`pdf.invoicing.co/api/version`) e gravação em `latest_version` | `Jobs/Util/VersionCheck.php`, agendador | Aceito. É um GET sem dados da conta. Efeito visível: o frontend passa a mostrar o aviso de atualização disponível. O botão de atualizar responderá 403 |
| Atualização de câmbio | `Jobs/Util/UpdateExchangeRates.php` | Não ocorre: sai cedo sem a chave `OPENEXCHANGE_APP_ID`, que não é definida |
| E-mail | — | Não ocorre: transporte `log` |
| Gateways, bancos, webhooks, e-invoice | rotinas agendadas | Não ocorrem sem configuração. Se alguém cadastrar um webhook ou gateway pela interface, passa a funcionar de verdade |
| Script de entrada (migrações, seed, criação de conta) | `init.sh` | Não faz chamada externa |

Não fiz varredura de todas as chamadas HTTP do código. Conferi o agendador, o script de entrada e o tratamento de erros. A tabela é o que encontrei, não uma garantia de que não há outras.

### 16.4 Riscos reais

1. **Deixa de valer a garantia "nada sai da máquina".** O que impede e-mail real passa a ser só `MAIL_MAILER=log`. Se alguém trocar o transporte nas configurações da empresa pela interface, e-mails saem. É o comportamento normal do produto; registro para que ninguém conte com o isolamento antigo.
2. **O Chromium busca qualquer imagem referenciada no conteúdo da fatura.** Quem edita notas ou modelos pode fazer o servidor requisitar uma URL arbitrária, inclusive endereços da rede interna. Só usuários autenticados editam esse conteúdo. É característica do upstream, agora ativa.
3. **A saída é irrestrita.** Um filtro por destino exigiria firewall no host ou um proxy, que é justamente o que esta decisão evita. Se for requisito no futuro, é outro projeto.
4. **O logotipo do topo continua dependendo de configuração.** Com saída, o `app` tentará buscar a imagem em branco no próprio endereço público. Se o servidor alcançar a si mesmo por esse nome, o texto alternativo some; se não alcançar, continua. Não testei esse caminho. **Cadastrar um logotipo da empresa continua sendo a solução**, porque dispensa a rede.

### 16.5 Prova local

Rodei um container descartável da imagem oficial, pelo mesmo digest, na rede padrão do Docker e sem relação com o projeto local: uma requisição HTTPS a `https://invoicing.co/images/new_logo.png` respondeu `200`, `image/png`, 9.391 bytes. A imagem tem certificados e resolução de nomes suficientes para buscar a marca. O ambiente local da story 002 não foi tocado.

Isso prova o alcance a partir da imagem, não o PDF renderizado com a marca.

### 16.6 Validação após o deploy

| # | Critério | Evidência |
| --- | --- | --- |
| N1 | `app` nas redes `backend` e `egress`; `mysql` e `redis` só em `backend`; nenhuma porta publicada no projeto | inspeção dos containers |
| N2 | De dentro do `app`, uma requisição HTTPS externa funciona; de dentro do `mysql`, não | um teste em cada |
| N3 | PDF de uma fatura de teste mostra a marca do Invoice Ninja no rodapé, sem ícone quebrado | imagem renderizada do PDF |
| N4 | Com logotipo cadastrado, o topo mostra o logotipo | a mesma imagem |
| N5 | Configuração efetiva: DSN do Sentry vazio e autoatualização desligada | leitura dos dois valores dentro do `app`, sem imprimir o restante do ambiente |
| N6 | A rota de autoatualização responde 403 | status, sem enviar senha |
| N7 | Nenhum e-mail saiu: o envio de teste continua aparecendo só no log | trecho do log |
| N8 | H1–H6 e E7 continuam passando | repetição das verificações |
| N9 | Memória após gerar PDF dentro do observado antes, sem reinício | leitura dos containers |

Falha em N1, N5 ou N7 é bloqueio.

### 16.7 O que muda nas seções anteriores

- Seções 2, 3.1 e 14.3: onde se lê que o `app` não tem saída, passa a valer esta seção.
- Seção 6 e critério A7/E-equivalente: "sem envio real de e-mail" continua verdadeiro por configuração, não mais por rede.
- O ambiente local da story 002 **não muda**: lá o isolamento total segue valendo e a imagem quebrada no PDF local é esperada.

### 16.8 Ordem

Esta mudança entra no mesmo redeploy do backend previsto para o E9, depois do backup local. A publicação final do frontend continua aguardando a correção do campo numérico.
