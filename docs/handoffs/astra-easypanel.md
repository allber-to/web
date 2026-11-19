# Astra — artefatos EasyPanel

19/11/2026. Implementação conforme `docs/architecture-easypanel.md`: **duas origens HTTPS pelo proxy EasyPanel, sem proxy por caminhos nem portas publicadas**, conforme adendo §14. Nenhum acesso ao painel, VPS, Chrome ou WHMCS. Nenhum deploy remoto, registro público, commit ou push. `src/`, `tests/` e `local-backend/` preservados.

## Arquivos e configuração

- `.dockerignore` retira Git, dependências/build locais, `.env*`, backend local, evidências, artefatos e arquivos de chaves do contexto.
- `deploy/easypanel/frontend.Dockerfile`: Node 22 bookworm slim, `HUSKY=0`, `npm ci`, `npx vite build`, nginx final. `VITE_API_URL` obrigatório validado como origem HTTP(S) sem path/barra final/credenciais; `GIT_SHA` obrigatório com 40 caracteres hexadecimais. Flags fixas self-host, não teste, browser router e integrações opcionais desabilitadas. Após Vite, remove somente `dist/docuninja/builder2.0.js` quando VITE_ENABLE_DOCUNINJA não é true; o arquivo fonte permanece intacto. Executa self-checks e varredura E5 antes de produzir a imagem final. Só `dist/` chega ao runtime. `/version.json` publica apenas revisão e instante de build; label OCI registra revisão.
- `frontend.conf`: SPA fallback, `/healthz`, index/version sem cache, assets `/react/` imutáveis e 404 para inexistentes. Sem proxy_pass. Gzip habilitado para JS, CSS, JSON e SVG.
- `compose.yml`: app 5.13.49 fixado por digest de índice; nginx/backend construído localmente; MySQL/Redis isolados; quatro volumes nomeados; `unless-stopped`; nenhuma porta publicada no host; domínio da API deve apontar ao serviço interno nginx, porta 80. Ambiente do app explicitamente mapeado. Segredos/origem faltantes causam erro de configuração, sem defaults de credencial.
- `nginx/`: configurações oficiais validadas na fase anterior, origem anotada. Dockerfile remove `default.conf` da imagem antes de copiar os dois arquivos; isso reproduz o diretório montado na fase local e evita manter um virtual host extra do nginx base.
- `env.example`: somente chaves dinâmicas vazias; valores fixos da seção 4 documentados como comentários e implementados no Compose. Não gerar `.env` real neste checkout para a VPS.

Complemento autorizado pelo coordenador: `NINJA_ENVIRONMENT: selfhost` fixo explicita o default da versão, garantindo que a proteção de cadastro não dependa de configuração implícita da imagem.

## Verificação local

Logs e HTML extraído ficam em `/tmp/allberto-easypanel-validation/`, fora do Git. Contexto **desktop-linux** em todas as operações Docker. Nenhum container do projeto local aprovado foi parado. Container temporário de frontend usou somente `127.0.0.1:18090`, nome `allberto-easypanel-web-check`; nenhuma ligação com o banco local. Após os checks, sua label de propriedade e ausência de mounts foram conferidas e somente esse container foi removido. Imagens de teste permanecem locais, sem publicação.

Build de prova usa origem reservada para documentação `http://192.0.2.10:18012` e SHA do checkout. **Essa origem não é o valor de produção**, nem confirma as portas da VPS.

| Check | Resultado | Evidência |
| --- | --- | --- |
| Novo Compose com valores fictícios, sem imprimir expansão | PASS, exit 0 | `compose.log` |
| Build frontend Node 22/Vite/nginx | PASS, exit 0, arm64 local | `frontend-build.log`, `images.txt` |
| Build nginx backend + `nginx -t` | PASS, exit 0; nome app resolvido apenas para teste de sintaxe | `backend-build.log`, `backend-nginx-test.log` |
| nginx frontend `-t` | PASS, exit 0 | `frontend-nginx-test.log` |
| `/`, `/invoices`, `/clients/example/edit` | PASS, 200 HTML, cache no-store | `http-checks.json` |
| `/healthz` e `/version.json` | PASS, 200; SHA igual ao checkout | `http-checks.json` |
| Asset real e inexistente | PASS, immutable no real; 404 no ausente | `http-checks.json` |
| Origem de teste no bundle | PASS, presente no chunk de configuração | `http-checks.json` |
| E5 revisado pelo CTO | PASS: zero loopback numérico/localhost com porta; 9 referências minúsculas inertes + 2 tokens LOCALHOST do parser | `bundle-check-final.log` |
| Gzip JS/CSS/JSON/SVG | PASS: Content-Encoding gzip e payload descomprimido idêntico ao arquivo | `http-checks-final.json` |
| Build sem VITE_API_URL | PASS: build recusado com exit não zero antes de Vite | `missing-api-build.log` |

