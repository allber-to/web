# Arquitetura — backend local descartável (story 002)

Data: 19/11/2026. Decisão técnica: Fable 5.2 (CTO). Implementação: Astra. Frontend em `a56ec90f0`.

**Decisão: GO.** Usar a imagem oficial `invoiceninja/invoiceninja-debian` na versão 5.13.49, fixada por digest, com o Compose oficial reduzido ao necessário. Não construir imagem a partir do fork.

**Execução posterior concluída:** [handoff Astra](handoffs/astra-backend-local.md) e [aceite final CTO](reviews/fable-local-backend.md), A1–A10 aceitos, A7 com ressalva do transporte log. O texto abaixo preserva a decisão anterior à execução.

Nada foi instalado, baixado ou executado para produzir este documento. Tudo abaixo vem de leitura de fontes públicas e do checkout; o que só a execução pode confirmar está marcado como **a verificar**.

## 1. Origem e versão

| Item | Valor conferido |
| --- | --- |
| Fork do backend | `allber-to/invoiceninja`, branch `v5-stable`, HEAD `15ea35ea63f367eba33c04b7acd9ab1227853537` |
| Diferença para o upstream | **Nenhuma.** A comparação `invoiceninja:v5-stable...allber-to:v5-stable` devolve `identical`, 0 commits à frente e 0 atrás |
| Versão | `VERSION.txt` = `5.13.49`; `config/ninja.php` = `5.13.49` |
| Relação com a tag | A tag `v5.13.49` aponta para `8d25716e`; o HEAD do fork é o merge seguinte, com **0 arquivos alterados** |
| Imagem | `invoiceninja/invoiceninja-debian:5.13.49`, publicada em 21/10/2026 |
| Digest do índice | `sha256:05efd0913eb0d72d0246ec96d6cb6adf5ac3d3e59b9b91514b9f64b892f21c92` |
| Digest arm64 | `sha256:c0dadfee7ca70cd7407bffc353597f27c07cca815564e35ec0570c13ccd1437f` (≈ 1,04 GB comprimido) |
| Arquivos Docker de referência | `invoiceninja/dockerfiles`, branch `debian`, commit `84cc592bc09952eaac0393dc885e09db38b358c5`, pasta `debian/` |

### Por que imagem e não build do fork

O fork não tem customização: o código é byte a byte o da release 5.13.49. A imagem oficial dessa tag é construída do tarball dessa mesma release, com dependências e Chromium arm64 já incluídos. Construir do fork exigiria Composer e toolchain PHP, sem mudar uma linha do que roda. A imagem preserva o backend do projeto exatamente como ele está.

Se o fork vier a receber commits próprios, esta decisão deixa de valer e o caminho passa a ser build do fork com o `Dockerfile` oficial (argumento `URL` apontando para um tarball gerado do fork).

### Compatibilidade com o frontend

Conferido no código do SHA do fork:

- `POST /api/v1/login/precheck` existe (`routes/api.php:149`) e responde `{ methods, secret_required }`. O Astra confirmou que o frontend depende dessa rota.
- `POST /api/v1/charts/analytics_totals` e `charts/totals_v2` existem (`routes/api.php:192,196`), com os campos que o Painel lê: `mrr.mrr`, `aging.total`, `aging.current_amount`, `aging.outstanding_count`, recorrentes com `status_id = 2`, faturas com status 2 e 3.
- `activities/entity` e `emails/clientHistory/{client}` existem.
- O conjunto de rotas de `routes/api.php` é **idêntico** entre 5.13.49 e 5.13.54 (a mais recente).

**Risco assumido:** a base do frontend é o upstream web de 10/11/2026, cerca de três semanas mais nova que o backend 5.13.49 (18/10/2026). Entre 5.13.49 e 5.13.54 há 296 commits que alteram controllers e transformers, sem rota nova. Pode haver campo ou parâmetro que o frontend espera e este backend ainda não devolve. O critério A2 (seção 8) existe para detectar isso.

