# Revisão dos artefatos — domínio próprio (`allber.to`)

Data: 19/11/2026. Revisor: Claude Fable 5.2, como CTO. Somente leitura e conferência de hash; sem navegador, VPS, alterações no Git nem novo build.

## Veredito

**Artefatos aceitos. O PR pode ser aberto como rascunho.** O pacote está correto e a única mudança de código são as duas constantes do `Dockerfile`.

**O build leve local pode ficar para o deploy.** Explico na seção 3.

**Nada disto autoriza o deploy do `web`.** Publicar este pacote antes de `api.allber.to` responder com certificado válido quebra o aplicativo nos dois endereços, o novo e o temporário, porque o frontend passaria a chamar uma API que ainda não existe.

## 1. O que conferi eu mesmo

| Item | Resultado |
| --- | --- |
| SHA-256 do pacote local | `7a893ca6a434f7f4344ba816b619009ada06b6519b9abce288bfac21033812f6` |
| SHA-256 do arquivo baixado da release pública | o mesmo |
| Valor fixado em `deploy/easypanel/Dockerfile` | o mesmo |
| Tamanho | 15.271.381 bytes |
| Diff contra `d8a873829` fora de `docs/` | **só** `DIST_URL` e `DIST_SHA256` no `Dockerfile`; `frontend.conf` e o código da aplicação intactos |
| Conteúdo do pacote | 1.389 entradas; nenhum caminho absoluto, com `..` ou auxiliar do macOS; todos os arquivos legíveis; arquivo do DocuNinja ausente |
| `version.json` no pacote | revisão `d8a873829cbbc2ba1f71df71b0022829e2568443` |
| Origem de API embutida | extraí o pacote e procurei: `https://api.allber.to` está no JavaScript servido |
| Resquício do host temporário | **nenhuma** ocorrência de `cxfujw.easypanel.host` no pacote |
| Endereços locais | nenhuma ocorrência de `127.0.0.1` nem de `localhost` seguido de porta |

O último ponto da origem era o que mais importava conferir: um pacote que ainda apontasse para a API temporária passaria despercebido, porque ela continua no ar.

Li também as evidências do Astra e do coordenador: build com saída zero, verificador aprovado com os mesmos 11 contextos inertes de `localhost` já aceitos, e download anônimo com hash exato.

## 2. O que mudou em relação ao pacote anterior

Só a origem da API e a revisão. A receita é a mesma já validada duas vezes em produção: `frontend.Dockerfile` para gerar, verificador no build, `Dockerfile` leve para servir.

A revisão do código passou de `f5cb28e` para `d8a8738`. O diff entre as duas, fora de `docs/` e do pin anterior, é do ciclo de documentação já publicado; a aplicação não mudou e a suíte não precisava ser repetida.

## 3. O build leve pode ficar para o deploy

O Astra não conseguiu rodar o build leve com os novos valores: o Docker local estava indisponível, e não é o caso de abrir aplicativos na máquina enquanto o operador usa o navegador.

Aceito adiar, por três motivos:

- **O que esse build prova já está provado por outro caminho.** Ele verifica três coisas: que a URL baixa, que o hash confere e que a extração funciona. O coordenador baixou o arquivo dessa URL de forma anônima e o hash conferiu; eu refiz o cálculo. A extração e o `nginx -t` dependem da receita, que não mudou.
- **A receita falha de forma segura.** Com URL ou hash errado, o `sha256sum -c` interrompe o build. Isso foi demonstrado com hash trocado na primeira versão.
- **O deploy é o mesmo build.** O painel executa exatamente esse `Dockerfile`.

O que **não** sei: se, quando um build falha, o EasyPanel mantém o container anterior no ar. Não foi observado. Por isso a ordem importa mais do que o build local: o deploy do `web` deve ser a última etapa, depois de tudo o mais estar verificado, e o operador deve olhar a saída do deploy antes de considerar concluído.

Se o Docker local voltar antes do deploy sem custo para ninguém, rodar o build leve é bem-vindo. Não é condição.

## 4. O que falta, e de quem depende

**Infraestrutura (operador):**
- `www` e `api` na Cloudflare; troca dos nameservers na Namecheap; delegação visível publicamente (D1);
- os três domínios no EasyPanel com certificado válido (D2);
- definir como `www` redireciona: pela interface do painel, se oferecer, ou por regra no nginx do `web`. Essa segunda opção mudaria `frontend.conf` e exigiria revisão; até lá, `www` sem domínio no painel.

**Backend (operador, depois de D2):**
- `APP_URL=https://api.allber.to` e redeploy; D3, D4, D5 e D11.

**Frontend (coordenador, depois de D3):**
- tirar o PR de rascunho, merge, deploy do `web`; conferir na saída do deploy o hash aceito;
- D6, D7 e D8. O login real nas novas origens (D8) é o que confirma cookies e CORS.

**Fechamento:** D9, se houver redirecionamento, e D10.

## 5. Rollback deste artefato

Reverter as duas constantes para a release `web-f5cb28edb112-1` e seu hash `fcbf81bc…6351d1ac5`, e redeployar o `web`. Esse pacote aponta para a API temporária, que continua no ar. A release anterior não foi apagada.

## 6. Não verificado

- O build leve com os novos valores.
- O comportamento do painel quando um build falha.
- Qualquer coisa nas novas origens: DNS completo, certificados, API, login, PDF. O domínio e a conta foram confirmados pelo coordenador na interface, não por mim.