Não foi repetida a suíte de frontend: nenhum código de aplicação mudou; build de imagem e asserts HTTP cobrem os artefatos novos. Nenhum teste local de login apontou à VPS.

## E5 — correções CTO e verificação reproduzível

Conforme `docs/reviews/fable-easypanel-artifacts.md`, o build remove o arquivo público DocuNinja apenas do dist quando o recurso está desabilitado. Nenhuma modificação em public, src, bibliotecas ou funcionalidades ativas.

`deploy/easypanel/verify-bundle.mjs` usa somente Node padrão. Falha se qualquer arquivo servido contiver 127.0.0.1 ou localhost seguido de porta, assinaturas de chave privada/token GitHub/chave AWS, ou se a origem de API esperada estiver ausente. Falhas não imprimem o material suspeito. Lista todos os localhost restantes com caminho e contexto para revisão humana a cada build; essa classificação não é ocultada nem tratada como uma allowlist automática. O self-check cobre textos permitidos e proibições de endereço/segredo.

Comandos exatos fora do Docker:

```sh
node deploy/easypanel/verify-bundle.mjs --self-test
VITE_API_URL=http://192.0.2.10:18012 node deploy/easypanel/verify-bundle.mjs /tmp/allberto-easypanel-validation/html-final
```

Resultado final: zero endereços locais proibidos e zero assinaturas de segredo. Das 12 ocorrências minúsculas originais, 3 estavam no arquivo removido; restaram 9. A nova varredura é case-insensitive e também lista 2 tokens `LOCALHOST` do parser Markdown, totalizando 11 contextos, todos nas categorias aceitas pelo CTO:

- 2 comentários TinyMCE;
- 6 tokens/analisadores de URL (4 referências minúsculas e 2 tokens maiúsculos);
- 3 fallbacks sem window: paginação e duas cópias Axios.

A origem esperada de teste está no chunk de configuração. Na publicação deve ser substituída pela origem IP/porta confirmada pelo coordenador; o checker roda automaticamente em cada build com aquele argumento. A varredura de assinaturas é limitada aos padrões declarados e complementa, não substitui, a revisão de segredos/contexto de build.

Mantido GIT_SHA estrito de 40 caracteres por decisão do coordenador. Se o EasyPanel não injetar SHA completo, o coordenador deve fornecer o SHA completo da revisão publicada explicitamente como argumento; não publicar `unknown`. Digests auxiliares serão fixados pelo coordenador após resolver as imagens na VPS; nenhuma consulta extra foi feita nesta etapa.

## E7 — proteção de signup conferida na fonte

Fonte executada localmente: imagem 5.13.49, equivalente ao fork `15ea35ea63f367eba33c04b7acd9ab1227853537`.

1. `routes/api.php:142` mapeia POST `api/v1/signup` a `AccountController::store`.
2. O controller recebe `CreateAccountRequest`.
3. `app/Http/Requests/Account/CreateAccountRequest.php:188–190`: `authorize()` retorna `Ninja::isHosted()`.
4. `app/Utils/Ninja.php:30–32`: hosted somente se config `ninja.environment` for `hosted`.
5. `config/ninja.php:56`: variável real `NINJA_ENVIRONMENT`, default `selfhost`. Compose fixa `selfhost`, autorizado pelo coordenador.

Portanto o modo publicado recusa autorização de signup independentemente da existência de outra conta. Nenhuma nova flag inventada nem patch backend. **Não executei signup**, local ou remoto.

Verificação E7 na VPS cabe exclusivamente ao coordenador após P1–P6: POST vazio, sem Authorization/X-Api-Token/senha/dados pessoais; esperar 403. Motivo de não enviar credenciais nem payload de cadastro: `CreateAccountRequest::prepareForValidation`, linha 245, registra input e headers no log antes da autorização. Status remoto continua pendente até a execução.

## Ordem de operação no painel — coordenador

