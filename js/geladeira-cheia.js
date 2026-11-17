/*
 * Geladeira Cheia | armazenamento, mensagens de erro e painel de log SEM banco de dados.
 * Tudo fica guardado no navegador (localStorage), então funciona também no GitHub Pages.
 *
 *
 * O que fica no localStorage:
 *   geladeira_cheia_itens   recados da geladeira: id, nome, quantidade, unidade, validade, ponto, criadoEm
 *   geladeira_cheia_log     últimas 30 atividades: quando, acao, resultado
 *
 * Nenhum dado pessoal é pedido ou guardado (coleta mínima, LGPD).
 * Tudo que é lido do localStorage é validado de novo (itemValido) antes de aparecer na tela.
 */
(function () {
    "use strict";

    var K_ITENS = "geladeira_cheia_itens";
    var K_LOG = "geladeira_cheia_log";
    var MSG_ERRO = "Não foi possível carregar os dados. Tente novamente.";

    // ----- Erros: sempre a mensagem genérica, nunca o erro técnico -----
    function mostrarErro(msg) {
        var aviso = document.getElementById("aviso");
        if (aviso) { aviso.textContent = msg; aviso.hidden = false; }
    }

    // ----- localStorage com try/catch -----
    function lerLista(chave) {
        try {
            var bruto = localStorage.getItem(chave);
            var dados = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            mostrarErro(MSG_ERRO);
            return [];
        }
    }

    // Devolve true se gravou
    function salvarLista(chave, lista) {
        try { localStorage.setItem(chave, JSON.stringify(lista)); return true; }
        catch (erro) { mostrarErro(MSG_ERRO); return false; }
    }

    // ----- Painel de registro de atividades (data/hora, ação e resultado) -----
    function formatarDataHora(iso) {
        return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(", ", " ");
    }

    function registrarLog(acao, resultado) {
        var log = lerLista(K_LOG).filter(registroValido);
        log.unshift({ quando: new Date().toISOString(), acao: acao, resultado: resultado });
        salvarLista(K_LOG, log.slice(0, 30));
        desenharLog();
    }

    // Usa textContent (nunca innerHTML) para não executar o que a pessoa digitou
    function desenharLog() {
        var ol = document.getElementById("log");
        if (!ol) return;
        ol.replaceChildren();
        var log = lerLista(K_LOG).filter(registroValido);
        if (!log.length) {
            var vazio = document.createElement("li");
            vazio.textContent = "Nenhuma atividade ainda.";
            ol.appendChild(vazio);
            return;
        }
        log.forEach(function (r) {
            var li = document.createElement("li");
            var hora = document.createElement("time");
            hora.dateTime = r.quando;
            hora.textContent = formatarDataHora(r.quando);
            var acao = document.createElement("strong");
            acao.textContent = r.acao;
            var res = document.createElement("span");
            res.textContent = "— " + r.resultado;
            li.append(hora, acao, res);
            ol.appendChild(li);
        });
    }

    // ----- Validação -----
    // Texto obrigatório, com tamanho e sem < ou >. Devolve a mensagem ou ""
    function validarTexto(valor, min, max) {
        var v = String(valor).trim();
        if (!v) return "Preencha este campo.";
        if (v.length < min || v.length > max) return "Use de " + min + " a " + max + " caracteres.";
        if (/[<>]/.test(v)) return "Não use os símbolos < e >.";
        return "";
    }

    // ----- Validação do que vem do localStorage -----
    // O localStorage pode ser editado por qualquer pessoa no DevTools (ou ficar corrompido).
    // Por isso nada que é lido de lá é confiado: cada item é conferido de novo antes de ir para a tela.

    // true se for uma data real no formato AAAA-MM-DD (rejeita 2026-02-31, por exemplo)
    function ehDataReal(v) {
        if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
        var d = new Date(v + "T00:00:00");
        if (isNaN(d.getTime())) return false;
        var ano = d.getFullYear();
        return ano >= 2000 && ano <= 2100 &&
            ano === Number(v.slice(0, 4)) && d.getMonth() + 1 === Number(v.slice(5, 7)) && d.getDate() === Number(v.slice(8, 10));
    }

    // true se o recado tem todos os campos do modelo de dados, com tipo e tamanho corretos.
    // Não confere se a validade já passou: recados vencidos continuam válidos (aparecem como "vencidos").
    function itemValido(item) {
        if (!item || typeof item !== "object") return false;
        if (typeof item.id !== "string" || !/^[a-z0-9]{1,40}$/.test(item.id)) return false;
        if (typeof item.nome !== "string" || validarTexto(item.nome, 3, 40)) return false;
        if (typeof item.ponto !== "string" || validarTexto(item.ponto, 3, 60)) return false;
        if (!Number.isInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > 999) return false;
        if (["un", "kg", "L"].indexOf(item.unidade) === -1) return false;
        if (!ehDataReal(item.validade)) return false;
        if (typeof item.criadoEm !== "string" || isNaN(new Date(item.criadoEm).getTime())) return false;
        return true;
    }

    // Separa os recados válidos dos inválidos ou repetidos. Devolve { validos, descartados }
    function filtrarItensValidos(lista) {
        var vistos = Object.create(null);      // sem protótipo: um id como "constructor" não atrapalha
        var validos = [];
        lista.forEach(function (item) {
            if (itemValido(item) && !vistos[item.id]) {
                vistos[item.id] = true;
                validos.push(item);
            }
        });
        return { validos: validos, descartados: lista.length - validos.length };
    }

    // true se a linha do log tem quando (data válida), acao e resultado em texto
    function registroValido(r) {
        return !!r && typeof r.quando === "string" && !isNaN(new Date(r.quando).getTime()) &&
            typeof r.acao === "string" && typeof r.resultado === "string";
    }

    // Mostra ou limpa o erro de um campo (id do campo, sem o prefixo "erro-")
    function mostrarErroCampo(id, msg) {
        var el = document.getElementById("erro-" + id);
        if (el) el.textContent = msg || "";
        var campo = document.getElementById(id);
        if (campo) campo.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    // Traduz a validação nativa do HTML5 (campo.validity) em mensagem para a tela
    function mensagemNativa(campo) {
        var v = campo.validity;
        var data = campo.type === "date";
        if (v.valueMissing) return "Preencha este campo.";
        if (v.patternMismatch) return "Não use os símbolos < e >.";
        if (v.tooShort) return "Use pelo menos " + campo.minLength + " caracteres.";
        if (v.tooLong) return "Use no máximo " + campo.maxLength + " caracteres.";
        if (v.rangeUnderflow) return data ? "A validade não pode estar no passado." : "O menor valor é " + campo.min + ".";
        if (v.rangeOverflow) return data ? "Use uma validade de até 1 ano." : "O maior valor é " + campo.max + ".";
        if (v.stepMismatch) return campo.step === "1" ? "Informe um número inteiro." : "Use no máximo 1 casa decimal.";
        if (v.badInput) return "Informe um valor válido.";
        return "Valor inválido.";
    }

    // Liga a validação nativa ao formulário: o navegador valida, o JS mostra as mensagens na tela
    // (em vez do balão do navegador). aoRecusar roda uma vez por tentativa de envio inválida.
    function ligarValidacao(form, aoRecusar) {
        var recusou = false;
        form.querySelectorAll("input, select").forEach(function (campo) {
            if (campo.id && document.getElementById("erro-" + campo.id)) {
                campo.setAttribute("aria-describedby", "erro-" + campo.id);
            }
        });
        form.addEventListener("invalid", function (ev) {
            ev.preventDefault();
            if (!recusou) {
                recusou = true;
                form.querySelectorAll(".erro").forEach(function (e) { e.textContent = ""; });
                var primeiro = form.querySelector(":invalid");
                if (primeiro) primeiro.focus();
                if (aoRecusar) aoRecusar();
                setTimeout(function () { recusou = false; }, 0);
            }
            mostrarErroCampo(ev.target.id, mensagemNativa(ev.target));
        }, true);
        form.addEventListener("input", function (ev) {
            if (ev.target.id) mostrarErroCampo(ev.target.id, "");
        });
    }

    document.addEventListener("DOMContentLoaded", desenharLog);

    window.GeladeiraCheia = {
        K_ITENS: K_ITENS, K_LOG: K_LOG, MSG_ERRO: MSG_ERRO,
        mostrarErro: mostrarErro, lerLista: lerLista, salvarLista: salvarLista,
        formatarDataHora: formatarDataHora, registrarLog: registrarLog, desenharLog: desenharLog,
        validarTexto: validarTexto, itemValido: itemValido, filtrarItensValidos: filtrarItensValidos,
        mostrarErroCampo: mostrarErroCampo,
        mensagemNativa: mensagemNativa, ligarValidacao: ligarValidacao
    };
})();
