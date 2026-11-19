# Astra — marca Allberto na autenticação

Implementação local concluída; fonte congelada para revisão Fable. Pedido: substituir o logo Invoice Ninja observado no login de painel.allber.to pela identidade Allberto já aprovada.

## Alteração mínima

- `src/components/AllbertoLogo.tsx`: extração do componente anteriormente definido na Topbar, preservando wordmark, SVG (path/viewBox/stroke) e classes. Módulo sem imports de hooks, stores ou dependências da shell.
- `src/components/layouts/components/Topbar.tsx`: somente troca da definição pelo import compartilhado; aparência e handlers permanecem iguais.
- `src/pages/authentication/components/Header.tsx`: substitui a imagem pelo componente compartilhado. Preserva Link `/`, usando o mesmo componente Link e seus mecanismos de navegação. `useColorScheme().$3` fornece contraste conforme preferência real; `withoutDefaultStyling` evita a cor de accent/underline do link de texto comum. Avisos de copyright/licença do arquivo preservados.
- `src/resources/css/allberto.css`: regras restritas a `.ab-auth-logo` para wordmark de 48 px/altura 48 px, símbolo de 24 px, gap proporcional e foco visível de teclado. Regras existentes da Topbar intactas; fonte Albert Sans e cor do símbolo permanecem as da proposta.

Callers conferidos: Header é compartilhado por Login, Register e RecoverPassword; AllbertoLogo só era usado pela Topbar. Nenhum handler, formulário, contrato de autenticação, env, dependência ou API adicional foi alterado. Sem mudanças de footer, traduções, PDF/portal, white-label ou atribuições do backend.

## Verificação

- `npx vitest run tests/unit/allberto-shell.test.ts`: **6 PASS**, exit 0; `/tmp/allberto-auth-shell.log`.
- `npx tsc --noEmit --incremental`: **PASS**, exit 0; `/tmp/allberto-auth-tsc.log`.
- Biome lint dos três arquivos TSX alterados/extraídos: **PASS**, exit 0; `/tmp/allberto-auth-lint.log`.
- Validação visual com Playwright/Chrome headless em perfil novo: **12 PASS**, Login/Register/RecoverPassword × claro/escuro × 1440/390 px. Confere link `/`, nome allberto, foco pelo primeiro Tab, outline visível, altura 48 px, ausência de overflow/erros/external traffic. Screenshots inspecionadas de login desktop/mobile e claro/escuro, cadastro escuro e recuperação clara.

Evidências: `/tmp/allberto-auth-branding/visual-check.json`, `check.log` e screenshots `{login,register,recover}-{light,dark}-{1440,390}.png`. As capturas mostram deliberadamente o outline após Tab; o contorno não é permanente. Harness, script e config temporários ficam nesse mesmo diretório, sem novos testes de markup no repositório.

O harness renderiza as páginas/componentes reais com stores/providers, idioma pt_BR e preferência dark_mode locais. O body reproduz o fundo que App aplica pelo colorScheme. Todas as requisições externas são bloqueadas; descoberta OIDC é respondida localmente como desabilitada e o script público do GoogleOAuthProvider é interceptado e respondido vazio, com clientId fictício. Isso permite renderizar Register sem executar autenticação externa. Nenhum formulário foi enviado, nenhuma credencial/conta real foi usada. Um erro inicial de bootstrap React Refresh e a ausência inicial do GoogleOAuthProvider foram corrigidos apenas no harness temporário, sem mudança adicional na aplicação.

## Limites

Não é teste de login real, OAuth, cadastro ou recuperação de senha, nem validação do bundle já publicado. A aprovação CTO, commit/build/release/deploy e confirmação no domínio cabem ao coordenador. Nenhum Docker, GitHub, VPS, DNS, navegador/perfil do usuário, foco/clipboard ou commit/push foi usado. Ambiente e previews anteriores preservados; servidor temporário desta verificação usou apenas 127.0.0.1:4186.
