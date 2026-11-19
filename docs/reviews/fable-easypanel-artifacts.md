# Revisão dos artefatos de deploy — EasyPanel (story 003)

Data: 19/11/2026. Revisor: Claude Fable 5.2, como CTO, somente leitura. Implementação: Astra.

## Veredito

**Artefatos aceitos, com duas correções obrigatórias pequenas e três recomendadas.** Nenhuma muda o desenho. Depois delas, os artefatos estão prontos para o coordenador usar no painel, quando as pré-condições P1–P6 forem fechadas.

**Nada foi implantado.** Este aceite cobre arquivos e verificações locais. O funcionamento no IP da VPS não foi testado por ninguém.

## Aceite final dos artefatos (revalidação)

**Aceitos, sem achado pendente.** Li apenas o delta: `verify-bundle.mjs`, as mudanças em `frontend.Dockerfile` e `frontend.conf`, o handoff `docs/handoffs/astra-easypanel.md` e as evidências do build final. Não repeti build nem testes.

| Item da revisão | Situação |
| --- | --- |
| 1. Remover o arquivo DocuNinja | **Resolvido.** O `Dockerfile` apaga só `dist/docuninja/builder2.0.js`, e só quando `VITE_ENABLE_DOCUNINJA` não é `true`. |
| 2. Verificação de E5 como passo | **Resolvido.** `verify-bundle.mjs` roda dentro do build, depois de um autoteste com casos que devem passar e casos que devem falhar. Reprova `127.0.0.1`, `localhost` seguido de porta (sem diferenciar maiúsculas) e assinaturas de chave privada, AWS e GitHub; exige a origem de API esperada; lista cada `localhost` restante com contexto. Em falha, não imprime o trecho suspeito. |
| 3. `GIT_SHA` rígido | **Mantido por decisão do coordenador**, que aceito: se o EasyPanel não entregar o SHA completo, o coordenador o informa explicitamente, e nunca se publica `unknown`. O build aborta em vez de publicar sem identificação. |
| 4. Digests das imagens auxiliares | **Pendente por natureza:** só existem depois do primeiro deploy na VPS. Fica como tarefa do coordenador. |
| 5. Gzip | **Resolvido.** Ligado para JavaScript, CSS, JSON e SVG; a evidência mostra as quatro respostas comprimidas. |

**E5, conferido por leitura.** Li os 11 contextos listados no build final e concordo com a classificação do Astra:
- 2 são comentários do TinyMCE;
- 6 são do analisador de links do editor Markdown e de analisadores de URL (4 em minúsculas e 2 nomes de token `LOCALHOST`);
- 3 são valores de reserva para ambiente sem `window` (paginação e duas cópias do axios).

Nenhum é endereço de serviço. As três ocorrências do arquivo DocuNinja saíram.

Limites do verificador, que não mudam o aceite:
- A classificação dos `localhost` sem porta continua humana. O script lista; quem publica confere.
- As assinaturas de segredo cobertas são poucas. Basta aqui porque o build do frontend não recebe segredo nenhum.
- A origem usada no build de prova (`http://192.0.2.10:18012`) é um endereço reservado para documentação. O build real usará o IP e a porta confirmados, e o verificador rodará de novo com esse valor.

**Um cuidado operacional novo para o coordenador.** A documentação do EasyPanel diz que variáveis de ambiente do projeto e do serviço ficam disponíveis durante os builds. Portanto:
- os segredos do backend vão **somente** no ambiente do serviço Compose `backend`;
- **nada no nível do projeto**, que seria exposto também ao build do `web`;
- o serviço `web` recebe só `VITE_API_URL` (e `GIT_SHA`, se precisar ser informado).

O Vite só embute variáveis com prefixo `VITE_`, então não haveria vazamento direto no bundle; a regra evita o risco em vez de depender disso.

O handoff não contém endereço de e-mail, senha nem chave; a varredura por padrão em `deploy/`, no handoff, no `README.md` e em `docs/staycloud.md` não achou nada. P6 foi resolvido pelo proprietário fora dos documentos, como deve ser.

