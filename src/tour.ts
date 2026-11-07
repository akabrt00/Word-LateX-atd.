// First-run tour: a few steps pointing at the parts of Scribe that work differently from other
// LaTeX editors. Shown once, the first time a project opens; Help > Take the Tour shows it again.

import { localKeys, root } from "./core";

interface Step { target: string; title: string; body: string; }

const STEPS: Step[] = [
  {
    target: "#btn-save",
    title: "Uložte rozepsanou práci",
    body: "Tlačítko Uložit nebo ⌘S uloží změny v hlavním i bočním editoru. Dole poznáte, jestli jsou otevřené změny uložené. Uložení textu samo neobnoví náhled.",
  },
  {
    target: "#btn-compile",
    title: "Obnovte náhled",
    body: "Překompilovat nebo ⌘↵ uloží otevřené změny a přeloží dokument. Výsledek uvidíte vpravo. Pokud se kompilace nezdaří, podrobnosti najdete dole v panelu Problémy.",
  },
  {
    target: "#pdf-pane",
    title: "Uložte výsledné PDF",
    body: "Po úspěšné kompilaci zvolte Uložit PDF… nad náhledem a vyberte umístění souboru. Ukládá se právě zobrazená verze. Pokud jste od té doby změnili text, nejdřív dokument překompilujte.",
  },
  {
    target: "#files-panel",
    title: "Orientujte se v dokumentu",
    body: "Vlevo jsou soubory projektu: vlastní text, obrázky i podklady šablony. Dole je uvedený hlavní soubor kompilace; může spojovat několik kapitol. Průvodce si kdykoli znovu otevřete v nabídce Nápověda.",
  },
];

const KEY = "scribe.tour";
const ring = document.createElement("div");
ring.className = "tour-ring";
const card = document.createElement("div");
card.className = "tour-card";
card.setAttribute("role", "dialog");
card.setAttribute("aria-live", "polite");
card.setAttribute("aria-labelledby", "tour-title");
card.setAttribute("aria-describedby", "tour-description");
let at = -1;
let timer: number | null = null;
let previousFocus: HTMLElement | null = null;

function place() {
  const step = STEPS[at];
  const target = document.querySelector<HTMLElement>(step.target);
  const visible = target && target.offsetParent !== null;
  const r = visible ? target!.getBoundingClientRect() : null;
  ring.hidden = !r;
  if (r) {
    ring.style.left = `${r.left - 4}px`;
    ring.style.top = `${r.top - 4}px`;
    ring.style.width = `${r.width + 8}px`;
    ring.style.height = `${r.height + 8}px`;
  }
  // Beside the target where there's room: below it, else to its right, else centred.
  const w = 320;
  const h = card.offsetHeight || 160;
  let x = window.innerWidth / 2 - w / 2;
  let y = window.innerHeight / 2 - h / 2;
  if (r) {
    if (r.bottom + 12 + h < window.innerHeight && r.height < window.innerHeight / 2) {
      x = r.left + r.width / 2 - w / 2;
      y = r.bottom + 12;
    } else {
      x = r.right + 12;
      y = r.top + 8;
    }
  }
  card.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, x))}px`;
  card.style.top = `${Math.max(12, Math.min(window.innerHeight - h - 12, y))}px`;
}

function show(i: number) {
  at = i;
  const step = STEPS[i];
  card.replaceChildren();
  const count = document.createElement("p");
  count.className = "tour-count";
  count.textContent = `${i + 1} ze ${STEPS.length}`;
  const title = document.createElement("h3");
  title.id = "tour-title";
  title.textContent = step.title;
  const body = document.createElement("p");
  body.className = "tour-body";
  body.id = "tour-description";
  body.textContent = localKeys(step.body);
  const actions = document.createElement("div");
  actions.className = "tour-actions";
  const skip = document.createElement("button");
  skip.className = "btn";
  skip.textContent = i === STEPS.length - 1 ? "Zavřít" : "Přeskočit";
  skip.onclick = end;
  actions.appendChild(skip);
  if (i > 0) {
    const back = document.createElement("button");
    back.className = "btn";
    back.textContent = "Zpět";
    back.onclick = () => show(i - 1);
    actions.appendChild(back);
  }
  const next = document.createElement("button");
  next.className = "btn btn-primary";
  next.textContent = i === STEPS.length - 1 ? "Začít psát" : "Další";
  next.onclick = () => (i === STEPS.length - 1 ? end() : show(i + 1));
  actions.appendChild(next);
  card.append(count, title, body, actions);
  place();
  next.focus();
}

function onKey(e: KeyboardEvent) {
  if (!card.contains(document.activeElement)) return;
  if (!["Escape", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  if (e.key === "Escape") end();
  else if (e.key === "ArrowRight" && at < STEPS.length - 1) show(at + 1);
  else if (e.key === "ArrowLeft" && at > 0) show(at - 1);
}

export function startTour() {
  if (at >= 0) return;
  if (timer !== null) { clearTimeout(timer); timer = null; }
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.append(ring, card);
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", place);
  show(0);
}

export function closeTour() {
  if (timer !== null) { clearTimeout(timer); timer = null; }
  at = -1;
  ring.remove();
  card.remove();
  window.removeEventListener("keydown", onKey, true);
  window.removeEventListener("resize", place);
  previousFocus = null;
}

function end() {
  const focus = previousFocus;
  closeTour();
  try { localStorage.setItem(KEY, "done"); } catch {}
  if (focus?.isConnected) focus.focus();
}

/** The first time a project opens on this computer, once the window has settled. */
export function tourOnFirstProject() {
  try {
    if (localStorage.getItem(KEY)) return;
  } catch {
    return;
  }
  const project = root;
  if (!project) return;
  if (timer !== null) clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    if (root === project && !document.querySelector("dialog[open]")) startTour();
  }, 700);
}