1. Fechar inventário P1–P5 e condições D1–D4 do adendo HTTPS: dois hosts reais, certificados válidos, domínio do Compose associado ao nginx:80 e conectividade do proxy. Email administrador já foi fornecido ao coordenador. Não criar bindings de host nem inventar rede externa do painel.
2. Publicar/referenciar commit revisado e tag identificada. Usar o projeto allberto, sem tocar projetos alheios.
3. Serviço backend Compose: Git público, ref aprovada, Build Path `/deploy/easypanel`, arquivo `compose.yml`. Ambiente novo no editor e Create .env file ligado. `APP_URL=https://<host da API>`, sem barra final. Guardar APP_KEY fora do painel com o proprietário. Não reutilizar credenciais locais.
4. `REQUIRE_HTTPS=true` fixo; `TRUSTED_PROXIES` tem default `*`, substituível por faixa verificada do proxy. Essa confiança depende de nenhuma porta direta publicada. Conforme §16, app participa de backend internal + egress própria com saída irrestrita; somente app usa egress. MySQL/Redis ficam apenas em backend internal e nginx permanece em backend + edge. Não adicionar rede externa presumida do painel. SENTRY_LARAVEL_DSN vazio e DISABLE_AUTO_UPDATE=true são fixos; o transporte MAIL_MAILER=log, não o isolamento de rede, impede envio de email.
5. Deploy backend e domínio HTTPS no nginx:80; conferir versão, volumes e H1–H4 (certificado, ausência de loop, HTTP→HTTPS e versão API). Testar E7 com POST vazio sem credenciais e GET /setup; interromper se cadastro não for recusado ou setup estiver aberto.
6. Frontend pré-compilado conforme §15 abaixo: fonte Git, branch main, Build Path `/deploy/easypanel`, Dockerfile leve com URL e checksum da release versionados. Não executar build Node na VPS. Domínio HTTPS do web aponta para porta interna 80, sem publicação de host port; não há variáveis obrigatórias nem segredos no serviço web.
7. Executar login/refresh, PDF/portal HTTPS, ausência de mixed content/CORS, E8/E9, dump e inventário alheio depois. Não executar smoke local nem specs upstream contra VPS.
8. Registrar SHA/digests/hosts/data e preservar rollback. Nunca trocar APP_KEY/senhas DB com volumes existentes nem apagar serviços/volumes como rollback.

A migração futura do host temporário para allber.to altera APP_URL e origem frontend; links já emitidos podem deixar de valer. Antes de dados reais ainda são necessários backup externo com restauração testada e guarda da APP_KEY. Nenhuma dessas verificações remotas foi executada pelo Astra.

## Limites

Artefatos testados em arm64 local. O inventário posterior do operador confirmou VPS amd64 e os recursos descritos em `easypanel-live-inventory.md`; execução do backend nessa arquitetura continua pendente. O proprietário definiu o e-mail do administrador fora dos documentos públicos. Sem envio externo, gateway, backup automatizado ou restauração testada. E5 revisado passou localmente; a versão publicada, sua origem efetiva e os fluxos HTTPS ainda precisam da conferência remota.

Fonte congelada para revisão Fable. `git diff --check` passou. Logs em /tmp foram preservados; nenhum segredo real foi gerado ou copiado para os artefatos.

## Resultado após correções CTO

Build final exit 0; script E5/self-checks exit 0; nginx -t exit 0; rotas/cache/404/version e gzip dos quatro tipos passaram. Evidências finais: `frontend-build-final.log`, `bundle-check-final.log`, `frontend-nginx-test-final.log`, `http-checks-final.json` em `/tmp/allberto-easypanel-validation/`. Fonte congelada novamente para revisão. Nenhuma mudança em src/tests/local-backend, nenhum acesso remoto ou publicação de imagem.

**Fechamento do coordenador:** Fable aceitou o delta final sem achados pendentes nos artefatos. Segredos deverão ficar somente no ambiente do serviço backend, nunca no nível do projeto, pois o EasyPanel fornece as variáveis de projeto também aos builds do web. O aceite não inclui execução na VPS; veja [parecer final](../reviews/fable-easypanel-artifacts.md).

## Ajuste HTTPS — adendo §14

Removidos `nginx.ports` e API_PORT; REQUIRE_HTTPS fixado em true; TRUSTED_PROXIES interpolado com default `*`; env.example orienta APP_URL HTTPS. Redes e volumes preservados. Somente compose.yml, env.example e este handoff alterados nesta tarefa. A validação original deste adendo confirmou zero ports, app somente na rede internal, nginx em backend/edge, nenhuma rede externa e os valores HTTPS/proxy. O isolamento do app foi posteriormente substituído pela rede egress aprovada no §16; a validação atual está registrada ao final deste handoff. Também foi verificada a substituição do wildcard por faixa fornecida no ambiente. Não foram gerados segredos, iniciados containers ou feitos builds. Certificados/roteamento/loops e links HTTPS continuam pendentes no painel.