**Continua sem validação**, igual à seção final deste documento: P1–P5, todo o funcionamento na VPS por IP, o manifesto amd64, a entrega dos argumentos de build pelo EasyPanel, o 403 do signup e `GET /setup` no ar, e backup com restauração.

O texto abaixo é o registro da primeira revisão.

## Como revisei

- Li `deploy/easypanel/compose.yml`, `env.example`, `frontend.Dockerfile`, `frontend.conf`, `nginx/Dockerfile`, os dois `.conf` e `.dockerignore`.
- Validei a sintaxe do Compose com variáveis fictícias (`docker compose config -q`), sem criar container. Sem as variáveis, a interpolação falha com a mensagem prevista, como desejado.
- Comparei os `.conf` do nginx do backend com os aprovados na story 002: idênticos.
- Li as evidências do Astra em `/tmp/allberto-easypanel-validation` (ocorrências de `localhost`, checagens HTTP, trecho da fonte do signup).
- Conferi na fonte do backend (SHA do fork) a regra de criação de conta.
- Reli a documentação de builders do EasyPanel.
- O handoff `docs/handoffs/astra-easypanel.md` ainda não existia; usei o inventário e os arquivos.
- Não rodei o build do frontend nem subi containers. Os resultados de build, `nginx -t` e respostas HTTP são do Astra.

## Decisão sobre E5

O critério original pedia zero ocorrências de `localhost` no bundle. A verificação encontrou 12 (e nenhuma de `127.0.0.1`). Li as doze:

| Onde | Quantas | O que é | Avaliação |
| --- | --- | --- | --- |
| TinyMCE, plugin `codesample` | 2 | Comentário com exemplo de pilha de erro | Inerte |
| Editor Markdown, biblioteca de detecção de links, importador, worker TypeScript | 4 | Analisadores de URL que reconhecem a palavra `localhost` como nome de host válido | Não é endereço de destino |
| `tables` (paginação), duas cópias do axios | 3 | Valor de reserva `http://localhost` usado só quando não existe `window`; no navegador vale a origem real | Nunca executado no navegador |
| `public/docuninja/builder2.0.js` | 3 | Uma reserva igual à do axios e **duas URLs `http://localhost:8000`** como base de API | Ver abaixo |

**Decisão:** o critério literal estava mal formulado por mim. Ele pegava texto inerte de bibliotecas e não distinguia o que importa. Corrigir bibliotecas de terceiros para satisfazê-lo seria remendo sem ganho. O critério passa a ser:

1. **Nenhuma ocorrência de `127.0.0.1`** no que é servido.
2. **Nenhuma ocorrência de `localhost` seguido de porta** (`localhost:<número>`). É a forma que indica um endereço de serviço real embutido.
3. Ocorrências de `localhost` sem porta são admitidas apenas nas três categorias da tabela (comentário, analisador de URL, reserva para ambiente sem `window`). Cada build lista as ocorrências com contexto; qualquer uma fora dessas categorias reprova.
4. **A origem de API efetiva é exatamente a de `VITE_API_URL`**, presente no bundle e sem outra origem de API configurada.
5. Nenhum padrão de segredo.

Já atualizei o critério em `docs/architecture-easypanel.md`.

### O arquivo do DocuNinja

`public/docuninja/builder2.0.js` é o único caso que viola o item 2. Conferi:
- é um arquivo versionado do upstream, copiado para `dist/` sem passar pelo empacotador;
- **nada no código o referencia**: as telas de documentos importam o pacote `@docuninja/builder2.0` do npm, não este arquivo;
- o recurso está desligado neste build (`VITE_ENABLE_DOCUNINJA=false`), o que oculta as rotas e o menu.

**Aprovo a proposta do Astra:** remover esse arquivo do `dist/` dentro do `frontend.Dockerfile`, condicionado à mesma variável. Não altera o repositório, não toca em biblioteca e não tira função em uso. Se o DocuNinja for ligado no futuro, a condição preserva o arquivo e a decisão precisa ser revista — com ele ligado, as duas URLs `localhost:8000` seriam um defeito real do upstream a investigar.

