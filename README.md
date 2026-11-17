# Geladeira Cheia - A geladeira do bairro

A **Geladeira Cheia** é um projeto acadêmico (tema *Uso consciente de recursos*) que ajuda vizinhos a **avisar sobras de comida antes que vençam**, para que outras pessoas retirem em um ponto público.

> Protótipo sem servidor: os dados ficam no navegador e não são compartilhados entre pessoas.

---

## Problema e cidadão

Moradores de bairros urbanos e pequenos comércios (padarias, feiras) descartam comida boa enquanto vizinhos passam necessidade. Falta um jeito simples de avisar o bairro. A solução se liga aos **ODS 2, 11 e 12**.

---

## Funcionalidades

| Página | Pasta | Descrição |
|--------|-------|-----------|
| Início | `inicio/` | Colar, listar, editar e remover recados de sobras; painel de atividades |
| Simulador | `simulador/` | Estima quantas famílias a comida jogada fora poderia alimentar |
| Sobre | `sobre/` | Problema, cidadão, evidência, ODS e modelo de negócio |

### Início (a geladeira)

Cada recado vira uma etiqueta presa com ímã: amarela se vence hoje ou amanhã, riscada se já venceu. O **cupom de atividades** registra data/hora, ação e resultado de cada operação (ex.: `17/11/2026 08:30 — item adicionado com sucesso`). O resultado só diz "com sucesso" depois que o dado foi gravado de verdade; se a gravação falhar, o cupom registra `falha ao salvar os dados`.

**Recados vencidos podem ser editados**: ao editar um recado que já venceu, manter a data original é permitido, assim dá para corrigir nome, quantidade ou ponto. Para trocar a data, a nova precisa ser de hoje até 1 ano.

### Modelo de dados

| Campo | Para que serve |
|-------|----------------|
| `id` | Identifica o recado (editar e remover) |
| `nome` | O que sobrou (3 a 40 caracteres) |
| `quantidade` e `unidade` | Inteiro de 1 a 999, em `un`, `kg` ou `L` |
| `validade` | Data (hoje até 1 ano) |
| `ponto` | Ponto público de retirada (3 a 60 caracteres) |
| `criadoEm` | Data/hora de criação |

Log: `quando`, `acao`, `resultado` (guarda as últimas 30 atividades).

### Segurança e privacidade

- Toda entrada é validada (vazio, tamanho, formato e tipo) no HTML5 e em JavaScript;
- Erros mostram só "Não foi possível carregar os dados. Tente novamente.";
- O texto digitado só entra na página com `textContent`, nunca `innerHTML`;
- Dados lidos do `localStorage` são **validados de novo** antes de aparecer na tela (tipo, tamanho, unidade, data real e id repetido). Recados corrompidos ou alterados à mão são descartados e o descarte aparece no cupom;
- Bootstrap carregado do CDN com **SRI** (`integrity` + `crossorigin`): o navegador recusa o arquivo se ele for alterado;
- Coleta mínima (LGPD): nenhum dado pessoal; só dados fictícios; sem segredos no repositório (`.gitignore` bloqueia `.env`, chaves e certificados).

---

## Tecnologias utilizadas

- **HTML5** semântico (`header`, `nav`, `main`, `section`, `footer`);
- **CSS3** em arquivo externo, Mobile First, Flexbox/Grid;
- **JavaScript** puro: DOM, eventos, `localStorage`;
- **Bootstrap 5.3.9** (via CDN, com SRI): navbar, grid e formulários.

### Recursos além da aula (bônus) e por que usei cada um

| Recurso | Onde | Por que usei |
|---------|------|--------------|
| Animações CSS (`@keyframes`) com `prefers-reduced-motion` | recado "colado" na geladeira, casinhas do simulador | Dar retorno visual de que a ação funcionou. Quem configura o sistema para menos movimento (por distúrbio vestibular, por exemplo) não vê animação nenhuma. |
| `clip-path` | casinhas do simulador | Desenhar uma casa só com CSS, sem arquivo de imagem: menos requisições e o desenho muda de cor junto com o tema. |
| SVG inline | geladeira vazia (Início) | Ilustrar o estado "sem recados" sem depender de imagem externa, e o desenho é escondido do leitor de tela (`aria-hidden`). |
| SVG como fundo (data-URI) | borda serrilhada do cupom | Imitar um cupom de papel sem imagem à parte. |
| API de validação do navegador (`validity`) | `ligarValidacao` e `mensagemNativa` | Aproveitar as regras do HTML5 (obrigatório, tamanho, faixa) e mostrar a mensagem na tela em português, em vez do balão do navegador, sem duplicar regras no JavaScript. |
| `requestAnimationFrame` e `matchMedia` | contagem do simulador | Animar o número de forma suave e desligar a contagem quando a pessoa pede menos movimento. |
| `aria-live`, `aria-busy`, `aria-invalid` | formulários, cupom e simulador | Leitores de tela avisam erros e resultados sem a pessoa precisar procurar na página. |
| SRI (`integrity` + `crossorigin`) | Bootstrap nas 3 páginas | Se o arquivo do CDN fosse trocado por um código malicioso, o navegador não o executaria. Mitiga a ameaça de ataque à cadeia de suprimentos. |

---

## Estrutura do projeto

```text
geladeira-cheia/
│
├── index.html         # Entrada: redireciona para inicio/index.html (evita 404 na URL base do GitHub Pages)
├── inicio/            # Página principal (index.html, style.css, inicio.js)
├── simulador/         # Simulador de famílias alimentadas (simulador.html, simulador.css, simulador.js)
├── sobre/             # Sobre o projeto (sobre.html, sobre.css)
├── js/
│   └── geladeira-cheia.js      # Armazenamento, erros, log e validação compartilhados
├── prints/            # Prints das telas (celular, tablet e desktop)
├── global.css         # Estilos globais compartilhados entre as páginas
├── .gitignore
└── README.md
```

---

## Prints das telas

### Início (a geladeira)

| Celular | Tablet | Desktop |
|---------|--------|---------|
| ![Início no celular](prints/index%20celular.png) | ![Início no tablet](prints/index%20tablet.png) | ![Início no desktop](prints/index%20desktop.png) |

### Simulador

| Celular | Tablet | Desktop |
|---------|--------|---------|
| ![Simulador no celular](prints/simulador%20celular.png) | ![Simulador no tablet](prints/simulador%20tablet.png) | ![Simulador no desktop](prints/simulador%20desktop.png) |

### Sobre

| Celular | Tablet | Desktop |
|---------|--------|---------|
| ![Sobre no celular](prints/sobre%20celular.png) | ![Sobre no tablet](prints/sobre%20tablet.png) | ![Sobre no desktop](prints/sobre%20desktop.png) |

---

## Como executar o projeto

1. Abra a pasta `geladeira-cheia/` no Visual Studio Code;
2. Clique com o botão direito em `index.html` (na raiz) ou em `inicio/index.html` e escolha **Open with Live Server**.

Também funciona abrindo `index.html` direto no navegador. O Bootstrap e as fontes vêm da internet (CDN).


---

## Status

> **Protótipo funcional**
