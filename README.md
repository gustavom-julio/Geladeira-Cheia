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
| Início | `Inicio/` | Colar, listar, editar e remover recados de sobras; painel de atividades |
| Simulador | `Simulador/` | Estima quantas famílias a comida jogada fora poderia alimentar |
| Sobre | `Sobre/` | Problema, cidadão, evidência, ODS e modelo de negócio |

### Início (a geladeira)

Cada recado vira uma etiqueta presa com ímã: amarela se vence hoje ou amanhã, riscada se já venceu. O **cupom de atividades** registra data/hora, ação e resultado de cada operação (ex.: `17/11/2026 08:30 — item adicionado com sucesso`).

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
- Coleta mínima (LGPD): nenhum dado pessoal; só dados fictícios; sem segredos no repositório.

---

## Tecnologias utilizadas

- **HTML5** semântico (`header`, `nav`, `main`, `section`, `footer`);
- **CSS3** em arquivo externo, Mobile First, Flexbox/Grid;
- **JavaScript** puro: DOM, eventos, `localStorage`;
- **Bootstrap 5.3.8**: navbar, grid e formulários.

---

## Estrutura do projeto

```text
geladeira-cheia/
│
├── Inicio/            # Página principal (index.html, style.css, inicio.js)
├── Simulador/         # Simulador de famílias alimentadas
├── Sobre/             # Sobre o projeto
├── js/
│   └── geladeira-cheia.js      # Armazenamento, erros, log e validação compartilhados
├── prints/            # Prints das telas (celular, tablet e desktop)
├── global.css         # Estilos globais compartilhados entre as páginas
└── README.md
```

---

## Prints das telas

> Coloque as imagens na pasta `prints/` com esse nomes e elas aparecem aqui. Depois apagar esta observação.

### Início (a geladeira)

| Celular | Tablet | Desktop |
|---------|--------|---------|
| ![Início no celular](prints/inicio-celular.png) | ![Início no tablet](prints/inicio-tablet.png) | ![Início no desktop](prints/inicio-desktop.png) |

### Simulador

| Celular | Tablet | Desktop |
|---------|--------|---------|
| ![Simulador no celular](prints/simulador-celular.png) | ![Simulador no tablet](prints/simulador-tablet.png) | ![Simulador no desktop](prints/simulador-desktop.png) |

### Sobre

| Celular | Tablet | Desktop |
|---------|--------|---------|
| ![Sobre no celular](prints/sobre-celular.png) | ![Sobre no tablet](prints/sobre-tablet.png) | ![Sobre no desktop](prints/sobre-desktop.png) |

---

## Como executar o projeto

1. Abra a pasta `geladeira-cheia/` no Visual Studio Code;
2. Clique com o botão direito em `Inicio/index.html` e escolha **Open with Live Server**.

Também funciona abrindo `Inicio/index.html` direto no navegador.

---

## Status

> **Protótipo funcional**
