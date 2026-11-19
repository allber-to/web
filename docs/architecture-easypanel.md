# Arquitetura — publicação no EasyPanel (story 003)

Data: 19/11/2026. Decisão técnica: Fable 5.2 (CTO). Implementação: Astra. Operação do painel: coordenador. Base: `77808e1ec`.

**Decisão: GO para os artefatos.** A execução no painel depende das pré-condições da seção 2, que só o inventário do coordenador pode fechar.

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
