# 003 — Publicação no EasyPanel da StayCloud

**Estado:** PRs #1 e #2 mescladas, inventário concluído e release do frontend publicada com checksum conferido. Backend em configuração pelo operador; a aplicação ainda não teve seu runtime validado.
**Coordenação:** SINAPSE. **CTO:** Fable 5.2. **Implementação:** Astra. **Operação do painel:** chat com CUA funcional, sob coordenação deste projeto.

## Autorização e escopo

O proprietário informou o EasyPanel existente em `http://192.102.140.18:3000/` e autorizou configurar e colocar o projeto no ar. Esta autorização substitui a restrição da fase anterior a ambiente local. Nenhuma contratação, exclusão de dados, alteração de aplicações alheias ou acesso ao WHMCS está incluído.

Base validada: `77808e1ec`, PR #1, Invoice Ninja 5.13.49, 345 testes e CI aprovados. Preservar a instância local e criar dados/segredos próprios na VPS. Não levar dados descartáveis nem credenciais locais para o servidor.

## Plano

1. Conferir acesso, recursos e serviços existentes no painel; identificar domínio disponível e versões.
2. Fable definir topologia de produção, isolamento, persistência, restart, domínios/HTTPS, filas/agendamento, backup e rollback.
3. Astra preparar artefatos mínimos de deploy e verificá-los localmente; coordenador configurar o painel após revisão da arquitetura.
4. Validar interface publicada, autenticação, API, PDF e persistência com escopo seguro. Não executar smokes locais nem resets contra a VPS.
5. Documentar URLs, configuração, revisão e limites; publicar artefatos no GitHub.

## Inventário inicial

- Worktree limpa em `77808e1ec` antes desta fase.
- O controle CUA da aba existente retornou indisponibilidade do host; Apple Events para Chrome foi recusado pelo macOS. Permissões não foram alteradas. Tentativa seguinte usa navegador integrado do Orca.
- O proprietário definiu `allber.to` como domínio futuro, ainda não comprado, e pediu acesso provisório pelo IP. Não alterar DNS. A fase publicada por HTTP será identificada como provisória; HTTPS e uso de dados reais ficam para a configuração do domínio.
- E-mail do administrador definido pelo proprietário em 19/11/2026; o endereço será usado na configuração do serviço, sem publicar credenciais no repositório.
- O proprietário autorizou solicitar acesso ao Chrome. O fluxo `orca computer permissions` abriu os Ajustes do macOS e informou que o helper Orca não tinha Acessibilidade. Outro chat validou depois o acesso nativo por CUA; por isso essa concessão não será exigida novamente para o caminho já comprovado. Nenhuma permissão foi habilitada por automação.

## Critérios de aceite

Build de produção do frontend conectado ao backend real por dois domínios temporários HTTPS do EasyPanel, conforme pedido mais recente; nenhuma porta do projeto publicada diretamente; volumes persistentes; segredos fora do Git; versão identificada e rollback documentado; serviços alheios preservados. E-mail real, gateways e backup externo dependem de configurações fornecidas ou disponíveis no ambiente e devem ter status explícito, sem alegar funcionamento antes de teste.

## Arquitetura e progresso

Fable entregou [arquitetura EasyPanel](../architecture-easypanel.md), com GO para artefatos e pré-condições P1–P6 para execução. A decisão mantém duas origens por IP, como no teste local: um serviço App para o frontend estático e um serviço Compose para o backend, com nginx, PHP-FPM, MySQL e Redis. As portas sugeridas 8090/8012 só serão adotadas após verificar disponibilidade e firewall. O backend mantém a versão 5.13.49 fixada por digest, redes/volumes próprios e restart automático; não haverá proxy parcial de caminhos entre frontend e portal.

