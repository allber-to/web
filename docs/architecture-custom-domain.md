# Arquitetura — domínio próprio (`allber.to`)

Data: 19/11/2026. Decisão técnica: Fable 5.2 (CTO). Base: `main` em `d8a873829`. Ambiente publicado e aprovado em homologação (`docs/reviews/fable-easypanel-runtime.md`).

Nota de execução do coordenador: domínio adquirido e conta StayCloud foram posteriormente confirmados pelo operador. O estado atual, registros efetivamente salvos e pendências estão em [operação ao vivo](handoffs/custom-domain-live.md) e [story 004](stories/004-custom-domain.md); a seção 1 abaixo preserva o estado no momento da decisão.

Adendo do coordenador: o proprietário orientou cadastrar domínios em vez de redirecionamento. Essa decisão substitui a recomendação original para `www`: apex e `www` serão hosts do mesmo serviço web, sem redirect entre eles. D9 abaixo acompanha essa preferência; sessões por origem continuam independentes.

**Decisão: o plano do coordenador está correto e pode seguir, na ordem da seção 5.** Acrescento quatro ajustes, na seção 3.

Não usei navegador, VPS nem painel. Li a fonte e a documentação já consultadas e fiz consultas públicas de DNS, somente leitura.

## 1. Presumido e confirmado

| Item | Estado |
| --- | --- |
| O domínio comprado é `allber.to` | **Presumido.** Confirmar na página de confirmação da Namecheap antes de qualquer alteração. Se for outro nome, este documento vale trocando o nome, mas a seção 2 precisa ser refeita |
| O domínio está na conta Namecheap do proprietário | Presumido |
| A conta Cloudflare é a da StayCloud | Presumido; confirmar o nome da conta na interface antes de adicionar a zona |
| Nameservers que a Cloudflare vai atribuir | **Desconhecidos.** São gerados ao adicionar a zona. Copiar da interface; não supor |
| IP da VPS `192.102.140.18` | Confirmado nas fases anteriores |

## 2. Estado público de `allber.to` hoje

Consultas de DNS que fiz em 19/11/2026. Valem só se o domínio for mesmo este.

| Registro | Valor observado | O que é |
| --- | --- | --- |
| NS | `dns1.registrar-servers.com`, `dns2.registrar-servers.com` | DNS padrão da Namecheap |
| A (apex) | `192.64.119.103` | Página de estacionamento ou redirecionamento da Namecheap |
| `www` | CNAME para `parkingpage.namecheap.com` | Estacionamento |
| MX | cinco hosts `eforward*.registrar-servers.com` | Encaminhamento de e-mail da Namecheap |
| TXT | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | SPF do mesmo encaminhamento |
| `api` | não existe | — |
| DS | **nenhum** | DNSSEC não está ativo na delegação |
| CAA | nenhum | Nada restringe a emissão de certificado |

A zona `.to` é assinada, então a ausência de DS significa delegação sem DNSSEC, não falha de consulta. **Trocar os nameservers neste estado não quebra a resolução.**

## 3. Ajustes ao plano

**1. Os registros de estacionamento precisam ser substituídos; os de e-mail, preservados.**
Ao importar a zona, a Cloudflare tende a trazer o A do apex e o CNAME de `www` apontando para o estacionamento da Namecheap. Esses dois são substituídos pelos nossos: não são registros de e-mail e conflitam com o que vamos criar. Os cinco MX e o TXT de SPF ficam como estão. Anotar tudo o que a importação trouxer antes de mexer.

Não sei se o encaminhamento de e-mail da Namecheap continua funcionando com nameservers de terceiros, mesmo com os MX copiados. Antes de trocar os NS, conferir na Namecheap se existe algum endereço de encaminhamento configurado. Se existir, parar e avisar: é o único ponto em que a troca pode interromper algo em uso.

**2. `www` como host adicional, por orientação posterior do proprietário.**
O frontend guarda a sessão no navegador por origem. A recomendação inicial do CTO foi redirecionar `www` ao apex, mas o proprietário escolheu cadastrar os domínios sem redirecionamento. Criar `allber.to` e `www.allber.to` no serviço web, ambos com HTTPS. Alternar entre esses hosts pode exigir login separado; o backend e os dados são os mesmos. Nenhuma regra adicional no nginx ou em Redirecionamentos do EasyPanel é necessária.