## Decisão sobre E7 (criação de conta)

Confirmado na fonte do backend 5.13.49:
- `CreateAccountRequest::authorize()` devolve `Ninja::isHosted()`;
- `isHosted()` é verdadeiro só quando `ninja.environment` vale `hosted`; o padrão é `selfhost`.

Fixar `NINJA_ENVIRONMENT: selfhost` no Compose, como está, impede que um valor de ambiente errado abra o cadastro. **Correto.**

Um cuidado, que o coordenador já identificou e eu confirmo: `prepareForValidation()` grava em log os cabeçalhos e o corpo da requisição, e no ciclo do Laravel isso roda **antes** da autorização. Mesmo uma tentativa recusada é registrada. Portanto o teste de E7 deve ser um `POST` sem corpo, sem token e sem senha, esperando 403. Não fazer cadastro real nem enviar credencial nessa rota. Atualizei o critério com essa instrução.

Acrescentei ao E7 uma segunda checagem, só de leitura: `GET /setup` não deve oferecer o assistente de instalação depois que a conta existe. Não conferi essa rota na fonte; por isso é verificação, não afirmação.

## Achados

### Obrigatórios antes do uso

**1. Média — aplicar a remoção do arquivo DocuNinja no `frontend.Dockerfile`.**
Sem isso o build não passa no E5 revisado. Uma linha após o `vite build`, condicionada a `VITE_ENABLE_DOCUNINJA` diferente de `true`.

**2. Média — a verificação de E5 precisa virar passo do build ou do checklist.**
Hoje ela é manual. Mínimo: no handoff, o comando exato que conta `127.0.0.1` e `localhost:<porta>` no `dist/` final e lista as ocorrências de `localhost` com contexto. Melhor: falhar o build se os itens 1 ou 2 do critério tiverem ocorrência.

### Recomendados

**3. Baixa — validação de `GIT_SHA` rígida demais.**
O `Dockerfile` exige exatamente 40 caracteres hexadecimais. A documentação do EasyPanel diz que ele "adiciona `GIT_SHA`" em deploys de repositório, sem especificar formato nem se chega como argumento de build. Se vier abreviado ou não vier como `ARG`, o deploy falha por um motivo sem relação com o produto. Aceitar de 7 a 40 caracteres e, na ausência, gravar `unknown` em `version.json` em vez de abortar. A falha por `VITE_API_URL` inválida deve continuar abortando: essa sim protege.

**4. Baixa — imagens auxiliares por tag móvel num ambiente que persiste.**
`mysql:8`, `redis:alpine` e `nginx:alpine` podem mudar a cada redeploy. Para o banco isso importa: uma atualização de versão do MySQL converte os dados e não tem volta. Após o primeiro deploy, registrar os digests resolvidos na VPS e fixá-los no Compose na mudança seguinte. No mínimo o do MySQL.

**5. Baixa — nginx do frontend sem compressão.**
O `dist/` tem cerca de 56 MB e é servido sem gzip. Ligar `gzip` para JavaScript, CSS, JSON e SVG em `frontend.conf`. Só desempenho; sem efeito funcional.

### Informativos

- `.dockerignore` não exclui `docs/` nem `design/` (este tem um HTML de 7,6 MB). Não entram na imagem final, só aumentam o contexto enviado ao build. Excluir é opcional. Não excluir `deploy/`, que o `Dockerfile` usa.
- Sem cabeçalhos de segurança no nginx do frontend. Aceitável para homologação em HTTP; rever na migração para o domínio.
- `IN_PASSWORD` permanece no ambiente do container depois do primeiro uso. Previsto na arquitetura: o proprietário troca a senha no primeiro login.

## Conferido sem achados

