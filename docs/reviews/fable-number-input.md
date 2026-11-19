# Campo numérico perde o valor digitado — parecer inicial do CTO

Data: 19/11/2026. Revisor: Claude Fable 5.2, somente leitura de código e evidência. A correção ainda não existe; este parecer orienta a implementação do Astra e será completado quando o delta estiver congelado.

## O que aconteceu

Na verificação E8 no ambiente publicado, o operador criou pelo assistente uma fatura de teste com preço 10. A leitura pela API mostra o rascunho gravado com `cost 0`, `quantity 1`, `amount 0` e a descrição correta (`/tmp/allberto-easypanel-release/draft-ui-investigation.json`). O preço digitado não chegou ao servidor.

## Causa, confirmada no código

`src/components/forms/NumberInputField.tsx`, no modo `changeOverride`:

- cada tecla atualiza só o estado interno do campo (`:170-188`);
- o valor é entregue ao formulário **500 ms depois**, por `useDebounce` (`:103-113`);
- ao sair do campo nada é entregue: o `onBlur` só age quando `changeOverride` está desligado (`:189-207`);
- se o campo é desmontado antes dos 500 ms, o temporizador é cancelado (comportamento do `useDebounce` da biblioteca) e o valor se perde sem aviso.

No assistente de fatura, os campos de quantidade e preço usam esse modo (`StepItems.tsx:311-341`). Clicar em Continuar em menos de meio segundo depois da última tecla troca de etapa, desmonta o campo e descarta o preço.

## Não é só artefato de automação

O operador preencheu e clicou no mesmo lote, o que garante a corrida. Mas **uma pessoa rápida reproduz o mesmo**: digitar o preço e clicar em Continuar dentro de meio segundo. O clique real tira o foco do campo antes, só que neste modo a saída de foco não entrega nada. É defeito herdado do upstream, não introduzido pelo allberto.

## Alcance

Seis telas usam o campo neste modo. Além do assistente de fatura:
- **`payments/create/Create.tsx`** — valor do pagamento;
- `invoices/common/components/InvoiceDetails.tsx`, `quotes/…/QuoteDetails.tsx`, `credits/…/CreditDetails.tsx`, `purchase-orders/edit/components/Details.tsx` — campos como desconto e parcela.

Em todas, salvar em menos de meio segundo após digitar grava o valor antigo. O atalho de salvar (Ctrl+S) já tira o foco do campo ativo justamente para forçar a entrega pendente (`useSaveKeyboardShortcut`), mas neste modo isso não entrega nada: o atalho também perde o valor.

**Gravidade: alta.** É valor financeiro gravado diferente do digitado, em silêncio. Reforça a regra vigente: sem dados reais até a correção estar publicada.

## Avaliação da correção proposta

A direção do coordenador está certa: **entregar o valor na saída de foco e cancelar a entrega pendente, mantendo o atraso durante a digitação, sem entregar no desmonte.**

Por que funciona: o clique real em Continuar ou Salvar tira o foco do campo antes do clique. O React aplica a atualização de estado de um evento de saída de foco antes de tratar o evento seguinte, então o manipulador do clique já enxerga o valor novo.

Por que **não** entregar no desmonte: o botão de remover item desmonta a linha. Uma entrega nesse momento chamaria `update(index, …)` com um índice que já aponta para outra linha, ou para nenhuma, e corromperia o item vizinho. Concordo em não fazer.

### Requisitos para a implementação

1. Na saída de foco, em modo `changeOverride`: cancelar o temporizador pendente (o `useDebounce` devolve a função de cancelar) e entregar o valor com **a mesma normalização** da entrega atrasada (número como texto; vazio como `'0'`).
2. Não entregar na saída de foco se nada mudou desde a última entrega, para não marcar o formulário como alterado só por passar pelo campo.
3. Não alterar o modo sem `changeOverride`, que já entrega na saída de foco.
4. Nenhuma mudança nas seis telas: a correção fica no componente compartilhado.

### Testes que quero ver, começando por um que falha antes da correção

