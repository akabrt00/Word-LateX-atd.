// Illustrative source-to-page animation. It never compiles or edits a document.
const blocks = [
  { source: "\\documentclass[a4paper]{article}\n\\usepackage[czech]{babel}\n\\usepackage{xcolor}\n\\definecolor{tul}{HTML}{5948AD}", html: "" },
  {
    source: "\\title{\\textcolor{tul}{Semestrální práce}}\n\\author{Anna Nováková}\n\\date{}\n\n\\begin{document}\n\\maketitle",
    html: '<h1>Semestrální práce</h1><p class="demo-author">Anna Nováková</p>',
  },
  {
    source: "\\section{Cíl práce}\nPopsat problém, najít řešení\na srozumitelně předat výsledky.",
    html: '<h2><span>1</span>Cíl práce</h2><p>Popsat problém, najít řešení a srozumitelně předat výsledky.</p>',
  },
  {
    source: "\\section{Postup}\n\\begin{enumerate}\n  \\item Vyberte šablonu.\n  \\item Doplňte údaje.\n  \\item Začněte psát.\n\\end{enumerate}",
    html: '<h2><span>2</span>Postup</h2><ol><li>Vyberte šablonu.</li><li>Doplňte údaje.</li><li>Začněte psát.</li></ol>',
  },
  {
    source: "\\section{Výsledek}\nDokument připravený ke čtení.\n\\[ E = mc^2 \\]\n\n\\end{document}",
    html: '<h2><span>3</span>Výsledek</h2><p>Dokument připravený ke čtení.</p><p class="demo-equation">E = mc<sup>2</sup></p>',
  },
];

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function highlight(text: string) {
  const tokens = /(%[^\n]*)|(\\[a-zA-Z]+)|(\d+(?:\.\d+)?)/g;
  const classes = ["demo-comment", "demo-command", "demo-number"];
  let output = "", end = 0;
  for (const match of text.matchAll(tokens)) {
    output += escapeHtml(text.slice(end, match.index)) + `<span class="${classes[match.slice(1).findIndex(value => value !== undefined)]}">${escapeHtml(match[0])}</span>`;
    end = match.index! + match[0].length;
  }
  return output + escapeHtml(text.slice(end));
}

// Reserve each block's layout while its source is typed. Avoid duplicate hidden
// text nodes: the visible page remains ordinary document markup in either theme.
function mountBlock(paper: HTMLElement, html: string) {
  const block = document.createElement("div");
  block.className = "welcome-demo-block";
  block.innerHTML = html;
  block.style.opacity = "0";
  paper.append(block);
  return (progress: number) => { block.style.opacity = String(Math.max(0, Math.min(1, progress))); };
}

let timer: number | null = null;
let resumeOnVisible = false;
export function stopWelcomeDemo() {
  if (timer !== null) window.clearTimeout(timer);
  timer = null;
}

export function startWelcomeDemo() {
  stopWelcomeDemo();
  resumeOnVisible = false;
  const stage = document.getElementById("welcome-demo");
  const source = document.getElementById("welcome-demo-source");
  const paper = document.getElementById("welcome-demo-paper");
  const replay = document.getElementById("welcome-demo-replay") as HTMLButtonElement | null;
  if (!stage || !source || !paper || !replay) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  replay.disabled = reduced;
  replay.textContent = "Přehrát znovu";
  replay.title = reduced ? "Animace je vypnutá podle nastavení omezeného pohybu." : "Přehrát ukázku znovu";
  replay.onclick = startWelcomeDemo;
  paper.replaceChildren(); source.scrollTop = 0;
  const finish = () => {
    stopWelcomeDemo();
    source.innerHTML = highlight(blocks.map(block => block.source).join("\n\n"));
    paper.replaceChildren();
    for (const block of blocks) mountBlock(paper, block.html)(1);
    source.scrollTop = source.scrollHeight;
    replay.textContent = "Přehrát znovu";
    replay.onclick = startWelcomeDemo;
  };
  if (reduced || stage.getClientRects().length === 0) { finish(); return; }
  let block = 0, character = 0, typed = "";
  let progress = mountBlock(paper, blocks[0].html);
  const tick = () => {
    if (document.hidden || document.getElementById("welcome")?.classList.contains("hidden")) { stopWelcomeDemo(); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || stage.getClientRects().length === 0) { finish(); return; }
    const text = blocks[block].source;
    source.innerHTML = highlight(typed + text.slice(0, character)) + '<span class="demo-cursor"></span>';
    source.scrollTop = source.scrollHeight;
    progress(character / text.length);
    if (character++ < text.length) { timer = window.setTimeout(tick, text[character - 1] === "\n" ? 65 : 14); return; }
    typed += text + "\n\n";
    if (++block === blocks.length) { finish(); return; }
    character = 0; progress = mountBlock(paper, blocks[block].html);
    timer = window.setTimeout(tick, 220);
  };
  replay.textContent = "Pozastavit";
  replay.title = "Pozastavit nebo obnovit ukázku";
  replay.onclick = () => {
    if (timer !== null) { stopWelcomeDemo(); replay.textContent = "Pokračovat"; }
    else { replay.textContent = "Pozastavit"; timer = window.setTimeout(tick, 0); }
  };
  source.innerHTML = "";
  timer = window.setTimeout(tick, 300);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { resumeOnVisible = timer !== null; stopWelcomeDemo(); }
  else if (resumeOnVisible && !document.getElementById("welcome")?.classList.contains("hidden")) startWelcomeDemo();
});
