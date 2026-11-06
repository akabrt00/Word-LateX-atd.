# Stav funkcí

Legenda: převzato = nalezeno ve zdroji, ještě ne potvrzeno kompletním živým testem; testováno = konkrétní evidence v docs/TEST_REPORT.md.

| Funkce | Průběžný stav |
|---|---|
| Tauri 2, Rust, TypeScript | Nativní EXE sestavené a spuštěné na Windows |
| Zprovoznění na druhém Windows PC | Ověřeno sestavení DEBUG EXE a GUI tok editace → uložení → kompilace → PDF; podrobnosti v docs/TEST_REPORT.md |
| Otevření složky, .tex soubory, více souborů | Ověřeno nativním integračním testem a načtením projektu v GUI |
| CodeMirror úpravy, Ctrl+S, undo | Editace a Ctrl+S ověřeny v GUI; undo převzato |
| Atomický zápis a historie | Jedinečné dočasné soubory, zachovaná historie; regresní testy zápisů prošly |
| Konflikt při uložení otevřeného souboru | Revize hlavního/bočního editoru a notebooku; odmítnutí novějšího nebo smazaného souboru, zachování bufferu a dialog pro načtení z disku; watchdog/recovery a starší integrační zápisy zbývají |
| Kompilace a PDF.js | Převzato; doplněna přímá cesta pdflatex, dva průchody a odmítnutí stale PDF |
| Shell escape a projektový latexmkrc | Explicitně vypnuty pro latexmk/pdflatex |
| Python notebook při kompilaci | Automatické spuštění vypnuto; explicitní spuštění zůstává |
| Vlastní identita, Inter, light/dark | Implementováno; ověření UI viz test report |
| AI centrum | Implementovaná struktura a navigace, agent označen jako plán |
| AI chat a editace výběru | Převzato, žádné živé API ověření |
| Source-preserving transakce | Experiment; 7 automatických testů |
| Word Mode, paginace, bezpečný parser | Plánováno, není hotový převod |
| Resize/crop/rotate obrázků | Plánováno; Cropper.js je kandidát |
| Tabulky a rovnice | Převzaté dialogy Scribe; Word-like integrace plán |
| Citace, Zotero, DOI, TikZ | Převzaté implementace; vyžadují dílčí ověření |
| AI agent, paměť, file disclosure policy | Navrženo, neimplementováno |
| Pracovní prostor | Výchozí složka Dokumenty / TUL Writer, změna složky a šablony pro celý počítač, nastavení přetrvává po restartu |
| TUL šablony a zakládání dokumentů | Čtyři nezměněné offline balíčky z portálu TUL × LaTeX; nová vlastní podsložka bez přepisování, volba šablony a nastavení enginu/bibliografie. Fakultní průvodce zatím není implementovaný |
| Překladač podle šablony | Explicitní pdfLaTeX / XeLaTeX / LuaLaTeX, BibTeX / Biber a navazující průchody; původní projekty zachovávají dosavadní automatickou detekci |
| Windows EXE/MSI | Sestavené testovací DEBUG EXE/MSI; instalace na čistém systému neověřena |
| Podepsané aktualizace | Vlastní privátní GitHub Release kanál, nabídka po startu i ruční kontrola; NSIS/MSI s podpisem souboru a verze, revizní uložení před instalací. Vyžaduje GitHub CLI přihlášení; evidence skutečné distribuce a hranice ověření v docs/TEST_REPORT.md |
| Kompletní české UI | Částečně; převzaté obrazovky zůstávají anglické |
| GitHub synchronizace projektu | Origin akabrt00/Word-LateX-atd.; main a automatický commit/push po dokončených úkolech podle AGENTS.md |

Není tvrzeno, že staticky auditované funkce jsou připraveny k veřejnému vydání. Neověřené části mají vlastní akceptační scénáře v roadmapě.
