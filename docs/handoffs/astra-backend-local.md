# Astra — backend real local

19/11/2026. Implementação conforme GO em `docs/architecture-local-backend.md`, sem produção/WHMCS e sem reset de contas upstream.

## Entrega

- `local-backend/compose.yml`: projeto `allberto-ninja-local`, contexto usado em todas as operações `desktop-linux`; app/mysql/redis somente na rede internal; nginx publica apenas `127.0.0.1:8012`. Quatro volumes próprios, restart desabilitado.
- `nginx/*.conf`: arquivos oficiais do commit `84cc592bc09952eaac0393dc885e09db38b358c5`, origem anotada; somente espaços finais normalizados, sem alteração semântica. `laravel.conf` foi lido integralmente.
- `env.example` e `init-env.sh`: segredo aleatório por openssl, `.env` ignorado com modo 0600. Segunda inicialização comparou hash em memória e preservou arquivo. Não versionar nem compartilhar `.env` ou logs brutos do app.
- `smoke.mjs`: trava URL exata localhost:8012, email @allberto.test e container app deste projeto rodando; token só em memória. Reutiliza registros ALB-LOCAL, valida IDs, valores, PDF e log de email. Execução deliberada com URL externa foi rejeitada antes de qualquer acesso API.
- `browser-smoke.mjs`: Playwright/Chrome já instalado, sem mocks, sem importar setup/fixtures upstream. Login pela tela, KPIs exatos, calendário, quatro listas, detalhe de cliente, total/pago/saldo da fatura, alternância editar/visão geral e reload autenticado. Relatório grava somente método/path/status, nunca headers/body/token. Não gera trace autenticado.

Frontend real permanece em **http://127.0.0.1:3100**, terminal Orca **term_1702dce7-2cf8-4f0b-9147-b61465aa3e44**. Comando: `VITE_API_URL=http://localhost:8012 VITE_IS_HOSTED=false npm run dev -- --host 127.0.0.1 --port 3100 --strictPort`. O terminal exec inicial 69775 foi encerrado deliberadamente após identificar seu processo Vite para transferir à sessão persistente. Preview fixture 4178 preservado.

Credenciais locais: email `admin@allberto.test`; senha somente em `local-backend/.env` (`IN_PASSWORD`). Nenhuma chave ou token neste documento.

## Evidências A1–A10

Todas em `local-backend/evidence/`, ignorado pelo Git. Coordenador selecionará apenas arquivos sanitizados para documentação pública.

| Critério | Resultado | Evidência |
| --- | --- | --- |
| A1 | PASS: versão API 5.13.49 e manifesto do container arm64 `sha256:c0dadfee7ca70cd7407bffc353597f27c07cca815564e35ec0570c13ccd1437f` | `running-manifest.json`, `image-manifest.txt`, smoke |
| A2 | PASS baseline real sem 404/405/4xx/5xx/erro JS; encontrado e corrigido contador calendário, detalhes abaixo | `browser-report.json`, capturas |
| A3 | PASS: loopback 8012 único binding, DB/Redis sem publicação, app somente rede internal; curl externo de dentro app falhou | `services.txt`, `network.txt` |
| A4 | PASS: `.env` ignorado 0600, segredo preservado e não anexado | git check-ignore + self-check local |
| A5 | PASS: BRL/pt_BR, 3 clientes, 3 faturas, recorrente ativa, pagamento parcial; MRR 75 / a receber 300 / vencido 200 / recebido 23,45; pago 23,45 / saldo 100 | `summary.json`, `chart-values.json`, `smoke-after-restart.log` |
| A6 | PASS: PDF real, 39.020 bytes após configurar Brasil, MIME application/pdf, assinatura %PDF; texto contém cliente,123,45 e Serviço | `invoice.pdf`, `pdf-text.txt` |
| A7 | PASS log e sent_date; ressalva: histórico de provedor vazio neste transporte | `mail-summary.json` |
| A8 | PASS: stop/up somente projeto, mesma empresa/IDs/saldos; smoke repetido idempotente | `before-restart.json`, `summary.json`, `restart.log`, smoke |
| A9 | PASS final com exit 0: KPIs em BRL exatos, calendário 1 cobrança, total/pago/saldo, edição UI de cliente + PUT 200 + GET persistido e reload autenticado | `browser.log`, `browser-report.json`, screenshots |
| A10 | PASS: containers/volumes/redes alheios iguais antes/depois | `isolation-summary.json`, snapshots docker-before/after |

