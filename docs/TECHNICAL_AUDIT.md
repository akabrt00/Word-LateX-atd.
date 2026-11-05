# Technický audit – 5. listopadu 2026

Audit rozlišuje README tvrzení, kontrolu konkrétního kódu a lokální runtime ověření. U všech tří repozitářů byl dostupný veřejný zdroj; žádný archivovaný stav nebyl na kontrolované stránce indikován. GitHub main se může změnit; níže jsou přesné snapshoty.

## Rozhodnutí

Základ je Scribe 1.2.3, commit 08168f3208c32609ae5404016e9306c185f69f37. Zachovat upstream historii i MIT licenci, založit vlastní identitu a vyvíjet bezpečnou projekci nad skutečným LaTeXem. WordCraft nepřipojovat jako druhý dokumentový engine. Oleafly použít pro funkční srovnání bez kopírování jeho AGPL kódu.

| Kandidát | Architektura / formát | Licence | Náročnost pro TUL Writer | Výsledek |
|---|---|---|---|---|
| Scribe | Tauri 2, Rust, TS/DOM, CodeMirror, PDF.js; LaTeX | MIT | Nízká pro první milník, vysoká pro Word Mode | Vybrán |
| WordCraft | Rust/egui, vlastní doc/layout/render; hlavně OOXML | MIT OR Apache-2.0 | Vysoká: jiný model i UI a chybějící LaTeX autorita | Reference a možné dílčí algoritmy |
| Oleafly | Tauri, Rust crates, React/editor packages; LaTeX/Typst/Markdown | AGPL-3.0-or-later deklarované projektem | Vysoká: licence a širší infrastruktura | Reference, žádná integrace kódu |

Toto je technické licenční posouzení komponent, nikoli konečné právní schválení distribuce. Před vydáním provést SBOM a ověřit každou přebíranou komponentu i její assets.

## Scribe