**Alternativa já avaliada, não escolhida:** `5.13.53` (digest do índice `sha256:217a0f2d45403b9562f90af51762cdd22bc6d9728c9a8751571ff6bfefc51f64`), mais próxima da base do frontend. Usá-la significaria validar contra um backend que não é o do fork do projeto. Só adotar se A2 falhar, e nesse caso a recomendação passa a incluir sincronizar o fork — decisão do coordenador e do proprietário.

## 2. Topologia

Quatro serviços, os mesmos do Compose oficial. Projeto Compose com nome fixo `allberto-ninja-local`, para que rede e volumes tenham prefixo próprio e nenhum comando atinja outros projetos.

| Serviço | Imagem | Porta publicada | Redes |
| --- | --- | --- | --- |
| `app` | `invoiceninja/invoiceninja-debian@sha256:05efd091…f21c92` | nenhuma | `backend` |
| `nginx` | `nginx:alpine` | `127.0.0.1:8012:80` | `backend`, `edge` |
| `mysql` | `mysql:8` | nenhuma | `backend` |
| `redis` | `redis:alpine` | nenhuma | `backend` |

- **`backend` é uma rede `internal: true`.** `app`, `mysql` e `redis` ficam sem saída para a internet. Isso garante por construção que nenhum e-mail, webhook, gateway ou telemetria saia da máquina, independentemente de configuração. `nginx` fica também na rede `edge` (bridge comum) só para publicar a porta.
- **Única porta publicada: `127.0.0.1:8012`.** Nunca `0.0.0.0`, nunca `8012:80` sem o endereço. MySQL e Redis não são publicados.
- **Volumes nomeados:** `app_public`, `app_storage`, `mysql_data`, `redis_data` (o Compose prefixa com o nome do projeto).
- `restart: "no"` em todos os serviços: é ambiente descartável, não deve voltar sozinho após reiniciar o Docker.
- Para `nginx`, `mysql` e `redis`, usar as tags do Compose oficial e **registrar na evidência os digests resolvidos** no primeiro pull (`docker image inspect`). Fixar digest só é obrigatório para `app`.
- Configuração do nginx: copiar `debian/nginx/invoiceninja.conf` e `debian/nginx/laravel.conf` do commit `84cc592` sem alteração, mantendo a origem anotada no topo de cada arquivo.

**A verificar na execução:** se a rede interna atrapalhar a geração de PDF (o Chromium tentando buscar um recurso remoto, como logotipo padrão ou fonte) ou a subida da aplicação. Se acontecer, parar e reportar com o log; a alternativa é liberar saída para `app` mantendo `MAIL_MAILER=log` e nenhum gateway configurado, e essa troca precisa do meu aceite.

## 3. Arquivos a criar

| Caminho | Versionado | Conteúdo |
| --- | --- | --- |
| `local-backend/compose.yml` | sim | Topologia da seção 2. Sem segredos; lê `local-backend/.env`. |
| `local-backend/nginx/*.conf` | sim | Cópia dos dois arquivos oficiais. |
| `local-backend/env.example` | sim | Todas as chaves, valores sensíveis vazios. |
| `local-backend/init-env.sh` | sim | Gera `local-backend/.env` se não existir. Nunca sobrescreve. |
| `local-backend/smoke.mjs` (ou `.sh`) | sim | Smoke da seção 7. |
| `local-backend/.env` | **não** | Segredos locais gerados. |
| `local-backend/evidence/` | não | Saídas do smoke, PDF gerado, trechos de log. |

Acrescentar ao `.gitignore`: `/local-backend/.env` e `/local-backend/evidence/`. Conferir com `git check-ignore -v local-backend/.env` antes de gerar o arquivo.

Não alterar `src/`, `tests/`, a fixture de prévia nem a porta 4178.

## 4. Configuração do backend

`init-env.sh` gera, com `openssl rand`, e grava com permissão `600`:

