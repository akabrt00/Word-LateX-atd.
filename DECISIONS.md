# Rozhodnutí

## ADR-009 – Podepsané aktualizace instalované aplikace (2026-11-06)

Na výslovný pokyn uživatele řešíme aktualizaci nainstalované aplikace, nikoli automatický git pull uživatelova vývojového projektu. Zachován tauri-plugin-updater 2.14.1. Používáme privátní GitHub Releases stejného origin a vlastní veřejný klíč. NSIS i MSI mají podpis svázaný s verzí (requireSignedVersion). Authenticode podpis není tímto podpisem nahrazen a zatím není nastaven.

Soukromý repozitář neumožňuje anonymní stahování. Přijato přihlášení přes GitHub CLI na každém PC; backend získá token do paměti a nevrací jej do JS. Není vložen společný PAT do aplikace ani zpřístupněn repozitář veřejnosti. API adresy balíčků jsou odvozeny od asset ID a kontrolovány vůči vydání. Manifest přes restore_update vstupuje do standardního ověřovače Tauri; nejde o vlastní implementaci kryptografie.

Uživatel výslovně povolil uložit soukromý podpisový klíč a heslo jako šifrovaná GitHub Actions secrets. Lokální klíč je šifrovaný, jeho heslo chrání Windows DPAPI v ignorované .tools. Workflow na main spouští testy, jedinečné verzování, Windows build a publikaci hotového privátního vydání. Změny workflow s oprávněním contents:write jsou hranicí důvěry; veřejná distribuce a změna viditelnosti nadále vyžadují samostatné zadání.

Kontrola aktualizace nikdy neinstaluje. Tlačítko uživatele spustí ověření, uložení a instalaci; aktivní kompilace/notebook/terminál a konflikt uložení instalaci zastaví. Staré 0.1 buildy vyžadují ruční bootstrap. Instalace na čisté VM a skutečný upgrade/restart jsou samostatné akceptační kontroly; jejich dokončení nelze odvodit pouze z úspěchu buildů či podpisu.

## ADR-008 – Pracovní prostor a offline TUL předvolby (2026-11-05)

Přijato na pokyn uživatele: globální složka nových dokumentů (výchozí systémové Dokumenty / TUL Writer) a výchozí šablona v konfiguraci aplikace, nikoli v nastavení právě otevřeného projektu. Založení vytváří výhradně novou podsložku; nepřebírá existující obsah a neprovádí automatické skripty. Při chybě rozbalení se částečná nová složka ponechá s chybovou zprávou, aby se automaticky neodstraňovala případná uživatelská data.

Čtyři nezměněné univerzitní ZIP balíčky z uživatelova portálu se přibalují do EXE přes include_bytes, včetně původních textů a podkladů. provenance.json zachycuje zdroj a SHA-256. Aktualizace balíčků je vědomá změna distribuce, nikoli síťová operace při každém založení. Původní obecné šablony zůstávají jako samostatná volba.

Nový projekt dostane .tulwriter/project.json (main, engine, bibliography, template). Engine je omezen na pdflatex/xelatex/lualatex a bibliografie na bibtex/biber; neznámý program je odmítnut. Přímé enginy zachovávají vypnutý shell escape a nečtou projektový latexmkrc. Bibliografie vybrané hlavní šablony běží mezi TeX průchody. Projekty bez této konfigurace zachovávají původní detekci Tectonic/latexmk/pdfLaTeX. Jde o podporu nových předvoleb, nikoli o kompletní compiler worker, timeout či obecnou automatickou detekci všech TeX projektů.

## ADR-007 – Revize otevřeného souboru při uložení (2026-11-05)

Přijato: hlavní editor, boční editor a notebook drží vlastní SHA-256 revizi bajtů načtených příkazem read_document. save_document vyžaduje tuto revizi; pomocná čtení read_file ji neposouvají. Změněný či odstraněný soubor vyvolá konflikt, editor zachová lokální text a nabídne explicitní načtení z disku. Zavření panelu či projektu a kompilace se při neúspěšném uložení zastaví. Souběžná uložení jednoho editoru se řadí a rozpracované změny vzniklé během zápisu zůstávají označené jako neuložené.

Všechny write_file/save_document zápisy v jednom procesu sdílejí mutex. Náhrada souboru používá jedinečný dočasný soubor ve stejném adresáři, flush a atomický persist. Revize se ověřuje před přípravou i těsně před náhradou. Jde o optimistickou kontrolu: OS neposkytuje společný compare-and-swap s cizími editory, takže zůstává malé okno mezi poslední kontrolou a náhradou a ochrana proti nepřátelským změnám cest není vyřešena. Starší integrační write_file operace zatím nemají povinnou revizi; jejich převod, filesystem watcher a obnova po pádu jsou další práce.

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
