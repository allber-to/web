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
4. `REQUIRE_HTTPS=true` fixo; `TRUSTED_PROXIES` tem default `*`, substituível por faixa verificada do proxy. Essa confiança depende de nenhuma porta direta publicada. App permanece somente na rede backend internal; nginx permanece em backend + edge. Não abrir egress do app nem adicionar uma rede externa presumida.
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

Removidos `nginx.ports` e API_PORT; REQUIRE_HTTPS fixado em true; TRUSTED_PROXIES interpolado com default `*`; env.example orienta APP_URL HTTPS. Redes e volumes preservados. Somente compose.yml, env.example e este handoff alterados nesta tarefa. Validação efetiva do Compose com valores fictícios confirma zero ports, app somente na rede internal, nginx em backend/edge, nenhuma rede externa e os valores HTTPS/proxy. Também foi verificada a substituição do wildcard por faixa fornecida no ambiente. Não foram gerados segredos, iniciados containers ou feitos builds. Certificados/roteamento/loops e links HTTPS continuam pendentes no painel.

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