| Chave | Valor |
| --- | --- |
| `APP_KEY` | `base64:` + `openssl rand -base64 32`. Não usar a chave do `.env` oficial, que é pública. |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` (e os pares `MYSQL_*`) | aleatórios, 24+ caracteres alfanuméricos |
| `IN_USER_EMAIL` | `admin@allberto.test` |
| `IN_PASSWORD` | aleatória, 20+ caracteres. Não usar `changeme!`. |

Valores fixos:

```
APP_URL=http://localhost:8012
APP_ENV=production
APP_DEBUG=false
REQUIRE_HTTPS=false
TRUSTED_PROXIES=*
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
MAIL_FROM_ADDRESS=nao-responder@allberto.test
MAIL_FROM_NAME=Allberto Local
SCOUT_DRIVER=null
```

- Não definir `API_SECRET`: o precheck devolve `secret_required: false` e o login segue só com e-mail e senha.
- Deixar vazias as chaves de gateway, banco (Nordigen), Sentry, Pusher e login social.
- `SNAPPDF_CHROMIUM_PATH` não precisa ser definido: o `init.sh` da imagem exporta `/usr/bin/chromium` em arm64.

### Bootstrap idempotente

O próprio `init.sh` da imagem resolve: roda as migrações a cada subida e só cria a conta (`ninja:create-account`) quando a tabela `accounts` está vazia. Subir de novo com os volumes existentes não recria nem apaga nada. O comando cria usuário administrador, empresa e token.

`init-env.sh` não regenera segredos se o `.env` já existe. Isso importa: trocar `APP_KEY` ou a senha do banco com os volumes antigos quebra a instância.

## 5. Frontend real contra a API

O frontend roda do checkout, em modo dev, apontando para a API local. Não é a fixture de navegador e não é a interface React embutida na imagem.

```
VITE_API_URL=http://localhost:8012 VITE_IS_HOSTED=false \
  npm run dev -- --host 127.0.0.1 --port 3100 --strictPort
```

- Variáveis passadas pelo ambiente do processo; nenhum arquivo `.env` do frontend é criado ou alterado.
- Porta `3100` com `--strictPort`: se estiver ocupada, falhar e escolher outra livre, registrando qual. Não usar `4178`.
- **Autenticação:** token no cabeçalho `X-API-TOKEN`, guardado pelo frontend; não há cookie de sessão entre origens.
- **CORS:** o middleware `Cors` do backend responde `Access-Control-Allow-Origin: *` e aceita os cabeçalhos que o frontend envia (`X-API-TOKEN`, `X-React`, `X-Requested-With`, `X-API-PASSWORD`, `X-Socket-ID`, `Content-Type`). Não é preciso proxy nem alteração de CORS. **A verificar:** nenhum erro de CORS no console durante o smoke de navegador.
- **Atenção a uma armadilha:** `http://localhost:8012/` também serve a interface React original embutida na imagem. Toda evidência de interface deve vir de `http://127.0.0.1:3100`, e as capturas devem mostrar a shell allberto.

### URL de PDF

O backend monta links absolutos a partir de `APP_URL`. Por isso `APP_URL` precisa ser exatamente o endereço que o navegador alcança: `http://localhost:8012`. Não usar nome de serviço Docker nem `127.0.0.1` num lugar e `localhost` no outro.

## 6. Comandos

Todos com o nome do projeto explícito e a partir da raiz do checkout.

```
# preparar (uma vez)
sh local-backend/init-env.sh

# subir
docker compose -p allberto-ninja-local -f local-backend/compose.yml --env-file local-backend/.env up -d

# estado e logs
docker compose -p allberto-ninja-local -f local-backend/compose.yml ps
docker compose -p allberto-ninja-local -f local-backend/compose.yml logs --tail=200 app

# parar preservando dados
docker compose -p allberto-ninja-local -f local-backend/compose.yml stop

# remover containers e rede, preservando volumes
docker compose -p allberto-ninja-local -f local-backend/compose.yml down

# apagar tudo deste projeto (só com pedido explícito)
docker compose -p allberto-ninja-local -f local-backend/compose.yml down -v
```

