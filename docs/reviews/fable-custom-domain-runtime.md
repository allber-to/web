# Revisão final do CTO — migração para `allber.to` (story 004)

Data: 19/11/2026. Revisor: Claude Fable 5.2, como CTO. Base: `main` em `631de1386` (PR 7, CI verde no head `2251e1b81`).

## Veredito

**Migração aceita em serviço, TLS, backend e pacote publicado. D8 (login real no navegador) continua pendente: a única tentativa não chegou ao aplicativo. A story 004 não deve ser fechada antes dele.**

Dez dos onze critérios estão atendidos. Nenhum achado bloqueia. O ambiente continua sendo homologação: o domínio próprio não o torna apto a dados reais.

## Como revisei

Só leitura. Não fiz chamadas à API, consultas de DNS, navegação, build nem qualquer alteração fora deste arquivo.

- Li as evidências em `/tmp/allberto-custom-domain-release/`: `dns-check.json`, `api-domain-before-appurl.json`, `backend-after-domain.json`, `frontend-final-check.json`, `w2-check.json`, `public-download-check.json`, os dois registros de host iniciais, o resumo da release, o texto extraído do PDF e a imagem renderizada.
- Li o handoff do operador, a story 004 e a arquitetura.
- Recalculei localmente o SHA-256 de quatro arquivos do pacote extraído e dos dois arquivos compactados, e conferi o pin no `Dockerfile` do repositório.
- Não li os dois arquivos privados da pasta (`before-migration.json`, `portal-origin-diagnosis.json`), o PDF em si nem o ambiente do backend.

## Critérios D1–D11

| # | Resultado | Base |
| --- | --- | --- |
| D1 — delegação e registros | **Aceito** | `dns-check.json` (17:57 UTC): NS `jerry` e `melinda.ns.cloudflare.com`; apex e `api` em `192.102.140.18`; `www` como CNAME do apex; os cinco MX e o SPF iguais aos de antes. |
| D2 — TLS nos três hosts | **Aceito** | `api`: validado por resolução normal. Apex e `www`: validados com resolução explícita para a VPS e verificação normal de certificado. Ver "Serviço e propagação". |
| D3 — raiz sem laço, HTTP → HTTPS, versão | **Aceito** | Raiz e `/health` 200, `/setup` 302 para a nova raiz, `http://` 301 para `https://`, versão 5.13.49. Medido antes da troca de `APP_URL`; depois dela, as onze chamadas autenticadas responderam 200 com a mesma versão. |
| D4 — dados preservados | **Aceito** | Mesmos identificadores: empresa Allberto, BRL, Brasil; cliente e fatura fictícios arquivados e não excluídos; fatura 0001, total 10, pago 0, rascunho; zero clientes e faturas ativos. |
| D5 — link do portal e PDF | **Aceito** | Origem do portal `https://api.allber.to` com as chaves de convite inalteradas. PDF 200 pelo caminho autenticado, sem restaurar nada. Ver "PDF". |
| D6 — versão e JavaScript servidos | **Aceito** | Os hashes servidos em apex e `www` são iguais aos que recalculei no pacote local (tabela abaixo). |
| D7 — verificador e hash da release | **Aceito** | Pacote local, download público e pin do `Dockerfile` têm o mesmo SHA-256 `7a893ca6…12f6`. `w2-check.json`: revisão exata, origem da API presente, zero endereços de serviço local, zero assinaturas de segredo. |
| D8 — login real no navegador | **Pendente** | Uma tentativa, sem sucesso e sem credenciais enviadas. Ver "D8 e saúde após o deploy". |
| D9 — `www` sem redirect | **Aceito** | Dez respostas (cinco caminhos por host), todas 200 com zero redirecionamentos e HTML idêntico entre apex e `www`. Segue a preferência explícita do proprietário, que substituiu minha recomendação de redirecionar. |
| D10 — hosts temporários | **Aceito** | O web temporário entrega o pacote novo; a raiz do backend temporário responde 200. |
| D11 — configuração do backend | **Aceito** | Relato do operador: `APP_URL` novo, Sentry vazio, autoatualização desligada, e-mail em log; arquivo de ambiente comparado com a cópia anterior, só `APP_URL` diferente. Não tenho evidência independente além do handoff. |

