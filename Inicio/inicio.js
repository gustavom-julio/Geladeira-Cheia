/*
 * Geladeira Cheia | Início (a geladeira): adicionar, listar, editar e remover recados.
 */
(function () {
    "use strict";

    var S = window.GeladeiraCheia;
    var form = document.getElementById("form");
    var lista = document.getElementById("lista");
    var CAMPOS = ["nome", "quantidade", "unidade", "validade", "ponto"];
    var itens = [];

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

    // Valida todos os campos e devolve { campo: mensagem }
    function validarDados(d) {
        var erros = {};
        var eNome = S.validarTexto(d.nome, 3, 40); if (eNome) erros.nome = eNome;
        var ePonto = S.validarTexto(d.ponto, 3, 60); if (ePonto) erros.ponto = ePonto;
        var q = Number(d.quantidade);
        if (d.quantidade === "") erros.quantidade = "Preencha este campo.";
        else if (!Number.isInteger(q) || q < 1 || q > 999) erros.quantidade = "Informe um número inteiro de 1 a 999.";
        if (["un", "kg", "L"].indexOf(d.unidade) === -1) erros.unidade = "Escolha uma unidade da lista.";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.validade)) erros.validade = "Informe a data de validade.";
        else if (diasAte(d.validade) < 0) erros.validade = "A validade não pode estar no passado.";
        else if (diasAte(d.validade) > 365) erros.validade = "Use uma validade de até 1 ano.";
        return erros;
    }

    function limparFormulario() {
        form.reset();
        document.getElementById("id").value = "";
        document.getElementById("salvar").textContent = "Colar na geladeira";
        document.getElementById("cancelar").hidden = true;
        document.getElementById("t-form").textContent = "Novo recado";
        CAMPOS.forEach(function (c) { S.mostrarErroCampo(c, ""); });
    }

    // ----- Operações sobre os dados -----
    function persistir() { return S.salvarLista(S.K_ITENS, itens); }

    function adicionar(d) {
        itens.push({
            id: gerarId(), nome: d.nome.trim(), quantidade: Number(d.quantidade), unidade: d.unidade,
            validade: d.validade, ponto: d.ponto.trim(), criadoEm: new Date().toISOString()
        });
        S.registrarLog("adicionar", "item adicionado com sucesso");
    }

    function atualizar(d) {
        var item = itens.filter(function (i) { return i.id === d.id; })[0];
        if (!item) { S.registrarLog("editar", "item não encontrado"); return; }
        item.nome = d.nome.trim();
        item.quantidade = Number(d.quantidade);
        item.unidade = d.unidade;
        item.validade = d.validade;
        item.ponto = d.ponto.trim();
        S.registrarLog("editar", "item editado com sucesso");
    }

    function remover(id) {
        if (!window.confirm("Remover este recado da geladeira?")) return;
        itens = itens.filter(function (i) { return i.id !== id; });
        persistir();
        S.registrarLog("remover", "item removido com sucesso");
        desenharLista();
    }

    function iniciarEdicao(item) {
        CAMPOS.forEach(function (c) { document.getElementById(c).value = item[c]; });
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

    function criarCartao(item) {
        var dias = diasAte(item.validade);
        var col = document.createElement("div");
        col.className = "col-sm-6 col-xl-4";
        var art = document.createElement("article");
        art.className = "etiqueta" + (dias < 0 ? " vencido" : dias <= 1 ? " urgente" : "");
        var acoes = document.createElement("div");
        acoes.className = "acoes";
        acoes.append(
            criarBotao("Editar", function () { iniciarEdicao(item); }),
            criarBotao("Remover", function () { remover(item.id); })
        );
        art.append(
            criarTexto("h3", "", item.nome),
            criarTexto("p", "mb-1", item.quantidade + " " + item.unidade),
            criarTexto("p", "prazo mb-1", descreverPrazo(dias)),
            criarTexto("p", "mb-0", "Retirar: " + item.ponto),
            acoes
        );
        col.appendChild(art);
        return col;
    }

    function desenharLista() {
        lista.replaceChildren();
        var ordenados = itens.slice().sort(function (a, b) { return a.validade.localeCompare(b.validade); });
        ordenados.forEach(function (i) { lista.appendChild(criarCartao(i)); });
        document.getElementById("vazio").hidden = ordenados.length > 0;
        document.getElementById("contagem").textContent = "(" + ordenados.length + ")";
    }

    // ----- Eventos -----
    function aoEnviar(ev) {
        ev.preventDefault();
        var dados = lerFormulario();
        var erros = validarDados(dados);
        CAMPOS.forEach(function (c) { S.mostrarErroCampo(c, erros[c]); });
        if (Object.keys(erros).length) { S.registrarLog("validar", "recusado: dados inválidos"); return; }
        try {
            if (dados.id) atualizar(dados); else adicionar(dados);
            if (!persistir()) return;
            desenharLista();
            limparFormulario();
        } catch (erro) {
            S.mostrarErro(S.MSG_ERRO);
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

    function iniciar() {
        var campoData = document.getElementById("validade");
        campoData.min = hojeISO();
        campoData.max = dataEm(365);
        var primeiraVez = false;
        try { primeiraVez = localStorage.getItem(S.K_ITENS) === null; } catch (erro) { S.mostrarErro(S.MSG_ERRO); }
        itens = primeiraVez ? criarExemplos() : S.lerLista(S.K_ITENS);
        if (primeiraVez) persistir();
        // O navegador valida primeiro (HTML5); o JS mostra as mensagens e confere as regras extras
        S.ligarValidacao(form, function () { S.registrarLog("validar", "recusado: dados inválidos"); });
        form.addEventListener("submit", aoEnviar);
        document.getElementById("cancelar").addEventListener("click", limparFormulario);
        desenharLista();
    }

    iniciar();
})();
