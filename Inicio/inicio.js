/*
 * Geladeira Cheia | Início (a geladeira): adicionar, listar, editar e remover recados.
 * Usa as funções compartilhadas de ../js/geladeira-cheia.js (window.GeladeiraCheia).
 */
(function () {
    "use strict";

    var S = window.GeladeiraCheia;
    var form = document.getElementById("form");
    var lista = document.getElementById("lista");
    var CAMPOS = ["nome", "quantidade", "unidade", "validade", "ponto"];
    var CAPACIDADE = 12;                                  // recados que "enchem" a geladeira
    var ICONES = { un: "🧺", kg: "⚖️", L: "🥛" };         // um ícone por unidade
    var itens = [];
    var filtro = "todos";                                 // todos | logo | vencidos
    var idNovo = "";                                      // recado recém-colado (ganha animação)

    // ----- Datas -----
    function hojeISO() {
        var d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }

    // Dias entre hoje e a validade (negativo = já venceu)
    function diasAte(validade) {
        return Math.round((new Date(validade + "T00:00:00") - new Date(hojeISO() + "T00:00:00")) / 86400000);
    }

    function descreverPrazo(d) {
        if (d < 0) return "venceu há " + (-d) + (d < -1 ? " dias" : " dia");
        if (d === 0) return "vence hoje";
        if (d === 1) return "vence amanhã";
        return "vence em " + d + " dias";
    }

    // Data daqui a N dias, no formato AAAA-MM-DD
    function dataEm(dias) {
        var d = new Date(hojeISO() + "T00:00:00");
        d.setDate(d.getDate() + dias);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    // ----- Formulário -----
    function lerFormulario() {
        var dados = {};
        CAMPOS.forEach(function (c) { dados[c] = document.getElementById(c).value; });
        dados.id = document.getElementById("id").value;
        return dados;
    }

    // Valida todos os campos e devolve { campo: mensagem }.
    // Ao editar um recado que já venceu, manter a data original é permitido (só a data nova segue a regra
    // "de hoje até 1 ano"). Assim dá para corrigir nome, quantidade ou ponto de um recado vencido.
    function validarDados(d) {
        var erros = {};
        var eNome = S.validarTexto(d.nome, 3, 40); if (eNome) erros.nome = eNome;
        var ePonto = S.validarTexto(d.ponto, 3, 60); if (ePonto) erros.ponto = ePonto;
        var q = Number(d.quantidade);
        if (d.quantidade === "") erros.quantidade = "Preencha este campo.";
        else if (!Number.isInteger(q) || q < 1 || q > 999) erros.quantidade = "Informe um número inteiro de 1 a 999.";
        if (["un", "kg", "L"].indexOf(d.unidade) === -1) erros.unidade = "Escolha uma unidade da lista.";
        var original = d.id ? buscarItem(d.id) : null;
        var mantemData = !!original && original.validade === d.validade;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.validade)) erros.validade = "Informe a data de validade.";
        else if (!mantemData && diasAte(d.validade) < 0) erros.validade = "A validade não pode estar no passado.";
        else if (!mantemData && diasAte(d.validade) > 365) erros.validade = "Use uma validade de até 1 ano.";
        return erros;
    }

    function limparFormulario() {
        form.reset();
        document.getElementById("id").value = "";
        document.getElementById("validade").min = hojeISO();      // volta ao limite normal (fim da edição)
        document.getElementById("salvar").textContent = "Colar na geladeira";
        document.getElementById("cancelar").hidden = true;
        document.getElementById("t-form").textContent = "Novo recado";
        CAMPOS.forEach(function (c) { S.mostrarErroCampo(c, ""); });
    }

    // ----- Operações sobre os dados -----
    // Regra: primeiro grava a lista NOVA no localStorage; só se der certo ela vira a lista da tela
    // e o resultado "com sucesso" vai para o painel. Se a gravação falhar, o painel diz que falhou.
    function buscarItem(id) {
        return itens.filter(function (i) { return i.id === id; })[0] || null;
    }

    // Grava a lista no localStorage. Devolve true se gravou (o erro na tela é mostrado por salvarLista)
    function persistir(novaLista) { return S.salvarLista(S.K_ITENS, novaLista); }

    // Monta o recado a partir do formulário. Em edição, mantém o id e o criadoEm originais (base)
    function montarItem(d, base) {
        return {
            id: base ? base.id : gerarId(),
            nome: d.nome.trim(),
            quantidade: Number(d.quantidade),
            unidade: d.unidade,
            validade: d.validade,
            ponto: d.ponto.trim(),
            criadoEm: base ? base.criadoEm : new Date().toISOString()
        };
    }

    function remover(id) {
        if (!window.confirm("Remover este recado da geladeira?")) return;
        var restantes = itens.filter(function (i) { return i.id !== id; });
        if (!persistir(restantes)) { S.registrarLog("remover", "falha ao salvar os dados"); return; }
        itens = restantes;
        if (document.getElementById("id").value === id) limparFormulario();   // não deixa editar um recado que não existe mais
        S.registrarLog("remover", "item removido com sucesso");
        desenharLista();
    }

    function iniciarEdicao(item) {
        CAMPOS.forEach(function (c) { document.getElementById(c).value = item[c]; });
        // Se o recado já venceu, o limite mínimo do campo passa a ser a data dele, para o navegador aceitá-la
        var campoData = document.getElementById("validade");
        campoData.min = item.validade < hojeISO() ? item.validade : hojeISO();
        document.getElementById("id").value = item.id;
        document.getElementById("salvar").textContent = "Salvar alterações";
        document.getElementById("cancelar").hidden = false;
        document.getElementById("t-form").textContent = "Editar recado";
        document.getElementById("nome").focus();
    }

    // ----- Lista na tela (DOM) -----
    function criarBotao(texto, aoClicar) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = texto;
        b.addEventListener("click", aoClicar);
        return b;
    }

    function criarTexto(tag, classe, texto) {
        var el = document.createElement(tag);
        if (classe) el.className = classe;
        el.textContent = texto;
        return el;
    }

    // Selo redondo de prazo (enfeite: o prazo também está escrito no texto do recado)
    function criarSelo(dias) {
        var selo = document.createElement("span");
        selo.className = "selo";
        selo.setAttribute("aria-hidden", "true");
        if (dias < 0) {
            selo.append(criarTexto("b", "", "!"), criarTexto("small", "", "venceu"));
        } else if (dias === 0) {
            selo.className += " palavra";
            selo.append(criarTexto("b", "", "hoje"));
        } else {
            selo.append(criarTexto("b", "", String(dias)), criarTexto("small", "", dias === 1 ? "dia" : "dias"));
        }
        return selo;
    }

    function criarCartao(item) {
        var dias = diasAte(item.validade);
        var col = document.createElement("div");
        col.className = "col-sm-6 col-xl-4 prateleira" + (item.id === idNovo ? " nova" : "");
        var art = document.createElement("article");
        art.className = "etiqueta" + (dias < 0 ? " vencido" : dias <= 1 ? " urgente" : "");
        var icone = criarTexto("span", "icone", ICONES[item.unidade] || "");
        icone.setAttribute("aria-hidden", "true");
        var qtd = document.createElement("p");
        qtd.className = "mb-1";
        qtd.append(icone, " " + item.quantidade + " " + item.unidade);
        var acoes = document.createElement("div");
        acoes.className = "acoes";
        acoes.append(
            criarBotao("Editar", function () { iniciarEdicao(item); }),
            criarBotao("Remover", function () { remover(item.id); })
        );
        art.append(
            criarSelo(dias),
            criarTexto("h3", "", item.nome),
            qtd,
            criarTexto("p", "prazo mb-1", descreverPrazo(dias)),
            criarTexto("p", "mb-0", "Retirar: " + item.ponto),
            acoes
        );
        col.appendChild(art);
        return col;
    }

    // ----- Filtros: todos, vence logo (até 2 dias) e vencidos -----
    function passaNoFiltro(item) {
        var d = diasAte(item.validade);
        if (filtro === "logo") return d >= 0 && d <= 2;
        if (filtro === "vencidos") return d < 0;
        return true;
    }

    function ligarFiltros() {
        var botoes = document.querySelectorAll(".filtros button");
        botoes.forEach(function (b) {
            b.addEventListener("click", function () {
                filtro = b.dataset.filtro;
                botoes.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
                desenharLista();
            });
        });
    }

    // ----- Termômetro: quanto mais recados, mais cheia a geladeira -----
    function atualizarNivel() {
        var total = itens.length;
        var pct = Math.min(100, Math.round(total / CAPACIDADE * 100));
        document.getElementById("nivel-barra").style.height = pct + "%";
        document.querySelector(".nivel").dataset.cheia = pct >= 100 ? "sim" : "nao";
        var texto = total === 0 ? "Geladeira vazia" : pct >= 100 ? "Geladeira lotada" : "Geladeira " + pct + "% cheia";
        document.getElementById("nivel-texto").textContent = texto + " · " + total + (total === 1 ? " recado" : " recados");
    }

    function desenharLista() {
        lista.replaceChildren();
        var ordenados = itens.slice().sort(function (a, b) { return a.validade.localeCompare(b.validade); });
        var visiveis = ordenados.filter(passaNoFiltro);
        visiveis.forEach(function (i) { lista.appendChild(criarCartao(i)); });
        document.getElementById("vazio").hidden = itens.length > 0;
        document.getElementById("vazio-filtro").hidden = !(itens.length > 0 && visiveis.length === 0);
        document.getElementById("contagem").textContent = "(" + visiveis.length + ")";
        atualizarNivel();
        idNovo = "";
    }

    // ----- Eventos -----
    function aoEnviar(ev) {
        ev.preventDefault();
        var dados = lerFormulario();
        var erros = validarDados(dados);
        CAMPOS.forEach(function (c) { S.mostrarErroCampo(c, erros[c]); });
        if (Object.keys(erros).length) { S.registrarLog("validar", "recusado: dados inválidos"); return; }

        var editando = Boolean(dados.id);
        var acao = editando ? "editar" : "adicionar";
        try {
            var proposta;
            var novo = null;
            if (editando) {
                var atual = buscarItem(dados.id);
                if (!atual) { S.registrarLog("editar", "item não encontrado"); limparFormulario(); return; }
                proposta = itens.map(function (i) { return i.id === dados.id ? montarItem(dados, atual) : i; });
            } else {
                novo = montarItem(dados);
                proposta = itens.concat([novo]);
            }
            if (!persistir(proposta)) { S.registrarLog(acao, "falha ao salvar os dados"); return; }
            itens = proposta;
            if (novo) idNovo = novo.id;                       // o recado novo ganha a animação
            S.registrarLog(acao, editando ? "item editado com sucesso" : "item adicionado com sucesso");
            desenharLista();
            limparFormulario();
        } catch (erro) {
            S.mostrarErro(S.MSG_ERRO);                        // o erro técnico não aparece para a pessoa
        }
    }

    // Primeira visita: 3 exemplos fictícios para demonstrar a geladeira
    function criarExemplos() {
        var base = [
            ["Pão francês", 6, "un", 0, "Padaria Sol, balcão lateral"],
            ["Tomates maduros", 2, "kg", 1, "Praça da Matriz"],
            ["Leite integral", 3, "L", 4, "Associação de Moradores"]
        ];
        return base.map(function (b) {
            return { id: gerarId(), nome: b[0], quantidade: b[1], unidade: b[2], validade: dataEm(b[3]), ponto: b[4], criadoEm: new Date().toISOString() };
        });
    }

    // Lê os recados do localStorage e descarta os que estão corrompidos ou foram alterados à mão
    function carregarItens() {
        var resultado = S.filtrarItensValidos(S.lerLista(S.K_ITENS));
        if (resultado.descartados > 0) {
            S.salvarLista(S.K_ITENS, resultado.validos);
            S.registrarLog("carregar", resultado.descartados + (resultado.descartados === 1 ? " item inválido descartado" : " itens inválidos descartados"));
        }
        return resultado.validos;
    }

    function iniciar() {
        var campoData = document.getElementById("validade");
        campoData.min = hojeISO();
        campoData.max = dataEm(365);
        // O navegador valida primeiro (HTML5); o JS mostra as mensagens e confere as regras extras
        S.ligarValidacao(form, function () { S.registrarLog("validar", "recusado: dados inválidos"); });
        form.addEventListener("submit", aoEnviar);
        document.getElementById("cancelar").addEventListener("click", limparFormulario);
        ligarFiltros();
        // Carregar e desenhar são os pontos que podem falhar: se der erro, a pessoa vê só a mensagem genérica
        try {
            var primeiraVez = localStorage.getItem(S.K_ITENS) === null;
            itens = primeiraVez ? criarExemplos() : carregarItens();
            if (primeiraVez) persistir(itens);
            desenharLista();
        } catch (erro) {
            itens = [];
            S.mostrarErro(S.MSG_ERRO);
        }
    }

    iniciar();
})();