### Hashes que eu mesmo recalculei

| Arquivo | SHA-256 local | Igual ao servido |
| --- | --- | --- |
| `version.json` | `bedef8f4…9d61` | sim, apex, `www` e web temporário |
| `index.html` | `167c85c3…63f7` | sim, em `/`, `/dashboard` e `/clients` dos dois hosts |
| `react/index-BTiSf8Om.js` | `814f4ec0…a702` | sim (apex) |
| `react/colors-mt5QUWN6.js` | `97317929…5802` | sim (apex) |

O chunk `colors` contém `https://api.allber.to`, e nenhum arquivo de `dist/react` contém o host temporário.

## Serviço e propagação

São duas afirmações diferentes, e só a primeira está provada para apex e `www`.

- **Serviço e certificado na VPS: provado.** As requisições a `allber.to` e `www.allber.to` foram feitas com o nome real e o endereço da VPS informado explicitamente. A verificação de certificado e de nome continuou ativa; o campo `tlsVerify: 0` é o código de sucesso dessa verificação, não verificação desligada.
- **DNS público: correto.** Autoritativos e os resolvedores `1.1.1.1` e `8.8.8.8` devolvem os registros novos.
- **Propagação em todos os caches: não provada.** Às 18:22 UTC o resolvedor do Mac ainda devolvia os endereços de estacionamento para apex e `www`. `api.allber.to`, que não existia antes, já resolvia certo.

Consequência para D8: um navegador que use esse mesmo resolvedor não chega ao aplicativo. Foi o que aconteceu na primeira tentativa, descrita abaixo. Quando D8 for refeito, o relato precisa dizer que a página carregada era o Allberto (por exemplo, pela revisão em `version.json`), e não só que "o login funcionou".

## D8 e saúde após o deploy

Fatos relatados pelo coordenador e pelo operador depois da primeira versão desta revisão. Não repeti nenhuma consulta.

**Saúde do web.** O deploy criou uma nova instância do serviço web. No console dela, `/healthz` respondeu `ok` e `/version.json` trouxe a revisão `d8a873829cbbc2ba1f71df71b0022829e2568443`, de 17:27:33 UTC. O endpoint do novo container está aprovado. A inspeção completa dos cinco containers (estado, reinícios, OOM, portas, volumes) **não foi repetida** depois do deploy do web; a última é a do D11. O backend não foi reimplantado desde então, e nada indica mudança nele, mas isso é ausência de evento, não uma nova medição.

**D8.** Houve uma única navegação a `allber.to`, que terminou em `ERR_CONNECTION_TIMED_OUT`. Nenhuma página carregou, nem o Allberto nem o estacionamento. Nenhuma credencial foi digitada e não houve recarga.

**Causa provável: resolução local do Mac.** Neste computador, a consulta direta de DNS já devolve o endereço correto, mas a resolução do sistema, a que navegador e `curl` usam, continua entregando o endereço de estacionamento, e o `curl` sem resolução explícita falha. Isso é coerente com cache local de nomes; não foi demonstrado por outro meio. Limpar o cache sem privilégio não resolveu, e a limpeza privilegiada exige senha, então não foi executada. O coordenador perguntou ao proprietário se ele prefere limpar o cache ou aguardar expirar.

O que isso muda no veredito: nada no serviço, que segue provado na VPS. D8 continua pendente, e a falha observada não é evidência contra o aplicativo, porque a conexão nem chegou à VPS. Também não é evidência a favor. Um teste a partir de outra rede ou aparelho serviria para D8 tanto quanto esperar este Mac.

## Backend e `portal_domain`

