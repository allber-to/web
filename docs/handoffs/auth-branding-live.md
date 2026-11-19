# Marca Allberto no login — validação ao vivo

Data: 19/11/2026. Operador Chrome: `777a7c50-10d2-44c7-a090-a6ec475c5f59`. Coordenador: `ecdf0c57-bcde-43e8-9066-dc595b02857f`.

**Resultado: frontend PR9 implantado uma vez; marca no login confirmada visualmente; versão/saúde/arquivos externos aprovados pelo coordenador. D8/P4 permanece parcial:** autenticação, Painel pt_BR/BRL e listas ativas zero ainda não verificados no domínio administrativo. O controle interrompeu a entrada do email e a leitura de reconciliação mostrou o seletor de perfis do Chrome; nenhuma senha ou submit de login foi executado nesta etapa.

Contexto de DNS, domínios, backend e tentativas anteriores: [custom-domain-live.md](custom-domain-live.md). Este suplemento registra apenas a publicação da marca e a observação de runtime; não altera aquele histórico.

## Versão autorizada e escopo

Autorização concreta `msg_691acdba863f`, após CI e aceite de fonte/pacote por Fable:

- PR9, main `9441e4163dba0c4c8c0f36ce9af8c33c58150eb2`.
- Revisão do pacote `a0fe5f2edd3bc5a4d3f1873346efe4d9e2cf5f02`.
- builtAt informado: `2026-11-19T18:49:57.490Z`.
- SHA-256 do tar informado: `1b10a59e1bd7d541b1ba0a4841be4a95baf1f6ec0353d816ba17cd0eedc22316`.
- Somente `allberto/web`, Git main/Dockerfile leve já configurados. Sem nova fonte, ambiente, build args, DNS ou backend. Login e navegação somente em leitura; nenhum registro financeiro, PDF, envio ou pagamento.

## Implantação observada

Selecionada a janela existente do EasyPanel pelo menu nativo do Chrome. A página confirmou projeto `allberto`, serviço `web` e os hosts já existentes, inclusive `painel.allber.to` para HTTP porta 80.

**Implantar acionado uma vez.** Toast **Aplicativo implantado** e histórico **Merge pull request #9**, duração **6 segundos**. Memória exibida após o início: **9.4 MB**. Nenhuma segunda implantação, reinício manual, alteração de configuração ou operação no backend. `completion_summary` enviado e coordenador avisado em `msg_fb5788cc55b7` para sua verificação externa.

Não foi aberto console nem inspecionado OOM/reinícios nesta publicação. Saúde HTTP e versão foram verificadas pelo coordenador, conforme próxima seção; a medição de memória da UI não substitui uma inspeção de saúde de container.

## Evidência externa recebida

Em `msg_c15595ee1ebb`, o coordenador informou **PASS em sete respostas, DNS/TLS normais**, evidência `/tmp/allberto-auth-branding-release/live-check.json`:

- `/version.json` com revisão `a0fe5f2edd3bc5a4d3f1873346efe4d9e2cf5f02`.
- HTML de login, `healthz`, JS principal, CSS de fonte, CSS da aplicação e chunk Header iguais byte a byte ao pacote.
- Header publicado contém `ab-auth-logo` e não contém `Invoice Ninja Logo`.

Este operador recebeu esse resultado, sem repetir download, hash ou deploy. builtAt e hash do tar acima são os metadados aprovados informados, não recalculados na VPS nesta etapa.

## Conferência visual e TLS

Após retomar o controle para a validação, a janela atual já era `painel.allber.to/login`. Realizada recarga completa **super+shift+r**. Screenshot observado diretamente:

- Palavra **allberto** em preto e símbolo violeta à direita, acima do formulário.
- Logo sem borda permanente na apresentação inicial.
- Formulário **Login**, **Email address** e **Continue** preservados; versão visual `v10.11.2026.1`.
- AX identifica o link da marca como **allberto**.
- Popup nativo de informações do site confirmou **A conexão é segura** e foi fechado normalmente, sem bypass.

Havia aviso do navegador **O Chrome não foi encerrado corretamente / Restaurar páginas?**; não foi acionado Restaurar. Não foi determinada a causa desse aviso. Nenhuma janela ou aba alheia foi fechada por este operador.

O tema escuro não foi testado, pois não foram alteradas preferências. A aparência sem foco foi observada; o foco da logo por teclado não foi exercitado nesta etapa, portanto não se afirma validação visual do foco exclusivo de teclado.

## Interrupção do login e encerramento

Depois de confirmar a origem e TLS, tentou-se preencher somente o email usando as credenciais existentes mantidas em memória privada, sem registrar seu conteúdo. A chamada foi interrompida com **The user changed '/Applications/Google Chrome.app'**. Feita **uma única leitura de reconciliação**, que mostrou **Quem está usando o Chrome?**, URL `chrome://profile-picker/`, fora da tarefa Allberto.

O operador parou sem escolher perfil, forçar foco, repetir preenchimento ou submeter o formulário. Não se afirma persistência do email dessa chamada interrompida. **Nenhuma senha foi digitada e nenhum submit de login ocorreu nesta publicação.** A causa da mudança de janela não foi determinada.

`completion_summary` enviado; coordenador informado em `msg_b94dd61dbc58`. **D8/P4 não concluído:** autenticação, Painel em português/BRL e Clientes/Faturas ativos zero continuam pendentes de observação nessa origem. A marca e os arquivos publicados estão confirmados; essa pendência não motivou outro deploy.

CUA/foco/clipboard parados. **Chrome liberado por este operador ao entregar este registro estável**, sem ação adicional no navegador. Qualquer retomada de login depende de nova coordenação de acesso. Nenhum segredo, conteúdo de ambiente ou credencial foi incluído neste arquivo.