- digitar e sair do campo sem avançar o relógio: a entrega acontece na hora, com o valor certo;
- digitar e esperar 500 ms sem sair: a entrega atrasada continua funcionando;
- digitar, sair e esperar 500 ms: **uma** entrega, não duas;
- digitar e desmontar sem sair do campo: nenhuma entrega;
- passar pelo campo sem digitar: nenhuma entrega na saída;
- empresa com vírgula decimal: `10,50` é entregue como `10.5`;
- modo sem `changeOverride`: comportamento idêntico ao atual;
- no assistente: digitar o preço, clicar em Continuar imediatamente com clique real, e o corpo enviado ao salvar leva o preço digitado.

O último precisa de clique que tire o foco de verdade. Um clique disparado por script (`element.click()`) não tira o foco e não prova nada sobre a correção.

### Risco residual que a correção não cobre

Avançar **sem** tirar o foco e em menos de 500 ms: clique disparado por script ou um futuro atalho de teclado que troque de etapa. No assistente não encontrei envio por Enter nos campos de preço e quantidade, então hoje isso se limita à automação. Para os testes de aceite no ambiente publicado, a instrução ao operador é: depois de digitar um valor, sair do campo (Tab) antes de clicar.

## Enquanto a correção não é publicada

- A fatura de teste com valor zero é dado fictício; pode ser corrigida pela edição depois, ou mantida como evidência. Não apagar a conta.
- Refazer o E8 saindo do campo com Tab e aguardando um segundo antes de avançar. Se o valor persistir assim, fica confirmado que a causa é esta e só esta.
- A regra de não cadastrar dados reais continua, agora com este motivo a mais.

## Pendente deste parecer

Revisão do delta quando o Astra congelar os arquivos, e a confirmação no ambiente publicado depois do novo pacote do frontend (nova release, novo hash, novo commit do `Dockerfile`, conforme a seção 15 da arquitetura).

---

## Revisão final do delta (19/11/2026)

Base: `aa9b976c0014ce6a445ddc53286488a1f4c95067`. Arquivos: `src/components/forms/NumberInputField.tsx`, `tests/unit/number-input-field-blur.test.ts` e os quatro arquivos novos em `tests/local/`.

### Veredito

**Requer uma correção antes de publicar.** A correção resolve o incidente e está bem testada, mas introduz uma regressão concreta: passar pelo campo sem digitar pode arredondar o valor guardado. O ajuste é de poucas linhas, no mesmo arquivo.

### O que está correto

- A saída de foco agora entrega o valor e cancela o temporizador pendente, no modo `changeOverride`. É o que pedi.
- Não há entrega no desmonte.
- O modo sem `changeOverride` continua entregando sempre na saída de foco, como antes.
- A entrega atrasada de 500 ms foi mantida para quem digita e não sai do campo.
- **Teste que falha antes:** o registro `/tmp/allberto-number-blur-red.log` mostra falhas antes da correção; o verde mostra 7 de 7. Rodei o arquivo: 7 passaram.
- **Clique real:** o teste de navegador usa `page.getByRole(...).click()` do Playwright, que move o foco de verdade, e mede a saída de foco 43,9 ms depois da digitação, bem dentro dos 500 ms. O corpo interceptado do salvamento leva `cost: 10`, e nenhuma requisição escapou para fora. Li o arquivo de evidência; não reexecutei o teste de navegador.
- Os oito casos que pedi estão cobertos, exceto o que descrevo abaixo, que não estava na minha lista. A falha de especificação é minha.

Uma mudança de comportamento que aceito: antes, o campo entregava o valor inicial 500 ms depois de montar, mesmo sem ninguém digitar. Agora só entrega se o valor mudou. É melhor: deixa de marcar o formulário como alterado à toa.

### Achado — Média: sair do campo sem digitar pode arredondar o valor

**Onde:** `NumberInputField.tsx`, `onBlur`. No modo `changeOverride` ele relê o **texto exibido** no campo, converte e compara com o último valor entregue.

**Problema:** o campo exibe o número arredondado para a precisão configurada. Quando o valor guardado tem mais casas do que isso, o texto exibido já difere do valor guardado, e a saída de foco entrega o valor arredondado, mesmo sem nenhuma tecla.

**Demonstração:** renderizei o componente de formatação com duas casas e apliquei a mesma conversão da saída de foco:

| Valor guardado | Exibido | Entregue ao sair do campo |
| --- | --- | --- |
| 1,2345 | `1,23` | 1,23 |
| 10,129 | `10,13` | 10,13 |
| 0,0125 | `0,01` | 0,01 |

