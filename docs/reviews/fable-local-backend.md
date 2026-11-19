# Revisão final do CTO — backend local (story 002)

Data: 19/11/2026. Revisor: Claude Fable 5.2, como CTO. Base do diff: `a56ec90f0`. Implementação: Astra.

## Veredito

**Aceito. Nenhum bloqueio e nenhuma correção obrigatória.** Os dez critérios da arquitetura estão atendidos; A7 é aceito com a ressalva prevista. A story 002 pode ser concluída e publicada, com os limites da seção final.

## Como revisei

- Li a arquitetura, o handoff do Astra, a story e o diff completo contra `a56ec90f0`.
- Li integralmente `compose.yml`, `env.example`, `init-env.sh`, `smoke.mjs`, `browser-smoke.mjs` e o novo teste unitário.
- Conferi ao vivo, só com leitura: estado dos serviços, redes, política de restart, imagem em uso, porta em escuta no host e o cabeçalho de versão da API.
- Comparei os dois arquivos do nginx com a origem oficial no commit `84cc592`.
- Li as evidências sanitizadas em `local-backend/evidence/` (resumos, relatório do navegador, texto do PDF).
- Não li `local-backend/.env` nem logs brutos. Não rodei os smokes, não reiniciei nada e não alterei código.

## Critérios A1–A10

| # | Resultado | O que eu mesmo conferi |
| --- | --- | --- |
| A1 — versão e digest | **Aceito** | O container `app` usa a imagem `…@sha256:05efd091…f21c92`; a API respondeu `X-APP-VERSION: 5.13.49`; o manifesto registrado é o arm64 `sha256:c0dadfee…d1437f`. |
| A2 — contrato | **Aceito** | Relatório do navegador: 150 respostas da API, 0 erros de JavaScript, 0 requisições falhas, 0 respostas com status ≥ 400, cobrindo 22 grupos de endpoints. O relatório guarda só método, caminho e status. |
| A3 — exposição | **Aceito** | Único processo em escuta: `127.0.0.1:8012`. MySQL e Redis sem porta publicada. Rede `backend` com `internal=true`; `app` ligado só a ela. A tentativa de saída de dentro do container consta na evidência do Astra; não a repeti. |
| A4 — segredos | **Aceito** | `.env` e `evidence/` ignorados pelo Git (regras nas linhas 53–54 do `.gitignore`); `.env` com permissão `600`. Varredura por padrão (chave `base64:` longa, sequência hexadecimal de 48 caracteres, token) em evidências, documentação e arquivos versionáveis: nenhuma ocorrência. |
| A5 — fluxos e valores | **Aceito** | `summary.json`: BRL, pt_BR, 3 clientes, 3 faturas, recorrente, pagamento; esperado MRR 75, a receber 300, vencido 200, recebido 23,45, saldo 100. O script compara com igualdade exata. |
| A6 — PDF | **Aceito** | Texto extraído do PDF mostra empresa, "Brasil", "FATURA" e número. Gerado com a rede interna mantida, então o risco que eu havia levantado não se confirmou. |
| A7 — e-mail local | **Aceito com ressalva** | Ver seção própria. |
| A8 — persistência | **Aceito** | O smoke compara o resumo novo com o anterior por igualdade profunda; os IDs e valores se mantiveram após `stop`/`up`. `restart: no` confirmado no container. |
| A9 — navegador real | **Aceito** | O script faz login pela tela, confere os quatro KPIs em BRL, o calendário, as listas, total/pago/saldo da fatura, edição de cliente com PUT 200 e releitura por GET, e recarga autenticada. A captura publicada mostra a shell allberto. |
| A10 — isolamento | **Aceito** | `isolation-summary.json`: 3 containers, 62 volumes e 4 redes alheios, todos inalterados. Hoje o projeto tem 4 containers e 4 volumes próprios. |

## A7 — decisão

O critério pedia a mensagem registrada só em log local e o registro de envio na fatura. As duas coisas aconteceram: o log do container contém o assunto de teste e o destinatário `@example.test`, e o convite da fatura recebeu data de envio.

O que ficou vazio foi o endpoint de histórico de e-mails do cliente. Conferi a causa no código do backend (SHA do fork): `EmailHistoryController` só devolve registros de `SystemLog` que tenham `history.events`, e esses eventos vêm de retorno de provedor de e-mail. Com transporte `log` não há provedor, então a lista vazia é o comportamento correto, não uma falha da integração.

