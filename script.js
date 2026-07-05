/* ==========================================================================
   THE HOUSE OF WISDOM — behaviour layer.
   Everything here is progressive enhancement: the page is fully readable
   with JavaScript disabled (all expandables are native <details>).
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* Mark that JS is available — reveal/animation CSS is gated on this class,
     so a JS-less visitor simply sees everything, un-animated. */
  root.classList.add("js");

  /* ---------- 1. Theme: parchment <-> night-sky --------------------------- */

  var THEME_KEY = "hw-theme";

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* private mode etc. */ }
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      var label = btn.querySelector(".toggle-label");
      if (label) label.textContent = theme === "dark" ? "Night sky" : "Parchment";
    }
  }

  var initial = storedTheme();
  if (!initial) {
    initial = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }
  applyTheme(initial);

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ---------- 2. Scroll-triggered reveals & girih draw-ins ----------------- */

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    document.querySelectorAll(".reveal, .girih-divider").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    /* No observer / reduced motion: show everything immediately. */
    document.querySelectorAll(".reveal, .girih-divider").forEach(function (el) {
      el.classList.add("in-view");
    });
  }

  /* Set pathLength on girih paths so the dash trick is resolution-independent */
  document.querySelectorAll(".girih-divider path").forEach(function (p) {
    p.setAttribute("pathLength", "1");
  });

  /* ---------- 3. Scrollspy: highlight active section in the nav ------------ */

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.toc a[href^="#"], .mobile-nav a[href^="#"]')
  );
  var sections = Array.prototype.slice.call(
    document.querySelectorAll("section[id]")
  );

  function setActive(id) {
    navLinks.forEach(function (a) {
      var match = a.getAttribute("href") === "#" + id;
      a.classList.toggle("active", match);
      if (match) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    /* keep the active pill visible in the horizontal mobile nav */
    var activeMobile = document.querySelector(".mobile-nav a.active");
    if (activeMobile && activeMobile.scrollIntoView) {
      activeMobile.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }

  if ("IntersectionObserver" in window && sections.length) {
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          current = entry.target.id;
          setActive(current);
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. Reading progress bar -------------------------------------- */

  var bar = document.querySelector(".progress");
  if (bar) {
    var ticking = false;
    function updateBar() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(updateBar); ticking = true; }
    }, { passive: true });
    updateBar();
  }

  /* ---------- 5. Courtesy behaviours ---------------------------------------- */

  /* When a footnote back-link is used, or a nav link is clicked on mobile,
     make sure the target's parent <details> is open so we never scroll to
     hidden content. */
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    var host = target.closest("details");
    while (host) { host.open = true; host = host.parentElement.closest("details"); }
  });

  /* Randomise star twinkle delays so the field doesn't pulse in unison */
  document.querySelectorAll(".starfield-band .stars circle").forEach(function (star) {
    star.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
    star.style.animationDuration = (2.5 + Math.random() * 3).toFixed(2) + "s";
  });
})();