Check HTTPS: `python3 /tmp/allberto-easypanel-validation/check-https.py`, exit 0; evidência sanitizada `/tmp/allberto-easypanel-validation/https-compose-check.log`. `git diff --check` também passou. O script apenas lê `docker compose config --format json` em memória com placeholders, sem imprimir ambiente expandido.

## Frontend pré-compilado — adendo §15

Implementado `deploy/easypanel/Dockerfile`, separado do gerador `frontend.Dockerfile`. O novo arquivo usa somente nginx:alpine, baixa DIST_URL, confere DIST_SHA256 com sha256sum -c, extrai os arquivos na raiz web e remove o tar.gz. Reutiliza frontend.conf e healthcheck já aprovados. Não instala Node na VPS.

**Defaults definitivos versionados:** DIST_URL aponta para o asset público da release `web-52db1b5423ea-1` e DIST_SHA256 contém o checksum abaixo. O serviço web não precisa fornecer esses argumentos. O coordenador publicou a release como pré-lançamento; nenhum deploy na VPS é afirmado por este handoff.

- Release: https://github.com/allber-to/web/releases/tag/web-52db1b5423ea-1
- Asset: https://github.com/allber-to/web/releases/download/web-52db1b5423ea-1/allberto-web-52db1b5423ea.tar.gz
- Fonte do pacote: `52db1b5423eafac06d43c38b710f23b6a5fdc6c4`, obtida por git archive em contexto temporário isolado.
- SHA-256: `5f9d3b717d30706d82c8d4ba66e7cf8ebcb49fa0ef695c1630dce4b94e351f02`.
- Tamanho: 15.276.656 bytes.
- API embutida: `https://allberto-backend.cxfujw.easypanel.host`.
- Host web previsto: `https://allberto-web.cxfujw.easypanel.host`.
- version.json: revision igual ao SHA de fonte; builtAt `2026-11-19T15:57:42.232Z`.

W1 passou por download HTTPS anônimo conferido pelo coordenador, tamanho e checksum exatos; evidência `/tmp/allberto-easypanel-release/public-download-check.json`. W2 passou sobre o pacote extraído, com a origem real; E5 não encontrou endereço local proibido nem assinatura de segredo. Os 11 contextos inertes continuam nas categorias aprovadas pelo CTO. Logs `/tmp/allberto-easypanel-release/{build.log,bundle-package-check.log,release-summary.json}`.

### Empacotamento local depois de receber host e SHA reais

O operador deve preencher API_ORIGIN e SOURCE_SHA com os valores confirmados, e executar sobre o checkout da revisão que gerará o pacote. Estes comandos apenas constroem/extraem localmente; não publicam release:

```sh
set -eu
API_ORIGIN='https://HOST-REAL-DA-API'
SOURCE_SHA='SHA-COMPLETO-DA-REVISAO-PUBLICADA'
test "$(git rev-parse HEAD)" = "$SOURCE_SHA"
PACKAGE_DIR=$(mktemp -d /tmp/allberto-web-package.XXXXXX)
docker --context desktop-linux build --target build \
  -f deploy/easypanel/frontend.Dockerfile \
  --build-arg VITE_API_URL="$API_ORIGIN" --build-arg GIT_SHA="$SOURCE_SHA" \
  -t "allberto-web-dist:$SOURCE_SHA" .
DIST_CONTAINER=$(docker --context desktop-linux create "allberto-web-dist:$SOURCE_SHA")
docker --context desktop-linux cp "$DIST_CONTAINER:/app/dist" "$PACKAGE_DIR/dist"
docker --context desktop-linux rm "$DIST_CONTAINER"
VITE_API_URL="$API_ORIGIN" node deploy/easypanel/verify-bundle.mjs "$PACKAGE_DIR/dist"
COPYFILE_DISABLE=1 tar -czf "$PACKAGE_DIR/allberto-web-${SOURCE_SHA}.tar.gz" -C "$PACKAGE_DIR/dist" .
shasum -a 256 "$PACKAGE_DIR/allberto-web-${SOURCE_SHA}.tar.gz"
```

