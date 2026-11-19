# Revisão do CTO — marca Allberto na autenticação (story 005)

Data: 19/11/2026. Revisor: Claude Fable 5.2, como CTO. Base do diff: `30fd76960`. Implementação: Astra.

## Veredito

**Aceito. Nenhum bloqueio e nenhuma correção obrigatória.** A fonte pode ser commitada e seguir para pacote, release e deploy do web pelo caminho já aprovado.

## Como revisei

Só leitura. Não repeti a suíte, o build nem o harness visual; não usei navegador, VPS ou Git.

- Li o diff completo contra `30fd76960` (três arquivos alterados, um novo), o componente `Link`, o esquema de cores e o trecho do `App` que define o fundo da página.
- Procurei todos os usos de `AllbertoLogo`, do `Header` da autenticação e da imagem antiga.
- Li o handoff do Astra, o `visual-check.json` e abri quatro das doze capturas: login claro 1440, login escuro 390, cadastro claro 390 e recuperação escura 1440.
- Rodei só a checagem de tipos (`tsc --noEmit`): sem erros.

## O que conferi

| Ponto | Resultado |
| --- | --- |
| Leveza do componente | `AllbertoLogo.tsx` não tem nenhum import. A autenticação não carrega a Topbar nem suas dependências (troca de empresa, busca, notificações). |
| Marca equivalente | O componente é a cópia exata do que estava na Topbar: mesmo texto, `viewBox`, traçado e espessura. A Topbar só trocou a definição pelo import. |
| Usos | `AllbertoLogo` era usado só pela Topbar; agora também pelo `Header`. O `Header` é compartilhado por Login, Register e RecoverPassword, e os três recebem a troca. |
| Fluxo e link | O link continua indo para `/`, pelo mesmo componente `Link`, com a mesma proteção de navegação. Nenhum formulário, handler, variável de ambiente ou dependência mudou. |
| Nome acessível | O link passa a se chamar "allberto" (o texto do wordmark); o símbolo fica oculto para leitores de tela. Antes era "Invoice Ninja Logo". |
| Cor e contraste | A tinta vem de `colors.$3`, a mesma dos títulos do formulário. Sobre o fundo real da página: `#18181b` em `#f7f7f5` e `#fafafa` em `#111111`, ambos acima de 15:1. `withoutDefaultStyling` impede a cor de destaque e o sublinhado de link comum. |
| Foco de teclado | Contorno de 2 px na cor da tinta, com afastamento de 6 px, só em `:focus-visible`. As capturas mostram o contorno porque foram tiradas depois de um Tab; ele não é permanente. |
| Responsividade | Wordmark de 48 px com símbolo de 24 px, cerca de 200 px de largura. Cabe com folga em 390 px; o registro visual marca sem transbordo nas doze variantes. |
| CSS | Quatro regras novas, todas sob `.ab-auth-logo`. As regras da Topbar não foram tocadas. |
| Avisos legais | O cabeçalho de copyright e licença do `Header.tsx` foi mantido. Nada de rodapé, tradução, PDF, portal ou white-label mudou. |

As quatro capturas que abri confirmam: wordmark centralizado acima do cartão, asterisco na cor da marca, proporção coerente com a Topbar, nos dois temas e nas duas larguras.

## Achados

Nenhum bloqueia. Nenhum nasce deste diff, exceto o primeiro.

1. **Baixo — asterisco com pouco contraste no tema claro.** `#7e85ff` sobre `#f7f7f5` dá cerca de 2,9:1. É elemento decorativo, oculto para leitores de tela, e o nome da marca está no texto de alto contraste. É a cor da proposta; não recomendo mudar. Fica registrado.
2. **Informativo — a página "não encontrado" ainda mostra o logo Invoice Ninja.** `src/components/NotFound.tsx` importa a mesma imagem que saiu do `Header`. Fora do escopo pedido (login); candidato natural à próxima troca, com o mesmo componente.
3. **Informativo — texto de versão ilegível no tema escuro.** Na captura de login escuro, a linha de versão abaixo do cartão aparece em preto sobre fundo escuro. O parágrafo não define cor e já era assim antes deste diff. Pode ser efeito do harness, que define só o fundo do `body`; conferir na página publicada.
4. **Informativo — cadastro ainda traz links do upstream.** A tela de Register mostra "Check status", "Applications" e "Documentation", que são do Invoice Ninja. Já existiam; não avaliei se aparecem na instalação publicada.
5. **Informativo — sem teste automatizado do `Header`.** A troca é de marcação simples e foi coberta pela verificação visual temporária. Não peço teste novo.

