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