O coordenador publica esse tar.gz como asset de release pública marcada pré-lançamento, com tag própria apontando ao SOURCE_SHA. Descrição: SHA, origem pública da API e checksum. Em seguida insere os dois defaults reais no novo Dockerfile e publica o commit. Confirmar W1 baixando o arquivo público e recalculando o hash; confirmar W2 extraindo o pacote e repetindo verify-bundle com a origem real. Nada de dados locais ou .env no pacote.

Serviço web definitivo: Git allber-to/web, branch main, Build Path `/deploy/easypanel`, Dockerfile padrão. Sem variáveis obrigatórias quando os defaults reais estiverem versionados, sem segredos, domínio HTTPS para porta interna 80 e Auto Deploy desligado. O SHA dentro do pacote é o commit que gerou dist; o commit posterior que fixa URL/hash pode ser diferente. Rollback reverte URL/hash para release anterior preservada.

### W5 e controle positivo local

Foi usado o próprio novo Dockerfile, com fixture tar.gz contendo apenas index.html e servidor HTTP temporário em loopback 18091, alcançado do builder por host.docker.internal. Não foi utilizado pacote real ou release pública.

- Hash incorreto: build falhou na linha sha256sum, com FAILED; assert confirmou exit não zero e que a falha foi checksum, não download. **W5 PASS**.
- Hash correto da mesma fixture: build exit 0; nginx -t exit 0. Controle positivo confirma que o arquivo é baixado e extraído normalmente quando íntegro.
- Evidências isoladas em `/tmp/allberto-easypanel-w5/{wrong-hash.log,correct-hash.log,nginx-test.log}`; evidências anteriores preservadas.
- Container de nginx de verificação foi criado com --rm; servidor HTTP de fixture foi encerrado. Nenhum serviço existente foi parado.

W1 e W2 definitivos passaram com a release real, conforme atualização acima. W3 e W4 publicados continuam pendentes do deploy; W5 prova somente a recusa local de hash incorreto. Nenhuma imagem foi publicada em registro e o Astra não acessou a VPS.

### Validação da release pública com defaults reais

Novo Dockerfile construído **sem build args**, somente defaults versionados: exit 0, wget HTTPS concluiu, sha256sum exibiu `/tmp/allberto-web.tar.gz: OK`, pacote extraído e arquivo temporário removido. Imagem local não contém Node. `nginx -t` exit 0 e GET local `/version.json` retornou a revisão `52db1b5423eafac06d43c38b710f23b6a5fdc6c4` com cache no-store. Não foi repetido build Node nem o teste W5 de fixture.

Evidências: `/tmp/allberto-easypanel-release/lightweight-build.log`, `lightweight-nginx-test.log` e `lightweight-check.json`. Container próprio temporário `allberto-release-defaults-check` usou loopback 18092 e foi removido; runtime local anterior preservado. Fonte congelada, `git diff --check` passou. W3/W4 na VPS e deploy web continuam condicionados à validação H1–H4 do backend pelo operador.

## Pins observados na VPS e procedimento E9

Conforme etapa 3 do inventário do operador (somente leitura deste relatório pelo Astra), MySQL e Redis estavam saudáveis em linux/amd64. Fixados exatamente os RepoDigests observados:

- `mysql:8@sha256:a81d043930e51745522bd5c430961cf8286f0a23f0a9a2a6e0108f7ea71b0902`
- `redis:alpine@sha256:7958cfbb9d152f87dadfbc89f1b0b15938f0b81ff8982feb327476f4911935c3`

O próximo redeploy aplica referências imutáveis às mesmas imagens já executadas. nginx não foi fixado: o digest reportado é da imagem construída, insuficiente para inferir o digest da base. Nenhuma consulta a registro nem build adicional. Compose com placeholders passou (exit 0), incluindo assertions HTTPS, isolamento e ausência de portas; log `/tmp/allberto-easypanel-validation/pinned-compose-check.log`.

### Backup manual anterior ao redeploy — somente operador, Console Docker

Os comandos abaixo **não foram executados pelo Astra**. Usam os nomes exatos observados `allberto_backend-mysql-1` e `allberto_backend-app-1`. Executar em janela sem edições de dados; se qualquer comando falhar, parar e não declarar backup concluído. Não habilitar `set -x`, não imprimir env, SQL ou conteúdo de tar. O dump usa a senha root já presente dentro do MySQL, sem colocar seu valor na linha de comando do host.