**3. Proxy da Cloudflare desligado, e assim deve ficar nesta fase.**
"Somente DNS" nos três registros. É uma escolha nossa, não uma impossibilidade: é possível emitir certificado com o proxy ligado. Escolho assim porque simplifica a emissão e o diagnóstico, já que o painel valida o domínio recebendo a requisição direto na VPS, e porque evita acrescentar uma camada de proxy que mudaria o modo de TLS e o endereço que o backend vê como cliente. Ligar o proxy depois é outra decisão, com ajuste de `TRUSTED_PROXIES`.

**4. Manter os hosts temporários até o fim, e depois.**
Eles são o rollback. Não remover nesta tarefa.

## 4. O que muda e o que não muda

### DNS (Cloudflare, zona gratuita)

| Nome | Tipo | Valor | Proxy |
| --- | --- | --- | --- |
| `allber.to` | A | `192.102.140.18` | desligado |
| `api` | A | `192.102.140.18` | desligado |
| `www` | CNAME | `allber.to` | desligado |

Sem curinga. Sem AAAA: a VPS não foi verificada em IPv6, e um AAAA errado quebra o acesso para quem prefere IPv6.

### EasyPanel

| Serviço | Domínio novo | Destino |
| --- | --- | --- |
| `web` | `allber.to` | porta 80, HTTPS |
| `web` | `www.allber.to` | porta 80, HTTPS, host adicional sem redirect para o apex |
| `backend` | `api.allber.to` | serviço interno `nginx`, porta 80, HTTPS |

Os domínios `*.cxfujw.easypanel.host` continuam.

### Backend

Uma variável muda: `APP_URL=https://api.allber.to`, sem barra final. Todo o resto do ambiente fica igual: `APP_KEY`, senhas, `TRUSTED_PROXIES`, volumes. Redeploy do serviço `backend`.

### Frontend

Novo pacote com `VITE_API_URL=https://api.allber.to`, pelo caminho da seção 15 de `docs/architecture-easypanel.md`: build fora da VPS, verificador, release pública, URL e hash no `deploy/easypanel/Dockerfile`, PR, deploy do `web`.

### Riscos avaliados

- **Cookies:** a arquitetura é compatível com a migração. A autenticação do aplicativo é por token em cabeçalho, e o portal do cliente usa cookie de sessão que vive inteiro em `api.allber.to`, sem cruzar domínios. Isso é leitura do desenho; a confirmação é o login real nas novas origens (D8).
- **CORS:** a configuração não muda. O backend aceita qualquer origem com token em cabeçalho, então o frontend em `allber.to` chamando `api.allber.to` deve funcionar como hoje. Também depende de D8 para ser dado como verificado.
- **`TRUSTED_PROXIES`:** não muda. Quem fala com o `nginx` continua sendo o proxy do painel. A ressalva de restringir `*` segue aberta, independente desta tarefa.
- **Links já emitidos:** nenhum real. Só existe a fatura fictícia arquivada. É o melhor momento para trocar.
- **Janela entre o redeploy do backend e o novo frontend:** o frontend antigo continua chamando o host temporário da API, que segue respondendo. Os links gerados já saem com o domínio novo. Não há indisponibilidade; há alguns minutos em que interface e links usam nomes diferentes.
- **Logotipo da empresa:** o endereço do arquivo é gravado com o `APP_URL` do momento do envio. Nenhum foi enviado ainda. Cadastrar o logotipo **depois** da troca.
- **Certificado:** a emissão depende de o DNS já apontar para a VPS e da porta 80 alcançável. Se o domínio for adicionado no painel antes de o DNS propagar, a emissão falha e pode demorar a tentar de novo. Por isso a ordem abaixo.
- **DNSSEC:** hoje desligado; não ligar nesta tarefa. Se, na hora, a Namecheap mostrar DNSSEC ativo, **não trocar os nameservers**: primeiro desativar lá, esperar o DS sair do `.to`, e só então trocar. Ativar DNSSEC pela Cloudflare depois é opcional e exige cadastrar na Namecheap o DS que a Cloudflare fornecer, nunca um inventado.

## 5. Ordem segura

Cada etapa só começa quando a anterior tem a evidência indicada.

