# Roadmap

## Etapa 0 – audit a rozhodnutí

Vybrán Scribe MIT se zachováním historie. Audit, licence, architektura, AI návrh a design systém jsou připravené. Převzetí AGPL kódu není součástí rozhodnutí.

## Etapa 1 – pracovní základ 0.1

2026-11-05: na druhém Windows PC doplněn toolchain a ověřeno čisté sestavení i základní desktopový tok editace, uložení a PDF kompilace. Evidence a omezení jsou v docs/TEST_REPORT.md; další funkční etapy zůstávají beze změny.

Hlavním vzdáleným úložištěm projektu je od 2026-11-05 GitHub repozitář akabrt00/Word-LateX-atd. s větví main. Další dokončené úkoly se automaticky commitují a synchronizují podle AGENTS.md.

Samostatná identita, Tauri konfigurace, ukázkový vícesouborový projekt, přímý MiKTeX compiler fallback, explicitní notebook execution, vlastní ikony, AI centrum a experiment zdrojových transakcí. Průběžný stav akceptačních bodů a omezení je v docs/TEST_REPORT.md.

## Bezprostřední další etapa – 0.2

Pracovní prostor a základní TUL předvolby: implementována globální složka nových dokumentů, trvalá výchozí šablona a vytvoření samostatné kopie čtyř univerzitních balíčků. Doplněn výběr překladače a bibliografie podle projektu. Semestrální práce má dvoukrokový průvodce součástí TUL a údaji titulní strany včetně seznamu autorů pro skupinové práce, ověřený až do PDF. Navazující práce: obdobný průvodce závěrečnou prací, prezentací a posterem a správa verzí šablon. Originální archivy zůstávají nezměněné.

1. Nativní smoke test, Rust regresní sada a DEBUG EXE/MSI build jsou dokončené. Navázat release buildem a ověřením instalace/odinstalace na čistém Windows účtu bez vývojových nástrojů.
2. Revizní read/save pro hlavní a boční editor i notebooky implementován v documents.rs, včetně konfliktového dialogu a zastavení zavření po chybě. Další krok: převést starší integrační write_file volání na povinné revize, doplnit filesystem watcher, obnovu po pádu a dále vyjmout files/compiler z lib.rs. Optimistická kontrola neřeší celý TOCTOU závod s cizími procesy (ADR-007).
3. Compiler worker: fronta, timeout, cancel, stdout/stderr limit, bezpečný profil prostředí, trust pro projekt a samostatná konfigurace enginu. Test: nekonečný TeX se ukončí, cizí soubor se nepřepíše, starý PDF není nový výsledek.
4. Zapojit parser pouze pro analýzu korpusu. Rozsahy a opaque uzly pro neznámá makra, komentáře, catcode, verbatim a vlastní prostředí; ukládání stále přes zdrojové patche. Test: bezzměnové otevření/uložení zachová bajty.
5. Minimalistická vizuální projekce nadpisů a prostých odstavců v Tiptap/ProseMirror; žádná plná HTML serializace. Podporovaný serializer jen pro lokální editaci. Test: zdroj → vizuální úprava → zdroj → znovuotevření a undo zachová okolní zdroj.
6. UI režimy LaTeX/Hybrid/Word až po funkčním napojení. Neznámý blok přepne do zdroje; přímá změna zdroje invaliduje projekci. Paginace je aproximace, PDF zůstává autorita.
7. Dokončit české popisky hlavního toku a testy klávesnice, focusu a obou motivů.

Definition of done 0.2: tři režimy bezpečně upraví podporovaný jednoduchý dokument, neznámé bloky zůstanou beze změny, externí konflikt je odmítnut, autosave se zotaví po pádu a PDF odpovídá označené revizi.

## Etapa 2 – základ Word Mode

Styly, formátování a image insertion (soubor, paste, drop), resize a základní popisky. Přidat fixture/regression test pro každý typ uzlu. Paginaci rozvíjet po měřeních výkonu.

## Etapa 3 – agent

Nejprve lokální fake provider pro smluvní testy a permission broker; potom uživatelem nastavený první reálný provider. Read/search → plan → propose diff → approve → compile → checkpoint/rollback. Ověřit prompt injection, omezení souborů, odvolání oprávnění a zachování citací.

## Etapa 4 – odborné objekty

Nedestruktivní crop/rotate, skupiny obrázků, subcaption, podporované obtékání; tabulky merge/width; MathLive + amsmath; BibTeX/biber; TikZ/pgfplots a schválená data. Průvodce tulthesis s verzovanými šablonami po ověření licencí a fakultních pravidel. Další AI adaptéry.

## Etapa 5 – vydání

Výkon a velké projekty, recovery, plná přístupnost, čistá Windows VM, podepsané MSI/NSIS a updater s vlastními klíči. Kompletní licence/SBOM, ověření značek a dokumentace. Sites projekt analyzovat až po dodání zdrojů.

Časové odhady nepředstírají znalost rozsahu obecného LaTeX parseru. Každý krok má malý měřitelný akceptační scénář, samostatný commit a záznam testů.