```sh
set -eu
umask 077
BACKUP_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR="/var/www/html/storage/app/backups/$BACKUP_STAMP"
BACKUP_STAGE=$(mktemp -d /tmp/allberto-backup-transfer.XXXXXX)

docker exec allberto_backend-app-1 sh -c '
  set -eu
  umask 077
  mkdir -p /var/www/html/storage/app/backups
  chmod 700 /var/www/html/storage/app/backups
  mkdir "$1"
' sh "$BACKUP_DIR"

docker exec allberto_backend-mysql-1 sh -c '
  set -eu
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump \
    --user=root --single-transaction --no-tablespaces --set-gtid-purged=OFF ninja
' > "$BACKUP_STAGE/ninja.sql"
test -s "$BACKUP_STAGE/ninja.sql"
chmod 600 "$BACKUP_STAGE/ninja.sql"
docker cp "$BACKUP_STAGE/ninja.sql" "allberto_backend-app-1:$BACKUP_DIR/ninja.sql"

docker exec allberto_backend-app-1 sh -c '
  set -eu
  umask 077
  backup_dir=$1
  chmod 600 "$backup_dir/ninja.sql"
  tar --exclude=./app/backups -czf "$backup_dir/storage.tar.gz" \
    -C /var/www/html/storage .
  test -s "$backup_dir/ninja.sql"
  test -s "$backup_dir/storage.tar.gz"
  tar -tzf "$backup_dir/storage.tar.gz" >/dev/null
  cd "$backup_dir"
  sha256sum ninja.sql storage.tar.gz > SHA256SUMS
  chmod 600 ninja.sql storage.tar.gz SHA256SUMS
  sha256sum -c SHA256SUMS
  wc -c ninja.sql storage.tar.gz
  sha256sum ninja.sql storage.tar.gz
' sh "$BACKUP_DIR"

rm -rf "$BACKUP_STAGE"
printf 'Backup local verificado em %s\n' "$BACKUP_DIR"
```

A pasta com data fica no volume persistente **app_storage**, em `storage/app/backups`, fora de `storage/app/public`. Proteção inicial: diretórios 0700 e arquivos 0600. Essa proteção não permanece igual após redeploy: o init.sh da imagem aplica chown www-data e chmod 755/644 ao storage; as cópias passam a ser legíveis pelo PHP. Continuam fora de storage/app/public, sem publicação web por esse caminho, mas isso não equivale a isolamento do processo da aplicação. O staging temporário serve apenas à transferência entre containers e é removido somente após sucesso das verificações na cópia persistente. O tar exclui todo `./app/backups`, portanto não inclui a si mesmo, o dump nem backups anteriores. `set -e` preserva os erros do dump e do tar; não existe pipeline que possa esconder falha do produtor. Se o tar informar arquivo alterado durante leitura, repetir em janela estável em nova pasta datada, sem ignorar exit status.

Registrar apenas caminho, exit 0, tamanhos e checksums. Antes de redeploy, conservar os IDs e valores dos registros de teste observados na UI/API; depois do redeploy web/backend, reler os mesmos IDs e confirmar saldo, health e ausência de recriação de conta. Verificar também que o diretório de backup e SHA256SUMS continuam no app_storage após a recriação do container.

Isso comprova somente geração e integridade de cópias **na mesma VPS**. Não é backup externo nem restauração testada; falha/perda do volume ou servidor ainda perde essas cópias. APP_KEY precisa continuar guardada fora do painel pelo proprietário, sem ser colocada em log ou no tar de storage. Destino externo, retenção e restauração permanecem requisitos separados antes de dados reais.

## Incidente: preço perdido ao avançar rapidamente no assistente (19/11/2026)

O coordenador confirmou na API que a descrição foi gravada, mas a fatura de teste criada pela UI tinha `cost=0`, `quantity=1`, `amount=0` após digitar preço 10 e avançar imediatamente. Evidência original do coordenador: `/tmp/allberto-easypanel-release/draft-ui-investigation.json`. Não fiz acesso ao ambiente publicado nesta investigação.

Causa reproduzida no componente real `NumberInputField` + `NumericFormat`: `changeOverride` atualizava somente o estado interno e entregava ao formulário após 500 ms; seu blur não entregava nada. A implementação instalada de `react-use/esm/useDebounce.js` e `useTimeoutFn.js` confirma que o cleanup cancela o timer ao desmontar. O teste antes da correção mostrou parent state `0` quando deveria ser `10` (`/tmp/allberto-number-blur-red.log`, 1 falha/4 passes). Foram inspecionados os consumidores, em particular os sete campos com override em pagamento, parcelas de invoice/quote/credit/purchase order e quantidade/preço do assistente. Nenhum desses callers foi alterado.

