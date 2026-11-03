/* =====================================================================
   CONFIGURAÇÕES — EDITE AQUI
   ===================================================================== */

// Link do checkout. TODOS os botões de compra usam esta única variável.
const CHECKOUT_URL = "https://pay.cakto.com.br/3ad4c27_1210477";

// (Opcional) Checkout com preço cheio, usado SOMENTE se OFFER_EXPIRES_FOR_REAL = true
// e o cronômetro chegar a zero. Deixe vazio se não existir.
const CHECKOUT_URL_FULL_PRICE = "";

const CONFIG = {
  productName: "Cozinha Fácil — 30 Receitas para Sua Rotina", // nome completo do produto
  brandName: "Cozinha Fácil",                                  // nome curto/marca
  priceOld: "R$ 47,90",     // preço de referência (use apenas se for uma condição comercial real)
  priceCurrent: "R$ 19,90", // preço promocional
  showOldPrice: true,       // false oculta o preço riscado

  // ---- Cronômetro ----
  offerMinutes: 30,         // duração do cronômetro em minutos
  storageKey: "cf_offer_end_v1",
  /*
   * OFFER_EXPIRES_FOR_REAL
   *  false (padrão) → cronômetro DEMONSTRATIVO. Ao zerar, apenas informa que a contagem
   *                    terminou; o preço e o checkout não mudam e o site não afirma
   *                    que o visitante perdeu o desconto.
   *  true            → ao zerar, o preço promocional deixa de ser exibido e os botões
   *                    passam a usar CHECKOUT_URL_FULL_PRICE (ou ficam indisponíveis).
   *                    ATENÇÃO: isso é apenas visual. A validação real precisa ser feita
   *                    na plataforma de checkout/servidor (ex.: cupom ou oferta com validade).
   */
  OFFER_EXPIRES_FOR_REAL: false
};

/* =====================================================================
   APLICAÇÃO
   ===================================================================== */