[Snapshot](https://github.com/Scribe-IDE/Scribe/tree/08168f3208c32609ae5404016e9306c185f69f37), [MIT licence](https://github.com/Scribe-IDE/Scribe/blob/08168f3208c32609ae5404016e9306c185f69f37/LICENSE).

| Oblast | Evidence ve zdroji | Hodnocení / mezery |
|---|---|---|
| Desktop | Cargo.toml, tauri.conf.json, main.rs | Tauri 2, Windows konfigurace existuje; build je nutno skutečně ověřit |
| Zdrojový editor | editor.ts, texassist.ts, snippets.ts, lint.ts | CodeMirror 6, LaTeX completions, diagnostika, undo; nejsou plnohodnotný Word Mode |
| Projekty | project.ts, sidebar.ts, tabs.ts, session.ts, lib.rs | Složky, vícesouborové projekty, hlavní soubor, import, git; doplnit diskové revize a watch |
| Kompilace | build.ts, lib.rs run_tex | Tectonic/latexmk; doplněn pdflatex bez Perlu, vypnut rc a shell escape |
| Náhled | preview.ts, reader.ts | PDF.js, textová vrstva, hledání a SyncTeX cesty; živé ověření viz test report |
| Matematika | equation.ts, mathpreview.ts, symbols.ts | MathLive, KaTeX a zdrojový zápis; pokročilá amsmath kompatibilita vyžaduje testy |
| Tabulky | tables.ts | Grid dialog a vložení LaTeXu; nikoli plný stránkový editor |
| Citace | cite.ts, zotero.ts, texindex.ts | DOI/arXiv/BibTeX a Zotero integrace; závisí na síti a dostupnosti služby |
| AI | ai.rs, ai.ts, assistant.ts, aiedit.ts | Stream, více providerů, keyring, výběrový diff; chybí samostatný nástrojový agent s brokerem |
| Historie | history.ts, revisions.ts, write_file | Historie souborů a atomické ukládání; doplnit crash recovery a konflikt s externí editací |
| Windows distribuce | bundle targets all, CI release | EXE/MSI podporuje konfigurace Tauri; není tím potvrzen test instalátoru |

Lokálně původní npm ci a npm run build prošly. Původní Rust testy nebylo možné spustit před doplněním toolchainu; nesrovnáváme tedy dvě nezávisle otestované nativní revize. Vlastní výsledky jsou v TEST_REPORT.md.

Hlavní technické dluhy: velký lib.rs, široké command API, CSP null, neomezené kompilátorové procesy, implicitní Python při kompilaci, převzaté značky/aktualizace. Provedené úpravy odstraňují automatický Python, upstream updater a část rizik procesu; úplný sandbox ještě neexistuje. Nové resolve ověřuje i předky nových cest, ale TOCTOU zůstává.

## WordCraft / ArtCraft

[Snapshot](https://github.com/storytold/wordcraft/tree/d4bbe8ba9aeafa5aeb4bf1fdfbc710a168b41352), [MIT licence](https://github.com/storytold/wordcraft/blob/d4bbe8ba9aeafa5aeb4bf1fdfbc710a168b41352/LICENSE-MIT). README projekt označuje alpha; vysoké procento příkazů není důkaz fidelity či stability. Nebyl lokálně sestaven ani otestován.

crates/doc/src/document.rs ukazuje strukturovaný copy-on-write model s bloky, styly, revizemi, komentáři, médii a passthrough. crates/layout řeší odstavce, stránky, floating objekty a tabulky; crates/engine nabízí příkazový model a historii; crates/ui-egui je samostatné nativní UI s ribbonem.

README a strom uvádějí stránkové rozvržení, formátování textu, styly, tabulky, obrázky, resize/rotate/crop, text wrapping, track changes a import/export DOCX/ODT/RTF/HTML/Markdown/TeX/PDF. Zápis .tex v tomto systému není bezeztrátový round-trip libovolného LaTeX projektu.

Konkrétně přečtený crates/ui-egui/src/crop.rs implementuje nedestruktivní ořez pomocí frakcí okrajů původního obrázku, převod tažení na crop/rozměr/posun a jeden undo krok. Rotované obrázky tento režim výslovně nepřijímá. Přínosem pro TUL Writer je matematika crop a příkazový kontrakt; přímé převzetí UI vyžaduje egui geometrické typy a převod dokumentového modelu. Nyní nebyl převzat žádný kód ani branding.

## Oleafly

[Snapshot](https://github.com/Oleafly/Oleafly/tree/f7fd35189a217d26ea087be2e9f871b66eb52882), [licence](https://github.com/Oleafly/Oleafly/blob/f7fd35189a217d26ea087be2e9f871b66eb52882/LICENSE). package.json a README deklarují AGPL-3.0-or-later, verzi 0.4.11 a beta. Licence připojených balíčků, runtime a research skills mohou mít vlastní podmínky. Nebyl lokálně sestaven ani otestován.

packages/editor/src/visual/atomic-decorations.ts používá CodeMirror syntaktický strom, decorations a widgety pro argumenty, matematiku, figures a tabulky. Jde o vizuální práci nad zdrojem; samotný název visual nezaručuje Word-like stránkovou věrnost. Strom obsahuje regresní testy visual editoru a table modelu.

crates/oleafly-agent odděluje provider, nástroje, streamy a session; crates/oleafly-research/src/builtin.rs nabízí host kontrakty, gate pro schválení, budget, evidence/literature a práci s PDF. README uvádí 39 research skills a integrace Codex/Claude Code a dalších CLI i MCP. Přesný runtime a práva konkrétního nástroje je třeba auditovat samostatně.

Technická inspirace: agentní životní cyklus, evidence, kontrola claims, explicitní approvals a vizuální widgety nad syntaxí. AGPL kód nevkládáme do MIT forku. Samostatný proces sám o sobě není obecnou zárukou, že licenční povinnosti nevzniknou.

## Další technologie

| Technologie | Licence / použití | Rozhodnutí |
|---|---|---|
| [Tiptap](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md) | MIT core nad ProseMirror; placené doplňky mají jiné podmínky | Kandidát projekce; nespoléhat na bezplatnost Pages/Tracked Changes |
| [Cropper.js](https://github.com/fengyuanchen/cropperjs) | MIT, v2 web components, jiné API než v1 | Kandidát nedestruktivního viewportu, nikoli serializer LaTeXu |
| [unified-latex](https://github.com/siefkenj/unified-latex) | MIT parser/AST utilities | Kandidát analýzy; neukládat celý přeformátovaný AST |
| CodeMirror 6 | MIT | Zachovat zdrojový editor |
| PDF.js | Apache-2.0 | Zachovat skutečný PDF náhled |
| MathLive / KaTeX | MIT | Zachovat a otestovat podporované matematické operace |
| [Codex](https://github.com/openai/codex/blob/main/LICENSE) | Apache-2.0 zdrojový harness, oddělený přístup k modelům | Volitelný adapter App Server stdio; není automatický API kredit |

Oficiální [Tiptap dokumentace](https://tiptap.dev/docs/editor/getting-started/overview) rozlišuje open-source editor a platformní/pro rozšíření. Typová integrace ve vanilla TypeScript je možná bez přepisu celé aplikace do Reactu. Žádná z uvedených knihoven sama neřeší obecnou obousměrnou věrnost TeXu.

## TUL šablony a identita

[Balík tul od Pavla Satrapy na TUL](https://www.nti.tul.cz/~satrapa/vyuka/latex-tul/) uvádí verzi 2.3 z února 2025 a třídu tulthesis pro závěrečné práce. Před balením je nutné prohlédnout celý archiv a podmínky obsažených fontů/log, ověřit aktuální fakultní požadavky a vzor z IS STAG. V této etapě nepřebíráme celý archiv ani nepředstíráme oficiální schválení dokumentu.

[Grafický manuál](https://www.fp.tul.cz/images/logo/2022/design-manual-tul.pdf) potvrzuje #5948AD, #FFFFFF a #000000. Inter je samostatně dostupný open font; TUL Mono není v projektu distribuován. Nezávislý branding a podmínky značek jsou zaznamenány v DESIGN_SYSTEM.md.

## Relativní rozsah práce

První editor/kompilátor: Scribe nízký, Oleafly střední, WordCraft vysoký.
Word-like projekce s chráněným TeXem: u všech vysoký.
Řízený multi-provider agent: Scribe střední až vysoký, Oleafly technicky blíže, ale odlišné licenční rozhodnutí; WordCraft vyžaduje vlastní LaTeX nástroje.
Největší nevyřešené riziko je věrnost a bezpečnost vizuální editace, nikoli barva nástrojové lišty.