- **Compose:** segue a arquitetura. Imagem do backend pelo digest do índice; sem `container_name`; sem bind mount; porta publicada só no `nginx` e vinda de variável; MySQL, Redis e PHP-FPM sem porta; rede `backend` interna; `restart: unless-stopped`; variáveis obrigatórias com falha explícita quando ausentes; `APP_DEBUG=false`; `TRUSTED_PROXIES` e `API_SECRET` ausentes de propósito.
- **nginx do backend:** arquivos idênticos aos da story 002, copiados por build; `fastcgi_pass app:9000` coerente com o nome do serviço.
- **`env.example`:** só nomes; segredos, portas e origem vazios.
- **`frontend.Dockerfile`:** Node 22, `npm ci` com `HUSKY=0`, `vite build` sem `tsc`, estágio final só com nginx e `dist/`; `VITE_API_URL` validada como origem sem barra final, caminho, credencial ou parâmetros; `VITE_IS_TEST=false` explícito.
- **`frontend.conf`:** rota profunda cai em `index.html` com `no-store`; arquivos em `/react/` com cache longo e 404 quando ausentes; sem `proxy_pass`; arquivos ocultos negados. As respostas registradas pelo Astra batem com a configuração.
- **Segredos:** varredura por padrão em `deploy/`, `.dockerignore` e nos documentos novos, sem ocorrência.
- **Escopo:** nenhuma alteração em `src/`, `tests/` ou `local-backend/`.

## O que não está validado

Tudo que depende da VPS e do painel:

- P1–P6 continuam abertas: versão e plano do EasyPanel, arquitetura e recursos, portas livres e firewall, inventário dos serviços existentes, e-mail do administrador. O coordenador ainda não conseguiu entrar no painel.
- Nenhum deploy foi feito. O acesso por IP, as duas portas, o login real, o PDF e a persistência após redeploy (E1–E4, E6, E8, E9) não foram exercitados.
- O manifesto **amd64** da imagem do backend nunca foi executado; só o arm64, localmente.
- Se o EasyPanel entrega as variáveis de ambiente e o `GIT_SHA` como argumentos de build do `Dockerfile` é o que a documentação sugere, não o que foi observado.
- O build do frontend dentro da VPS (memória e tempo) não foi medido.
- `GET /setup` após a inicialização e o 403 do signup são leitura de código, a confirmar no ar.
- Backup e restauração: procedimento descrito, nunca executado.

Continua valendo: enquanto for HTTP por IP, só dados de teste.

## Suplemento — delta HTTPS do backend (19/11/2026)

**Publicação autorizada.** Revisei só `deploy/easypanel/compose.yml` e `deploy/easypanel/env.example` contra `96b1a1c907f33048849473250571da74ae5c0082`. O novo `Dockerfile` leve do frontend e o handoff não fazem parte desta revisão.

O delta é exatamente o da seção 14.3 da arquitetura, sem nada além:

| Ajuste pedido | No arquivo |
| --- | --- |
| Remover porta publicada e `API_PORT` | `ports` saiu do `nginx`; `API_PORT` não aparece mais em nenhum dos dois arquivos |
| `REQUIRE_HTTPS` verdadeiro | `REQUIRE_HTTPS: "true"`, fixo |
| `TRUSTED_PROXIES` com padrão `*`, trocável | `${TRUSTED_PROXIES:-*}`; valor vazio também cai em `*` |
| `APP_URL` em HTTPS | continua obrigatória; a mensagem de erro agora pede origem HTTPS sem barra final |
| `app` sem saída | `app` só na rede `backend`, que segue `internal: true` |
| `nginx` em `backend` e `edge`, sem rede externa nomeada | inalterado |

O restante do arquivo não mudou: imagem pelo digest, `NINJA_ENVIRONMENT: selfhost`, `APP_DEBUG: "false"`, volumes, healthchecks.

O que conferi:
- li o diff inteiro;
- validei a sintaxe do Compose com valores fictícios (`docker compose config -q`), sem criar container;
- li o script de verificação do Astra: ele afirma, sobre a configuração efetiva, zero portas publicadas, `app` só na rede interna, `nginx` nas duas redes, nenhuma rede externa, HTTPS ligado e `TRUSTED_PROXIES` tanto no padrão quanto com valor explícito. O registro mostra aprovação. Não reexecutei o script.