(function () {
  "use strict";
  document.body.classList.remove("no-js");

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const isConfigured = (url) => typeof url === "string" && /^https?:\/\//i.test(url) && !url.includes("COLOQUE_AQUI");

  let offerExpired = false;

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  function notify(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
  }

  /* ---------- textos configuráveis ---------- */
  function applyConfig() {
    $$("[data-product-name]").forEach((el) => (el.textContent = CONFIG.productName));
    $$("[data-brand]").forEach((el) => (el.textContent = CONFIG.brandName));
    $$("[data-price-old]").forEach((el) => (el.textContent = CONFIG.priceOld));
    $$("[data-price-current]").forEach((el) => (el.textContent = CONFIG.priceCurrent));
    $$("#btn-buy [data-cta-price]").forEach((el) => (el.textContent = "Quero minhas receitas por " + CONFIG.priceCurrent));
    $$("#btn-final [data-cta-price]").forEach((el) => (el.textContent = "Garantir minhas receitas por " + CONFIG.priceCurrent));
    if (!CONFIG.showOldPrice) $$("[data-show-when-promo]").forEach((el) => (el.hidden = true));
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- checkout ---------- */
  function currentCheckout() {
    if (CONFIG.OFFER_EXPIRES_FOR_REAL && offerExpired) return CHECKOUT_URL_FULL_PRICE;
    return CHECKOUT_URL;
  }
  function goToCheckout(e) {
    e.preventDefault();
    const url = currentCheckout();
    if (!isConfigured(url)) {
      notify(CONFIG.OFFER_EXPIRES_FOR_REAL && offerExpired
        ? "A condição promocional foi encerrada e não há checkout de preço cheio configurado."
        : "Checkout ainda não configurado. Defina CHECKOUT_URL no código para ativar a compra.");
      console.warn("[Cozinha Fácil] Configuração pendente: CHECKOUT_URL não definido.");
      return;
    }
    try { window.location.href = url; }
    catch (err) { console.error(err); notify("Não foi possível abrir o checkout. Tente novamente."); }
  }
  $$("[data-checkout]").forEach((b) => b.addEventListener("click", goToCheckout));

  if (!isConfigured(CHECKOUT_URL)) {
    const flag = document.createElement("div");
    flag.className = "config-flag";
    flag.textContent = "Checkout pendente de configuração";
    flag.setAttribute("role", "note");
    document.body.appendChild(flag);
  }

  /* links legais ainda não definidos */
  $$("[data-legal]").forEach((a) =>
    a.addEventListener("click", (e) => {
      if (a.getAttribute("href") === "#") { e.preventDefault(); notify("Página ainda não configurada. Adicione o link real no rodapé."); }
    })
  );

  /* ---------- cabeçalho / menu mobile ---------- */
  const nav = $(".nav"), menuBtn = $("#menu-btn"), panel = $("#mobile-panel");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) { panel.hidden = false; requestAnimationFrame(() => panel.classList.add("open")); $("a", panel).focus(); }
    else { panel.classList.remove("open"); setTimeout(() => { if (!panel.classList.contains("open")) panel.hidden = true; }, 350); }
  }
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("a", panel).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  $$("[data-checkout]", panel).forEach((b) => b.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
  });
  window.matchMedia("(min-width: 961px)").addEventListener?.("change", (m) => { if (m.matches) setMenu(false); });

  const sticky = $("#sticky-buy"), stickyBtn = $("#btn-sticky"), heroEl = $(".hero"), buyEl = $("#comprar");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 12);
    const pastHero = heroEl.getBoundingClientRect().bottom < 0;
    const r = buyEl.getBoundingClientRect();
    const buyVisible = r.top < window.innerHeight && r.bottom > 0;
    const nearEnd = window.innerHeight + window.scrollY > document.body.scrollHeight - 700;
    const show = pastHero && !buyVisible && !nearEnd;
    sticky.classList.toggle("show", show);
    sticky.setAttribute("aria-hidden", String(!show));
    stickyBtn.tabIndex = show ? 0 : -1;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- FAQ ---------- */
  $$(".faq-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      item.classList.toggle("open", !open);
    });
  });

  /* ---------- revelação ao rolar ---------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ---------- imagens: fallback se algum arquivo faltar ---------- */
  $$("img").forEach((img) => img.addEventListener("error", () => {
    img.style.visibility = "hidden";
    const box = img.parentElement; if (box) box.style.background = "linear-gradient(135deg,#bdbdbd,#8a8a8a)";
  }, { once: true }));

  /* =====================================================================
     CRONÔMETRO
     Calcula o tempo restante a partir de um horário final salvo em
     localStorage (persiste entre recargas no mesmo navegador).
     Não depende da contagem de chamadas do setInterval.
     ===================================================================== */
  const elMin = $("#t-min"), elSec = $("#t-sec"), msg = $("#timer-msg"), sr = $("#timer-sr"), box = $("#offer-box");
  const DURATION = Math.max(1, Number(CONFIG.offerMinutes) || 30) * 60 * 1000;
  let tick = null;

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado / bloqueado */ } }

  function getEndTime() {
    const saved = parseInt(storageGet(CONFIG.storageKey), 10);
    if (Number.isFinite(saved) && saved > 0 && saved - Date.now() <= DURATION) return saved;
    const end = Date.now() + DURATION;
    storageSet(CONFIG.storageKey, String(end));
    return end;
  }
  const endTime = getEndTime();
  const pad = (n) => String(n).padStart(2, "0");
  let lastSrMinute = null;

  function render() {
    const left = Math.max(0, endTime - Date.now());
    const totalSec = Math.ceil(left / 1000);
    const m = Math.floor(totalSec / 60), s = totalSec % 60;
    elMin.textContent = pad(m);
    elSec.textContent = pad(s);
    if (m !== lastSrMinute) { lastSrMinute = m; sr.textContent = m > 0 ? `Restam cerca de ${m} minutos.` : ""; }
    if (left <= 0) { finish(); return false; }
    return true;
  }

  function finish() {
    if (tick) { clearInterval(tick); tick = null; }
    offerExpired = true;
    elMin.textContent = "00"; elSec.textContent = "00";
    box.classList.add("is-expired");
    msg.hidden = false;
    if (CONFIG.OFFER_EXPIRES_FOR_REAL) {
      $("#offer-title").textContent = "Condição promocional encerrada";
      $("#offer-text").textContent = "O período desta condição especial terminou.";
      msg.textContent = "O preço promocional não está mais disponível neste navegador.";
      $$("[data-show-when-promo]").forEach((el) => (el.hidden = true));
      $$("[data-price-current]").forEach((el) => (el.textContent = CONFIG.priceOld));
      $$("[data-cta-price]").forEach((el) => (el.textContent = "Quero minhas receitas"));
      if (!isConfigured(CHECKOUT_URL_FULL_PRICE)) $$("[data-checkout]").forEach((b) => b.setAttribute("aria-disabled", "true"));
      sr.textContent = "A condição promocional foi encerrada.";
    } else {
      // Modo demonstrativo: não altera preço nem afirma perda do desconto.
      msg.textContent = "A contagem demonstrativa chegou ao fim. Consulte as condições vigentes no checkout.";
      sr.textContent = "A contagem chegou ao fim.";
    }
  }

  if (!CONFIG.OFFER_EXPIRES_FOR_REAL) $("#demo-tag").hidden = false;
  if (render()) {
    tick = setInterval(render, 250);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && tick) render(); });
  }

  applyConfig();
  if (offerExpired && CONFIG.OFFER_EXPIRES_FOR_REAL) finish(); // reaplica após applyConfig

  // Utilitário de teste no console: CozinhaFacil.resetTimer() ou CozinhaFacil.expireIn(5)
  window.CozinhaFacil = {
    resetTimer() { try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {} location.reload(); },
    expireIn(sec) { storageSet(CONFIG.storageKey, String(Date.now() + sec * 1000)); location.reload(); }
  };
})();
