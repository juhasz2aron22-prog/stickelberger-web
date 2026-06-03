/* =========================================================================
   Stickelberger Projektmanagement — shared interaction layer
   Lenis smooth scroll · GSAP ScrollTrigger reveals · nav · page transitions
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ----------------------------------------------------------------------
     0. Accessibility: skip-to-content link
  ---------------------------------------------------------------------- */
  (function () {
    const main = document.querySelector("main");
    if (!main) return;
    if (!main.id) main.id = "main";
    const a = document.createElement("a");
    a.className = "skip-link";
    a.href = "#main";
    a.textContent = "Zum Inhalt springen";
    document.body.insertBefore(a, document.body.firstChild);
  })();

  /* ----------------------------------------------------------------------
     1. Lenis smooth scrolling (synced to GSAP ticker)
  ---------------------------------------------------------------------- */
  let lenis = null;
  if (!prefersReduced && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGSAP) {
      lenis.on("scroll", () => ScrollTrigger.update());
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ----------------------------------------------------------------------
     2. Header: shrink on scroll + hide-on-down / show-on-up
  ---------------------------------------------------------------------- */
  const header = document.querySelector("[data-header]");
  if (header) {
    let lastY = 0;
    const onScroll = (y) => {
      header.classList.toggle("is-scrolled", y > 24);
      if (y > lastY && y > 280) header.classList.add("is-hidden");
      else header.classList.remove("is-hidden");
      lastY = y;
    };
    if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
    else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  }

  /* ----------------------------------------------------------------------
     3. Mobile navigation toggle
  ---------------------------------------------------------------------- */
  const burger = document.querySelector("[data-burger]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (burger && mobileNav) {
    const setOpen = (open) => {
      burger.classList.toggle("is-active", open);
      mobileNav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.documentElement.classList.toggle("nav-open", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener("click", () => setOpen(!burger.classList.contains("is-active")));
    mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  /* Fire `cb` when `el` scrolls into view — or immediately if it is already
     visible at load (ScrollTrigger's onEnter does not replay passed triggers). */
  const onView = (el, cb, startPct) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.94) { cb(); return; }
    ScrollTrigger.create({ trigger: el, start: `top ${startPct || 86}%`, once: true, onEnter: cb });
  };

  /* ----------------------------------------------------------------------
     4. Scroll reveals — [data-reveal], optional [data-reveal-stagger]
  ---------------------------------------------------------------------- */
  if (hasGSAP && !prefersReduced) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      const kids = el.hasAttribute("data-reveal-stagger") ? el.children : [el];
      gsap.set(kids, { y: 34, opacity: 0 });
      onView(el, () => gsap.to(kids, {
        y: 0, opacity: 1, duration: 1, ease: "power3.out",
        stagger: el.hasAttribute("data-reveal-stagger") ? 0.09 : 0,
      }));
    });

    /* Headline line-mask reveal — wrap [data-split] text in clipped spans */
    gsap.utils.toArray("[data-split]").forEach((el) => {
      const lines = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = lines
        .map((l) => `<span class="line"><span class="line__inner">${l}</span></span>`)
        .join("");
      const inners = el.querySelectorAll(".line__inner");
      gsap.set(inners, { yPercent: 115 });
      onView(el, () => gsap.to(inners, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }), 92);
    });

    /* Parallax — [data-parallax="0.2"] (positive = slower) */
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const depth = parseFloat(el.dataset.parallax) || 0.15;
      gsap.to(el, {
        yPercent: -depth * 100,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    /* Scroll-fade band — image & caption appear on enter, stay vibrant, then
       scroll away naturally (no opacity fade-out, so the picture never greys). */
    gsap.utils.toArray("[data-scroll-fade]").forEach((el) => {
      const img = el.querySelector(".scrollfade__sticky img");
      const cap = el.querySelector(".scrollfade__cap");
      if (img) gsap.fromTo(img, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 95%", end: "top 38%", scrub: true } });
      if (cap) gsap.fromTo(cap, { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: el, start: "top 72%", end: "top 30%", scrub: true } });
    });
  } else {
    // Reduced motion / no GSAP — show everything
    document.querySelectorAll("[data-reveal]").forEach((el) => (el.style.opacity = 1));
  }

  /* ----------------------------------------------------------------------
     5. Animated counters — [data-count="60"]
  ---------------------------------------------------------------------- */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const run = () => {
      if (prefersReduced || !hasGSAP) { el.textContent = target + suffix; return; }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.8, ease: "power2.out",
        onUpdate: () => (el.textContent = Math.round(obj.v) + suffix),
      });
    };
    if (hasGSAP && window.ScrollTrigger && !prefersReduced) onView(el, run, 90);
    else run();
  });

  /* ----------------------------------------------------------------------
     6. Magnetic buttons — [data-magnetic]
  ---------------------------------------------------------------------- */
  if (!prefersReduced && hasGSAP && matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.4;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.6, ease: "power3.out",
        });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
    });
  }

  /* ----------------------------------------------------------------------
     7. Page transition overlay — smooth fade between the .html pages
  ---------------------------------------------------------------------- */
  const overlay = document.querySelector("[data-transition]");
  const isInternal = (a) =>
    a.hostname === location.hostname &&
    !a.hasAttribute("target") &&
    !a.hasAttribute("data-no-transition") &&
    !a.href.includes("#") &&
    !a.href.startsWith("mailto:") &&
    !a.href.startsWith("tel:");

  if (overlay) {
    // reveal-in on load
    requestAnimationFrame(() => overlay.classList.remove("is-active"));
    document.querySelectorAll("a[href]").forEach((a) => {
      if (!isInternal(a)) return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        overlay.classList.add("is-active");
        setTimeout(() => (window.location.href = a.href), 520);
      });
    });
    // restore on back/forward cache
    window.addEventListener("pageshow", (e) => { if (e.persisted) overlay.classList.remove("is-active"); });
  }

  /* ----------------------------------------------------------------------
     8. Marquee — duplicate children of [data-marquee] for seamless loop
  ---------------------------------------------------------------------- */
  document.querySelectorAll("[data-marquee]").forEach((track) => {
    track.innerHTML += track.innerHTML;
  });

  /* ----------------------------------------------------------------------
     9. Footer year
  ---------------------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ----------------------------------------------------------------------
     9b. Failsafe — never leave content hidden.
     If the tab is backgrounded at load, requestAnimationFrame never fires, so
     GSAP tweens never advance and reveal targets would stay invisible. Detect
     that (ticker frame stalled) and reveal everything without animation.
     In a normal foreground tab the ticker has advanced and this is a no-op.
  ---------------------------------------------------------------------- */
  if (hasGSAP) {
    const failsafe = () => {
      if (gsap.ticker.frame > 3) { ScrollTrigger && ScrollTrigger.refresh(); return; }
      gsap.set("[data-reveal] > *, [data-reveal]", { clearProps: "opacity,transform" });
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
      document.querySelectorAll("[data-reveal-stagger] > *").forEach((c) => gsap.set(c, { opacity: 1, y: 0 }));
      gsap.set("[data-split] .line__inner", { yPercent: 0 });
      gsap.set("[data-scroll-fade] .scrollfade__sticky img, [data-scroll-fade] .scrollfade__cap", { opacity: 1, y: 0, scale: 1 });
      document.querySelectorAll("[data-count]").forEach((el) => (el.textContent = el.dataset.count + (el.dataset.suffix || "")));
    };
    window.addEventListener("load", () => setTimeout(failsafe, 1400));
  }

  /* ----------------------------------------------------------------------
     9c. Lightbox — [data-lb="group"] [data-lb-src="full.jpg"]
  ---------------------------------------------------------------------- */
  (function () {
    const triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lb]"));
    if (!triggers.length) return;
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.innerHTML =
      '<button class="lightbox__close" aria-label="Schließen">✕</button>' +
      '<button class="lightbox__nav lightbox__prev" aria-label="Vorheriges Bild">‹</button>' +
      '<img alt="" />' +
      '<button class="lightbox__nav lightbox__next" aria-label="Nächstes Bild">›</button>' +
      '<span class="lightbox__count"></span>';
    document.body.appendChild(lb);
    const imgEl = lb.querySelector("img");
    const countEl = lb.querySelector(".lightbox__count");
    let group = [], idx = 0;

    const show = (i) => {
      idx = (i + group.length) % group.length;
      imgEl.src = group[idx].src;
      imgEl.alt = group[idx].alt || "";
      countEl.textContent = (idx + 1) + " / " + group.length;
    };
    const open = (g, i) => {
      group = g; lb.classList.add("is-open");
      document.documentElement.classList.add("lb-open");
      if (lenis) lenis.stop();
      show(i);
    };
    const close = () => {
      lb.classList.remove("is-open");
      document.documentElement.classList.remove("lb-open");
      if (lenis) lenis.start();
    };

    triggers.forEach((t) => {
      t.addEventListener("click", (e) => {
        e.preventDefault();
        const name = t.getAttribute("data-lb");
        const set = triggers.filter((x) => x.getAttribute("data-lb") === name);
        const g = set.map((x) => ({ src: x.getAttribute("data-lb-src"), alt: (x.querySelector("img") || {}).alt }));
        open(g, set.indexOf(t));
      });
    });
    lb.querySelector(".lightbox__close").addEventListener("click", close);
    lb.querySelector(".lightbox__prev").addEventListener("click", () => show(idx - 1));
    lb.querySelector(".lightbox__next").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });
  })();

  /* ----------------------------------------------------------------------
     10. Active nav link based on current file
  ---------------------------------------------------------------------- */
  const norm = (s) => (s.split("/").pop() || "index").replace(/\.html$/, "") || "index";
  const here = norm(location.pathname);
  document.querySelectorAll("[data-nav] a").forEach((a) => {
    if (norm(a.getAttribute("href")) === here) a.classList.add("is-current");
  });
})();
