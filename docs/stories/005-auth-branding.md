# 005 — Marca Allberto na autenticação

**Estado:** implementação e revisão aprovadas; pacote publicado, deploy pendente. O proprietário enviou uma captura de `painel.allber.to/login` e pediu substituir o logo Invoice Ninja pelo logo Allberto. A página real e o certificado foram observados no navegador; o login ainda não foi concluído por interrupção do controle nativo.

## Escopo

Reutilizar o wordmark e símbolo Allberto já usados na topbar. O componente Header da autenticação é compartilhado por login, cadastro e recuperação de senha; a troca deve alcançar esses pontos sem alterar formulários, handlers, autenticação ou destinos. Extrair a marca existente para um componente leve evita carregar toda a topbar na página pública. Manter contraste, foco de teclado e proporções em desktop/mobile, com CSS específico da autenticação.

A solicitação não altera PDF/portal de clientes, licença white-label do backend, avisos de copyright/licença, DNS, banco ou segredos. Nenhuma nova identidade visual ou dependência é necessária.

## Entrega e validação

Astra implementa a mudança e verifica visualmente em ambiente local isolado; Fable revisa o delta. O coordenador confirma lint/TypeScript/build, publica novo pacote com `VITE_API_URL=https://api.allber.to`, confere SHA-256 e atualiza o pin do Dockerfile leve. O deploy será somente do web, sem compilar Node na VPS.

Após publicação, conferir revisão/arquivos e o logo em `https://painel.allber.to/login`; concluir o login de leitura pendente e verificar Painel/Clientes/Faturas, sem criar ou alterar dados. Manter as releases anteriores para reversão e os limites de homologação existentes.


## Fonte e pacote

Astra extraiu `AllbertoLogo` para um módulo sem imports e reutilizou a marca na Topbar e no Header. O logo da autenticação tem texto de 48 px e símbolo de 24 px, cor do tema e foco de teclado. Callers Login/Register/RecoverPassword preservados. [Handoff](../handoffs/astra-auth-branding.md) e [revisão CTO](../reviews/fable-auth-branding.md).

Verificações: lint dos TSX, TypeScript e 6 testes existentes da shell aprovados; 12 variantes visuais locais (3 telas × 2 temas × 2 larguras), sem requests externos nem submissão de formulários. O coordenador inspecionou as capturas de login claro desktop e escuro mobile. O CTO aceitou sem correção obrigatória, preservando como limites itens preexistentes fora do pedido (NotFound, links upstream no cadastro e cor da versão no tema escuro).

Fonte fixada em `a0fe5f2edd3bc5a4d3f1873346efe4d9e2cf5f02`. Build isolado do `git archive` desse commit pelo Dockerfile aprovado, com API `https://api.allber.to`, terminou exit 0. Verificador/self-check e empacotamento seguros passaram; o chunk do Header contém as classes Allberto e não contém o alt antigo. Pacote de 15,281,775 bytes, SHA-256 `1b10a59e1bd7d541b1ba0a4841be4a95baf1f6ec0353d816ba17cd0eedc22316`.

[Release de homologação web-a0fe5f2edd3b-1](https://github.com/allber-to/web/releases/tag/web-a0fe5f2edd3b-1) publicada; download anônimo HTTPS confirmou tamanho/hash. `/version.json` deve mostrar a revisão de fonte acima e `builtAt=2026-11-19T18:49:57.490Z`, não o SHA do commit posterior do pin/merge. Dockerfile leve atualizado somente em URL/hash. Evidências locais em `/tmp/allberto-auth-branding-release/`; pacote/pin não contém ambiente privado.


O build leve local com os defaults novos passou; `nginx -t` passou e a revisão dentro da imagem corresponde ao pacote. Ambos os comandos de verificação rodaram com rede desabilitada, em containers temporários removidos ao concluir. Evidência `lightweight-check.json`; a receita e o nginx.conf não foram alterados.