Uma atenção para quem preenche o ambiente no painel: o Compose não consegue impedir um `APP_URL` começando com `http://`. Com `REQUIRE_HTTPS` ligado, esse erro só apareceria como links errados no ar. Conferir o valor antes do deploy; o critério H5 pega se escapar.

**Continua sem validação:** tudo que depende do painel. Que o proxy alcance o `nginx` sem porta publicada (D4), que os cabeçalhos encaminhados cheguem (H2, H5) e que o certificado seja emitido (H1) só se sabe no primeiro deploy.

## Suplemento — frontend pré-compilado, caminho da seção 15 (19/11/2026)

**Aceito. Sem correção obrigatória.** O caminho pode seguir para a publicação da release e o commit dos valores reais. Revisei `deploy/easypanel/Dockerfile`, o pacote local e as evidências; não reconstruí nada.

### O que conferi eu mesmo

- **Hash do pacote:** calculei o SHA-256 de `allberto-web-52db1b5423ea.tar.gz` e obtive `5f9d3b717d30706d82c8d4ba66e7cf8ebcb49fa0ef695c1630dce4b94e351f02`, igual ao informado. Tamanho 15.276.656 bytes.
- **Conteúdo do pacote:** 1.389 entradas, todas com caminho relativo, nenhuma absoluta nem com `..`; nenhum arquivo auxiliar do macOS; todos os arquivos e diretórios legíveis por qualquer usuário, então o nginx consegue servi-los. O arquivo do DocuNinja não está no pacote.
- **`version.json` dentro do pacote:** revisão `52db1b5423eafac06d43c38b710f23b6a5fdc6c4`.
- **Verificador (E5/W2):** o registro mostra aprovação sobre o pacote extraído, com zero endereço local de serviço.
- **Download por HTTPS com redirecionamento:** era o ponto que o teste do Astra não cobria, porque W5 usou um pacote de teste servido por HTTP local. Rodei o `wget` da imagem `nginx:alpine` contra um arquivo de release pública do GitHub de outro projeto: baixou, seguindo o redirecionamento. A ferramenta da imagem base serve para a URL real.
- **`Dockerfile`:** falha se a URL ou o hash estiverem vazios; confere o hash antes de extrair; limpa o diretório padrão; apaga o pacote; usa o `frontend.conf` já aceito; mesmo healthcheck.
- **W5:** com hash errado, o build falha na conferência; com o certo, conclui; `nginx -t` aprovado.

### Achados

Nenhum bloqueia.

1. **Baixa — a imagem leve não registra a revisão em rótulo.** O `frontend.Dockerfile` original gravava `org.opencontainers.image.revision`. Aqui a identificação fica só em `/version.json`. Suficiente; opcional acrescentar.
2. **Informativa — revisão do pacote e commit publicado são diferentes.** O pacote identifica `52db1b5`; a `main` está em `1ee50c7`, o merge da PR #2. É coerente, porque o merge não altera o código do frontend, mas quem conferir `/version.json` no ar deve esperar `52db1b5`, não o SHA do merge. Registrar isso na descrição da release.
3. **Informativa — os argumentos estão sem valor padrão de propósito.** Até o commit com a URL e o hash reais, o build do serviço `web` falha por desenho. Não fazer deploy do `web` antes desse commit.

### Sequência que falta, na ordem

1. Coordenador publica a release com o pacote e confere que o arquivo público tem o mesmo SHA-256 (W1).
2. Commit em `deploy/easypanel/Dockerfile` com a URL do arquivo e o hash como valores padrão.
3. Deploy do `backend` e verificação de H1–H4.
4. Deploy do `web`; a saída deve mostrar o hash conferido e nenhuma instalação de Node (W3); `/version.json` com `52db1b5` (W4).

### Requisitos remotos ainda abertos

Com o segundo inventário, ficaram fechados: arquitetura amd64, memória disponível (3.277 MiB, sem swap), disco e ausência de outros serviços. Os dois hosts existem e têm certificado válido, respondendo 502 enquanto não há container.