- [x] Autorização do proprietário para configurar/publicar na VPS existente.
- [x] Definir IP provisório e domínio futuro `allber.to`.
- [x] Inventário do código pelo Astra e arquitetura pelo Fable.
- [x] Preparar e verificar artefatos de deploy localmente.
- [x] Acessar sessão autenticada do painel e conferir recursos, arquitetura, versão/plano, serviços existentes, hosts e administrador.
- [x] Revisar artefatos e publicar no GitHub.
- [ ] Configurar serviços e segredos novos no projeto `allberto`.
- [ ] Implantar e validar E1–E10 na VPS, incluindo bloqueio de signup adicional, PDF e persistência.
- [ ] Registrar URLs, revisão final, backup e limites.

A tentativa no navegador integrado mostrou a tela de login. O conector CUA de navegador retornou host indisponível; a alternativa nativa inicialmente falhou ao iniciar. Outro chat confirmou depois o procedimento funcional: sessão nova de `mcp__cua_repl` cuja primeira chamada é somente `cua.getApp("com.google.Chrome")`; observou EasyPanel autenticado, sem novo login. O coordenador aguarda a liberação exclusiva do Chrome pelo agente que testa firewall em outra VM, sem tocar em foco, abas ou clipboard. Nenhuma sessão foi extraída nem permissão alterada por automação.

Fable revisou os artefatos e pediu remover do build o arquivo público inativo de DocuNinja com destinos localhost:8000, além de registrar uma verificação reproduzível de E5. As duas correções foram aplicadas e revalidadas, junto com gzip para JS/CSS/JSON/SVG. O [aceite final](../reviews/fable-easypanel-artifacts.md) não deixou achado pendente nos arquivos. O critério agora distingue destinos locais de rede de textos inertes em bibliotecas; os 11 contextos restantes foram lidos e aceitos pelo CTO.

Build final, autoteste/verificador E5, `nginx -t`, rotas profundas, cache, 404 de asset ausente, versão e gzip passaram. A imagem de prova usa uma origem reservada para documentação; o build definitivo usará a origem real confirmada e será compilado fora da VPS. A proteção de signup selfhost foi confirmada na fonte; o runtime ainda precisa responder aos testes de signup sem credenciais e `/setup`.

Os segredos novos deverão ser configurados **somente no serviço Compose backend**, nunca no ambiente do projeto ou do serviço web. Isso evita que sejam disponibilizados ao build do frontend pelo EasyPanel. O web recebe apenas a origem pública da API e, se necessário, o SHA completo da revisão. Segredos reais da VPS ainda não foram gerados.

## Atualização de publicação e acesso

O proprietário autorizou explicitamente aprovar/mesclar a PR e publicar usando, por enquanto, o domínio temporário do EasyPanel. Essa preferência substitui a exigência anterior de usar apenas IP. Os endereços e o HTTPS devem ser confirmados no painel antes de configurar `APP_URL` e `VITE_API_URL`; a topologia será ajustada a essa decisão, mantendo frontend e API separados.

PR #1 mesclada em 19/11/2026, commit de merge `96b1a1c907f33048849473250571da74ae5c0082`, preservando o histórico. O commit de artefatos `5912c52c0adbc98ee3aa3bdb12299aac63aacaa8` passou no CI e no hook de publicação. A branch de trabalho foi avançada por fast-forward para o merge; nenhuma branch foi apagada.

O agente da outra VM liberou o Chrome, com suas abas preservadas. A tentativa nova deste coordenador, iniciada diretamente por `cua.getApp("com.google.Chrome")`, ainda falhou ao iniciar o canal nativo. Foi solicitado ao chat que comprovou esse acesso realizar somente o inventário no EasyPanel, como único operador da janela. O coordenador mantém a revisão e só autorizará a configuração remota após fechar as pré-condições. Não há novo pedido de permissão de deploy ao proprietário.

O [inventário ao vivo](../handoffs/easypanel-live-inventory.md) confirmou EasyPanel 2.33.1 autenticado, 2 CPUs, 3,8 GB de RAM total, aproximadamente 43,1 GB de disco livre e nenhum projeto listado. O sufixo de serviços é `*.cxfujw.easypanel.host`; ainda faltam os hosts concretos e a prova de roteamento/certificado. Como a memória total está abaixo da folga estimada para o build Node, o frontend será compilado fora da VPS, com distribuição do artefato definida pelo CTO.