Proibido nesta etapa: `docker system prune`, `docker volume prune`, `docker network prune`, qualquer `down`/`rm` sem `-p allberto-ninja-local`, e parar containers de outros projetos.

A primeira subida leva alguns minutos (migrações, seed, cache); o healthcheck da imagem tem 100 s de carência. Considerar pronto quando `app` estiver `healthy` e `GET http://localhost:8012/health` responder `{"status":"ok",...}` — **a verificar** se `/health` é exposto pelo nginx; se não for, usar `POST /api/v1/login/precheck`.

## 7. Smoke

Smoke próprio, pequeno, contra a instância criada aqui. **Não executar as specs Playwright upstream**: o Astra confirmou que `clients`, `invoices`, `payments`, `recurring-invoices` e `localization` chamam o reset de conta individualmente, e `PLAYWRIGHT_SKIP_GLOBAL_SETUP=1` não os desliga.

### Trava de segurança (obrigatória no início do script)

O script aborta se qualquer condição falhar:
1. a URL base é exatamente `http://localhost:8012`;
2. o e-mail de login termina em `@allberto.test`;
3. o container `app` do projeto `allberto-ninja-local` está em execução.

O script nunca chama endpoints de reset, purge de conta ou exclusão de empresa.

### Parte API (determinística)

Login com as credenciais do `.env` local; token só em memória, nunca em arquivo ou log. Todos os registros criados levam o prefixo `ALB-LOCAL-` e o script reaproveita os existentes em vez de duplicar.

1. **Empresa:** definir moeda BRL nas configurações da empresa.
2. **Clientes:** criar três, com contato `@example.test`; reler por id e conferir os campos.
3. **Faturas:** uma rascunho; uma enviada com vencimento futuro; uma enviada com vencimento passado (vencida). Valores conhecidos.
4. **Recorrente:** uma mensal ativa (iniciada), valor conhecido, próximo envio dentro de 7 dias.
5. **Pagamento manual:** aplicar pagamento parcial à fatura enviada; conferir `paid_to_date` e `balance` da fatura e o status parcial.
6. **Painel:** chamar `charts/analytics_totals` e `charts/totals_v2` do mês e comparar com os valores esperados, calculados a partir do que foi criado: MRR = valor da recorrente; a receber = soma dos saldos; em atraso = saldo da vencida; recebido = pagamento manual.
7. **PDF:** baixar o PDF da fatura enviada pelo mesmo caminho que o frontend usa; conferir `Content-Type: application/pdf`, início `%PDF` e tamanho acima de 10 KB; guardar em `evidence/`.
8. **E-mail local:** disparar o envio da fatura para o contato `@example.test`; conferir que a mensagem aparece em `storage/logs/laravel.log` dentro do container e que o registro de e-mail da fatura mostra o envio. Com a rede interna e `MAIL_MAILER=log`, não há transporte externo.
9. **Persistência:** `stop` e `up -d` do projeto; reler clientes, faturas, recorrente e pagamento por id e conferir que nada mudou. Um segundo `init` não cria conta nova.

### Parte navegador (frontend real em `:3100`)

Poucos passos, manuais ou em um teste Playwright próprio (arquivo novo em `tests/local/`, sem importar helpers de reset upstream):

1. login pela tela real (precheck + login), chegando ao Painel allberto;
2. Painel mostra os quatro KPIs em BRL com os valores do passo 6, sem alerta de erro;
3. lista de clientes mostra os três `ALB-LOCAL-`; abrir um e ver os saldos;
4. lista de faturas; abrir a vencida na visão geral: total, pago e saldo iguais aos da API; trocar para Editar e voltar;
5. lista de recorrentes mostra a ativa; lista de pagamentos mostra o pagamento manual;
6. recarregar a página autenticado e continuar na mesma tela;
7. console sem erro de CORS e sem resposta 4xx/5xx inesperada.

## 8. Critérios de aceite

