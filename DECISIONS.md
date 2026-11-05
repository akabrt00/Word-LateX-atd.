# Rozhodnutí

## ADR-001 – Scribe jako pracovní základ (2026-11-05)

Přijato: fork snapshotu 08168f3 pod MIT se zachováním Git historie a copyright. Důvody: Tauri 2, lokální soubory, TeX/PDF tok a modulární provider infrastruktura. Alternativy: vlastní kostra zahazuje hotové funkce; WordCraft má jiný model a renderer; Oleafly by vyžadoval AGPL rozhodnutí. Důsledky: postupně rozdělit lib.rs, nezávisle ověřovat funkce.

## ADR-002 – Autoritou je původní LaTeX

Přijato: CST/AST projekce a lokální revizní patche. Zamítnuto: celý dokument LaTeX → HTML → LaTeX jako ukládací cesta. Neznámé uzly zůstanou opaque. Experiment v 0.1 ještě neprokazuje obecný parser ani kontextovou bezpečnost libovolného výběru.

## ADR-003 – Zachovat frontend TypeScript/DOM

Přijato: pro milník 1 zachovat CodeMirror, PDF.js a stávající moduly. Tiptap lze izolovat v modulu Visual Editor bez frameworkového přepisu. Stránkovou vizuální sazbu nezaměňovat s výsledkem TeXu.

## ADR-004 – Agent oddělený od provideru

Přijato: capabilities, nástrojový broker, explicitní disclosure policy a review checkpointů. Codex App Server volitelně přes stdio. Provider API klíče mimo projekt. Živá integrace vyžaduje uživatelské nastavení; v 0.1 není autonomní agent.

## ADR-005 – Samostatný branding a release

Přijato: vlastní app identifier, keyring service, ikona a verze 0.1.0; vypnout upstream updater. Zachovat copyright. Bez oficiálního loga a TUL Mono do ověření práv. Vnitřní .scribe metadata a scribe_lib zatím zachovány pro kompatibilitu; jejich kosmetický rename není produktová funkce.

## ADR-006 – MiKTeX bez Perlu

Přijato: fallback pdflatex, dva průchody pro odkazy, skutečný PDF.js náhled. Pro plnou bibliografii použít latexmk a jeho závislosti. -norc/-no-shell-escape, žádný automatický projektový Python. Úplná procesová izolace, timeout a cancel zůstávají samostatnou prací.
