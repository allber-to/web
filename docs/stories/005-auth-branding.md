# 005 — Marca Allberto na autenticação

**Estado:** concluída e aceita pelo CTO no escopo da marca. Nova versão publicada e confirmada visualmente em `painel.allber.to/login`; checagem externa aprovada. O login real da story 004 permanece pendente por interrupção do controle nativo e não faz parte do aceite desta troca visual.

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


## Publicação

PR [#9](https://github.com/allber-to/web/pull/9) mesclada em `9441e4163dba0c4c8c0f36ce9af8c33c58150eb2` após revisão e CI verde no head exato `c630a71266ede1266edc25ff210ff647f0508fb4`. Hooks e CI passaram lint, TypeScript, build e suíte existente. O operador acionou uma única implantação do web: histórico PR9, conclusão em 6 segundos, sem mudança de fonte/ambiente/DNS/backend.

Checagem externa pós-deploy aprovada em sete caminhos por DNS/TLS normal: versão `a0fe5f2edd3bc5a4d3f1873346efe4d9e2cf5f02`, HTML do login, healthz, JavaScript principal, CSS da fonte, CSS da aplicação e chunk do Header. Arquivos idênticos aos locais; Header servido contém a classe Allberto e não o alt antigo. Evidência `/tmp/allberto-auth-branding-release/live-check.json`. O script temporário inicialmente só aceitava caminhos /react e foi ajustado para incluir o CSS local /rsms/inter.css observado no HTML; a primeira tentativa parou antes de qualquer requisição. Essa correção foi só no verificador temporário, não na aplicação.

O operador recebeu o resultado e concluiu a confirmação visual após recarga completa: palavra allberto preta, símbolo violeta, sem borda permanente e com formulário preservado. O Chrome confirmou conexão segura. O [handoff ao vivo](../handoffs/auth-branding-live.md) distingue observação direta, checks recebidos e limitações.

Ao tentar preencher o e-mail, o controle nativo foi interrompido; uma leitura de reconciliação mostrou o seletor de perfis do Chrome. Nenhuma senha ou submit de login foi executado. O operador encerrou o controle e liberou o Chrome, sem nova implantação nem alteração de dados. Não foi determinada a causa da mudança de janela.

O [CTO aceitou a story como entregue](../reviews/fable-auth-branding.md), após ler as provas e conferir os hashes locais contra os servidos. Tema escuro/foco ao vivo, inspeção completa de containers e login real não foram repetidos; a matriz local continua sendo a prova dos temas e do foco. A autenticação e a navegação autenticada continuam pendentes na story 004, sem impedir o aceite da substituição da marca solicitada.
