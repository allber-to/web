# Astra — artefatos EasyPanel

19/11/2026. Implementação conforme `docs/architecture-easypanel.md`: **duas origens dedicadas, sem proxy por caminhos**. Nenhum acesso ao painel, VPS, Chrome ou WHMCS. Nenhum deploy remoto, registro público, commit ou push. `src/`, `tests/` e `local-backend/` preservados.

## Arquivos e configuração

- `.dockerignore` retira Git, dependências/build locais, `.env*`, backend local, evidências, artefatos e arquivos de chaves do contexto.
- `deploy/easypanel/frontend.Dockerfile`: Node 22 bookworm slim, `HUSKY=0`, `npm ci`, `npx vite build`, nginx final. `VITE_API_URL` obrigatório validado como origem HTTP(S) sem path/barra final/credenciais; `GIT_SHA` obrigatório com 40 caracteres hexadecimais. Flags fixas self-host, não teste, browser router e integrações opcionais desabilitadas. Após Vite, remove somente `dist/docuninja/builder2.0.js` quando VITE_ENABLE_DOCUNINJA não é true; o arquivo fonte permanece intacto. Executa self-checks e varredura E5 antes de produzir a imagem final. Só `dist/` chega ao runtime. `/version.json` publica apenas revisão e instante de build; label OCI registra revisão.
- `frontend.conf`: SPA fallback, `/healthz`, index/version sem cache, assets `/react/` imutáveis e 404 para inexistentes. Sem proxy_pass. Gzip habilitado para JS, CSS, JSON e SVG.
- `compose.yml`: app 5.13.49 fixado por digest de índice; nginx/backend construído localmente; MySQL/Redis isolados; quatro volumes nomeados; `unless-stopped`; só nginx publica `${API_PORT}:80`. Ambiente do app explicitamente mapeado. Segredos/origem/porta faltantes causam erro de configuração, sem defaults de credencial.
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

1. Fechar P1–P6: versão/plano, arquitetura, recursos, duas portas livres/liberadas, inventário alheio e email autorizado. Não assumir 8090/8012 livres.
2. Publicar/referenciar commit revisado e tag identificada. Criar projeto allberto, sem tocar projetos alheios.
3. Serviço backend Compose: Git público, branch/ref aprovada, Build Path `/deploy/easypanel`, arquivo `compose.yml`. Criar ambiente novo no editor e habilitar Create .env file. Registrar somente valores públicos; guardar APP_KEY fora do painel com o proprietário.
4. Deploy backend; conferir health, versão e volumes. Portas do banco/Redis/FPM não publicadas. Testar E7 com POST vazio. Interromper exposição se a resposta não recusar cadastro.
5. Serviço web App: Git público, Build Path `/`, Dockerfile `deploy/easypanel/frontend.Dockerfile`; variável pública VITE_API_URL com IP e porta API confirmada. GIT_SHA fornecido pelo builder; Auto Deploy desligado; porta web confirmada → alvo 80.
6. Deploy web; conferir version.json, rota profunda, origem API, login/precheck/refresh e rede sanitizada. Usar só dados fictícios enquanto HTTP. API também expõe UI upstream na raiz; URL comunicada para Allberto é a porta web.
7. Executar E8/E9 pela UI/terminal do painel com dados de teste aprovados, dump não vazio e inventário alheio depois. Não executar `local-backend/smoke.mjs` nem specs upstream na VPS.
8. Registrar SHA/digests/portas/data e preservar tag/imagem anterior. Rollback frontend para revisão anterior; backend sem troca de versão nesta fase. Nunca trocar APP_KEY/senhas DB com volumes existentes nem apagar serviço/volumes como rollback.

Migração futura para allber.to segue seção 9 da arquitetura: dois subdomínios HTTPS, APP_URL/REQUIRE_HTTPS/proxies ajustados e rebuild frontend com a nova origem; retirar portas públicas. Nada disso foi executado.

## Limites

Artefatos testados em arm64 local, não no provável amd64 da VPS. Portas, recursos e inventário do painel continuam pendentes. O proprietário definiu o e-mail do administrador fora dos documentos públicos. Homologação HTTP não autoriza dados reais. Sem envio externo, gateway, backup automatizado ou restauração testada. E5 revisado passou localmente; a versão publicada e sua origem efetiva ainda precisam da conferência remota.

Fonte congelada para revisão Fable. `git diff --check` passou. Logs em /tmp foram preservados; nenhum segredo real foi gerado ou copiado para os artefatos.

## Resultado após correções CTO

Build final exit 0; script E5/self-checks exit 0; nginx -t exit 0; rotas/cache/404/version e gzip dos quatro tipos passaram. Evidências finais: `frontend-build-final.log`, `bundle-check-final.log`, `frontend-nginx-test-final.log`, `http-checks-final.json` em `/tmp/allberto-easypanel-validation/`. Fonte congelada novamente para revisão. Nenhuma mudança em src/tests/local-backend, nenhum acesso remoto ou publicação de imagem.

**Fechamento do coordenador:** Fable aceitou o delta final sem achados pendentes nos artefatos. Segredos deverão ficar somente no ambiente do serviço backend, nunca no nível do projeto, pois o EasyPanel fornece as variáveis de projeto também aos builds do web. O aceite não inclui execução na VPS; veja [parecer final](../reviews/fable-easypanel-artifacts.md).