Continua sem validação, até o deploy:
- o manifesto **amd64** da imagem do backend nunca foi executado;
- que o proxy alcance o `nginx` do Compose sem porta publicada (D4) e que os cabeçalhos encaminhados cheguem (H2, H5);
- que a VPS alcance `github.com` e o Docker Hub durante o build;
- que o plano com licença inativa aceite serviço App com fonte GitHub e builder Dockerfile no Build Path `/deploy/easypanel`;
- o 403 do signup e `GET /setup` no ar (E7);
- o consumo de memória com os quatro containers, sobretudo ao gerar PDF: sem swap, falta de memória derruba processo em vez de degradar;
- login, PDF, persistência após redeploy e dump do banco (E6, E8, E9);
- backup com restauração testada, que continua sendo condição para dados reais.

## Suplemento — digests de MySQL e Redis e procedimento de backup E9 (19/11/2026)

**Autorizados o próximo redeploy do backend com os digests fixados e a execução do backup local**, com uma correção de texto obrigatória e uma recomendação antes de dados reais. Revisei `deploy/easypanel/compose.yml` e a seção "Pins observados na VPS e procedimento E9" do handoff. Não executei nada na VPS.

### Digests

- `mysql:8@sha256:a81d0439…b0902` e `redis:alpine@sha256:7958cfbb…935c3`.
- São os mesmos digests resolvidos no ambiente local arm64 da story 002 e agora observados na VPS amd64. Isso indica que são digests de índice, válidos nas duas arquiteturas, e que o redeploy não troca a imagem em execução.
- A sintaxe com tag e digest é válida; validei o Compose com valores fictícios (`docker compose config -q`).
- O nginx do backend continua com base por tag (`nginx:alpine` no build). Aceitável: não guarda dado.

### Backup: o que está certo

- O dump usa a senha que já existe dentro do container do MySQL, sem expô-la na linha de comando do host; `--single-transaction` e `--no-tablespaces` são adequados.
- Não há encadeamento que esconda falha: o dump vai para arquivo, com `set -e` e verificação de arquivo não vazio.
- O `tar` exclui a própria pasta de backups, então não inclui a si mesmo nem dumps anteriores.
- Gera e confere `SHA256SUMS`; registra só caminho, tamanhos e hashes.
- O texto já declara o limite essencial: é cópia na mesma VPS, não backup externo nem restauração testada.

### Achados

**1. Média — a afirmação de permissões restritas não sobrevive ao redeploy. Corrigir o texto antes de usar.**
O handoff diz que os diretórios ficam `0700` e os arquivos `0600`. Isso vale só até o container `app` reiniciar. O script de entrada da imagem (`init.sh` oficial, que li na story 002) roda a cada subida `chown -R www-data:www-data` sobre `storage` e redefine arquivos para `644` e diretórios para `755`. Depois do redeploy, o dump do banco passa a ser legível pelo usuário do PHP.

Não fica exposto pela web: o nginx serve `public/`, e de `storage` só `app/public` é ligado ali. Mas é um dump completo dentro do diretório de dados da aplicação, legível por ela.

- Correção obrigatória agora: trocar a afirmação no handoff por essa realidade.
- Recomendação antes de dados reais: guardar os backups num diretório do host, fora dos volumes dos containers e restrito ao root, em vez de dentro de `app_storage`. O arquivo de transferência em `/tmp` do host já passa por lá; basta um destino permanente no host e dispensar a cópia para o container.

Para a homologação com dados fictícios, o procedimento como está é aceitável.

**2. Baixa — o `tar` de `storage` inclui os logs da aplicação.** Entre eles os registros da rota de cadastro, que gravam cabeçalhos e corpo das tentativas. Mais um motivo para tratar o pacote como sensível e não deixá-lo legível pela aplicação.

**3. Informativa — a verificação pós-redeploy pedida no handoff está correta** (reler os mesmos registros, saúde, ausência de conta nova, backup ainda presente). Acrescentar a conferência das permissões do diretório de backup depois do redeploy: é o que vai mostrar o achado 1 na prática.

### Continua aberto

Destino externo, retenção e **restauração testada** seguem como condição para dados reais. Este procedimento prova apenas que as cópias são geradas e íntegras.