Correção limitada a `src/components/forms/NumberInputField.tsx`: o blur cancela o timer e normaliza o valor atual usando a conversão existente. Uma ref guarda o último valor entregue/sincronizado pelas props para evitar dirty/entregas duplicadas quando nada mudou em override. A digitação continua com debounce de 500 ms; desmontar sem blur não entrega alterações descartadas. O modo sem override conserva sua entrega no blur.

Validação final:

- `npx vitest run tests/unit/number-input-field-blur.test.ts`: **7 PASS**, exit 0. Cobrem avanço imediato, debounce, cancel sem duplicação, descarte por unmount, blur sem mudança e após entrega, vírgula `10,50 → 10.5`, e modo sem override. Log `/tmp/allberto-number-blur-green.log`.
- `npx playwright test --config tests/local/number-wizard.config.ts`: **1 PASS**, exit 0. Chrome headless com perfil novo; harness adicional monta o Wizard/steps/stores reais e reutiliza fixtures sintéticas. Clique Playwright real tira foco; entrada→blur medidos em **43,9 ms (<500 ms obrigatório)** e POST interceptado de salvar contém `line_items[0].cost=10`. Toda rede externa é bloqueada; nenhum request desconhecido ocorreu. Evidência `tests/local/artifacts/number-wizard/allberto-number-wizard-imm-6a7be--price-in-the-saved-invoice/numeric-blur.json`; log `/tmp/allberto-number-wizard-pass.log`. A configuração reaproveita o preview local4178 sem pará-lo e não usa setup/reset upstream.
- `npx tsc --noEmit --incremental`: exit 0; `/tmp/allberto-number-blur-tsc.log`.
- Biome lint dos cinco arquivos TS/TSX da mudança: exit 0; `/tmp/allberto-number-blur-lint.log`.

Arquivos adicionais: teste unitário, `tests/local/{number-wizard-main.tsx,number-wizard.html,number-wizard.config.ts,allberto-number-wizard.spec.ts}`. Os fixtures/config/main anteriores permanecem intactos. Tentativas iniciais de navegador ajustaram a sequência das etapas e removeram congelamento global do relógio; o teste final usa eventos reais e mede o intervalo em vez de depender de timer mock.

Fonte congelada para revisão CTO. Não houve publicação, alteração de API/runtime, acesso ao Chrome do operador, novos dados reais ou alteração de PDF/branding. Continua fora desta correção o avanço programático que não dispara blur em menos de 500 ms. A confirmação no frontend publicado depende de nova release/deploy coordenados. A nota E9 acima também foi corrigida: permissões 0700/0600 são iniciais; o init da imagem normaliza storage para www-data/755/644 após reinício, e backup externo/restauração continuam pendentes.

## §16 — saída do app para renderizar a atribuição oficial no PDF

Aplicado o diff aprovado pelo CTO: app em `backend` + `egress`; rede própria `egress: {}` não interna e usada somente por app. MySQL e Redis continuam somente em backend `internal: true`; nginx continua em backend/edge. Nenhuma porta publicada, nenhuma rede externa presumida, nenhum override PHP ou imagem nova. Os digests de app/MySQL/Redis e o transporte `MAIL_MAILER=log` permanecem. Fixados `SENTRY_LARAVEL_DSN: ""` e `DISABLE_AUTO_UPDATE: "true"` no environment do app; documentados como fixos em env.example.

**A saída é normal e irrestrita, sem allowlist de destinos.** A garantia anterior de nada sair da máquina deixou de valer para este deploy. O email depende da configuração `log`, não de bloqueio de rede; gateways/webhooks configurados futuramente podem realizar chamadas reais. O Chromium pode buscar URLs de imagens presentes no conteúdo/modelo, inclusive endereços internos. Não foi auditada toda chamada HTTP do upstream. O isolamento do projeto local da story002 não mudou.

Validação: `python3 /tmp/allberto-easypanel-validation/check-https.py` **PASS, exit 0**; log `/tmp/allberto-easypanel-validation/egress-compose-check.log`. O script usa Docker `--context desktop-linux`, `compose --env-file /dev/null config --format json`, valores fictícios para todas as variáveis exigidas e não imprime a expansão. Asserts conferem redes exatas, exclusividade de egress ao app, backend internal, zero ports, ausência de redes externas, DSN vazio, auto-update=true, mail log/host vazio, pins MySQL/Redis, HTTPS e trusted proxy default/override. Não foram lidos ambientes reais nem criados containers; sem build/suíte de aplicação nesta alteração.

