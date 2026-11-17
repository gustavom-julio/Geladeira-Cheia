/*
 * Geladeira Cheia | Simulador: quantas famílias a comida desperdiçada poderia alimentar.
 */
(function () {
    "use strict";

    var S = window.GeladeiraCheia;
    var REFEICAO_KG = 0.5;          // suposição declarada na página
    var REFEICOES_PESSOA_DIA = 3;   // suposição declarada na página
    var MAX_CASAS = 24;             // limite de ícones desenhados

    // Valida número dentro de um intervalo. Devolve a mensagem ou ""
    function numeroEntre(valor, min, max, inteiro) {
        if (valor === "") return "Preencha este campo.";
        var n = Number(valor);
        if (!isFinite(n) || n < min || n > max) return "Informe um valor de " + min + " a " + max + ".";
        if (inteiro && !Number.isInteger(n)) return "Informe um número inteiro.";
        return "";
    }

    function formatar(n, casas) { return n.toLocaleString("pt-BR", { maximumFractionDigits: casas || 0 }); }

    // Faz as contas a partir de dados já validados
    function calcularImpacto(kgSemana, pessoas, meta) {
        var kgAno = kgSemana * 52;
        var kgSalvos = kgAno * meta / 100;
        var refeicoes = kgSalvos / REFEICAO_KG;
        var diasFamilia = refeicoes / (pessoas * REFEICOES_PESSOA_DIA);
        return { kgAno: kgAno, kgSalvos: kgSalvos, refeicoes: refeicoes, diasFamilia: diasFamilia, familiasSemana: diasFamilia / 7 };
    }

    // Parágrafo com um trecho em destaque (textContent, sem innerHTML)
    function adicionarLinha(caixa, antes, destaque, depois) {
        var p = document.createElement("p");
        var s = document.createElement("strong");
        s.textContent = destaque;
        p.append(antes, s, depois);
        caixa.appendChild(p);
    }

    // Uma casinha por família alimentada (até o limite)
    function desenharCasas(caixa, quantidade) {
        if (quantidade < 1) return;
        var linha = document.createElement("div");
        linha.className = "casas";
        linha.setAttribute("aria-hidden", "true");
        for (var i = 0; i < Math.min(quantidade, MAX_CASAS); i++) {
            var c = document.createElement("span");
            c.className = "casa";
            linha.appendChild(c);
        }
        caixa.appendChild(linha);
    }

    function mostrarResultado(caixa, r, pessoas, meta) {
        caixa.replaceChildren();
        var gente = pessoas + (pessoas === 1 ? " pessoa" : " pessoas");
        adicionarLinha(caixa, "Você joga fora ", formatar(r.kgAno, 1) + " kg", " de comida por ano.");
        adicionarLinha(caixa, "Reduzindo " + meta + "%, sobram ", formatar(r.kgSalvos, 1) + " kg", " que viram " + formatar(Math.round(r.refeicoes)) + " refeições.");
        var familias = Math.floor(r.familiasSemana);
        if (familias >= 1) {
            adicionarLinha(caixa, "Isso alimenta ", formatar(familias) + (familias === 1 ? " família" : " famílias"), " de " + gente + " por uma semana.");
        } else {
            adicionarLinha(caixa, "Isso dá comida para uma família de " + gente + " por ", formatar(r.diasFamilia, 1) + " dias", ".");
        }
        desenharCasas(caixa, familias);
        caixa.hidden = false;
    }

    function calcular(ev) {
        ev.preventDefault();
        var kg = document.getElementById("kg").value;
        var pessoas = document.getElementById("pessoas").value;
        var meta = document.getElementById("meta").value;
        var erros = { kg: numeroEntre(kg, 0.1, 50), pessoas: numeroEntre(pessoas, 1, 10, true), meta: numeroEntre(meta, 10, 90) };
        Object.keys(erros).forEach(function (c) { S.mostrarErroCampo(c, erros[c]); });
        var caixa = document.getElementById("resultado");
        if (Object.keys(erros).some(function (c) { return erros[c]; })) {
            caixa.hidden = true;
            S.registrarLog("simular", "recusado: dados inválidos");
            return;
        }
        try {
            mostrarResultado(caixa, calcularImpacto(Number(kg), Number(pessoas), Number(meta)), Number(pessoas), Number(meta));
            S.registrarLog("simular", "simulação calculada com sucesso");
        } catch (erro) {
            S.mostrarErro(S.MSG_ERRO);
        }
    }

    var formSim = document.getElementById("form-sim");
    S.ligarValidacao(formSim, function () { S.registrarLog("simular", "recusado: dados inválidos"); });
    formSim.addEventListener("submit", calcular);
    document.getElementById("meta").addEventListener("input", function (e) {
        document.getElementById("meta-valor").textContent = e.target.value + "%";
    });
})();
