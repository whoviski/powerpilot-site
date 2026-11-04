(() => {
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  const ul = document.querySelector("#topnav ul");
  const burger = document.querySelector(".burger");
  const setOpen = (open) => {
    ul.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => setOpen(!ul.classList.contains("open")));
  ul.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#topnav")) setOpen(false);
  });

  const links = [...ul.querySelectorAll("a")];
  document.querySelectorAll(".reveal").forEach((sec) => {
    sec.querySelectorAll(".rise, .rise-x").forEach((el, i) => {
      if (!rm) el.style.animationDelay = Math.min(i, 10) * 55 + "ms";
    });
  });

  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((sec) => reveal.observe(sec));

    const active = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach((sec) => active.observe(sec));
  } else {
    document.querySelectorAll(".reveal").forEach((sec) => sec.classList.add("in"));
  }

  const bar = document.querySelector(".progress > span");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
    const list = root.querySelector('[role="tablist"]');
    const select = (tab, focus) => {
      tabs.forEach((item, i) => {
        const on = item === tab;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle("is-on", on);
      });
      const left = tab.offsetLeft;
      const right = left + tab.offsetWidth;
      if (left < list.scrollLeft) list.scrollLeft = left;
      else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
      const nextBox = tab.getBoundingClientRect();
      const nextList = list.getBoundingClientRect();
      list.style.setProperty("--x", nextBox.left - nextList.left + list.scrollLeft + "px");
      list.style.setProperty("--w", nextBox.width + "px");
      if (focus) tab.focus();
    };
    root.dataset.ready = "true";
    select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0], false);
    list.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab, false);
    });
    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(tabs[next], true);
    });
    addEventListener("resize", () => {
      const current = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
      if (current) select(current, false);
    });
  });

  const filters = document.querySelector(".filters");
  if (filters) {
    const buttons = [...filters.querySelectorAll("[data-filter]")];
    const figures = [...document.querySelectorAll("#gallery figure")];
    const apply = (name) => {
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === name)));
      figures.forEach((figure) => {
        figure.hidden = !(name === "all" || figure.dataset.cat === name);
      });
    };
    filters.addEventListener("click", (e) => {
      const button = e.target.closest("[data-filter]");
      if (button) apply(button.dataset.filter);
    });
  }

  const lb = document.getElementById("lb");
  const shot = lb.querySelector("img");
  const caption = lb.querySelector("p");
  let index = -1;
  let lastFocus = null;
  const photos = () => [...document.querySelectorAll("header img, section img")].filter((img) => !img.closest("[hidden]"));
  const show = (i) => {
    const list = photos();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    const img = list[index];
    shot.src = img.currentSrc || img.src;
    shot.alt = img.alt;
    caption.textContent = img.alt;
    lb.hidden = false;
    document.body.classList.add("lock");
  };
  const close = () => {
    if (lb.hidden) return;
    lb.hidden = true;
    shot.removeAttribute("src");
    document.body.classList.remove("lock");
    if (lastFocus) lastFocus.focus();
  };
  document.querySelectorAll("header img, section img").forEach((img) => {
    img.addEventListener("click", () => {
      lastFocus = document.activeElement === img ? img : img;
      show(photos().indexOf(img));
    });
  });
  lb.querySelector(".lb-x").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => show(index - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => show(index + 1));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  const format = (value, digits) => value.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const count = (el) => {
    const target = +el.dataset.to;
    const digits = +el.dataset.dec;
    const suffix = el.dataset.suf || "";
    if (rm) {
      el.textContent = format(target, digits) + suffix;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / 1400);
      const eased = 1 - (1 - k) ** 3;
      el.textContent = format(target * eased, digits) + suffix;
      if (k < 1) requestAnimationFrame(step);
      else el.classList.add("done");
    };
    requestAnimationFrame(step);
  };
  const counters = document.querySelectorAll("[data-to]");
  if ("IntersectionObserver" in window) {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        count(entry.target);
        watch.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    counters.forEach((el) => watch.observe(el));
  } else {
    counters.forEach(count);
  }

  document.querySelectorAll(".faq details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".faq details").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  document.querySelectorAll(".eflow").forEach((svg) => {
    const nodes = [...svg.querySelectorAll(".node")];
    let lock = null;
    const paint = (key) => {
      svg.classList.toggle("is-hot", Boolean(key));
      svg.querySelectorAll("[data-link]").forEach((el) => {
        el.classList.toggle("on", Boolean(key && el.dataset.link.split(" ").includes(key)));
      });
      nodes.forEach((node) => {
        const linked = key && [...svg.querySelectorAll(".wire")].some((wire) => {
          const keys = wire.dataset.link.split(" ");
          return keys.includes(key) && keys.includes(node.dataset.k);
        });
        node.classList.toggle("on", node.dataset.k === key || Boolean(linked));
        node.setAttribute("aria-pressed", lock === node.dataset.k ? "true" : "false");
      });
    };
    nodes.forEach((node) => {
      node.addEventListener("mouseenter", () => { if (!lock) paint(node.dataset.k); });
      node.addEventListener("mouseleave", () => { if (!lock) paint(null); });
      node.addEventListener("focus", () => { if (!lock) paint(node.dataset.k); });
      node.addEventListener("blur", () => { if (!lock) paint(null); });
      const toggle = () => {
        lock = lock === node.dataset.k ? null : node.dataset.k;
        paint(lock);
      };
      node.addEventListener("click", toggle);
      node.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        toggle();
      });
    });
  });

  if (!rm) {
    const hero = document.querySelector(".hero");
    const layers = [...hero.querySelectorAll("[data-depth]")];
    const spot = hero.querySelector(".spot");
    let mx = 0;
    let my = 0;
    let visible = true;
    let ticking = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(hero);
    }
    const apply = () => {
      ticking = false;
      if (!visible) return;
      const rect = hero.getBoundingClientRect();
      const scrolled = -rect.top;
      layers.forEach((el) => {
        const depth = parseFloat(el.dataset.depth) || 0;
        const x = fine ? mx * depth * 26 : 0;
        const y = (fine ? my * depth * 16 : 0) + scrolled * depth * 0.28;
        el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      });
    };
    const requestApply = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    addEventListener("scroll", requestApply, { passive: true });
    if (fine) {
      hero.addEventListener("pointermove", (e) => {
        const rect = hero.getBoundingClientRect();
        mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        if (spot) {
          spot.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + "%");
          spot.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + "%");
        }
        requestApply();
      }, { passive: true });
    }
    requestApply();
  }

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      close();
      return;
    }
    if (lb.hidden) return;
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  const canvas = document.getElementById("fx");
  if (!canvas || rm || saveData) return;
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dots = [];
  const colors = ["rgba(255,255,255,.75)", "rgba(214,255,63,.85)", "rgba(34,211,238,.8)", "rgba(255,138,0,.85)", "rgba(255,61,138,.75)"];
  const resize = () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    const countDots = Math.min(40, Math.max(18, (width / 38) | 0));
    dots = Array.from({ length: countDots }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r: Math.random() * 1.7 + 0.8,
      color: colors[(Math.random() * colors.length) | 0]
    }));
  };
  resize();
  addEventListener("resize", resize);
  let canvasOn = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { canvasOn = entries[0].isIntersecting; }).observe(canvas);
  }
  const draw = () => {
    requestAnimationFrame(draw);
    if (!canvasOn || document.hidden) return;
    ctx.clearRect(0, 0, width, height);
    dots.forEach((dot) => {
      dot.x = (dot.x + dot.vx + width) % width;
      dot.y = (dot.y + dot.vy + height) % height;
      ctx.fillStyle = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, 6.3);
      ctx.fill();
    });
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i];
        const b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 96) {
          ctx.strokeStyle = "rgba(255,255,255," + (0.16 * (1 - dist / 96)).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  };
  requestAnimationFrame(draw);
})();