Fonte congelada para revisão. Operador deve aplicar no redeploy E9 após backup; N1–N9 do §16 continuam pendentes no runtime, incluindo PDF com atribuição renderizada, flags efetivas, auto-update403 e email somente em log. Esta validação é da configuração, não prova a renderização ou a conectividade na VPS.

### Correção incremental CTO — preservar precisão armazenada no blur

A revisão final de `docs/reviews/fable-number-input.md` identificou regressão na primeira correção: com override, valor interno `1.2345` e precisão visual 2, o texto exibido `1.23` era relido no blur e enviado sem digitação. Acrescentei o teste antes do ajuste: **1 falha/8 passes**, entregando indevidamente `'1.23'` (`/tmp/allberto-number-precision-red.log`, exit 1).

Ajuste mínimo: somente o ramo `changeOverride` do blur usa `String(currentValue ?? 0)`, exatamente como o debounce. O parser do texto permanece no ramo sem override; cancelamento do timer e comparação com a última entrega continuam intactos. Os dois testes novos comprovam que blur sem digitação conserva `1.2345` sem entrega e que digitar `2` entrega `'2'` imediatamente, uma única vez mesmo após 600 ms.

Validação: teste focado **9 PASS**, TSC e lint dos dois arquivos **exit 0**. Logs `/tmp/allberto-number-precision-{green,tsc,lint}.log`. O teste de clique real já aprovado não foi repetido: evento blur e navegação permanecem iguais; a mudança seleciona o valor interno já atualizado no evento de digitação anterior. Compose/env §16 e fixtures de navegador congelados não foram alterados. Fonte novamente congelada para revisão incremental; sem publicação/runtime.

## Release v2 — correção numérica aprovada e defaults finais

Pacote produzido de `git archive f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`, isolado do checkout e dos ambientes locais, com o frontend.Dockerfile aprovado/target build. API compilada: `https://allberto-backend.cxfujw.easypanel.host`. Inclui a correção numérica final: entrega no blur sem perda por avanço rápido e sem arredondar valores armazenados ao apenas passar pelo campo. O coordenador informou aprovação CTO, suíte completa 354 testes/49 arquivos e hook lint/tsc/build aprovados, PR4 merged em `c6737c2e32297d0c20ff1156f5769e43c7e9dfc9`, CI verde.

Release publicada pelo coordenador: `https://github.com/allber-to/web/releases/tag/web-f5cb28edb112-1`. Defaults do Dockerfile leve atualizados exatamente para:

- DIST_URL: `https://github.com/allber-to/web/releases/download/web-f5cb28edb112-1/allberto-web-f5cb28edb112.tar.gz`
- DIST_SHA256: `fcbf81bcbb622efab348a218b8524f4c5af62a7225321777af019ca6351d1ac5`
- Tamanho: **15.274.255 bytes**; versão dentro do pacote `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`, builtAt `2026-11-19T16:39:54.354Z`.

Evidências em `/tmp/allberto-easypanel-release-v2/`: tar.gz e `.sha256`, `release-summary.json`, `w2-check.json`, `build.log`, `bundle-package-check.log`. Build/E5/W2 PASS; zero endereços locais/assinaturas de segredo e 11 contextos localhost inertes revisados nas categorias CTO anteriores. O tar contém somente dist na raiz; checksum independente conferido. Release v1 e suas evidências permanecem em `/tmp/allberto-easypanel-release/` para rollback.

Validação dos defaults v2: `docker --context desktop-linux build -t allberto-web-lightweight:f5cb28edb112 deploy/easypanel` **PASS, exit 0**, sem build args. O próprio Dockerfile baixou o asset público com TLS, validou SHA256 e extraiu. `nginx -t` **PASS, exit 0**; leitura do version.json da imagem confirmou a revisão exata. Logs `lightweight-build.log`, `lightweight-nginx-test.log` e resultado `lightweight-check.json` no diretório v2. Container descartável rodou sem rede/ports/volumes e foi removido via --rm. Nenhum build Node ou suíte foi repetido nesta etapa de defaults.

Somente Dockerfile leve e este handoff mudaram nesta tarefa. Fonte congelada para PR5; nenhum deploy remoto foi realizado por Astra e não se afirma que a v2 já está servida. Aplicação web no painel ainda depende do commit do pin e redeploy pelo operador. O teste W1 anônimo separado fica sob responsabilidade do coordenador em `public-download-check.json`.
