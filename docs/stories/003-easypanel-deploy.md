# 003 — Publicação no EasyPanel da StayCloud

**Estado:** artefatos implementados, testados e aceitos pelo CTO. Publicação no GitHub em andamento; inventário e deploy da VPS aguardam a liberação do Chrome compartilhado por outro agente.
**Coordenação:** SINAPSE. **CTO:** Fable 5.2. **Implementação:** Astra. **Operação do painel:** coordenador.

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

Build de produção do frontend conectado ao backend real por IP, conforme pedido atualizado; bancos sem portas públicas; volumes persistentes; segredos fora do Git; versão identificada e rollback documentado; serviços alheios preservados. HTTPS depende da definição operacional do domínio e permanece requisito antes de dados reais. E-mail real, gateways e backup externo dependem de configurações fornecidas ou disponíveis no ambiente e devem ter status explícito, sem alegar funcionamento antes de teste.

## Arquitetura e progresso

Fable entregou [arquitetura EasyPanel](../architecture-easypanel.md), com GO para artefatos e pré-condições P1–P6 para execução. A decisão mantém duas origens por IP, como no teste local: um serviço App para o frontend estático e um serviço Compose para o backend, com nginx, PHP-FPM, MySQL e Redis. As portas sugeridas 8090/8012 só serão adotadas após verificar disponibilidade e firewall. O backend mantém a versão 5.13.49 fixada por digest, redes/volumes próprios e restart automático; não haverá proxy parcial de caminhos entre frontend e portal.

- [x] Autorização do proprietário para configurar/publicar na VPS existente.
- [x] Definir IP provisório e domínio futuro `allber.to`.
- [x] Inventário do código pelo Astra e arquitetura pelo Fable.
- [x] Preparar e verificar artefatos de deploy localmente.
- [ ] Acessar sessão autenticada do painel e conferir P1–P6 (recursos, arquitetura, versão/plano, portas, serviços existentes e administrador).
- [ ] Revisar artefatos e publicar no GitHub.
- [ ] Configurar serviços e segredos novos no projeto `allberto`.
- [ ] Implantar e validar E1–E10 na VPS, incluindo bloqueio de signup adicional, PDF e persistência.
- [ ] Registrar URLs, revisão final, backup e limites.

A tentativa no navegador integrado mostrou a tela de login. O conector CUA de navegador retornou host indisponível; a alternativa nativa inicialmente falhou ao iniciar. Outro chat confirmou depois o procedimento funcional: sessão nova de `mcp__cua_repl` cuja primeira chamada é somente `cua.getApp("com.google.Chrome")`; observou EasyPanel autenticado, sem novo login. O coordenador aguarda a liberação exclusiva do Chrome pelo agente que testa firewall em outra VM, sem tocar em foco, abas ou clipboard. Nenhuma sessão foi extraída nem permissão alterada por automação.

Fable revisou os artefatos e pediu remover do build o arquivo público inativo de DocuNinja com destinos localhost:8000, além de registrar uma verificação reproduzível de E5. As duas correções foram aplicadas e revalidadas, junto com gzip para JS/CSS/JSON/SVG. O [aceite final](../reviews/fable-easypanel-artifacts.md) não deixou achado pendente nos arquivos. O critério agora distingue destinos locais de rede de textos inertes em bibliotecas; os 11 contextos restantes foram lidos e aceitos pelo CTO.

Build final, autoteste/verificador E5, `nginx -t`, rotas profundas, cache, 404 de asset ausente, versão e gzip passaram. A imagem de prova usa uma origem reservada para documentação; o build na VPS usará a origem real confirmada. A proteção de signup selfhost foi confirmada na fonte; o runtime ainda precisa responder aos testes de signup sem credenciais e `/setup`.

Os segredos novos deverão ser configurados **somente no serviço Compose backend**, nunca no ambiente do projeto ou do serviço web. Isso evita que sejam disponibilizados ao build do frontend pelo EasyPanel. O web recebe apenas a origem pública da API e, se necessário, o SHA completo da revisão. Segredos reais da VPS ainda não foram gerados.