O operador recebeu autorização para criar `allberto` e, se necessário, serviços vazios `web` e `backend`, inspecionar App/Compose, domínios e fonte de imagem, e realizar inventário mínimo somente leitura no console do servidor. Nenhum build ou deploy foi autorizado nessa etapa de inspeção. Astra implementa os ajustes HTTPS da seção 14 da arquitetura: sem porta publicada, `REQUIRE_HTTPS=true` e proxies confiáveis, mantendo o backend interno. As abas e recursos da frente de firewall continuam reservados à outra equipe.

Fable aprovou a distribuição do frontend por release pública de pré-lançamento no GitHub (§15): o Dockerfile existente compila localmente com o host real da API e identifica o commit; o pacote `dist` recebe SHA-256. Um Dockerfile leve na VPS somente baixa, confere e extrai o pacote sobre nginx. A URL e o hash ficarão versionados; nenhum registry novo é necessário. Astra concluiu os ajustes HTTPS e validou a configuração efetiva com valores fictícios; a revisão desse delta ocorre antes de publicá-lo. O pacote definitivo ainda depende do hostname real da API.

O operador criou o projeto `allberto` e os serviços vazios `web` (App) e `backend` (Compose). Hosts gerados e observados na interface: `https://allberto-web.cxfujw.easypanel.host` e `https://allberto-backend.cxfujw.easypanel.host`. O formulário de domínio do Compose tem campo para o serviço interno; o destino será `nginx:80`. Uma consulta externa a cada host aceitou o certificado (`ssl_verify_result=0`) e retornou 502, esperado enquanto os serviços ainda estavam vazios; isso confirma TLS, não a aplicação nem o roteamento ao container.

PR #2 mesclada com revisão Fable e CI aprovados, merge `1ee50c75292023cb193beafa328a56bf1127e5a7` (conteúdo do delta `52db1b5423eafac06d43c38b710f23b6a5fdc6c4`). Lint, TypeScript e build passaram no hook. O operador foi autorizado a configurar e implantar primeiro o backend a partir dessa main após concluir o inventário mínimo, com segredos novos exclusivos do serviço. Astra prepara o pacote frontend local a partir do commit `52db1b5423eafac06d43c38b710f23b6a5fdc6c4` e da origem real da API. Ainda não há validação de runtime.

O inventário mínimo confirmou amd64, 3.277 MiB de memória disponível, nenhum swap e 44 GB disponíveis na raiz. Antes do deploy, havia apenas EasyPanel, Traefik e o container transitório do console, sem volumes. O operador não encontrou conflito visível e iniciou a preparação da configuração do backend.

O pacote frontend local foi gerado de um `git archive` do commit acima, com 15.276.656 bytes e SHA-256 `5f9d3b717d30706d82c8d4ba66e7cf8ebcb49fa0ef695c1630dce4b94e351f02`. Build e verificação sobre o pacote extraído passaram; a origem real HTTPS está embutida, sem o endereço de prova anterior. O novo Dockerfile leve também recusou checksum incorreto e aceitou a fixture íntegra, com `nginx -t` aprovado. A release pública, os defaults versionados e o deploy web ainda dependem da primeira validação do backend.

Após a revisão final do CTO, o coordenador publicou a [release de pré-lançamento `web-52db1b5423ea-1`](https://github.com/allber-to/web/releases/tag/web-52db1b5423ea-1), vinculada ao commit de origem do pacote. Uma nova transferência anônima por HTTPS confirmou o mesmo tamanho e SHA-256 (W1). A release registra que `/version.json` identifica o commit de compilação `52db1b5`, que difere do commit de merge. Astra insere os defaults reais no Dockerfile e verifica o build leve com o pacote público; o deploy web continua condicionado à validação inicial do backend.