| # | Critério | Evidência |
| --- | --- | --- |
| A1 | Imagem `app` em execução tem o digest arm64 `sha256:c0dadfee…d1437f` e a API responde com `X-APP-VERSION: 5.13.49` | saída de `docker image inspect` e cabeçalho de uma resposta |
| A2 | Contrato: login, Painel, quatro listas, detalhe de cliente e visão geral de fatura carregam no frontend real sem campo ausente que quebre a tela e sem 404/405 de API | captura do console/rede; lista de qualquer chamada com falha |
| A3 | Só `127.0.0.1:8012` publicado; MySQL e Redis sem porta; `app` sem saída para a internet | `docker compose ps`, `docker port`, e uma tentativa de saída de dentro de `app` que falha |
| A4 | Nenhum segredo versionado: `git status` limpo de `.env`; `git check-ignore` confirma; nenhuma senha, token ou `APP_KEY` em documento, log anexado ou captura | saída dos dois comandos |
| A5 | Passos 1 a 6 do smoke de API passam com valores exatos | saída do script |
| A6 | PDF válido gerado pelo Chromium da imagem | arquivo em `evidence/` |
| A7 | E-mail registrado só em log local | trecho do log, com destinatário `@example.test` |
| A8 | Persistência após `stop`/`up -d`; segunda subida não recria conta | saída do passo 9 |
| A9 | Passos de navegador 1 a 7 no frontend em `:3100`, com a shell allberto visível | capturas ou relatório do teste |
| A10 | Outros projetos Docker intactos: mesmos containers, volumes e redes alheios antes e depois | `docker ps -a`, `docker volume ls`, `docker network ls` antes e depois |

Qualquer falha em A1, A3, A4 ou A10 é bloqueio. Falha em A2 aciona a alternativa da seção 1 e volta para decisão. A6 e A7 podem ser aceitos com ressalva documentada se a causa for limitação conhecida da imagem.

## 9. Limites

- Ambiente local e descartável. Não prova nada sobre produção, VPS, DNS, HTTPS, backup, desempenho ou concorrência.
- Sem gateway de pagamento: só pagamento manual. Cobrança automática, cartão, recusa, estorno por gateway e webhooks ficam fora.
- Sem envio real de e-mail; o conteúdo é conferido no log, não numa caixa de entrada.
- Um usuário administrador. Perfis com permissão restrita só entram se sobrar tempo, criando um segundo usuário local; não é critério de aceite.
- Sem WHMCS, sem dados reais, sem importação.
- Digests de `nginx`, `mysql` e `redis` são registrados na execução, não fixados de antemão.
- Não li `debian/nginx/laravel.conf` nem testei a rede interna com PDF; ambos estão marcados como "a verificar".
- A compatibilidade frontend × backend foi conferida por rotas e pelos contratos do Painel e do login, não campo a campo em todas as telas. O critério A2 cobre o restante na prática.

## 10. Fontes

- `allber-to/invoiceninja@15ea35ea` — `routes/api.php`, `VERSION.txt`, `config/ninja.php`, `app/Http/Middleware/Cors.php`, `app/Http/Controllers/Auth/LoginController.php`, `app/Services/Chart/{ChartService,AnalyticsQueries}.php`, `app/Console/Commands/CreateAccount.php`.
- API do GitHub: comparação fork × upstream, tag `v5.13.49`, releases, diferença de rotas 5.13.49 × 5.13.54.
- `invoiceninja/dockerfiles@84cc592`, pasta `debian/` — `Dockerfile`, `docker-compose.yml`, `.env`, `scripts/init.sh`, `supervisor/programs.conf`, `nginx/invoiceninja.conf`.
- Docker Hub, repositório `invoiceninja/invoiceninja-debian` — tags, arquiteturas e digests (consulta de metadados, sem pull).
- Checkout local — `package.json`, `vite.config.js`, `.env.example`, `src/common/helpers.ts`, `src/pages/authentication/common/hooks.ts`, `docs/stories/002-local-backend.md`, e o inventário do Astra sobre precheck e resets por spec.