1. **Confirmar o nome do domínio** na confirmação da Namecheap, e a conta na Cloudflare.
2. **Inventariar na Namecheap:** nameservers atuais, estado do DNSSEC, endereços de encaminhamento de e-mail. Comparar com a seção 2.
3. **Adicionar a zona na Cloudflare**, plano gratuito. Anotar os registros importados e os dois nameservers atribuídos.
4. **Ajustar os registros na Cloudflare** conforme a seção 4, antes de trocar os nameservers: assim, quando a delegação mudar, as respostas já estão certas.
5. **Trocar os nameservers na Namecheap** pelos dois exatos da Cloudflare.
6. **Esperar a delegação.** Evidência: consulta pública de NS devolve os da Cloudflare, e `allber.to` e `api.allber.to` resolvem para `192.102.140.18`. Pode levar de minutos a algumas horas. Não seguir antes.
7. **Adicionar os três domínios no EasyPanel.** Evidência: os três respondem em HTTPS com certificado válido. Neste ponto `allber.to` já mostra o aplicativo, ainda com o frontend atual.
8. **Backend:** trocar `APP_URL` e redeployar. Verificar D3–D5.
9. **Frontend:** pacote, release, PR, deploy do `web`. Verificar D6–D8.
10. **Host adicional `www`**, sem redirect entre hosts conforme o proprietário. Verificar D9.

## 6. Critérios de aceite

| # | Critério | Evidência |
| --- | --- | --- |
| D1 | NS públicos de `allber.to` são os dois atribuídos pela Cloudflare; A do apex e de `api` é `192.102.140.18`; MX e SPF iguais aos de antes | consultas públicas de DNS, antes e depois |
| D2 | `https://allber.to`, `https://www.allber.to` e `https://api.allber.to` respondem com certificado válido | requisições com validação TLS ativa |
| D3 | `GET https://api.allber.to/` responde sem laço; a mesma URL em `http://` redireciona para `https://`; `X-APP-VERSION: 5.13.49` | sequência de status e cabeçalho |
| D4 | Conta, empresa e os registros arquivados continuam os mesmos depois do redeploy; nenhuma conta nova | leitura por API dos mesmos identificadores |
| D5 | O PDF da fatura de teste e o link de portal saem com `https://api.allber.to` | prefixo do link, sem a chave; PDF 200 |
| D6 | `https://allber.to/version.json` traz a revisão do novo pacote; o JavaScript servido contém `https://api.allber.to` e tem o hash do pacote verificado | respostas e hash |
| D7 | Verificador de bundle aprovado com a nova origem; hash da release pública igual ao do `Dockerfile` | saída do verificador e cálculo do hash |
| D8 | Login em `https://allber.to`, Painel carregado, sem erro de CORS nem conteúdo misto | status das chamadas, sem corpos |
| D9 | `https://www.allber.to/` e rota profunda servem o mesmo frontend, sem redirect para outro host | status, versão e HTML iguais ao apex |
| D10 | Os hosts temporários continuam respondendo | uma requisição a cada |
| D11 | Configuração do backend intacta além de `APP_URL`: Sentry vazio, autoatualização desligada, e-mail em log | o mesmo comando de três valores usado antes |

Validar só com o que já existe. Para D5, usar a fatura fictícia arquivada: restaurá-la, gerar o PDF e arquivá-la de novo, se o operador julgar seguro; caso contrário, registrar D5 como não verificado. Não criar dados novos, não enviar e-mail, não registrar pagamento.

## 7. Rollback

Em ordem do mais provável para o menos:

- **Frontend novo com problema:** reverter no `Dockerfile` a URL e o hash para a release anterior e redeployar o `web`. O pacote anterior aponta para o host temporário da API, que continua no ar.
- **Backend com `APP_URL` novo com problema:** restaurar o valor anterior e redeployar. Nenhum dado é tocado.
- **Certificado não emitido:** remover o domínio no painel, conferir o DNS e adicionar de novo. Os hosts temporários não são afetados.
- **DNS:** os registros novos são aditivos. Só voltar os nameservers à Namecheap se o e-mail encaminhado estiver em uso e parar.

Não há passo irreversível neste plano. O mais lento de desfazer é a troca de nameservers, por causa do tempo de propagação.

## 8. Fora desta tarefa

Backup externo, provedor de e-mail, gateway, restrição de `TRUSTED_PROXIES`, proxy da Cloudflare, DNSSEC e remoção dos hosts temporários. Seguem como estavam na revisão final da homologação, que continua valendo: o domínio próprio não torna o ambiente apto a dados reais.

## 9. Não verificado

- Que o domínio comprado é `allber.to`.
- Se há encaminhamento de e-mail configurado na Namecheap.
- Os nameservers que a Cloudflare vai atribuir.
- IPv6 na VPS.
- Se o EasyPanel desta instalação oferece regra de redirecionamento por serviço, e como ela se comporta.
- Login, cookies e CORS nas novas origens: só o teste real (D8) confirma.