## O que esta revisão prova e o que não prova

Prova, por leitura: a troca é mínima, não acopla a autenticação à Topbar, preserva link, fluxo e avisos legais, e a marca é a mesma já aprovada.

Não prova:

- o resultado na página publicada: depende do novo pacote, release, pin e deploy;
- login real, OAuth, cadastro ou recuperação de senha, que o harness não executa e que este diff não toca;
- as oito capturas que não abri; para elas vale o registro do Astra;
- lint e os seis testes de shell, que vêm do relato do Astra. Só a checagem de tipos foi repetida por mim.

## Para o fechamento

1. Commitar a fonte e gerar o pacote com a origem `https://api.allber.to`, release, hash e pin, como nas publicações anteriores.
2. Depois do deploy, conferir em `https://painel.allber.to/login` o logo e, de passagem, a cor do texto de versão no tema escuro.
3. O login real no navegador continua pendente da story 004 e não é resolvido por esta mudança.

## Suplemento — fonte commitada, pacote e pin

Revisão curta, por leitura e hash local. Não repeti build, chamadas à API nem navegador. **Aceito: o pacote corresponde à fonte que revisei e o pin aponta para ele. Pode seguir para o deploy do web depois do CI.**

| Ponto | Resultado | Base |
| --- | --- | --- |
| Fonte exata | **Confere** | O commit `a0fe5f2edd3bc5a4d3f1873346efe4d9e2cf5f02` altera os mesmos quatro arquivos de `src/` que revisei, e a diferença entre o checkout e esse commit em `src/` é vazia. |
| Pacote | **Confere** | Recalculei: 15.281.775 bytes, SHA-256 `1b10a59e…2316`. O arquivo baixado da release pública tem o mesmo hash. |
| Revisão no pacote | **Confere** | `version.json` traz `a0fe5f2e…5f02`, de 18:49:57 UTC. |
| Pin | **Confere** | O `Dockerfile` muda só duas linhas, URL e hash, para a release `web-a0fe5f2edd3b-1` e o SHA-256 acima. A receita não mudou. |
| Marca no pacote | **Confere** | A classe `ab-auth-logo` está no JavaScript e no CSS gerados. O texto alternativo antigo não aparece em nenhum arquivo do pacote. |
| Origem da API | **Confere** | `https://api.allber.to` presente; nenhuma referência ao host temporário. |
| Estrutura do pacote | **Confere** | 1.388 entradas, conteúdo na raiz, nenhum caminho absoluto ou com `..`. |
| Imagem leve | **Relatado** | `lightweight-check.json`: build e `nginx -t` com saída 0, rede desligada, revisão dentro da imagem igual à do pacote. Não repeti. |
| Story 005 | **Coerente** | Estado "pacote publicado, deploy pendente"; commit, tamanho, hash, release e limites batem com o que conferi. |

### Observações

- **As duas imagens do logo Invoice Ninja continuam no pacote.** É esperado: uma é usada pela página "não encontrado" e a outra é o logotipo padrão das configurações da empresa. Nenhuma aparece mais na autenticação.
- **`version.json` mostra o commit da fonte, não o do pin nem o do merge.** A story já avisa. Na conferência pós-deploy, o valor esperado é `a0fe5f2e…`.
- **O registro do verificador desta vez é mais curto.** Não traz as contagens de endereços locais e de assinaturas de segredo que o da release anterior trazia. O verificador terminou com saída 0, e as únicas mudanças de fonte são as desta revisão, que não tocam em configuração.
- O pin e os documentos da story 005 ainda estavam no checkout, sem commit, quando li. O coordenador informou que está commitando para o CI.

### Não verificado

- CI do commit com o pin.
- O resultado em `https://painel.allber.to/login`, que depende do deploy.
- O login real no navegador, pendente desde a story 004.