A correção seguiu o que confirmei na fonte: um único `PUT` com `portal_domain` e `portal_mode`, sem `settings`. A comparação antes/depois mostra apenas `portal_domain` e `updated_at` alterados, `settings` e chaves de convite iguais. A sequência de chamadas registrada tem esse `PUT` como única escrita.

As respostas trazem CORS `*`, mas foram feitas por script. Preflight e conteúdo misto só o navegador exercita; ficam com D8.

## PDF

Abri a imagem renderizada: uma página, fatura 0001, item "Teste de implantação", quantidade 1, total R$ 10,00, saldo R$ 10,00, marca do Invoice Ninja íntegra no rodapé, nenhuma imagem quebrada. Confere com o texto extraído.

Três limites:

- O PDF não mostra o link do portal. A parte "link com a nova origem" de D5 se apoia no campo calculado pela API, não no PDF.
- O topo não tem logotipo porque a empresa ainda não cadastrou um. Cadastrar agora, depois da troca de `APP_URL`, como previsto.
- A requisição sem token devolve 403. É o comportamento correto da rota, não um defeito.

## Achados

Nenhum bloqueia.

1. **Médio — D8 pendente.** Falta o login real em `https://allber.to`. A única tentativa parou na resolução local do Mac, antes de alcançar a VPS.
   **Baixo — inspeção final não repetida.** O novo container do web responde no endpoint de saúde com a revisão certa, mas o estado completo dos cinco containers não foi medido de novo após o deploy do web.
2. **Baixo — documentação final fora do `main`.** O PR 7 foi mesclado, mas `README.md`, `docs/staycloud.md`, a arquitetura, o handoff e a story têm alterações locais não commitadas. Os resultados de D3 em diante ainda não estão no repositório.
3. **Baixo — handoff do operador desatualizado no topo.** O parágrafo "Estado atual" dizia "Web não reimplantado", sem seção sobre o deploy do web. O operador está atualizando.
4. **Baixo — arquitetura com dois trechos superados.** O parágrafo final da seção 6 sugeria restaurar a fatura para D5, e a seção 9 listava como não verificados itens já confirmados. O coordenador informa que ambos já foram corrigidos no checkout; não reli.
5. **Informativo — sessões separadas em apex e `www`.** Consequência aceita da escolha sem redirect: quem alternar entre os dois hosts faz login em cada um.
6. **Informativo — rollback do portal.** Com `portal_domain` na nova origem, voltar só o `APP_URL` não devolve os links ao host temporário. A arquitetura já registra isso na seção 7.

## O que esta migração prova e o que não prova

Prova: DNS delegado com e-mail preservado; três hosts com certificado válido na VPS; backend respondendo na nova origem com os mesmos dados; links de portal na nova origem; PDF gerado; frontend publicado idêntico ao pacote verificado; hosts temporários disponíveis para reversão.

Não prova:

- login, preflight de CORS e ausência de conteúdo misto no navegador (D8);
- que todos os resolvedores já entregam o destino novo;
- funcionamento do encaminhamento de e-mail da Namecheap depois da troca de nameservers; só os registros foram preservados, e não havia destinatário configurado;
- IPv6, que continua sem registro e sem verificação;
- qualquer item fora do escopo: gateway, envio real de e-mail, usuário não administrador.

## Limites da homologação, inalterados

Continuam valendo os da revisão `fable-easypanel-runtime.md`: sem backup externo e sem restauração testada, e-mail em log, `TRUSTED_PROXIES` em `*`, custódia da `APP_KEY`. **Não usar com dados financeiros reais até resolver esses pontos.**

## Para fechar a story

1. Refazer D8 quando a resolução local estiver correta, ou a partir de outra rede, com a confirmação de que a página era o Allberto.
2. Commitar a documentação pendente, incluindo as correções dos achados 3 e 4.
3. Opcional: repetir a inspeção dos cinco containers, para ter uma medição posterior ao deploy do web.