**Cenário:** no assistente de fatura, a precisão do campo de preço vem da preferência de casas decimais do usuário (`StepItems.tsx:61-64`). Um produto com preço unitário de quatro casas, num usuário configurado com duas, tem o preço alterado só por navegar com Tab pelo campo. Antes da correção isso não acontecia: neste modo a saída de foco não entregava nada, e a entrega atrasada usava o valor interno, sem arredondar.

É um caso estreito, mas é alteração silenciosa de valor financeiro — a mesma classe de defeito que estamos corrigindo.

**Menor correção:** no modo `changeOverride`, a saída de foco deve usar o **mesmo valor interno** que a entrega atrasada usa (`String(currentValue ?? 0)`), em vez de reler o texto exibido. Sem digitação, o valor interno é o guardado, igual ao último entregue, e nada é enviado. Com digitação, o valor interno já foi atualizado pelo `onChange`, que acontece num evento anterior. O ramo sem `changeOverride` fica como está.

**Teste a acrescentar:** campo em modo `changeOverride`, precisão 2, valor inicial `1.2345`; sair do campo sem digitar e avançar o relógio 600 ms; nenhuma entrega. E um segundo: mesmo campo, digitar `2`, sair; entrega `'2'` uma vez.

### Outras observações

- **Baixa.** Depois de uma entrega pela saída de foco, se o formulário devolver um valor diferente do entregue (por exemplo, limitado a um máximo), o efeito de `props.value` ressincroniza o controle interno. Correto.
- **Informativa.** Os arquivos em `tests/local/` são página e configuração de teste próprias, sem importar nada da suíte upstream que reseta contas. Não entram no pacote publicado.
- **Risco residual inalterado.** Avançar sem tirar o foco e em menos de 500 ms (clique disparado por script) continua perdendo o valor. Para a operação no ambiente publicado: sair do campo com Tab antes de clicar.

### Depois da correção

Rever só o `onBlur` e os dois testes novos. Em seguida: novo pacote do frontend, nova release, novo hash e novo commit do `Dockerfile`, conforme a seção 15 da arquitetura, e repetição do E8 no ambiente publicado com clique imediato de uma pessoa.

---

## Aceite final (revisão incremental, 19/11/2026)

**Aceito. Sem achado pendente.** Revisei só o incremento sobre o parecer anterior, em `NumberInputField.tsx` e no teste unitário.

- **A regressão está corrigida.** No modo `changeOverride`, a saída de foco agora usa o valor interno, `String(currentValue ?? 0)`, o mesmo da entrega atrasada. O texto exibido só é relido no modo sem `changeOverride`, que ficou como era. O cancelamento do temporizador e o controle do último valor entregue não mudaram.
- **Os dois testes pedidos existem e exercitam o caso real.** O primeiro confirma que o campo exibe `1.23` para um valor guardado `1.2345`, sai do campo sem digitar, avança 600 ms e verifica que nada foi entregue e que o valor guardado continua `1.2345`. O segundo digita `2` sobre esse valor, sai, e verifica uma única entrega de `'2'`.
- **Falha antes, passa depois:** o registro anterior à correção mostra 1 falha e 8 aprovações; rodei o arquivo agora: **9 de 9**.
- **Navegador, na fonte final:** rodei o teste local do assistente (`tests/local/number-wizard.config.ts`): passou, com saída de foco 43,4 ms depois da digitação e o salvamento interceptado levando `cost: 10`, sem requisição para fora. Era o que faltava conferir, porque a entrega passou a depender do estado interno estar atualizado no momento da saída de foco, e só um navegador real prova essa ordem de eventos.

Não rodei a suíte completa, `tsc` nem lint; o coordenador informa aprovação.

### O que continua valendo

- Avançar sem tirar o foco em menos de 500 ms (clique disparado por script) ainda perde o valor. Na operação: sair do campo antes de clicar.
- A correção só chega ao ambiente publicado com novo pacote do frontend, nova release, novo hash e novo commit do `Dockerfile` (seção 15 da arquitetura). Depois disso, repetir o E8 com clique imediato de uma pessoa.
- A fatura de teste com valor zero, criada antes da correção, é dado fictício.