**Aceito com ressalva.** Consequência a registrar para a implantação: o cartão "Histórico de e-mails" do cliente e da fatura ficará vazio em qualquer ambiente cujo transporte não gere esses eventos. Validar esse cartão exige um provedor real em homologação, fora desta fase.

## Código

- **`Sections.tsx`** — única mudança em `src/`. A API 5.13.49 devolve `next_send_date` com horário (`2026-11-22 00:00:00`), e o calendário comparava a string inteira com a data do dia. A normalização com `dayjs` está correta e é a mesma leitura já usada pela lista e pela janela de sete dias. O teste novo renderiza o componente real com os dois formatos; rodei: passa.
  Corrijo aqui uma afirmação minha da revisão integrada: eu havia concluído, pela leitura do código do backend, que o campo chegava só como data. A execução real mostrou o contrário. Procurei outras comparações diretas desse campo em `src/`; não há.
- **`compose.yml`** — segue a arquitetura: projeto nomeado, imagem por digest, porta só em loopback, rede interna, `restart: "no"`, quatro volumes.
- **`init-env.sh`** — não sobrescreve arquivo existente, usa `umask 077` e `noclobber`, grava com `600`.
- **`smoke.mjs`** — as três travas estão no início e antes de qualquer chamada: URL exatamente `http://localhost:8012`, e-mail `@allberto.test`, container `app` do projeto em execução. Recusa caminhos fora de `/api/v1/` e qualquer um com `purge` ou `reset`. Token só em memória; mensagens de erro trazem apenas método, caminho e status.
- **`browser-smoke.mjs`** — mesmas travas; sem mocks; não importa nada da suíte upstream; redige caminhos de portal do cliente e a senha no texto de falha.
- **nginx** — idêntico à origem, salvo espaços e a linha de procedência.

## Achados

Nenhum bloqueia. Todos são baixos ou informativos.

1. **Baixo — datas do smoke em UTC.** `day()` e o intervalo do mês usam `toISOString()`. Rodado depois das 21h no horário de Brasília, "hoje" vira o dia seguinte, e os vencimentos e a janela de sete dias deslocam um dia. Não afeta o que já foi validado. Se o smoke for reutilizado, formatar a data local.
2. **Baixo — a massa de teste tem prazo.** A recorrente dispara em 22/11 e o agendador do container vai gerar a fatura; a partir daí "a receber" muda e o smoke falha na comparação exata. O Astra documentou e a falha é a reação correta. Recomendo parar o ambiente (`stop`) quando não estiver em uso.
3. **Informativo — identificadores iguais entre entidades.** No resumo, a empresa, o primeiro cliente, a primeira fatura, a recorrente e o pagamento têm o mesmo identificador. Isso confirma, com dado real, a premissa do achado de cache de atividade da primeira revisão: sem o tipo de entidade na chave, cliente 1 e fatura 1 colidiriam. A correção já está aplicada.
4. **Informativo — healthcheck do MySQL sem credenciais.** `mysqladmin ping` responde mesmo sem autenticar. Serve para prontidão, que é o uso aqui.
5. **Informativo — tags auxiliares não fixadas.** `nginx:alpine`, `mysql:8` e `redis:alpine` seguem por tag, como previsto; os digests resolvidos estão no handoff.

## O que esta fase prova e o que não prova

Prova, em ambiente local e descartável: que o frontend allberto autentica, lê e grava num Invoice Ninja 5.13.49 real, idêntico ao fork do projeto; que os KPIs do Painel batem com valores conhecidos; que a visão geral da fatura mostra os valores persistidos; que o PDF é gerado; que os dados sobrevivem a parada e retomada.

Não prova:
- permissões de usuário não administrador;
- gateway de pagamento, cobrança automática, estorno por gateway, webhooks;
- entrega real de e-mail e o histórico de e-mails com eventos de provedor;
- exportações, importação, relatórios;
- telas não visitadas pelo smoke (orçamentos, produtos, despesas, configurações e as demais);
- produção, VPS, HTTPS, DNS, backup, desempenho;
- compatibilidade com versões do backend diferentes da 5.13.49.

Suíte completa, lint e build foram informados pelo coordenador (345 testes em 48 arquivos, 1.786 arquivos no lint, build aprovado); não os repeti. A tentativa de saída de rede de dentro do container e a comparação antes/depois dos recursos Docker alheios vêm da evidência do Astra.