## Suplemento — saída de rede do `app`, seção 16 (19/11/2026)

**Delta de Compose e `env.example` aceito. Publicação autorizada.** Revisei o diff contra `aa9b976c0014ce6a445ddc53286488a1f4c95067` e li a configuração efetiva com valores fictícios (`docker compose config --format json`), sem criar container nem repetir build.

| Pedido na seção 16 | Configuração efetiva |
| --- | --- |
| `app` em `backend` e `egress` | `app: [backend, egress]` |
| `mysql` e `redis` só em `backend` | `[backend]` nos dois |
| `nginx` inalterado | `[backend, edge]` |
| `backend` interna; `egress` não interna; nenhuma rede externa | `backend: internal`, `edge` e `egress` comuns, nenhuma externa |
| Nenhuma porta publicada | nenhum serviço com `ports` |
| `SENTRY_LARAVEL_DSN` vazio | `''` |
| `DISABLE_AUTO_UPDATE` verdadeiro | `'true'` |
| E-mail em log, HTTPS, proxy, ambiente | `MAIL_MAILER: log`, `REQUIRE_HTTPS: true`, `TRUSTED_PROXIES: *`, `NINJA_ENVIRONMENT: selfhost`, `APP_DEBUG: false` |
| Imagens fixadas | backend, MySQL e Redis por digest |

O `env.example` registra, corretamente, que a saída é irrestrita e que o e-mail é contido por configuração, não por rede. O registro do script de verificação do Astra mostra aprovação; não o reexecutei.

### Backup E9

O coordenador informa que o operador executou o backup uma vez, com saída zero, dump de 504.900 bytes e `storage` de 382.466 bytes, hashes conferidos. Não vi a evidência; registro como relatado. Vale o achado anterior: depois do redeploy o container `app` reinicia e o script de entrada reabre as permissões dessa pasta. Conferir as permissões do diretório de backup após o redeploy.

### Operação após o redeploy — N5, N6 e N7

**N5, configuração ativa.** No terminal do serviço `app`, como o usuário da aplicação, imprimindo só três valores:

```sh
runuser -u www-data -- php artisan tinker --execute='echo json_encode(["sentry_vazio"=>empty(config("sentry.dsn")),"autoupdate_off"=>(bool)config("ninja.disable_auto_update"),"mail"=>config("mail.default")]);'
```

Esperado: `{"sentry_vazio":true,"autoupdate_off":true,"mail":"log"}`. Rodar como `www-data` evita deixar arquivos de cache com dono root em `storage`.

**N6, autoatualização. Atenção: a ordem importa.** A rota é `POST /api/v1/self-update` (`routes/api.php:435`). Ela passa pelo middleware `password_protected` antes do controlador, e logo depois de um login esse middleware deixa passar sem pedir senha. Se a variável não estiver ativa, **a chamada inicia uma atualização real**.

- Só chamar depois de N5 mostrar `autoupdate_off: true`.
- Chamar com o token do administrador, sem cabeçalho de senha e sem corpo.
- `403` confirma o bloqueio. `412` significa que o middleware pediu senha: é inconclusivo, e não se deve reenviar com a senha.
- Alternativa que recomendo: **dispensar a chamada e aceitar N5 como prova.** O controlador lê exatamente esse valor de configuração (`SelfUpdateController.php:53`).

**N7, e-mail só em log.** Enviar a fatura de teste a um contato `@example.test`, com um assunto único, e contar as ocorrências sem imprimir o conteúdo:

```sh
runuser -u www-data -- grep -c 'ASSUNTO-UNICO-DE-TESTE' storage/logs/laravel.log
```

Esperado: 1 ou mais. Junto com `mail: log` no N5 e com o método de envio da empresa em "padrão" nas configurações de e-mail. Esse último ponto é o que importa daqui em diante: com a saída liberada, trocar o método de envio pela interface faz e-mails saírem de verdade.

### Continua aberto

N1 a N4, N8 e N9 da seção 16 dependem do redeploy. O PDF com a marca visível (N3) é o que confirma o propósito desta mudança.
