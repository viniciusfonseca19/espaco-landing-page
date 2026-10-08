/* ==========================================================
   ESPAÇO DA GÉSSICA — Comportamentos do site
   Cada recurso é um módulo independente, iniciado no final.
   ========================================================== */

(function () {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));
  const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Imagens: placeholders e carregamento ----------
     Se a imagem real não existir, mantém o fundo provisório e mostra
     o nome do arquivo esperado. Se existir, ela aparece suavemente. */
  function iniciarImagens() {
    $$(".foto img").forEach((img) => {
      const caixa = img.closest(".foto");

      const marcarCarregada = () => caixa.classList.add("foto--carregada");
      const marcarVazia = () => caixa.classList.add("foto--vazia");

      if (img.complete) {
        img.naturalWidth > 0 ? marcarCarregada() : marcarVazia();
      } else {
        img.addEventListener("load", marcarCarregada, { once: true });
        img.addEventListener("error", marcarVazia, { once: true });
      }
    });
  }

  /* ---------- 2. Cabeçalho: muda ao rolar ---------- */
  function iniciarCabecalho() {
    const cabecalho = $("#cabecalho");
    if (!cabecalho) return;

    const atualizar = () => {
      cabecalho.classList.toggle("cabecalho--rolado", window.scrollY > 60);
    };

    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
  }

  /* ---------- 3. Menu mobile ---------- */
  function iniciarMenuMobile() {
    const botao = $("#hamburguer");
    const menu = $("#menu");
    const cabecalho = $("#cabecalho");
    if (!botao || !menu) return;

    const alternar = (abrir) => {
      menu.classList.toggle("menu--aberto", abrir);
      cabecalho.classList.toggle("cabecalho--menu-aberto", abrir);
      botao.setAttribute("aria-expanded", String(abrir));
      botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("travado", abrir);
    };

    botao.addEventListener("click", () => alternar(!menu.classList.contains("menu--aberto")));

    // Fecha ao escolher um link
    $$("a", menu).forEach((link) => link.addEventListener("click", () => alternar(false)));

    // Fecha com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("menu--aberto")) {
        alternar(false);
        botao.focus();
      }
    });

    // Se a tela crescer, garante o menu fechado
    window.matchMedia("(min-width: 1101px)").addEventListener("change", (e) => {
      if (e.matches) alternar(false);
    });
  }

  /* ---------- 4. Rolagem suave com compensação do cabeçalho ---------- */
  function iniciarRolagemSuave() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (id.length < 2) return;
        const alvo = $(id);
        if (!alvo) return;

        e.preventDefault();
        const compensacao = $("#cabecalho") ? $("#cabecalho").offsetHeight - 1 : 0;
        const topo = alvo.getBoundingClientRect().top + window.scrollY - (id === "#inicio" ? 0 : compensacao);

        window.scrollTo({ top: Math.max(topo, 0), behavior: prefereMovimentoReduzido ? "auto" : "smooth" });
        history.replaceState(null, "", id);
      });
    });
  }

  /* ---------- 5. Link ativo no menu conforme a seção ---------- */
  function iniciarLinkAtivo() {
    const links = $$(".menu__link");
    const secoes = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
    if (!secoes.length || !("IntersectionObserver" in window)) return;

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("menu__link--ativo", l.getAttribute("href") === "#" + entrada.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    secoes.forEach((s) => observador.observe(s));
  }

  /* ---------- 6. Revelar elementos ao entrar na tela ---------- */
  function iniciarRevelacao() {
    const itens = $$("[data-revelar]");
    if (!itens.length) return;

    if (!("IntersectionObserver" in window) || prefereMovimentoReduzido) {
      itens.forEach((el) => el.classList.add("revelado"));
      return;
    }

    const observador = new IntersectionObserver((entradas, obs) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("revelado");
        obs.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    itens.forEach((el) => observador.observe(el));
  }

  /* ---------- 7. Parallax muito sutil ---------- */
  function iniciarParallax() {
    if (prefereMovimentoReduzido) return;

    const elementos = $$("[data-parallax]").map((el) => {
      const alvo = el.matches(".foto") ? el : $(".foto", el);
      // Se o próprio elemento é movido, mede-se pelo contêiner para evitar efeito de retorno
      const referencia = alvo === el ? el.parentElement : el;
      return { alvo, referencia, fator: parseFloat(el.dataset.parallax) || 0.08 };
    }).filter((item) => item.alvo);

    if (!elementos.length) return;

    let agendado = false;

    const atualizar = () => {
      agendado = false;
      const metade = window.innerHeight / 2;

      elementos.forEach(({ alvo, referencia, fator }) => {
        const r = referencia.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;

        const distancia = r.top + r.height / 2 - metade;
        const limite = alvo.offsetHeight * 0.05; // não passa da folga criada no CSS
        const deslocamento = Math.max(-limite, Math.min(limite, distancia * -fator));
        alvo.style.transform = "translate3d(0," + deslocamento.toFixed(1) + "px,0)";
      });
    };

    const aoRolar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(atualizar);
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    atualizar();
  }

  /* ---------- 8. Perspectiva 3D sutil em cards e galeria ---------- */
  function iniciarInteracao3D() {
    if (prefereMovimentoReduzido || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    $$(".cartao, .galeria__botao").forEach((elemento) => {
      let quadro = 0;
      const limite = elemento.matches(".cartao") ? 7 : 5;

      elemento.addEventListener("pointermove", (evento) => {
        if (evento.pointerType === "touch") return;

        const limites = elemento.getBoundingClientRect();
        if (!limites.width || !limites.height) return;
        const x = (evento.clientX - limites.left) / limites.width * 2 - 1;
        const y = (evento.clientY - limites.top) / limites.height * 2 - 1;

        cancelAnimationFrame(quadro);
        quadro = requestAnimationFrame(() => {
          elemento.style.transform = "perspective(900px) rotateX(" + (-y * limite).toFixed(2) +
            "deg) rotateY(" + (x * limite).toFixed(2) + "deg) translateY(-3px)";
        });
      });

      const restaurar = () => {
        cancelAnimationFrame(quadro);
        elemento.style.transform = "";
      };

      elemento.addEventListener("pointerleave", restaurar);
      elemento.addEventListener("blur", restaurar, true);
    });
  }

  /* ---------- 9. Reflexo interativo no Hero ---------- */
  function iniciarReflexoHero() {
    const hero = $("#inicio");
    if (!hero || prefereMovimentoReduzido) return;

    let temporizador;
    const posicionarReflexo = (evento) => {
      const limites = hero.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, (evento.clientX - limites.left) / limites.width * 100));
      const y = Math.max(0, Math.min(100, (evento.clientY - limites.top) / limites.height * 100));

      hero.style.setProperty("--hero-x", x.toFixed(1) + "%");
      hero.style.setProperty("--hero-y", y.toFixed(1) + "%");
      hero.classList.add("hero--interagindo");
    };

    hero.addEventListener("pointermove", (evento) => {
      if (evento.pointerType === "touch") return;
      clearTimeout(temporizador);
      posicionarReflexo(evento);
    });

    hero.addEventListener("pointerleave", (evento) => {
      if (evento.pointerType !== "touch") hero.classList.remove("hero--interagindo");
    });

    hero.addEventListener("pointerdown", (evento) => {
      if (evento.pointerType !== "touch") return;
      posicionarReflexo(evento);
      clearTimeout(temporizador);
      temporizador = setTimeout(() => hero.classList.remove("hero--interagindo"), 1400);
    });
  }

  /* ---------- 10. Lightbox da galeria ---------- */
  function iniciarLightbox() {
    const lightbox = $("#lightbox");
    const palco = $("#lightbox-palco");
    const contador = $("#lightbox-contador");
    const itens = $$(".galeria__botao");
    if (!lightbox || !palco || !itens.length) return;

    const btnFechar = $(".lightbox__fechar", lightbox);
    const btnAnterior = $(".lightbox__nav--anterior", lightbox);
    const btnProxima = $(".lightbox__nav--proxima", lightbox);

    let indice = 0;
    let ultimoFoco = null;

    const mostrar = (novoIndice) => {
      indice = (novoIndice + itens.length) % itens.length;

      const original = $(".foto", itens[indice]);
      const copia = original.cloneNode(true);
      const img = $("img", copia);
      if (img) img.loading = "eager";

      palco.replaceChildren(copia);
      contador.textContent = String(indice + 1).padStart(2, "0") + " / " + String(itens.length).padStart(2, "0");
    };

    const abrir = (i) => {
      ultimoFoco = document.activeElement;
      mostrar(i);
      lightbox.hidden = false;
      document.body.classList.add("travado");
      requestAnimationFrame(() => lightbox.classList.add("lightbox--aberto"));
      btnFechar.focus();
    };

    const fechar = () => {
      lightbox.classList.remove("lightbox--aberto");
      document.body.classList.remove("travado");
      setTimeout(() => { lightbox.hidden = true; }, 350);
      if (ultimoFoco) ultimoFoco.focus();
    };

    itens.forEach((botao, i) => botao.addEventListener("click", () => abrir(i)));
    btnFechar.addEventListener("click", fechar);
    btnAnterior.addEventListener("click", () => mostrar(indice - 1));
    btnProxima.addEventListener("click", () => mostrar(indice + 1));

    // Clicar no fundo escuro fecha
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) fechar();
    });

    // Teclado: ESC fecha, setas navegam, TAB fica preso dentro do lightbox
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;

      if (e.key === "Escape") fechar();
      else if (e.key === "ArrowLeft") mostrar(indice - 1);
      else if (e.key === "ArrowRight") mostrar(indice + 1);
      else if (e.key === "Tab") {
        const focaveis = [btnFechar, btnAnterior, btnProxima];
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    });

    // Gesto de deslizar no celular
    let inicioX = 0;
    lightbox.addEventListener("touchstart", (e) => { inicioX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      const diferenca = e.changedTouches[0].clientX - inicioX;
      if (Math.abs(diferenca) > 50) mostrar(indice + (diferenca < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- 11. WhatsApp: aviso enquanto o número não foi configurado ---------- */
  function iniciarWhatsApp() {
    const aviso = $("#aviso");
    let temporizador;

    $$("[data-whatsapp]").forEach((link) => {
      if (!link.getAttribute("href").includes("XXXXXXXXXXX")) return;

      link.addEventListener("click", (e) => {
        e.preventDefault();
        aviso.textContent = "O número do WhatsApp ainda será configurado neste botão.";
        aviso.classList.add("aviso--visivel");
        clearTimeout(temporizador);
        temporizador = setTimeout(() => aviso.classList.remove("aviso--visivel"), 3500);
      });
    });
  }

  /* ---------- Inicialização ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    iniciarImagens();
    iniciarCabecalho();
    iniciarMenuMobile();
    iniciarRolagemSuave();
    iniciarLinkAtivo();
    iniciarRevelacao();
    iniciarParallax();
    iniciarInteracao3D();
    iniciarReflexoHero();
    iniciarLightbox();
    iniciarWhatsApp();
  });
})();
