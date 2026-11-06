# Architektura

Stav 0.2: pracovní fork Scribe 1.2.3. Tauri 2 + Rust; frontend TypeScript/DOM + Vite, CodeMirror 6, PDF.js, MathLive, KaTeX. Frameworkový přepis není pro první etapu opodstatněný.

## Aktualizace aplikace

Windows workflow sestaví a podepíše NSIS/MSI a zveřejní kompletní privátní GitHub Release s latest.json. Verze je major.minor.GITHUB_RUN_NUMBER; souběžné běhy se řadí a zastaralý commit nesmí přepsat latest. Soukromý podpisový klíč a heslo jsou GitHub Actions secrets; aplikace obsahuje pouze veřejný klíč. Veřejné publikování blokuje kontrola repository.private.

updates.rs čte přihlášení přes gh auth token přímo v Rustu. Manifest i binární soubory získává přes autentizované GitHub API. URL balíčku musí přesně odpovídat assetu téhož vydání, tag musí odpovídat verzi. Tauri updater ověřuje podpis souboru i podepsanou verzi; není povolen downgrade. Credential ani celý Update objekt se neserializují do frontendu. Na straně Rustu jsou operace serializované a stažený balíček je do instalace pouze v paměti.

updates.ts zobrazuje nabídku a modální stav instalace. Čistý UpdateFlow odděluje kontrolu od explicitní instalace: kontrola běžících úloh → stažení a podpis → opětovná kontrola → revizní uložení hlavního/bočního editoru → stav relace → instalátor. Konflikt či neuložené další psaní zastaví instalaci. Veřejné příkazy updater pluginu nejsou zpřístupněny frontendovým capabilities; používají se vlastní IPC příkazy. Podrobnosti a hranice ověření: ADR-009 a docs/UPDATES.md.

## Současný tok

Pracovní prostor se ukládá mimo projekty přes Tauri app_config_dir/workspace.json; výchozí umístění odvozuje systémová složka Dokumenty. Backend workspace.rs vytváří výhradně novou pojmenovanou podsložku a rozbaluje do ní jednu z pevně přibalených ZIP šablon. .tulwriter/project.json přidává allowlistované nastavení překladače a bibliografie. Archivy se za běhu nestahují ani neupravují; vytvořené projekty jsou nezávislé kopie. Podrobnosti v ADR-008.

Nativní dialog → projektová složka → list_files/read_file → CodeMirror → write_file a historie → compile → lokální TeX → read_binary → PDF.js canvas a textová vrstva.

Backend src-tauri/src/lib.rs obsahuje velkou část funkcí v jediném modulu; postupně jej dělíme pod krytím testů. Současné moduly src/project.ts, build.ts, preview.ts, editor.ts, ai.ts, ai-center.ts a document-core.ts tvoří počáteční hranice.

## Cílové vrstvy

| Modul | Odpovědnost |
|---|---|
| Desktop Application | Okna, nativní dialogy, instalátor a capability IPC |
| Project Management | Kanonický root, inventář, hlavní soubor, externí změny |
| Document Core | Původní text, revize, CST/AST s rozsahy, identity uzlů |
| Synchronization Engine | Transakce, mapování rozsahů, konflikty a undo |
| Visual Editor | Tiptap/ProseMirror projekce podporovaných uzlů |
| LaTeX Editor | CodeMirror, completions, diagnostika, více souborů |
| PDF Compiler | Řízený proces, fronta, cancel, timeout, enginy a build profil |
| PDF Viewer | PDF.js, textová vrstva, vyhledávání, SyncTeX |
| Image Editor | Původní asset, Cropper.js viewport, metadatové transformace |
| AI Provider Manager | Provider adapters, model capabilities, credential store |
| AI Agent Runtime | Nástroje přes policy broker, evidence, diff a checkpoint |
| Project Context Manager | Transparentní instrukce, terminologie, index a provenience |
| Bibliography Manager | BibTeX, DOI metadata, ověřování a citace |
| Academic Templates | Verzované šablony, metadata a pravidla |
| Settings / Design System | Lokální nastavení, tokeny a přístupné komponenty |