Digests resolvidos arm64 das tags auxiliares:

- nginx: `sha256:0563c36f94a6d3ec3584161b77859f740f7e20b4853f52c796a864ce6908e8ea`
- mysql: `sha256:a81d043930e51745522bd5c430961cf8286f0a23f0a9a2a6e0108f7ea71b0902`
- redis: `sha256:7958cfbb9d152f87dadfbc89f1b0b15938f0b81ff8982feb327476f4911935c3`

## Achados e correções

A API 5.13.49 fornece `next_send_date = "2026-11-22 00:00:00"`. `withinWindow` aceitava a data, mas o calendário de `UpcomingCharges` comparava a string integral com `YYYY-MM-DD`, exibindo zero para uma cobrança existente. Com autorização do coordenador, `Sections.tsx` normaliza usando dayjs já importado. Teste `tests/unit/allberto-upcoming-charges.test.ts` renderiza o componente e verifica1 cobrança em 22/11 e 0 nos demais dias, para timestamp real e date-only. **2/2 PASS**, lint dos 2 arquivos PASS. Coordenador reportou após a correção **345 testes/48 arquivos PASS, lint 1.786 PASS, build TypeScript/Vite PASS**, logs `/tmp/allberto-backend-{unit,lint,build}.log`.

O email real foi registrado com subject ALB-LOCAL-Mail-Smoke e destinatário cliente2@example.test no log do container; invitation tem sent_date. `/api/v1/emails/clientHistory` retorna[]: `app/Http/Controllers/EmailHistoryController.php` filtra SystemLog com history.events; `app/Listeners/Mail/MailSentListener.php` registra sent_date/message_id na invitation. Não há comprovação de entrega externa nem histórico de eventos de provedor com MAIL_MAILER=log. Mantida rede internal e sem mudança backend.

Durante construção do smoke houve ajustes de teste, não de contratos: PDF exige os mesmos headers autenticados de InvoiceViewer; template de email é email_template_invoice; clientHistory usa POST. Uma tentativa inicial de login submetia form por evaluate antes de sincronizar estado, substituída por clique real. Modal welcome da empresa inicial podia cobrir a captura/edição; empresa agora recebe nome Allberto Local no bootstrap. O país inicial EUA sobrepunha os separadores de BRL em Number.formatMoney; empresa e clientes foram configurados como Brasil pelos statics, produzindo R$ 23,45 sem mudar o formatter. A edição de cliente usa o botão Salvar da página, pois o shell atual não o coloca dentro de topNavbar; após salvar, o fluxo retorna à visão geral.

## Operação e limites

Subir: `sh local-backend/init-env.sh` e `docker --context desktop-linux compose -p allberto-ninja-local -f local-backend/compose.yml --env-file local-backend/.env up -d`.

Validar: `node local-backend/smoke.mjs` e `node local-backend/browser-smoke.mjs` (frontend 3100 deve estar rodando). Parar preservando dados: mesmo comando Compose com `stop`. Não usar down-v/prune/reset.

Fixtures datadas servem a semana desta validação; após passar a data da recorrente/mudar mês, o smoke deve falhar em vez de fingir os mesmos KPIs. O backend fica rodando com cron local, então recorrente pode gerar nova fatura quando chegar a data. Transporte permanece log e rede sem egress. Nenhum gateway, ACL não admin, envio externo, cobrança automática ou implantação foi validado. Não foi alterada versão backend nem adicionada dependência.

## Resultado final

Smoke API repetido passou após reinício e após configuração de país. Browser final terminou naturalmente com exit 0: 150 respostas de API, nenhum erro JavaScript, nenhuma requestfailed e nenhuma resposta HTTP >=400. Captura `dashboard.png` inspecionada: shell Allberto, moeda BRL com vírgula, quatro KPIs corretos e uma cobrança em 22/11. O teste salvou website fictício de um cliente pela UI e confirmou o mesmo valor no GET após reabrir o editor. Fontes congeladas para revisão CTO; único limite de aceite conhecido é A7 (histórico de provedor vazio no transporte log).
