/* Tischlerei JENTSCH — main.js */
(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Jahr im Footer
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  // Header-Schatten beim Scrollen
  var header = document.querySelector(".site-header");
  // Mobil-Menü
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");
  var navClose = document.getElementById("navClose");
  function closeNav(){ navLinks.classList.remove("open"); if(navClose) navClose.classList.remove("show"); }
  if (burger) burger.addEventListener("click", function(){ navLinks.classList.add("open"); if(navClose) navClose.classList.add("show"); });
  if (navClose) navClose.addEventListener("click", closeNav);
  navLinks && navLinks.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeNav); });

  // In-page Anker: smooth scroll mit Header-Offset (robust, auch unter file://)
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(ev){
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      var headerH = header ? header.offsetHeight : 0;
      var top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerH - 8);
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      closeNav();
    });
  });

  // Scroll-Reveal via IntersectionObserver (mit Sicherheitsnetz)
  var reveals = document.querySelectorAll(".reveal, .clip");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function(el){ io.observe(el); });
    // Sicherheitsnetz: nach 3,5s alles sichtbar, falls IO mal nicht feuert
    setTimeout(function(){ reveals.forEach(function(el){ el.classList.add("in"); }); }, 3500);
  }

  // Hero-Zeilen-Mask-Reveal: .hero.in nach erstem Frame setzen (perf-safe).
  // Die Animation hat forwards-fill und landet im realen Browser im End-Zustand.
  // Hartes Sicherheitsnetz: nach 1,4s den End-Zustand zusätzlich inline erzwingen,
  // damit die H1 NIE verborgen bleibt — auch wenn die Animations-Uhr mal ruht.
  var hero = document.getElementById("hero");
  if (hero){
    hero.classList.add("in");
    // Sicherheitsnetz: nach 1,4s .hero--shown setzen (CSS killt dann die Animation
    // und erzwingt den End-Zustand), falls die Animations-Uhr mal ruht.
    if (!reduce){ setTimeout(function(){ hero.classList.add("shown"); }, 1400); }
    else { hero.classList.add("shown"); }
  }

  // Hero-Parallax + Header-Schatten + Siegel-Rotation/Ausblenden (rAF-gedrosselt)
  var heroBg = document.getElementById("heroBg");
  var seal = document.getElementById("seal");
  var contact = document.getElementById("kontakt");
  var orbs = document.querySelectorAll(".orb");
  var mobile = window.matchMedia("(max-width:680px)").matches;
  var ticking = false;

  function onScroll(){
    var sc = window.pageYOffset;
    if (header) header.classList.toggle("scrolled", sc > 20);
    if (heroBg && !reduce && !mobile) heroBg.style.transform = "translateY(" + (sc * 0.12) + "px)";
    /* Orbs bleiben statisch — Parallax auf blur(60px)-Ebenen verursacht Ruckeln. */
    if (seal && contact){
      var top = contact.getBoundingClientRect().top;
      seal.classList.toggle("hide", top < window.innerHeight * 0.85);
    }
    ticking = false;
  }
  window.addEventListener("scroll", function(){
    if (!ticking){ window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Kontaktformular:
  //  - Demo (file:// ODER Formspree-ID noch Platzhalter) -> Versand simulieren.
  //  - Ausgelieferte Seite (echte Formspree-ID) -> per fetch an Formspree senden (kein Server/PHP noetig).
  var form = document.getElementById("contactForm");
  var msg = document.getElementById("formMsg");
  if (form){
    var isDemoForm = location.protocol === "file:" || /\[FORMSPREE-ID\]/.test(form.getAttribute("action") || "");
    if (!isDemoForm){ var note0 = form.querySelector(".form-note"); if (note0) note0.style.display = "none"; }
    function formDone(text, ok){
      msg.className = "form-msg " + (ok ? "ok" : "err");
      msg.textContent = text;
      if (ok){ form.querySelectorAll("input,textarea,button").forEach(function(el){ el.disabled = true; }); }
      msg.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }
      if (isDemoForm){
        formDone("Vielen Dank! Ihre Anfrage wurde übermittelt. (Vorschau-Ansicht – im fertigen Projekt geht die Nachricht direkt an den Betrieb.)", true);
        return;
      }
      var btn = form.querySelector("button[type=submit]"); if (btn) btn.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function(r){
          if (r.ok){ formDone("Vielen Dank! Ihre Anfrage ist eingegangen – wir melden uns zeitnah.", true); }
          else { formDone("Entschuldigung, das hat nicht geklappt. Bitte rufen Sie uns kurz an.", false); if (btn) btn.disabled = false; }
        })
        .catch(function(){ formDone("Entschuldigung, das hat nicht geklappt. Bitte rufen Sie uns kurz an.", false); if (btn) btn.disabled = false; });
    });
  }

  // ===== Interaktiv-Effekte (perf-safe; nur Desktop-Maus, NICHT Touch/reduced-motion) =====
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduce){
    var isPhysio = document.body.classList.contains("b-physio");
    var orbsFX = document.querySelectorAll(".orb");
    // Hero: Cursor-Spotlight + 3D-Tilt (+ Orb-Drift bei Physio)
    if (hero){
      var inner = hero.querySelector(".hero__inner");
      var glow = document.createElement("span"); glow.className = "hero__glow";
      hero.insertBefore(glow, hero.firstChild);
      var hr = null, gx = 0, gy = 0, rx = 0, ry = 0, nx = 0, ny = 0, hTick = false;
      hero.addEventListener("pointerenter", function(){ hr = hero.getBoundingClientRect(); hero.classList.add("tilt"); });
      hero.addEventListener("pointermove", function(e){
        if (!hr) hr = hero.getBoundingClientRect();
        nx = (e.clientX - hr.left) / hr.width - 0.5;
        ny = (e.clientY - hr.top) / hr.height - 0.5;
        gx = e.clientX - hr.left; gy = e.clientY - hr.top;
        ry = nx * 6.5; rx = -ny * 4.5;
        if (!hTick){ requestAnimationFrame(function(){
          if (inner) inner.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
          glow.style.transform = "translate(" + gx + "px," + gy + "px)";
          if (isPhysio){ for (var k = 0; k < orbsFX.length; k++){ orbsFX[k].style.transform = "translate(" + (nx * 20 * (k + 1)) + "px," + (ny * 16 * (k + 1)) + "px)"; } }
          hTick = false;
        }); hTick = true; }
      });
      hero.addEventListener("pointerleave", function(){
        hero.classList.remove("tilt"); hr = null;
        if (inner) inner.style.transform = "";
        if (isPhysio){ for (var k = 0; k < orbsFX.length; k++){ orbsFX[k].style.transform = ""; } }
      });
    }
    // Galerie-Karten: 3D-Tilt zum Cursor
    var figs = document.querySelectorAll(".gallery figure");
    Array.prototype.forEach.call(figs, function(fig){
      var fr = null, ft = false, frx = 0, fry = 0;
      fig.addEventListener("pointerenter", function(){ fr = fig.getBoundingClientRect(); });
      fig.addEventListener("pointermove", function(e){
        if (!fr) fr = fig.getBoundingClientRect();
        var px = (e.clientX - fr.left) / fr.width - 0.5, py = (e.clientY - fr.top) / fr.height - 0.5;
        fry = px * 9; frx = -py * 9;
        if (!ft){ requestAnimationFrame(function(){
          fig.style.transform = "perspective(720px) rotateX(" + frx.toFixed(2) + "deg) rotateY(" + fry.toFixed(2) + "deg)";
          ft = false;
        }); ft = true; }
      });
      fig.addEventListener("pointerleave", function(){ fr = null; fig.style.transform = ""; });
    });
  }
})();
