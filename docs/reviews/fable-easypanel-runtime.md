# Revisão final do CTO — allberto publicado no EasyPanel

Data: 19/11/2026. Revisor: Claude Fable 5.2. Somente leitura de artefatos e evidências; não repeti build, chamadas de API, navegador nem alterei nada.

Publicado: `https://allberto-web.cxfujw.easypanel.host`, com a API em `https://allberto-backend.cxfujw.easypanel.host`.
Fonte do frontend: `f5cb28edb1123fd7ac1a8db3c6091f19e8f8d19d`. `main` em `32c777a0c2c186b1b4c3a581255682cd53c189d3` (PR #5).

## Veredito

**Entrega de homologação aprovada.** Os critérios de aceite da arquitetura foram atendidos ou têm ressalva explícita, e não encontrei bloqueio.

**Não está aprovado para dados reais.** As condições estão na seção 4 e não mudaram: são as mesmas declaradas desde a arquitetura.

## 1. O que verifiquei eu mesmo

- **Pacote publicado:** calculei o SHA-256 do pacote local e do arquivo baixado da release pública. Os dois dão `fcbf81bc…6351d1ac5`, o mesmo valor fixado em `deploy/easypanel/Dockerfile` na `main`.
- **PDF final:** abri a imagem renderizada. A marca do Invoice Ninja aparece no rodapé, não há ícone de imagem quebrada nem texto alternativo no topo, e os valores são R$ 10,00 em item, total e saldo.
- **Evidências em JSON:** li as seis, com possíveis links privados redigidos antes da leitura.
- **Relato do operador:** li as etapas 6 a 8.
- **Segredos e dados privados:** varredura por padrão em `docs/`, `deploy/` e `README.md` (chave de aplicação, senha gerada, link de convite) sem ocorrência; nenhum endereço de e-mail real nos documentos do operador.

Tudo o mais nesta revisão é leitura de evidência produzida pelo coordenador e pelo operador.

## 2. Critérios de aceite

### Publicação e contrato (E)

| # | Situação | Evidência |
| --- | --- | --- |
| E1 serviços alheios intactos | Atendido | O painel não tinha outros projetos; o inventário mostrou só o proxy e o próprio painel |
| E2 nada exposto além do proxy | Atendido | Nenhum container com porta publicada; 3306, 6379 e 9000 recusam conexão de fora |
| E3 versão e imagem | Atendido | `X-APP-VERSION: 5.13.49` em todas as respostas; as três imagens fixadas por digest; primeira execução em amd64 |
| E4 frontend e rota profunda | Atendido | `/version.json` com a revisão `f5cb28e…`; `/invoices` e `/clients` devolvem o HTML publicado |
| E5 bundle sem endereço local nem segredo | Atendido | Verificador aprovado sobre o pacote; o JavaScript servido tem hash idêntico ao do pacote e contém a origem da API |
| E6 login real | Atendido | precheck, login e refresh com 200 e CORS; Painel, Clientes e Faturas renderizados em português |
| E7 cadastro por API recusado | Atendido | `POST /api/v1/signup` → 403; `/setup` redireciona para a raiz |
| E8 cliente, fatura e PDF de teste | Atendido | Fatura de teste com total 10; PDF 200, 96.526 bytes, servido pela origem HTTPS da API |
| E9 persistência e dump | Atendido, com limite | Mesmos registros depois dos dois redeploys; dump de 504.900 bytes com hash conferido antes e depois. **Restauração não testada** |
| E10 nenhum segredo em documento | Atendido | Varredura acima |

### HTTPS (H)

| # | Situação | Evidência |
| --- | --- | --- |
| H1 certificado válido nos dois hosts | Atendido | Requisições com validação TLS ativa, de fora e de dentro do `app` |
| H2 raiz sem laço de redirecionamento | Atendido | `GET https://…/` → 200 direto |
| H3 HTTP redireciona para HTTPS | Atendido | 301 para a mesma URL em `https://` |
| H4 versão no cabeçalho | Atendido | 5.13.49 |
| H5 links com a origem HTTPS | Atendido | O PDF é servido pela origem HTTPS da API; o coordenador relatou portal e PDF funcionando por HTTPS |
| H6 sem conteúdo misto nem erro de CORS | Relatado | A interface funcionou de ponta a ponta; não há relatório de rede do navegador entre as evidências |

### Rede de saída (N)

| # | Situação | Evidência |
| --- | --- | --- |
| N1 redes | Atendido | `app` em `backend` e `egress`; MySQL e Redis só em `backend`, que segue interna |
| N2 saída só onde deve | Atendido | Do `app`, a marca externa responde 200; do MySQL, não há rota padrão e a resolução de nome falha |
| N3 marca visível no PDF | Atendido | Vi a imagem |
| N4 logotipo da empresa no topo | Não exercitado | Nenhum logotipo foi cadastrado. O topo deixou de mostrar imagem quebrada porque o `app` agora alcança o próprio endereço público e carrega a imagem em branco padrão. Era a dúvida que eu havia deixado em aberto na seção 16; está respondida |
| N5 configuração ativa | Atendido | Sentry vazio, autoatualização desligada, e-mail em log |
| N6 rota de autoatualização | Dispensado | Por recomendação minha: a chamada poderia iniciar uma atualização real se a configuração falhasse. N5 é a prova |
| N7 e-mail só em log | Atendido | Transporte conferido como log antes do envio; uma mensagem fictícia, contada uma vez |
| N8 H e E7 após a saída | Atendido | Repetidos depois do redeploy |
| N9 memória | Atendido | `app` com 678 MiB em repouso, total perto de 1,2 GiB, sem reinício nem encerramento por falta de memória. Medição pontual, sem carga |

### Frontend pré-compilado (W)

| # | Situação |
| --- | --- |
| W1 hash do arquivo público | Atendido; conferi |
| W2 verificador sobre o pacote | Atendido |
| W3 build leve na VPS, sem Node | Atendido; deploy concluído em 6 segundos |
| W4 revisão em `/version.json` | Atendido |
| W5 hash errado falha | Atendido na versão anterior do mesmo arquivo; não repetido para a v2, e não precisava |

### Correção do campo numérico

A correção está no ar: a revisão publicada é a que revisei e aceitei, e o arquivo servido tem o mesmo hash do pacote verificado.

O ciclo 10 → 11 → 10 no ambiente publicado persistiu corretamente. **Ele não prova o caso crítico**, e o operador foi correto em dizer isso: a automação levou 917 ms entre digitar e sair do campo, acima dos 500 ms em que o defeito se manifestava. A prova estrita é a local, com clique real a 43,4 ms. A combinação das duas com o hash idêntico sustenta a conclusão; um clique rápido de uma pessoa no ambiente publicado ainda não foi feito.

## 3. Ressalvas que acompanham a aprovação

1. **`TRUSTED_PROXIES=*` com o `nginx` na rede do painel.** O operador observou o `nginx` ligado à rede `easypanel`. Qualquer outro serviço que venha a existir nesse painel alcança o `nginx` por essa rede e pode forjar os cabeçalhos de origem. Hoje não há outro projeto. Antes de instalar outros serviços nesta VPS, ou antes de dados reais, trocar `*` pela faixa dessa rede. O valor é uma variável de ambiente; não exige mudança de código.
2. **Backup dentro do volume da aplicação.** Como previsto, depois do redeploy a pasta ficou `0755`/`0644`, do usuário da aplicação. Os hashes continuam íntegros. Não fica exposto pela web.
3. **Sem swap e com cerca de 1,2 GiB em uso de 3,8.** Folga suficiente em repouso; o pico ao gerar vários PDFs ao mesmo tempo não foi medido.
4. **Base do `nginx` por tag.** As duas imagens `nginx:alpine` (backend e web) são resolvidas a cada build. Não guardam dado.
5. **Dados de teste arquivados, não apagados.** O cliente e a fatura fictícios continuam no banco, arquivados. O número de fatura `0001` já foi consumido.
6. **Observação sobre o PDF de rascunho.** O PDF mostra "Saldo devedor R$ 10,00" enquanto a API devolve saldo 0 para a mesma fatura em rascunho. É o comportamento do Invoice Ninja: o saldo só passa a valer quando a fatura é enviada. A visão geral do allberto mostra o valor da API. Registro para ninguém estranhar a diferença.

## 4. Condições antes de dados reais

Nenhuma é nova. Enquanto não forem cumpridas, o ambiente é de homologação.

1. **Backup com destino fora da VPS, retenção definida e uma restauração testada.** Hoje existe uma cópia, na mesma máquina, nunca restaurada.
2. **`APP_KEY` guardada pelo proprietário fora do painel.** Sem ela, nenhum backup serve.
3. **Decisão sobre e-mail.** O transporte está em log. Para enviar faturas é preciso um provedor, e a partir daí a contenção deixa de existir: a saída de rede já está aberta.
4. **Restringir `TRUSTED_PROXIES`** (ressalva 1).
5. **Decisão sobre o domínio.** O endereço atual é temporário. Trocar para `allber.to` muda `APP_URL` e exige novo pacote do frontend; links já enviados deixam de valer. O ideal é trocar antes de emitir a primeira fatura real.
6. **Logotipo da empresa cadastrado**, se as faturas forem para clientes.
7. **Um teste com usuário não administrador**, se mais alguém além do proprietário for usar.

## 5. O que não foi testado

- Restauração de backup e backup externo.
- Entrega real de e-mail e o histórico de e-mails com eventos de provedor.
- Gateway de pagamento, cobrança automática, estorno, webhooks.
- Permissões de usuário não administrador.
- Clique humano em menos de 500 ms no ambiente publicado.
- Carga, concorrência e pico de memória.
- Telas não visitadas: orçamentos, produtos, despesas, relatórios, configurações e as demais.
- A rota de autoatualização, por decisão.
- Navegação em tela pequena e tema escuro no ambiente publicado; foram verificados só localmente.

## 6. Histórico desta entrega

Para quem ler depois, os pareceres que sustentam este:
- `docs/architecture-easypanel.md` — decisões, com os adendos 14 (HTTPS), 15 (frontend pré-compilado) e 16 (saída de rede);
- `docs/reviews/fable-easypanel-artifacts.md` — artefatos de deploy;
- `docs/reviews/fable-number-input.md` — defeito do campo numérico e sua correção;
- `docs/reviews/fable-pdf-runtime.md` — imagens quebradas no PDF;
- `docs/handoffs/easypanel-live-inventory.md` — o que o operador observou e fez no painel.

Duas correções que fiz ao longo do caminho, por ter errado antes: afirmei que `next_send_date` chegava só como data, e a API real devolve com horário; e li o texto do PDF local sem reconhecer que "logo" ali era uma imagem quebrada.