## Bezpečná vizuální editace

Diskové zdroje jsou jediná autorita. Parser vytváří CST s přesnými původními úseky včetně whitespace a komentářů; AST je pouze odvozený sémantický pohled. unified-latex je kandidát pro analýzu, nikoli automatický serializer celého souboru. Neexpandujeme uživatelská makra jako předpoklad pro editaci.

ProseMirror schema bude mít Paragraph, Heading, Text, Equation, Figure, Table, Citation a OpaqueLatex. Opaque uzel zachová původní rozsah a nabídne přechod do zdroje. Při nejasném parsování, změnách catcode, verbatim či vlastním makro jazyce se vizuální zásah odmítne.

Každá operace je SourceTransaction: fileId, baseRevision/hash, seznam původních rozsahů, expected source, nový text, původce a inverse edits. Podporovaný lokální serializer generuje pouze měněný úsek. Nekolidující úpravy se aplikují odzadu, pod jedinou revizní kontrolou; překryvy a zastaralá revize se odmítají. Backend musí tutéž revizi ověřit při atomickém zápisu; frontendová kontrola sama nestačí.

Po zdrojové změně se invalidují ovlivněné projekce; nová revize se parsuje a mapuje do obou editorů. PDF může patřit starší revizi: UI musí ukazovat stav zastaralosti. SyncTeX mapuje PDF/zdroj, neslouží jako dokumentový model ani garance stejného zalomení vizuální stránky.

## Experiment 0.1

src/document-core.ts ověřuje lokální zdrojové transakce s UTF-16 rozsahy CodeMirroru, očekávaným textem a úplným base snapshotem. Testy pokrývají neznámá makra, prostředí, citace, komentáře, TikZ, verbatim, BOM, CRLF, Unicode a inverse transakci. plainTextEdit přijímá pouze explicitní prostý rozsah. Neurčuje samo, zda rozsah leží v bezpečném TeX kontextu; zatím se nepřipojuje k vizuálnímu UI. To je záměrný experiment, nikoli obecné bezpečnostní rozhraní nebo hotový round-trip parser.

## Obrázky

Ponechat původní asset. Transformace ukládat jako crop v souřadnicích originálu, rozměr, rotace, popisek, label a sémantické umístění. Základ LaTeXu: graphicx width/angle/trim/clip. Pořadí trim je left,bottom,right,top; ořez Cropper viewportu nelze bez přepočtu měřítka a rotace opsat. Vedle sebe minipage/subcaption; obtékání přes podporovaný profil wrapfig s vysvětlením omezení. Žádná garance libovolných plovoucích souřadnic Wordu.

## Soubory a bezpečnost

Otevřené editory používají read_document/save_document a vlastní revizi bajtů (SHA-256); konflikt při uložení zachová buffer a zastaví navazující přechod či kompilaci. Backendový modul documents.rs a frontendový DocumentSession oddělují tuto revizi od pomocných čtení. Zápisy z jednoho procesu se serializují a používají jedinečný dočasný soubor. Hranice optimistické kontroly a zbývající integrační cesty popisuje ADR-007.

Zachováváme historii Scribe. Oprava resolve kontroluje nejbližší existující kanonický předek také u nových souborů. Ještě chybí session-bound projektové handles, úplná ochrana TOCTOU a filesystem watcher. Detekce externích změn nyní probíhá při ukládání otevřených editorů. CSP je převzato null: před vydáním zavést CSP a sanitizaci všech nedůvěryhodných náhledů.

Kompilace nyní neprovádí projektový Python automaticky; latexmk dostává -norc a -no-shell-escape. Přímý pdflatex dostává -no-shell-escape a dva průchody. Tectonic může přistupovat k síti kvůli balíčkům. Process sandbox, síťová izolace, cancel a timeout zůstávají nutným dalším krokem. Nepovažovat tuto verzi za bezpečný prohlížeč cizích projektů.
