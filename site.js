const SITE = {
  discordInvite: "https://discord.gg/XKXP7hn5Hr",
};

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

$$("[data-discord]").forEach((a) => {
  a.setAttribute("href", SITE.discordInvite);
  a.setAttribute("target", "_blank");
  a.setAttribute("rel", "noopener");
});
$$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
if (nav && toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

const progress = document.createElement("div");
progress.className = "progress";
document.body.prepend(progress);

const toTop = document.createElement("button");
toTop.className = "to-top";
toTop.setAttribute("aria-label", "Back to top");
toTop.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" shape-rendering="crispEdges"><path d="M7 3h2v2h2v2h2v2h-4v4H7V9H3V7h2V5h2z"/></svg>';
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
document.body.appendChild(toTop);

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--p", String(max > 0 ? y / max : 0));
    nav?.classList.toggle("scrolled", y > 8);
    toTop.classList.toggle("show", y > 900);
    parallax();
    ticking = false;
  });
}
addEventListener("scroll", onScroll, { passive: true });

const reveals = $$(".reveal");
const groups = new Map();
for (const el of reveals) {
  const list = groups.get(el.parentElement) ?? [];
  list.push(el);
  groups.set(el.parentElement, list);
}
for (const list of groups.values()) list.forEach((el, i) => (el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`));

function countUp(el) {
  const target = Number(el.dataset.count);
  const pre = el.dataset.prefix ?? "";
  const suf = el.dataset.suffix ?? "";
  if (reduce || !Number.isFinite(target) || target === 0) return;
  const t0 = performance.now();
  const dur = 1300;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = `${pre}${Math.round(target * (1 - Math.pow(1 - k, 3)))}${suf}`;
    if (k < 1) requestAnimationFrame(step);
  };
  el.textContent = `${pre}0${suf}`;
  requestAnimationFrame(step);
}

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(countUp);
        if (e.target.matches("[data-count]")) countUp(e.target);
        io.unobserve(e.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
  $$(".stats").forEach((el) => io.observe(el));

  const sections = $$(".subnav a[href^='#']")
    .map((a) => [a, document.querySelector(a.getAttribute("href"))])
    .filter(([, s]) => s);
  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          for (const [a, s] of sections) a.classList.toggle("on", s === e.target);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(([, s]) => spy.observe(s));
  }
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

const layers = $$("[data-depth]");
let px = 0;
let py = 0;
function parallax() {
  if (reduce || !layers.length) return;
  const sy = Math.min(scrollY, 900);
  for (const el of layers) {
    const d = Number(el.dataset.depth) || 0;
    el.style.transform = `translate3d(${(-px * 26 * d).toFixed(1)}px, ${(-py * 18 * d + sy * 0.06 * d).toFixed(1)}px, 0)`;
  }
}
if (layers.length && finePointer && !reduce) {
  addEventListener(
    "pointermove",
    (e) => {
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
      onScroll();
    },
    { passive: true }
  );
}

if (finePointer && !reduce) {
  for (const el of $$(".tilt")) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${((x - 0.5) * 7).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  }
}

function embers(canvas) {
  if (reduce) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let w = 0;
  let h = 0;
  const parts = [];
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const spawn = (p, init) => {
    p.x = Math.random() * w;
    p.y = init ? Math.random() * h : h + 8;
    p.s = 2 + Math.floor(Math.random() * 3);
    p.v = 0.25 + Math.random() * 0.7;
    p.a = Math.random() * Math.PI * 2;
    p.o = 0.25 + Math.random() * 0.6;
    p.c = Math.random() < 0.8 ? "242,184,58" : "255,231,163";
    return p;
  };
  resize();
  addEventListener("resize", resize);
  const n = Math.round(Math.min(70, Math.max(24, w / 20)));
  for (let i = 0; i < n; i++) parts.push(spawn({}, true));
  let visible = true;
  let raf = 0;
  const tick = () => {
    if (!visible || document.hidden) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y -= p.v;
      p.a += 0.015;
      p.x += Math.sin(p.a) * 0.35;
      if (p.y < -8) spawn(p, false);
      ctx.fillStyle = `rgba(${p.c},${(p.o * Math.min(1, p.y / (h * 0.6))).toFixed(3)})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => !document.hidden && visible && start());
  start();
}
$$("canvas.embers").forEach(embers);

if (!document.querySelector(".help-fab")) {
  const a = document.createElement("a");
  a.className = "help-fab";
  a.href = SITE.discordInvite;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Need help? Open a ticket on Discord");
  a.innerHTML = '<span class="dot"></span><span class="txt">Need help? <b>Open a ticket</b></span>';
  document.body.appendChild(a);
}

onScroll();
