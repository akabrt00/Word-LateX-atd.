# Ověření milníku 0.1 – 2026-11-05

## Hlavní pracovní cesta — první iterace — 2026-11-07

Výchozí čistý commit 2bbf249. Priorita uživatele: založit dokument → psát → uložit → získat PDF. Tato iterace zpřehledňuje tvorbu PDF, automatické uložení otevřených editorů a export přesné zobrazené verze. Ostatní překážky této cesty zůstávají v docs/UX_WORKFLOW.md; celá priorita není dokončená.

Prostředí: Windows/PowerShell, Node v24.15.0, npm 11.12.1, Rust/cargo 1.99.1, místní MiKTeX a izolovaný bezokenní Edge. Bez nových závislostí. Testy používají dočasné projekty a smyšlené názvy, ne uživatelova data.

- `npm test`: 24 prošlo, 0 selhalo; zahrnuje zachování exportovaného snímku při změně projektu během dialogu, zrušení, souběh a opakování po chybě. Finální `npm run check`: exit 0.
- `npm run test:workflow`: finálně 21 kontrol prošlo, exit 0. Skutečné index.html, build.ts, preview.ts, diagnostika a PDF.js včetně canvasu; nativní IPC, dialogy a editorové adaptéry jsou testovací. Ověřeno pořadí uložení obou editorů, chyby uložení, neúspěšný překlad, neplatné PDF, blokování opakovaných akcí, přepnutí projektu během uložení/překladu, změna hlavního souboru během načítání PDF, přesné exportované bajty a obnova ovladačů. Před rozšířením o poslední závod prošlo 20 kontrol.
- Regrese `npm run test:workspace` a `npm run test:metadata`: postupně 21 a 24 kontrol prošlo, exit 0.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib -- --test-threads=1 --skip tests::lists_and_compiles_example`: 57 prošlo, 0 selhalo, 13 ignorováno, 1 filtrován. Notebookový test zůstává vynechán kvůli dříve doloženému chybějícímu matplotlib; nejde o úspěch tohoto testu.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib pdf_export::tests::compiled_document_exports_byte_for_byte -- --ignored --test-threads=1`: 1 prošel. Skutečný nový dokument přeložen pdfLaTeXem; exportované PDF se bajt po bajtu shoduje a zdroj zůstal zachovaný. Dva běžné backendové exportní testy navíc ověřují přepsání pouze zvoleného PDF, českou cestu, odmítnutí neplatných dat, jiné přípony, relativní cesty a chybějící složky.
- `npm run build`: exit 0. Finální `npm run tauri build -- --debug --no-bundle`: exit 0, sestaveno src-tauri/target/debug/tul-writer.exe bez spuštění. Ignorovaný log workflow-desktop-build.log. Existující varování velikosti chunků a neúčinných dynamických importů přetrvávají. `git diff --check`: bez chyb.

Živé desktopové okno, skutečný nativní dialog přes Tauri a instalátor nebyly spuštěny na přání uživatele nepřebírat obrazovku. Browserové ověření a skutečný TeX/backendový export jsou oddělené kontroly, nikoli plný nativní průchod. Rozlišení uloženého textu od zastaralého náhledu PDF je další otevřená položka.

## TUL animace a upřesnění jednoduchosti – 2026-11-07

Výchozí čistý commit 9fb41b2. Uživatel upřesnil, že jednoduchost znamená snadnou práci, a požádal o animovanou ukázku v TUL vzhledu. Upraveny návrhové instrukce v AGENTS.md a DESIGN_SYSTEM.md. Na úvod vrácena česká ilustrační animace zdroje a vznikající stránky: Inter, fialový akcent, zdroj podle aktivního motivu, bílá stránka. Import je přímo dostupný bez rozbalování. Nový modul welcome-demo.ts používá pevný ukázkový obsah; nemá přístup k projektům ani překladači.

Prostředí: stejné Windows/PowerShell, Node v24.15.0, npm 11.12.1, Edge headless, bez nových závislostí a bez změn backendu.

- `npm test`: 21 prošlo, 0 selhalo. `npm run check` a `npm run build`: exit 0. Existující varování neúčinných dynamických importů a velikosti chunků zůstávají; ignorovaný log tul-demo-build.log.
- Dočasný preview v output/: `node output/prepare-welcome-preview.mjs` a `node output/welcome-preview-runner.mjs` mimo sandbox. Skutečné index.html, CSS a moduly welcome/welcome-demo, izolovaný Edge a mock projektových akcí/check_tools; pouze smyšlené názvy projektů a osob.
- Ověřeny hlavní akce, jednoznačně dostupný import, poslední projekty a odkrytí chybějícího překladače. Animace: rozepisování zdroje, pauza, pokračování, zastavení časovače, zachování zastavení při návratu k oknu, dokončení celé ukázky a okamžitý kompletní výsledek při prefers-reduced-motion. Postupné kontroly prošly 12 a následně 13 kontrolami chování, exit 0.
- Při vizuální kontrole byla prověřena nejednoznačně zobrazená část snímku v jiném motivu. DOM diagnostika potvrdila správné pozice, velikost, viditelnost i barvy textu; přímé načtení uloženého PNG potvrdilo 1630 barevných pixelů titulku. Vykreslování bylo zároveň zjednodušeno na běžné HTML bloky s průběžnou průhledností namísto skrytých kopií textu. Odhaleno a opraveno skutečné oříznutí při menší výšce okna: typografie stránky se odvozuje také od dostupné výšky.
- Jeden samostatný diagnostický start skončil uzamčeným dočasným profilem (EBUSY), nikoli úspěchem. Procesy byly dohledány výhradně podle konkrétního testovacího profilu a ukončeny; běžné prohlížeče se neovládaly. Opakovaný izolovaný průchod prošel.
- Finální opakování po změně měřítka: 13 kontrol chování a pět rozvržení prošlo, exit 0. PNG/JSON v ignorovaném output/welcome-tul-*: světlý/tmavý motiv 1400 × 860, sbalené/rozbalené možnosti 820 × 620 a minimální okno 820 × 520. Kontrolováno i to, že obsah ilustrační stránky nepřetéká mimo její spodní okraj.
- `npm run check` a finální `npm run tauri build -- --debug --no-bundle`: exit 0. Aktuální src-tauri/target/debug/tul-writer.exe sestaveno bez spuštění; log tul-demo-desktop.log je ignorovaný. `git diff --check`: bez chyb.

Backendové Rust testy se neopakovaly, protože zdrojové transakce, ukládání a překladač se neměnily. Nativní okno a instalátor nebyly otevřeny na přání uživatele zachovat obrazovku pro vlastní práci. Nejde o živý desktopový průchod ani skutečně zkompilované PDF ukázky.

## Jednodušší úvod – 2026-11-07

Výchozí čistý commit 7782dd4. Na přání uživatele „v jednoduchosti je krása“ zjednodušen úvod na nový dokument, otevření projektu a poslední práce. Import, pracovní prostor, diagnostika a zkratky zůstávají pod nativním details/summary Další možnosti; chybějící TeX tuto část otevře automaticky. Python je volitelný. Odstraněn dekorativní typewriter včetně časovačů a souvisejících stylů; z pracovní lišty odstraněn pouze nadbytečný popisek režimu. Pravidlo návrhu je uložené v DESIGN_SYSTEM.md a připomenuté v AGENTS.md.

Prostředí stejné Windows/PowerShell, Node v24.15.0 a npm 11.12.1. Žádné nové závislosti. Backend a zdrojové transakce dokumentů se neměnily.

- `npm test`: 21 prošlo, 0 selhalo. `npm run check`: exit 0. `npm run build`: exit 0; existující varování velikosti chunků a neúčinných dynamických importů zůstávají. Ignorovaný log simple-welcome-build.log.
- Dočasné ověření `node output/prepare-welcome-preview.mjs` a `node output/welcome-preview-runner.mjs` mimo sandbox: 6 kontrol chování a čtyři rozvržení prošly, exit 0. Použit skutečný index.html a CSS, skutečné renderSetup/renderRecent/renderShortcuts, izolovaný bezokenní Edge, mock check_tools a testovací adaptéry projektových akcí. Ověřeny dvě hlavní akce, zachované poslední projekty, dostupný import/nastavení, absence dekorativní animace, automatické odkrytí instalace při chybějícím TeXu a zachování sbalení při chybějícím volitelném Pythonu.
- Vizuálně prohlédnuté PNG: output/welcome-light.png a welcome-dark.png (1400 × 860), welcome-small.png a welcome-options.png (820 × 620, sbalené a rozbalené možnosti). Kontrola horizontálního přetečení prošla. Při zachycení se vyčkává na načtení fontů a ustálení barevných přechodů. Testovací projekty a cesty jsou ukázkové, nikoli uživatelova data. Dočasný preview i snímky zůstávají v ignorovaném output/.
- `git diff --check`: bez chyb. Rust testy se neopakovaly, protože backend se neměnil. Živé nativní okno ani instalátor nebyly otevřeny na přání uživatele zachovat ovládání počítače; nejedná se o úplný desktopový průchod.
- `npm run tauri build -- --debug --no-bundle`: exit 0, aktuální src-tauri/target/debug/tul-writer.exe sestaveno. Ignorovaný log simple-welcome-desktop.log. Instalace ani spuštění aplikace neproběhly.

## Úpravy údajů existujících prezentací – 2026-11-07

Výchozí čistý commit 83408bd. Rozsah: sdílené tlačítko Údaje práce pro podporovanou semestrálku i prezentaci TUL; čtení skutečného main.tex, sedm lokálních změn, revize zdroje, samostatná historie a zachování snímků. Souběžný zásah nebo odstranění souboru zablokuje zápis. No-op nemění bajty ani historii. Opravena také semestrální editace ručně přeuspořádaných deklarací a rozlišení úspěšného zápisu od následné chyby obnovení editoru. Windows release workflow nyní zahrnuje také regresní sady semester_edit a presentation_edit.

Prostředí: stejné Windows/PowerShell, Node v24.15.0, npm 11.12.1, Rust/cargo 1.99.1 a MiKTeX jako výše. Žádné nové balíčky, poskytovatelé ani přístupy k AI. Editační testy vytvářejí dočasné projekty; uživatelovy projekty nebo globální nastavení neupravují.

- `npm test`: 21 prošlo, 0 selhalo. `npm run check`: exit 0, zopakováno po doplnění stavu chyby obnovení editoru.
- `npm run build`: exit 0; existující varování velkých chunků a neúčinných dynamických importů zůstávají. Log metadata-build.log je ignorovaný.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib -- --test-threads=1 --skip tests::lists_and_compiles_example` mimo sandbox: finální regresní běh 55 prošlo, 0 selhalo, 12 ignorováno, 1 filtrován. Notebookový test zůstává vynechán kvůli již doloženému chybějícímu matplotlib.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib presentation_edit::tests::edited_presentation_pdf -- --ignored --test-threads=1`: 1 prošel. Skutečné XeLaTeX PDF po editaci fakulty na EF, názvu, autorky a data. pdftotext potvrdil „Nové výsledky“, „Ověřená autorka“ a „9. ledna 2027“.
- Po doplnění odmítnutí zanořených deklarací a změn syntaxe: `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib presentation_edit:: -- --test-threads=1`: 4 prošly, 0 selhalo, 1 PDF test ignorován v tomto dílčím běhu. Pokryty BOM/CRLF, komentáře, nezměněné mezery, zpřeházené deklarace, vlastní makra, neplatné datum/volby, no-op, přesná historie, návrat k originálu, konflikt/smazání a nepodporovaný projekt.
- `npm run test:metadata`: finálně 24 kontrol skutečného DOM v bezokenním Edge prošlo, exit 0. Testovací adaptéry nahrazují core/project/split jen na samostatném Vite testovacím serveru. Ověřeno pořadí uložení editorů před čtením, oba typy formulářů, správné revize a payloady, konflikt se zachováním draftu, zámek a dvojí submit, změna projektu během načtení, selhání hlavního/bočního editoru a odlišná chyba obnovení editoru po úspěšném zápisu. První pokus načetl skutečné UI moduly kvůli pořadí resolveru a skončil chybou chybějícího layoutu/timeoutem; oprava používá pre resolver, opakovaný běh prošel 22 kontrolami a finální rozšíření 24 kontrolami.
- Regrese `npm run test:workspace` při souběžném desktopovém sestavování překročila limit CDP; nebyla vydávána za úspěch. Testovací server následně dostal samostatnou cache podle scénáře a omezený seznam tří potřebných závislostí, místo skenování celé aplikace. Jeden další start metadat narazil na timeout endpointu při inicializaci prohlížeče. Finální oprava otevírá nejprve about:blank, počká na připravený protokol a teprve potom naviguje do testu; startovací endpoint má omezené opakování, chyby testových asercí se neopakují. Finální postupný běh bez souběžného sestavování: 21 kontrol vytvářecího průvodce a 24 kontrol editace metadat prošlo, exit 0, včetně odstranění obou dočasných profilů.
- `npm run tauri build -- --debug --no-bundle`: exit 0, včetně finálního opakování po kontrole zanořených deklarací. Aktuální EXE src-tauri/target/debug/tul-writer.exe sestaveno bez spuštění a bez instalace; ignorovaný log metadata-desktop-build.log. `git diff --check`: bez chyb.

Nativní desktopový průchod a instalace nebyly provedeny na přání uživatele pracovat bez přebírání obrazovky. Vlastní TeX makra, krátké volitelné názvy a neznámá syntaxe zůstávají určené pro zdrojový editor. Nejde o expanzi TeXu ani obecné ověření libovolné prezentace. Čárka a mezera ve zdroji autorů je oddělovač seznamu; původní členění jmen obsahujících čárku není součástí formátu této šablony. Závěrečné práce a postery zatím dodatečný formulář nemají.

## Dokončení průvodců dalších TUL šablon – 2026-11-07

Navázáno na zachované místní změny průvodců závěrečnou prací, prezentací a posterem. Scénář: založit nový personalizovaný dokument, zachovat rozepsané formuláře při návratu a změně šablony, odmítnout neplatné údaje před vznikem složky a nepřepsat existující projekt. Rozpracovaný kód z předchozího PC je součástí tohoto dokončovaného úkolu. Navíc doplněna izolace klávesových zkratek modálního průvodce a frontendový rozsah data prezentace shodný s backendem.

Prostředí: Windows, PowerShell, Node v24.15.0, npm 11.12.1, Rust/cargo 1.99.1, místní MiKTeX s XeLaTeX, LuaLaTeX, Biber a pdftotext. Nepřidány závislosti ani balíčky TeXu.

- `npm test`: 21 prošlo, 0 selhalo; `npm run check`: exit 0.
- `npm run build`: exit 0; přetrvávají varování velkých chunků a neúčinných dynamických importů. Log build-verification.log je ignorovaný.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib -- --test-threads=1 --skip tests::lists_and_compiles_example` mimo sandbox: 50 prošlo, 0 selhalo, 11 ignorováno, 1 filtrován. Vynechaný notebookový test má v tomto prostředí již doloženou chybějící závislost matplotlib; jeho úspěch se netvrdí. Zahrnuty transformace metadat, IPC camelCase, validace oboru, autoři, fakultní aliasy, zachování okolního zdroje, ochrana před přepsáním a regrese updateru/ukládání.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib workspace::tests::other_wizard_pdf -- --ignored --test-threads=1` mimo sandbox: 3 prošly, 0 selhalo. Skutečná PDF závěrečné práce, prezentace a posteru mají hlavičku PDF a správný engine. U prezentace pdftotext ověřil zobrazené datum „6. listopadu 2026“ i jméno autorky, nikoli jen přítomnost příkazu ve zdroji.
- `npm run tauri build -- --debug --no-bundle`: exit 0. Aktuální samostatná aplikace src-tauri/target/debug/tul-writer.exe sestavena; nebyla spuštěna ani instalována. Log desktop-verification.log je ignorovaný.

Bezokenní formulářový test používá skutečný DOM Chromium, vlastní dočasný profil, loopback Vite a mock IPC bez skutečných nastavení či dokumentů. První pokus s dump-dom nedal výstup; připojení bylo převedeno na CDP. Další pokus odhalil asynchronní událost close v testovací synchronizaci. Po opravě celý průchod ověřil 21 kontrol. Následná opakování odhalila závod navigace a příliš krátký limit CDP; opraveno čekání na testovací stránku a uzavírání prohlížeče i při chybě. Finální `npm run test:workspace` mimo sandbox: exit 0, všech 21 kontrol prošlo včetně úklidu profilu. Test pokrývá payloady všech tří typů, oddělené rozepsané formuláře, návrat, chybu backendu a opakování, zámek během vytváření, zadržení zkratek, prázdný dokument a pouhé uložení globálního nastavení.

Nativní desktopový průchod, instalační upgrade a restart nebyly provedeny, protože uživatel požaduje práci bez převzetí obrazovky. Editace metadat již existujících závěrečných prací, prezentací a posterů zůstává další etapou; dokončeno je jejich vytváření.

## Sloučení vývoje z obou PC – 2026-11-07

Prostředí: Windows, PowerShell, Node v24.15.0, npm 11.12.1, cargo 1.99.1. Původní HEAD f5d8b1b, vzdálený main 35d5f97: každá strana měla sedm vlastních commitů. Zachována větev codex/backup-before-sync-2026-11-07 a stash včetně obou nových souborů rozpracovaných průvodců. Merge 0ca25e2 zachoval obě historie; konflikty CHANGELOG.md, DECISIONS.md a tohoto reportu byly vyřešeny zachováním obou obsahů. Updater dostal samostatné ADR-012 a odpovídající odkaz v architektuře.

- `git fetch origin`: první sandboxový pokus selhal na getaddrinfo; opakování mimo sandbox uspělo.
- `npm test`: 21 prošlo, 0 selhalo. `npm run check`: exit 0. Obě kontroly zopakovány i se samostatně uloženou rozpracovanou prací, se stejným výsledkem.
- `npm run build`: exit 0, Vite 8.3.6; varování velkých chunků a neúčinných dynamických importů. Tento build zahrnoval obnovené místní průvodce, které nejsou součástí synchronizačního commitu.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline`: sandboxová sada vykázala chyby síťových a souborových testů a byla přerušena (exit 1); není vykázána jako úspěch.
- `cargo test --manifest-path src-tauri/Cargo.toml --offline --lib -- --test-threads=1` mimo sandbox, po samostatném uložení rozpracované práce: 46 prošlo, 1 selhal, 8 ignorováno, exit 1. Jediné selhání `tests::lists_and_compiles_example`: Python nemá `matplotlib`. Updater, revize dokumentů, editace semestrálních údajů a workspace testy prošly. Neinstalovány žádné další závislosti.
- `git diff --check`: bez chyb. GUI, instalátor, restart aplikace ani skutečný upgrade nebyly spuštěny; uživatel požadoval práci bez převzetí obrazovky. Výsledek této synchronizace neprokazuje úspěch nového GitHub Actions běhu nebo vydání.

Rozpracované soubory nejsou přidávány do synchronizačního commitu; po dokončení se obnoví jako místní změny a záložní stash zůstává zachovaný.

## Údaje existující semestrální práce – 2026-11-06

Výchozí pracovní kopie čistá na 90d60bf. Rozsah: formulář Údaje práce v otevřeném projektu tul-semester, čtení metadat přímo z aktuálního LaTeXu, sedm podporovaných deklarací, změna počtu autorů i příslušného popisku, revize obou souborů a samostatné body historie. Vytvářecí průvodce sdílí pole z semester-form.ts. Prostředí stejné Windows/Node/Rust/MiKTeX/WebView2 jako v předchozím ověření; bez nových závislostí a bez instalace TeX balíčků.

- `npm test`: 11 prošlo, 0 selhalo. `npm run check` a `npm run build`: prošly; dosavadní varování importů/chunků. Po upřesnění chybové zprávy zopakováno `npm run check`; finální native build znovu sestavil frontend.
- První cílený běh `cargo test --manifest-path src-tauri/Cargo.toml semester_edit -- --test-threads=1`: 3 prošly. Následně přidány testy komentářů/mezer, selhání stylu a PDF integrace; první celkový běh 41 prošlo, 8 ignorováno, 3 odfiltrováno. Po doplnění neslučované historie zopakován finální `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 41 prošlo, 0 selhalo, 8 ignorováno, 3 odfiltrováno, 12,58 s. Tři volitelné notebook/example integrace a ostatní ignorované integrace nejsou tímto během ověřené.
- Pět nových běžných Rust testů ověřuje čtení/escapování a opakované úpravy, byte-for-byte no-op a návrat k původním údajům, zachování těla/BOM/CRLF/komentářů/mezer, odmítnutí vlastních maker, duplicit a neplatných dat, konflikt stylu před zápisem zdroje a samostatný bod historie. Fault injection ověřuje obnovu zdroje po chybě zápisu stylu i zákaz přepsání cizí změny při neúspěšném rollbacku; druhý případ výslovně hlásí částečné uložení.
- `cargo test --manifest-path src-tauri/Cargo.toml semester_edit_pdf -- --ignored --test-threads=1`: finálně 1 prošel, 0 selhalo, 9,25 s. Tento jeden test skutečně překládá dvakrát: po úpravě na dva autory a následně na jedinou autorku; název obsahuje ampersand a procento. PDF hlavička ověřena při obou překladech. První běh před doplněním historie také prošel (8,79 s).
- `npm run tauri build -- --debug --no-bundle`: první build prošel, po doplnění historie finální build také prošel, 22,20 s, frontend 1,19 s. Vytvořeno DEBUG EXE; instalátor ani release build nevytvářeny.
- GUI přes computer-use testováno na nové kopii předchozí testovací semestrálky v ignorovaném `output/verification/semester-edit-gui`. Původní dokument v Dokumentech se neměnil. Tlačítko se vejde do lišty a formulář načetl název, dva autory po řádcích, TUL, předmět s ampersandem, rok a datum/verzi ze zdroje.
- GUI: změněn název na „Upravená semestrální práce 50 % & model“ a skupina na jedinou autorku. Uložení načetlo nový zdroj do editoru a vyzvalo ke kompilaci. Čtení disku potvrdilo escaping, identické tělo od begin{document}, přesně jedinou změnu Autoři práce → Autor práce v jinak identickém stylu a přítomnost původního celého zdroje v historii. Ctrl+Enter zobrazilo PDF s novým názvem a jedinou autorkou, Page 1 of 2, 0 chyb a 0 varování.
- GUI: znovu otevřený formulář načetl nové údaje. Během otevření přidán komentář do testovacího stylu a ve formuláři druhý autor. Uložení bylo odmítnuto s českou zprávou o konfliktu a doporučením formulář znovu otevřít; hash zdroje zůstal stejný a externí komentář stylu zachovaný. Zrušit zavřelo neuložené změny formuláře. Po opětovném načtení byl druhý autor úspěšně přidán, popisek se vrátil na Autoři práce a externí komentář zůstal zachovaný. Finální PDF.js zobrazilo obě jména, nový název, 2 strany, Compiled with pdflatex, 0 chyb a 0 varování. Aplikace zůstala otevřená nad touto kopií.
- První indexové kliknutí na Uložit údaje nepřineslo pozorovaný zápis; po novém screenshotu souřadnicové kliknutí prošlo. Snapshoty nástroje někdy vracejí starý strom; výsledky byly potvrzeny novým načtením, screenshotem a diskem. Nedošlo k maskování neúspěšného pokusu za úspěch.
- `git diff --check`: bez chyb. Úplný pád mezi dvěma souborovými výměnami není atomická transakce; zdroj a styl mají samostatnou historii a omezení jsou v ADR-010. Světlý motiv, současné psaní externím procesem v posledním okamžiku atomické výměny, živý boční editor s konfliktem, instalace na čistém PC a ostatní šablony nebyly tímto průchodem ověřeny. Vlastní makra jsou záměrně odmítnutá, nikoli genericky přepsaná.

Logy v ignorovaném output/verification: semester-edit-unit.log, semester-edit-frontend.log, semester-edit-check*.log, semester-edit-build.log, semester-edit-regression*.log, semester-edit-pdf*.log a semester-edit-native*.log. Původní zdroj/styl pro diskové porovnání jsou semester-edit-before.tex/.sty; testovací kopie a výstupy nejsou součástí commitu.

## Regrese a živý český tok – 2026-11-06

Výchozí pracovní kopie čistá, commit 447ff68. Na žádost uživatele zopakovány automatické kontroly a živý průchod aktuálním DEBUG EXE. Produkční kód se neměnil, nové závislosti ani TeX balíčky nebyly instalovány. Prostředí: Windows x64, Node/npm, Rust MSVC, MiKTeX a WebView2 jako v předchozích kontrolách.

- `npm test`: 11 prošlo, 0 selhalo. `npm run check` a `npm run build`: prošly. Dosavadní varování importů/chunků přetrvávají.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 36 prošlo, 0 selhalo, 7 ignorováno, 3 odfiltrováno, 20,31 s. Ignorované a odfiltrované testy nejsou vykazované jako úspěšně provedené.
- `cargo test --manifest-path src-tauri/Cargo.toml wizard_pdf -- --ignored --test-threads=1`: skutečný překlad jednoho autora se speciálními znaky i šesti autorů, 2 prošly, 0 selhalo, 12,02 s. Ostatní čtyři šablonové PDF integrace ani volitelné notebook/example integrace se tentokrát neopakovaly.
- GUI přes computer-use: založen nový projekt `C:\Users\akabr\Documents\TUL Writer\Test českého prostředí 2026-11-06`, součást TUL, dva fiktivní autoři po řádcích, předmět „Měření & modelování“. Zdroj na disku potvrzuje dvě jména s řízeným zalomením, escaped ampersand a automatické datum 6. listopadu 2026.
- GUI: nadpis Soubory a title/aria-label tlačítek jsou česky. Zobrazen a vizuálně ověřen Vzhled šablony, po sbalení jeho souborů také Vzhled šablony / Písma. Nápověda obsahuje původní podklady a podklady/pisma. Místní nabídka složky i souboru zobrazila české akce včetně Zobrazit v Průzkumníku. Mazání se neprovádělo.
- GUI: tlačítko Nový soubor otevřelo českou výzvu. Zadání `../mimo-projekt.txt` a Enter odmítnuto hláškou „Soubor musí být uvnitř projektu.“ Cílový soubor mimo projekt neexistuje. Následně vytvořen poznamky-test.txt, do editoru vloženy dva řádky českého textu a uloženy Ctrl+S; čtení z disku potvrdilo přesný text s diakritikou.
- GUI: hlavní semestralni-prace.tex znovu otevřen přes kartu, Ctrl+Enter provedlo překlad. PDF.js zobrazilo Page 1 of 2, oba autory pod sebou, popisek Autoři práce, ampersand a dnešní datum; Compiled with pdflatex, 0 chyb a 0 varování. Aplikace zůstala otevřená nad tímto testovacím PDF.
- Porovnání projektu s původním ZIP ověřilo 167 souborů kromě personalizovaného hlavního zdroje: 166 podkladů bajtově shodných pomocí SHA-256 a styl shodný s originálem po jediné očekávané změně popisku autorů. Konfigurace potvrzuje pdflatex/bibtex. Originální ZIP se neměnil.
- První UI kliknutí skončilo chybou nástroje „coordinate input geometry is unavailable“. Obnovena volba okna a screenshot, jediný opakovaný pokus prošel. Tato chyba ovládacího nástroje nebyla vydávána za chybu aplikace. Další snapshoty někdy ukazují předchozí strom; rozhodující hodnoty byly znovu načteny a potvrzeny obrazem či diskem.
- `git diff --check`: bez chyb. Nový native build se neprováděl, testovalo se poslední úspěšně sestavené EXE. Světlý motiv, úplný překlad všech panelů, skutečné mazání, přejmenování/přesuny, recovery a instalace na čistém PC nebyly tímto průchodem ověřeny. V testovaném rozsahu nenalezen nový funkční regresní problém.

Logy v ignorovaném output/verification: regression-1106-frontend.log, regression-1106-check.log, regression-1106-build.log, regression-1106-rust.log, regression-1106-pdf.log a regression-1106-assets.log.

## České popisky panelu Soubory – 2026-11-06

Překlad zobrazovaných řetězců v index.html, sidebar.ts a místní nabídce prázdné části stromu v main.ts. Zahrnuje nadpis, title/aria-label tlačítek, nabídky souborů/složek, zadávání názvů, validace, přidávání souborů a potvrzení koše. Windows popisek odkazuje na Průzkumníka. ID, příkazy, cesty, souborové operace a ochrany zůstávají stejné. Ostatní panely a hlavní nabídka nejsou součástí překladu.

- `npm test`: 11 prošlo, 0 selhalo. `npm run check` a `npm run build`: prošly. Po doplnění místní nabídky kořene zopakováno `npm run check`; finální Tauri build znovu sestavuje frontend. Dosavadní varování statických/dynamických importů přetrvávají.
- Pouze textová změna: nové testy nepřidávány, Rust testy neopakovány. Živé GUI ověření překladu nebylo provedeno. Kontrola diffu ověřila zachování obsluh a identifikátorů; `git diff --check` bez chyb.
- První `npm run tauri build -- --debug --no-bundle` prošlo (19,21 s); finální build zahrnující i nabídku prázdné části panelu také prošel (15,07 s, frontend 973 ms). Vytvořeno DEBUG EXE, bez instalátoru. Logy v ignorovaném output/verification/files-czech-*.log.

## Dokončení EXE s popisky šablony – 2026-11-06

`npm run tauri build -- --debug --no-bundle` nakonec prošlo: vytvořeno src-tauri/target/debug/tul-writer.exe, Rust build 14,32 s, frontend 983 ms. Bez instalátoru a bez živého GUI ověření nových popisků. Zdroj aplikace se v tomto kroku neměnil; předchozí testy zůstávají níže.

Dva předchozí pokusy (v omezeném prostředí a mimo něj) skončily Windows chybou 5 při přepsání EXE. Omezený výpis procesů běžící aplikaci neukázal; kontrola mimo omezené prostředí nalezla TUL Writer z přesné projektové cesty. CloseMainWindow běžně uzavřel okno, následná kontrola potvrdila ukončení procesu a nový build prošel. Nebylo použito násilné ukončení. Logy: tree-labels-native-final.log, tree-labels-native-elevated.log a úspěšný tree-labels-native-completed.log v ignorovaném output/verification.

## Srozumitelné názvy podkladů ve stromu – 2026-11-05

Pouze zobrazovací změna v sidebar.ts: podklady → Vzhled šablony, podklady/pisma (také písma nebo fonts) → Vzhled šablony / Písma. Nápověda vysvětluje účel a obsahuje skutečnou cestu. Dataset, kliknutí, přesuny, přejmenování i diskové cesty používají původní hodnotu. Ostatní složky zachovávají dosavadní popisek.

`npm test`: 11 prošlo, 0 selhalo. `npm run check` a `npm run build`: prošly, dosavadní varování importů/chunků. `git diff --check`: bez chyb. Rust testy nebyly opakovány, backend se neměnil; nové testy pro prosté popisky nebyly přidávány. Živé GUI ověření této změny nebylo provedeno. Logy v output/verification/tree-labels-*.log.

`npm run tauri build -- --debug --no-bundle`: frontend prošel, nativní sestavení selhalo při odstranění existujícího target/debug/tul-writer.exe s Windows chybou Přístup byl odepřen (os error 5); dosavadní aplikace zůstala otevřená. Nové EXE proto není dokončeno a změna zatím není vidět v běžící aplikaci.

## Skupinoví autoři semestrální práce – 2026-11-05

Na upřesnění uživatele rozšířen dosud nepublikovaný průvodce (1197c6f) o uspořádaný seznam 1–20 autorů. Každý neprázdný řádek tvoří jedno jméno, shodná jména se neslučují. Backend validuje každé jméno do 200 znaků a escapuje jej před spojením řízenými TeX zalomeními. V nové kopii stylu se pro skupinu změní jediný očekávaný popisek na Autoři práce; pro jednotlivce se styl nemění. Původní archivy zůstávají nedotčené.

- Stejné Windows/Node/Rust/MiKTeX prostředí jako níže; bez instalace dalších závislostí či TeX balíčků.
- `npm test`: 11 prošlo, 0 selhalo. `npm run check` a `npm run build`: prošly; dosavadní varování o importech/chuncích přetrvávají.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 36 prošlo, 0 selhalo, 7 ignorováno, 3 odfiltrováno. Ignorované TeX integrace nejsou v tomto běhu vykazovány jako ověřené; upstream instalace a tři volitelné notebook/example integrace zůstaly vynechány.
- `cargo test --manifest-path src-tauri/Cargo.toml wizard_pdf -- --ignored --test-threads=1`: 2 prošly, 0 selhalo, 13,60 s. Skutečný překlad pro jednoho autora se speciálními znaky a pro šest autorů; skupina bez Overfull vbox.
- `npm run tauri build -- --debug --no-bundle`: prošlo, vytvořeno DEBUG EXE. Bez nového instalátoru.
- GUI: zadáno šest fiktivních českých jmen po řádcích. Zpět a Pokračovat zachovaly celý seznam i předmět. Vytvořen projekt `C:\Users\akabr\Documents\TUL Writer\Ukázka skupinové semestrální práce`; zdroj na disku obsahuje šest jmen v původním pořadí oddělených TeX zalomením. Ctrl+Enter zobrazilo v PDF.js titulní stranu s popiskem Autoři práce a všemi šesti jmény pod sebou. Page 1 of 2, Compiled with pdflatex, 0 chyb a 0 varování. Aplikace zůstala otevřená nad touto ukázkou. Rozvržení extrémních seznamů s 20 dlouhými jmény není vizuálně ověřené.
- Nové testy pokrývají rozdělení CR/LF/CRLF, prázdné řádky, pořadí a duplicity, escapování jednotlivých jmen, jednotné/množné číslo popisku a odmítnutí chybějících, prázdných, víceřádkových či nadměrných položek. `git diff --check`: bez chyb.
- Dílčí pomocné pokusy: launch_app nejprve dostal nesprávný parametr path, opraveno na app; obecný python alias nebyl dostupný, použit konkrétní Python313. Pomocná aktualizace dokumentace skončila na přesné kontrole nenalezené věty v DECISIONS po uložení předchozích souborů; zbývající dokumentace upravena přímo a výsledný diff zkontrolován.

Logy v ignorovaném output/verification: authors-frontend.log, authors-regression.log, authors-pdf.log a authors-native-build.log. Starší výsledky níže popisují předchozí podobu průvodce.

## Průvodce semestrální prací – 2026-11-05

Rozsah: dvoukrokové založení nové semestrální práce s volbou TUL/FS/FT/FP/EF/FUA/FM/FZS/CXI, názvu, autora, předmětu, roku, data a verze zadání. Osobní údaje se zapisují pouze do nové kopie semestralni-prace.tex. Změny stávajících dokumentů a průvodci ostatními typy nejsou součástí úkolu. Před úkolem byla pracovní kopie čistá na commitu 3ed3d49.

- Prostředí: Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 MSVC a MiKTeX s balíčky opravenými v předchozím úkolu. Nebyly instalovány nové závislosti ani měněny TeX balíčky.
- `npm test`: 10 prošlo, 0 selhalo. `npm run check`: prošlo. `npm run build`: prošlo s dosavadními varováními o velikosti chunků a statických/dynamických importech.
- `cargo test --manifest-path src-tauri/Cargo.toml semester -- --test-threads=1`: první cílený běh ověřil 3 nové testy rendereru, bez selhání; PDF testy byly v tomto běhu ignorované.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 34 prošlo, 0 selhalo, 6 ignorováno, 3 odfiltrováno. Ignorované zahrnují pět explicitních TeX/šablonových integrací a upstream instalaci Tectonicu; odfiltrované jsou tři volitelné notebook/example integrace. Podmíněné návraty některých převzatých testů nadále nejsou důkazem úplného pokrytí volitelných nástrojů.
- `cargo test --manifest-path src-tauri/Cargo.toml semester_wizard_pdf -- --ignored --test-threads=1`: 1 prošel, 0 selhalo, 5,72 s. Skutečně založil projekt s údaji pro FM a názvem obsahujícím &, %, _, #, $, ~, ^, zpětné lomítko a závorky; pdfLaTeX/BibTeX vytvořily PDF s ověřenou hlavičkou.
- Nové testy ověřují všechny součásti, přestupný rok a neplatná data, prázdné či víceřádkové údaje, TeX escaping, zachování těla dokumentu, komentářů, BOM/CRLF, odmítnutí změněné struktury a ochranu před tím, aby uživatelský text ovlivnil další nahrazované deklarace. Test zakládání ověřuje, že neplatná metadata nevytvoří ani rodičovskou složku, že metadata pro jinou šablonu jsou odmítnuta a že existující projekt s uživatelskými úpravami nelze přepsat.
- `npm run tauri build -- --debug --no-bundle`: prošlo; vytvořeno nové DEBUG EXE. Při souběhu Cargo kontrol se čekalo na standardní build lock, nešlo o selhání. Instalátor se nevytvářel.
- GUI: první krok zobrazil název složky, šablonu a Pokračovat. Druhý krok nabídl fakultu, předvyplněný název podle složky, autora, předmět a rok; rozbalení Datum a verze zadání ukázalo 2026-11-05 a verzi 1. Vytvořit dokument bez autora neprovedlo založení; Test-Path cílového projektu vrátil False.
- GUI: vyplněn název „Měření & modelování 50 %“, autor „Zkušební autor“, předmět „Modelování & simulace“ a vybrána FM. Zpět a opětovné Pokračovat zachovaly všechna pole včetně ručně upraveného názvu a fakulty. Systémové rozbalovací menu WebView2 bylo kvůli omezení ovládacího nástroje vybráno klávesnicí; výsledná hodnota byla ověřena před pokračováním.
- GUI: vytvořen projekt `C:\Users\akabr\Documents\TUL Writer\Ukázka průvodce semestrální prací`. Get-Content ověřil správné deklarace FM, názvu a předmětu s escaped ampersandem/procentem, autora, roku, českého data a verze. Aplikace automaticky otevřela hlavní soubor.
- Ctrl+Enter vytvořilo skutečné dvoustránkové PDF; GUI ukázalo Compiled with pdflatex, 0 chyb a 0 varování. Vizuálně i textovou vrstvou ověřeno fakultní logo a oranžový akcent FM, název se skutečnými znaky & a %, autora, předmět, datum a verzi. Aplikace zůstala otevřená nad touto ukázkou.
- `git diff --check`: bez chyb whitespace. Logy: ignorované output/verification/semester-frontend.log, semester-rust.log, semester-regression.log, semester-pdf.log a semester-native-build.log. Původní ZIP archivy se při tomto úkolu neměnily.

Ověřený rozsah je semestrální šablona 1.3 a nové pracovní kopie. Nejde o obecný parser LaTeX metadat ani o automatickou úpravu existujících prací. Ostatní čtyři předvolby používají dosavadní zakládání bez tohoto formuláře; čtyři starší plné PDF testy šablon se neopakovaly, jejich zdroje a překladače se neměnily.

## Podepsané aktualizace instalované aplikace – 2026-11-06

Scénář: z privátního origin/main sestavit aktualizaci nainstalovaného TUL Writeru, nabídnout ji bez automatické instalace, ověřit soubor a podepsanou verzi a zastavit instalaci při konfliktu ukládání. Vývojové projekty uživatelů se automaticky nestahují. Rizika: únik přihlášení, podvržený balíček, downgrade, neuložené dokumenty a zastaralé souběžné CI vydání.

**Výsledek:** soukromé vydání [0.2.5](https://github.com/akabrt00/Word-LateX-atd./releases/tag/v0.2.5) vzniklo plně automaticky; Windows workflow 42240026035 skončilo success. Aplikace skutečně stáhla jeho MSI, ověřila podpis a odmítla pozměněný obsah i jinou verzi. Finálně 20 lokálních frontendových testů a 36 aktivních Rust testů prošlo; dalších 5 Rust testů bylo ignorováno. Instalace/restart a čistá VM neověřeny, Computer Use zastavil uživatel. Poslední pomocná oprava cesty pro CI cache je ověřena místním Windows/GNU tar experimentem; na dokončení dalšího celého cloudového běhu se tento závěr nevztahuje.

Prostředí: Windows x64, PowerShell, Node.js 24, Rust MSVC stable, WebView2, lokální MiKTeX a Python z .tools/test-python. Před změnami čisté main na 0f53916; `git fetch --no-tags origin` a `git merge --ff-only --quiet origin/main` bezpečně převzaly tři commity druhého PC až na 3ed3d49. Uživatelské změny nebyly přepsány. Soukromý repozitář a oprávnění GitHub CLI byly ověřeny bez vypsání tokenu.

### Místní kontroly před distribucí

- `npm test`: 18 prošlo, 0 selhalo. Pět nových testů kontroluje oddělení check/install, pořadí a shodnou verzi, odmítnutí chybného podpisu, konflikt uložení a souběžné požadavky. Tři nové testy kontrolují CI verze, oba lockfiles a manifest pro NSIS/MSI. První pokus v sandboxu skončil spawn EPERM před provedením testů; opakování mimo sandbox prošlo.
- `npm run check` a `npm run build`: prošly. Zachována dosavadní neblokující Vite varování o velikosti chunků a neúčinných dynamických importech. Logy jsou v ignorovaném output/updater-validation/.
- S PATH rozšířeným o `.tools/test-python/Scripts`: `cargo test --manifest-path src-tauri/Cargo.toml -- --test-threads=1`: 36 prošlo, 0 selhalo, 5 ignorováno. Čtyři ignorované jsou explicitní integrační překlady TUL šablon a pátý upstream instalace Tectonicu. Nejsou vykazovány jako provedené; jejich předchozí evidence je v sekci šablon. Převzaté testy mohou při absenci volitelného nástroje předčasně skončit; samotný počet není úplné pokrytí všech integrací.
- Tři nové Rust testy kontrolují příslušnost balíčků ke stejnému vydání, odmítnutí cizích URL, neplatné verze, prázdného podpisu a nadlimitní velikosti, citlivou Authorization hlavičku a serializaci operací.
- `npm run tauri build -- --debug --bundles nsis,msi` s lokálním klíčem a DPAPI heslem předanými pouze přes prostředí: vytvořeno DEBUG EXE, NSIS 25,54 MiB a MSI 31,43 MiB, oba instalační soubory mají .sig. Výstupy v src-tauri/target/debug/bundle a desktop-build.log. Jde o aktualizační podpis, nikoli Authenticode certifikát.
- První `tul-writer.exe --check-updates` odhalil panic reqwest/rustls-no-provider při chybějícím kryptografickém provideru. Opraveno explicitní inicializací ring před vytvořením HTTP klienta, přidána kontrola konstrukce klienta do Rust testu a zahájeno nové sestavení. Původní chybný běh není vydáván za úspěch.
- Po samostatném výslovném souhlasu uživatele `py scripts/setup-updater-signing.py --upload` úspěšně uložil klíč a heslo do GitHub Actions secrets; obsahy se nevypisovaly. První pokus automatická kontrola oprávnění zablokovala před provedením a byl zopakován až po schválení.

- Po opravě `cargo test --manifest-path src-tauri/Cargo.toml updates::`: 3 prošly. Nové DEBUG EXE z `npm run tauri build -- --debug --no-bundle` skutečně dokončilo `--check-updates` s exit 0 a JSON `available:false, version:null, installerStarted:false`: autentizované spojení funguje, dosud není vydání. WebView2 při zavření skrytého diagnostického okna vypsalo neblokující hlášku unregister class (1412). Stažení ani podpis tímto během ještě ověřené nejsou.

### Hranice a distribuční ověření

Úspěch místních testů není sám o sobě tvrzením o dokončeném CI ani o stažené aktualizaci; konkrétní živá evidence následuje níže. Skutečná instalace, upgrade/restart a odinstalace na čisté VM zatím nebyly provedeny. Dosavadní desktopový test otevření/editace/uložení/kompilace/PDF je zaznamenán níže; pro updater se tento průchod neopakoval v úplnosti. Živé AI API ani vizuální Word Mode nejsou předmětem tohoto kroku.

- Commit f5626c8 byl úspěšně nahrán na main a SHA přesně odpovídalo git ls-remote. První Windows Actions běh 42234822860 selhal již v checkoutu: název repozitáře končí tečkou a cesta D:/a/Word-LateX-atd./Word-LateX-atd. nebyla na Windows dostupná. Testy ani build se v tomto běhu nespustily. Workflow proto stahuje archiv přesného GITHUB_SHA pomocí autentizovaného gh API do runner.temp/tul-writer-source, používá tuto bezpečnou cestu pro run kroky, cache i artefakty. Repozitář se nepřejmenovává a credential se neukládá do zdrojů.
- Následující běh 42235262371 odmítla validace workflow před vytvořením jobu: runner context není povolen v jobs.defaults.run. Cesta byla přesunuta do jednotlivých steps.working-directory, kde jej GitHub podporuje. Neproběhl žádný build tohoto pokusu.
- Běh 42235426076 úspěšně stáhl a rozbalil zdroje, ale setup-node odmítl cache pro cestu mimo GITHUB_WORKSPACE. Vypnuta npm/Rust cache pro tento nestandardní Windows workspace a přidána přímá kontrola přítomnosti package-lock.json po rozbalení. Následující běh ověří čisté sestavení bez cache.
- Běh 42235624572 (commit 46779f9) následně prošel získáním zdrojů, npm ci, 18 frontendovými testy, TypeScriptem a cílenými Rust sadami updates/documents/workspace. Dne 2026-11-06 v 14:45:50 UTC přešel na sestavení podepsaných RELEASE instalátorů. Souběžný Linux Check 42235624564 dokončen úspěšně; první úspěch Check neznamenal úspěch předchozích chybných Windows pokusů.
- Finální lokální podepsané DEBUG sestavení po opravě TLS a odebrání přímého updater capability z frontendu znovu prošlo. EXE/MSI, oba .sig a SHA256SUMS.json jsou v ignorovaném output/TUL-Writer-0.2.0-bootstrap/. Log desktop-final-build.log. Původní předopravové instalátory nejsou doporučovaným bootstrapem.
- Skutečné GUI verze 0.2.0 bylo spuštěno, úvodní obrazovka i samostatná kopie output/updater-validation/gui-project se načetly; accessibility potvrdila CodeMirror s main.tex a stromem souborů. Automatizace nepracovala spolehlivě s nativním dialogem a později vrátila failed to activate captured window. Ověřeno pouze spuštění a načtení, nikoli nová úplná editace/uložení/kompilace/PDF či kliknutí na aktualizaci. Vlastní testovací proces byl ukončen před finálním buildem; uživatelské dokumenty se neměnily.
- Běh 42235624572 skutečně dokončil podepsané RELEASE NSIS/MSI (0.2.4) v 14:59:58 UTC. Následná publikace selhala na REST `/releases/tags/v0.2.4`: draft není tímto endpointem dostupný, přestože existuje a obsahuje čtyři soubory. Publisher byl opraven na dohledání draftu přes seznam vydání a čtení přes jeho ID s kontrolou původního SHA. Přidána i regresní kontrola normalizace mezer na tečky v názvech GitHub assetů; `npm test` nyní 19 prošlo a `npm run check` prošlo.
- Dokončení prvního vydání bylo provedeno lokálně opraveným `publish()` se stejným SHA 46779f9 a čtyřmi původními podepsanými CI balíčky staženými ze soukromého draftu do ignorovaného stagingu. Žádný instalátor nebyl znovu sestaven ani změněn. Publisher úspěšně nahrál manifest a dokončil privátní v0.2.4. `gh release view` ověřilo isDraft:false a pět souborů: EXE, MSI, obě .sig a latest.json. To je evidence opraveného publisheru; první CI běh jako celek zůstává failed, protože jeho původní publish krok selhal.
- Pro další Windows běhy přidána explicitní actions/cache se SHA-256 Cargo.lock vypočteným v bezpečné cestě a verzí rustc; nepoužívá workspace-limited hashFiles. Nahrávání diagnostických artefaktů má if:always(), aby se úspěšně sestavené balíčky zachovaly i při následné chybě publikace. Tuto úpravu prověří další běh po push.
- Finální lokální DEBUG EXE 0.2.0 s `--verify-update-download` reálně stáhlo privátní MSI aktualizaci 0.2.4 přes GitHub API. Exit 0; JSON: `available:true, version:0.2.4, signatureVerified:true, tamperRejected:true, versionMismatchRejected:true, installerStarted:false`. Ověřovač Tauri odmítl změnu prvního bajtu i oznámenou verzi 99.99.99 téhož souboru. Log verify-update-download.log. Ověřeno skutečné přihlášení, manifest, download, podpis i vazba na verzi; nikoli instalace/restart.
- Commit 8a64432 s opravou publisheru a cache byl nahrán, lokální a origin/main SHA souhlasila. Nový automatický běh: [Windows signed updates 42240026035](https://github.com/akabrt00/Word-LateX-atd./actions/runs/42240026035). Pokus o vizuální ověření nabídky aktualizace zastavil uživatel fyzickým Escape; další Computer Use nebylo prováděno. Nejde o potvrzení kliknutí na instalaci či restartu. `gh repo view` nadále potvrdilo visibility PRIVATE.
- Běh 42240026035 bez ručního zásahu dokončil testy, podepsané produkční sestavení i publikaci privátního vydání 0.2.5. Nahrávání artefaktů a první uložení cache pokračují samostatně; publikace je ověřena jako úspěšný krok, ne jako již dokončený celý job. Krátké přerušení gh run watch bylo výpadkem spojení s API; následné gh run view potvrdilo pokračující běh.
- Při přípravě opakovaného běhu doplněn filtr instalačních souborů podle přesné aktuální verze, aby cache obsahující staré bundle soubory nezpůsobila nesprávné vydání. Nový regresní test vylučuje starší verzi, shodný číselný prefix a dočasné soubory. `npm test`: finálně 20 prošlo, 0 selhalo; lokální log npm-test-final.log. Navazující běh ověří také skutečnou obnovu cache.
- Celý Windows běh 42240026035 skončil success včetně publikace a uploadu artefaktů. Uložení cache ale vypsalo neblokující warning: GNU tar používá původní GITHUB_WORKSPACE jako základ a tento literal trailing-dot adresář neexistoval. Cache tudíž nebyla uložena; zrychlení dalších běhů se zatím netvrdí.
- Oprava přípravy pracovního prostoru používá `[System.IO.Directory]::CreateDirectory('\\?\' + $env:GITHUB_WORKSPACE)` vedle bezpečné zdrojové složky v runner.temp. Windows NT prefix zachová tečky v názvu. Místní experiment skutečně vytvořil takový adresář PowerShellem a GNU tar přes něj úspěšně zabalil vnější cache payload podle manifestu. První sandboxový pokus selhal na signal pipe Win32 error 5; samostatný pokus s manifestem CRLF/backslash selhal na jeho formátu. Po použití LF a lomítek, jako v manifestu cache nástroje, probe prošel s exit 0. Testovací soubory jsou pouze v ignorovaném output/updater-validation/cache-path-probe.
- `tul-writer.exe --verify-update-download` následně ověřilo i **automaticky vydané 0.2.5**: exit 0, signatureVerified/tamperRejected/versionMismatchRejected true, installerStarted false. Log verify-auto-update-download.log; neblokující WebView2 hláška při zavření zůstala stejná. Průběžný běh 42244175367 pro commit 25991ca byl nahrazen finálním commitem s přípravou NT cesty a zrušen, aby neblokoval nejnovější zdroj. Finální cloudový běh opravy cache bude spuštěn běžným push; jeho dokončení se zde nepředstírá.

## Pracovní prostor a TUL předvolby – 2026-11-05

Scénář: nastavit jednu složku pro všechny nové dokumenty, zvolit výchozí šablonu, založit novou samostatnou pracovní kopii a přeložit ji. Existující adresář ani projekt se nesmí přepsat. Přidány čtyři nezměněné univerzitní balíčky z uživatelova portálu a prázdný dokument; fakultní průvodce není součástí tohoto kroku.

### Zdroje a prostředí

- Katalog a čtyři detailní stránky na `https://latex-tul.adamkabrt.chatgpt.site/templates` byly načteny přes Invoke-WebRequest. Webový čtecí nástroj URL nezpřístupnil, HTTP požadavky z hosta vrátily 200. ZIP soubory `/downloads/faculties/{semester,thesis,presentation,poster}-tul.zip` jsou beze změn v resources/templates; SHA-256 všech čtyř souhlasí s provenance.json. Původní podklady, skripty a licence byly zachovány, žádný projektový skript nebyl spuštěn.
- Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 MSVC, MiKTeX 24.1 s postupně aktualizovanými balíčky, WebView2. Příkazy Cargo/TeX běžely mimo sandbox s PATH doplněným o .cargo/bin a MiKTeX bin.
- První Rust sestavení odhalilo dva typové problémy: ZIP 9 vrací název jako Result a argument Biberu měl nesourodé reference String/Cow. Opraveno před dalšími kontrolami.

### Automatické kontroly

- `npm test`: 10 prošlo, 0 selhalo. Nový test diagnostiky ověřuje odstranění již vyřešených varování z dřívějších TeX průchodů i zachování skutečných problémů posledního průchodu.
- `npm run check`: prošlo. `npm run build` i finální `npm run tauri build -- --debug --no-bundle`: prošly s dosavadními varováními o velikosti chunků a kombinaci statických/dynamických importů. Vytvořeno DEBUG EXE, nikoli nový instalátor nebo veřejný release.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 30 prošlo, 0 selhalo, 5 ignorováno, 3 odfiltrováno. Čtyři ignorované jsou nové explicitní TeX integrační testy, pátý je upstream instalace Tectonicu. Tři odfiltrované volitelné notebook/example integrace nejsou tímto úkolem ověřeny; interní předčasné návraty některých převzatých testů nejsou důkazem pokrytí jejich volitelných nástrojů.
- Tři nové běžné Rust testy ověřují odmítnutí neplatných názvů a cest, nepřepsání existující práce, úplnost všech rozbalených předvoleb, nezávislost dvou kopií a odmítnutí libovolného programu či cesty mimo projekt v konfiguraci překladače.
- Přímé integrační testy se spouštějí přes `cargo test --manifest-path src-tauri/Cargo.toml workspace::tests::template_pdf -- --ignored --test-threads=1`. Každý zakládá skutečný nový projekt, používá jeho engine/bibliografii a kontroluje PDF hlavičku. Finální společný běh: 4 prošly, 0 selhalo, 43,43 s; zaznamenán v workspace-four-templates-final.log.
- `git diff --check`: bez chyb whitespace. Archivy jsou vstupní zdroje, testovací projekty a logy zůstávají v ignorovaném output/verification.

### Oprava místního TeX prostředí během ověření

Počáteční běh: semestrální práce a poster prošly, prezentace a závěrečná práce selhaly na starém XeLaTeX formátu (LaTeX 2023) s novější Polyglossií. Samotné `miktex formats build --engine=xetex` problém nevyřešilo. `miktex packages update --package-id-file=...` nejprve odmítlo neexistující název latex-base; správné ID je ltxbase. Poté byly aktualizovány ltxbase, l3kernel a l3packages, zatímco starý samostatný l3backend z roku 2024 stále překrýval novou kopii v l3kernel. Po ověření obou fyzických cest byl starý samostatný balíček odstraněn, l3kernel znovu nainstalován (`miktex packages install l3kernel`) a obnovena databáze (`miktex fndb refresh`). `miktex packages verify l3kernel` následně potvrdilo integritu.

`miktex formats build` obnovilo potřebné formáty, ale celý příkaz skončil chybou Windows API 2 u volitelných hilatex/hilatex-dev kvůli chybějícímu HiTeXu. To není vykazováno jako úspěšná obnova všech formátů. pdfLaTeX, XeLaTeX a LuaLaTeX byly ověřeny skutečnými překlady. Dílčí aktualizační příkazy také odmítly ID biber (správně biber-windows-x64) a nenainstalovaný caption; tyto pokusy se nevykazují jako úspěšné aktualizace.

Kvůli dalším nesouladům starých balíčků s novým jádrem byly následně úspěšně aktualizovány biblatex, fontspec, babel, hyperref, pgf, graphics, latex-tools, amsmath, fancyhdr, biber-windows-x64 a etoolbox. Počet opakování PDF testů souvisel s konkrétními chybami této smíšené instalace, nikoli se změnami zdrojů šablon. Konečná závěrečná práce úspěšně prošla XeLaTeXem a Biberem; původní ZIP nebyl upravován.

### Desktopové ověření

- Na úvodní obrazovce se zobrazila výchozí systémová složka `C:\Users\akabr\Documents\TUL Writer`. Nový český formulář obsahuje název, změnu složky, pět předvoleb, vysvětlení šablony a cílovou cestu. Při prvním vizuálním ověření bylo opraveno centrování dialogu a výška input/select polí; konečná podoba byla vizuálně zkontrolovaná.
- Přes formulář skutečně vytvořen dokument `Ukázková semestrální práce` v této složce a automaticky otevřen semestralni-prace.tex. Na disku ověřen zdroj i .tulwriter/project.json s pdflatex/bibtex. Knihovna podkladů a původní readme zůstaly přítomné.
- Nastavení bylo otevřeno také z ozubeného kolečka v editoru. Systémovým výběrem složky změněn pracovní prostor na ignorovaný testovací adresář output/verification/workspace-documents a výchozí šablona na prázdný dokument. Po úplném restartu se zobrazila uložená cesta a formulář nabídl prázdnou šablonu. Po ověření vráceno pouze toto testované nastavení na Dokumenty / TUL Writer a tul-semester; ostatní uživatelská nastavení se neměnila.
- GUI kompilace ukázkové práce zobrazila skutečné dvoustránkové PDF v PDF.js. První verze diagnostiky ukazovala i přechodná varování o citacích z prvního průchodu; opraveno výběrem posledního průchodu při zachování celého surového logu. Finální nové EXE nad ukázkovou prací zobrazilo Compiled with pdflatex, 0 chyb, 0 varování a Page 1 of 2. PDF má 203 712 bajtů. Aplikace zůstala otevřená nad ukázkou; výchozí nastavení na disku bylo ověřeno jako Dokumenty / TUL Writer a tul-semester.
- Fakultní výběr, vyplnění osobních metadat, automatické aktualizace šablon, instalátor na čistém PC, Word Mode a AI nebyly tímto úkolem implementovány ani ověřeny.

Logy: workspace-frontend.log, workspace-rust.log, workspace-regression-final.log, workspace-four-templates-final.log, workspace-final-native.log; jednotlivé neúspěšné pokusy a aktualizace mají v output/verification samostatné workspace-* logy. Starší oddíly níže zachovávají výsledky předchozích úkolů a prostředí.

## Ochrana otevřených dokumentů před přepsáním – 2026-11-05

Scénář: soubor otevřený v editoru změní nebo odstraní jiný program a uživatel zkusí uložit, zavřít kartu/panel nebo kompilovat. Backend porovná SHA-256 načtených bajtů a odmítne zastaralý zápis. Rozsah: hlavní editor, boční editor a serializace notebooků; legacy integrační write_file volání a filesystem watcher zůstávají další etapou. Optimistická kontrola má omezení závodu s cizími procesy podle ADR-007.

Prostředí: Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 MSVC, Visual Studio Build Tools 2022, MiKTeX pdflatex a WebView2. Rust příkazy běžely mimo sandbox s PATH doplněným o uživatelské .cargo/bin a MiKTeX bin.

- `npm test`: 9 prošlo, 0 selhalo. Dva nové testy ověřují řazení překrývajících se uložení, použití navazující revize a zachování původní revize po opakovaném konfliktu.
- `npm run check`: prošlo. `npm run build`: prošlo s dosavadními varováními o velikosti chunků a neúčinných dynamických importech.
- První `cargo test --manifest-path src-tauri/Cargo.toml documents::tests -- --test-threads=1`: oba tehdejší nové testy prošly. Poté doplněn test souběžných editorů a spuštěna regresní sada níže.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 27 prošlo, 0 selhalo, 1 upstream ignorovaný, 3 odfiltrováno. Tři vynechané testy patří k volitelnému Python/notebook/example toku, který nebyl součástí tohoto úkolu. Některé převzaté testy se při chybějícím volitelném nástroji vracejí předčasně; počet úspěchů neprokazuje plné pokrytí těchto integrací.
- Nové Rust testy skutečně mění/smažou soubor na disku, ověřují nezměněný externí obsah při konfliktu, kontrolují BOM/CRLF snapshot, pomocné read_file čtení, nové revize, původní historii, zachování existujícího sourozence main.scribe-tmp a přesně jeden úspěšný zápis dvou souběžných editorů téže revize. Původní nativní open/edit/save/compile/PDF a history testy také prošly.
- `npm run tauri build -- --debug --no-bundle`: prošlo. Vytvořeno nové DEBUG EXE; instalátor ani release build se pro tento úkol nevytvářely.
- GUI test na oddělené kopii v `output/verification/conflict-project`: hlavní editor obsahoval LOCAL UNSAVED VERSION, zatímco externí zápis změnil main.tex na EXTERNAL VERSION MUST SURVIVE. Ctrl+S ukázalo český konfliktový dialog. Po volbě Ponechat moje úpravy zůstal lokální text i neuložený stav v editoru a externí obsah na disku byl ověřen příkazem Get-Content.
- Ctrl+W znovu vyvolalo konflikt. Po výslovné volbě Načíst z disku se načetl externí obsah a karta zůstala otevřená. Následná nová editace a Ctrl+S uložily novou revizi bez konfliktu; Ctrl+Enter zobrazilo Compiled with pdflatex, 0 chyb, 0 varování a skutečné Page 1 of 1 PDF s novým textem „Conflict resolved. Normal save and PDF compilation work.“
- GUI test bočního panelu: lokální text LOCAL SIDE UNSAVED VERSION a externí změna notes.txt. Zavření panelu ukázalo konflikt; Ponechat moje úpravy ponechalo panel otevřený i s lokálním textem. Disk stále obsahoval EXTERNAL SIDE VERSION MUST SURVIVE. Po explicitním načtení z disku a dalším zavření se panel zavřel normálně.
- Živá notebooková editace a změna během IPC nebyly zvlášť simulovány v GUI; řazení IPC ověřují frontendové testy, revizní zápis sdílí stejný backend.
- Logy v ignorovaném `output/verification/conflict-frontend-build.log`, `conflict-rust.log`, `conflict-rust-regression.log` a `conflict-native-build.log`. `git diff --check`: bez chyb whitespace. Testovací projekty a buildy nejsou určeny ke commitu.

Záměrně se nedoplňuje vynucené přepsání konfliktního souboru. Uživatel může svůj text zkopírovat a načíst aktuální soubor. Nejde o úplnou obnovu neuložené práce po zavření celého OS okna/pádu ani o procesovou izolaci kompilátoru.

## Zprovoznění na druhém PC – 2026-11-05

Čistý klon origin/main v `C:\Users\akabr\Documents\ChatGPT\TULWright\Word-LateX-atd`. Zdrojový kód aplikace se při zprovoznění neměnil.

- Prostředí: Windows x64, Node.js 24.15.0, npm 11.12.1, MiKTeX-pdfTeX 4.18 (MiKTeX 24.1), WebView2 156.0.4314.58. Python není nainstalovaný.
- `gh repo clone` nebylo dostupné (chybí GitHub CLI). `git clone https://github.com/akabrt00/Word-LateX-atd..git Word-LateX-atd` prošlo mimo sandbox; explicitní cílová složka obchází nepovolenou koncovou tečku názvu ve Windows. První síťový pokus v sandboxu selhal na `getaddrinfo() thread failed to start`.
- Přes winget instalovány `Microsoft.VisualStudio.2022.BuildTools` 17.14.44 s `--override '--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended'` a `Rustlang.Rustup` 1.29.3. Ověřeno Rust/Cargo 1.99.1 (MSVC), C++ workload a úspěšná instalace Windows SDK 10.0.26100.
- První `npm ci` v sandboxu nepostupovalo a bylo přerušeno. Opakované `npm ci` mimo sandbox uspělo: 97 balíčků, audit bez známých zranitelností v tomto běhu.
- `npm test`: 7 prošlo, 0 selhalo. `npm run check`: prošlo. `npm run build`: prošlo s dosavadními varováními o velikosti chunků a neúčinných dynamických importech.
- S PATH doplněným o `C:\Users\akabr\.cargo\bin`: `npm run tauri build -- --debug --no-bundle` prošlo, nativní kompilace trvala 3 minuty. EXE: `src-tauri/target/debug/tul-writer.exe`. Instalátor nebyl vytvářen.
- `cargo test --manifest-path src-tauri/Cargo.toml tul_writer_open_edit_save_compile_pdf -- --test-threads=1`: 1 prošel, 27 odfiltrováno. Skutečně ověřeno čtení, změna, uložení, kompilace PDF v cestě s diakritikou a odmítnutí starého PDF po chybě. Celá Rust sada ani volitelné notebookové integrace se při tomto úkolu nespouštěly.
- Desktopové ověření: EXE spuštěno s `--project` nad kopií `examples/first-project` v ignorované složce `output/verification/desktop-project`. Přes GUI změněn text na „TUL Writer works on this computer. Edited and saved in the desktop app.“, uložen Ctrl+S a ověřen na disku. Ctrl+Enter spustilo kompilaci; GUI ukázalo `Compiled with pdflatex`, 0 chyb, 0 varování, Page 1 of 1 a nový text i sekci Results v PDF.js. PDF má 68 198 bajtů.
- Lokální logy: `output/verification/native-build.log` a `output/verification/native-test.log`. Generované soubory zůstávají ignorované Gitem.

Ověřený rozsah je základní desktopový editor a LaTeX/PDF tok na tomto PC. Nejde o nové ověření všech převzatých funkcí, instalátoru, AI nebo Word Mode. Následující oddíly zachovávají výsledky z původního vývojového počítače.

## Výsledek

Všech šest akceptačních bodů prvního milníku bylo ověřeno na Windows: spuštění nativního EXE, otevření LaTeX projektu, editace, uložení, lokální kompilace a zobrazení skutečného PDF uvnitř aplikace. Nejde pouze o webový náhled ani mock backendu.

## Prostředí

Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 (MSVC), Microsoft Build Tools 2022 17.14 / MSVC 14.44, Windows SDK 10.0.26100.0, MiKTeX 25.12. Rust a C++ workload byly v průběhu práce instalovány. Python 3.13; pro převzaté notebookové testy oddělené .tools/test-python s requirements-test.txt. Bez Perlu a bez instalovaného Tectonicu.

## Automatické kontroly

| Příkaz / kontrola | Skutečný výsledek |
|---|---|
| Původní Scribe npm ci + npm run build | Prošlo před vlastními úpravami |
| npm test | 7 prošlo, 0 selhalo |
| npm run check | Prošlo |
| npm run build | Prošlo, Vite 8.3.6 |
| cargo test --manifest-path src-tauri/Cargo.toml -- --test-threads=1 | 27 prošlo, 0 selhalo, 1 ignorovaný |
| npm audit --json | 0 známých zranitelností v tomto běhu |
| EXE --check-tools | tex=pdflatex; Python313/python.exe nalezen přes py launcher |
| npm run tauri build -- --debug --bundles nsis,msi | Vytvořeno EXE i MSI |
| npm run tauri bundle -- --debug --bundles nsis,msi | Finální balíčky v odděleném stagingu včetně licencí |
| git diff --check pro vlastní zdroje | Bez chyb whitespace |

Rust sada byla spuštěna s PATH rozšířeným o .tools/test-python/Scripts a .cargo/bin. Ignorovaný test installs_tectonic je ignorován už upstreamem. Některé převzaté testy mají podmíněný návrat bez kontroly při chybějícím nástroji: zejména latexdiff/latexmk cesta se zde neověřila kvůli chybějícímu Perlu. Číslo 27 proto není tvrzením o úplném pokrytí všech volitelných integrací. Nezávislé GUI ověření SyncTeXu, Zotera, bibliografických enginů a AI nebylo provedeno.

Nový nativní integrační test tul_writer_open_edit_save_compile_pdf opravdu čte, mění, zapisuje a kompiluje dokument v cestě s českými znaky. Kontroluje PDF hlavičku i odmítnutí starého PDF jako výsledku následující neúspěšné kompilace.

Sedm TypeScript testů kontroluje no-op zachování bajtů, makra/prostředí/citace/komentáře/TikZ/verbatim kolem změny, zastaralou revizi, chybný rozsah, překryvy, Unicode, více patchů, inverse patch, odmítnutí nepodporovaného textu a CRLF/BOM. Neprokazují obecný parser TeXu.

## Skutečný desktopový průchod

1. Spuštěn src-tauri/target/debug/tul-writer.exe se zabaleným frontendem na http://tauri.localhost, bez Vite serveru.
2. Argument --project načetl oddělenou testovací kopii vícesouborového projektu v output/verification/desktop-project. Strom ukázal main.tex a sections/results.tex.
3. V CodeMirror editoru byl pomocí klávesnice a vložení textu změněn obsah na větu „Desktop UI verification passed. This text was edited and saved in TUL Writer.“
4. Ctrl+S uložil změnu. Následná kontrola fyzického main.tex potvrdila tuto větu.
5. Tlačítko Kompilovat spustilo skutečný backend a MiKTeX; stavový řádek ukázal Compiled with pdflatex, 0 chyb a 0 varování.
6. PDF.js zobrazil Page 1 of 1 a přesně novou větu i výsledky z připojeného souboru. Ověřena textová vrstva i vizuální screenshot okna.
7. Otevřeno AI centrum. Zobrazuje Chat/Editace a agentní funkce výslovně jako plán. Screenshot ověřil rozložení panelu, nikoli živé AI spojení.

Dočasné souběžné používání počítače přerušilo první pokus; test byl dokončen až poté, co uživatel potvrdil, že je počítač volný. Nebyly upravovány jeho jiné dokumenty.

Samostatně kompilovaný příklad examples/first-project vytvořil skutečné A4 PDF o jedné stránce (69 207 B); PNG výstup byl vizuálně zkontrolován. Oficiální manuál TUL byl stažen a jeho stránky barev a typografie byly vyrenderovány a vizuálně prohlédnuty. Světlý motiv nebyl samostatně ručně ověřen v okně; definice a produkční sestavení jsou ověřeny, úplná kontrola kontrastů a přístupnosti zbývá.

## Nalezené a opravené problémy

- Chybějící Rust, linker a Windows SDK: doplněn toolchain.
- MiKTeX latexmk bez Perlu: přímý pdflatex fallback se dvěma průchody.
- Windows Python dostupný jen přes py: doplněna detekce skutečného interpretu.
- Chybějící NumPy/Matplotlib: izolované testovací prostředí, nikoli instalace do uživatelského Pythonu.
- Počáteční TypeScript deklarace assetů: samostatný vite-env.d.ts.
- Zranitelný vývojový Vite: aktualizován na 8.3.6, následný audit bez nálezů.
- Nový import AI centra měnil pořadí cyklických závislostí a zastavil inicializaci UI. Import přesunut za existující závislosti; následný nativní průchod prošel.
- Převzatý updater Scribe, automatický notebook execution a latexmkrc byly vypnuty.
- Do finálních balíčků přidána původní licence Scribe a dostupná znění licencí závislostí. Přítomnost MIT a notices ověřena také v generovaném WiX manifestu.

## Artefakty a hranice ověření

Finální testovací balíčky: output/TUL-Writer-0.1.0-debug/.
Jsou to nepodepsané DEBUG buildy, nikoli veřejné produkční vydání. SHA256SUMS.json zaznamenává jejich kontrolní součty.

EXE i MSI byly sestaveny ve Windows, ale nebyly instalovány/odinstalovány a nebyly ověřeny na čisté VM. Aplikace vyžaduje dostupný WebView2 a pro kompilaci TeX. Automatická aktualizace je vypnutá.

Živé AI API, autonomní agent, file disclosure policy, Word Mode, obecná round-trip věrnost, izolovaný compiler worker, timeout/cancel, kompletní crash recovery, konflikty s externím editorem a oficiální TUL šablony zůstávají neimplementované nebo neověřené podle FEATURES.md. Současná verze není sandbox pro nedůvěryhodné TeX projekty.

Build hlásí velké JS chunky a neúčinné dynamické importy z převzaté modulové struktury. Nejsou to chyby sestavení; optimalizace patří do další etapy. CI workflow bylo upraveno, ale nebylo spuštěno na GitHubu. Veřejný repozitář ani release nebyly publikovány.

## Propojení s GitHubem – 2026-11-05

Rozsah změn: Git remote/tracking, .gitignore, AGENTS.md a související projektová dokumentace. Funkční zdroje aplikace ani workflow nebyly změněny.

- git status --short --branch: před úkolem čistá větev tul-writer/milestone-1 na c4d2b81.
- gh auth status mimo sandbox: účet akabrt00 přihlášený, oprávnění repo a workflow; gh repo view ověřil soukromý repozitář a viewerPermission ADMIN. Token nebyl vypsán v otevřené podobě.
- git ls-remote --symref https://github.com/akabrt00/Word-LateX-atd..git HEAD refs/heads/main: původní main na 5c44e576d5c9fd192740258e64941e4fb1abf059.
- git remote add origin a git fetch --no-tags origin: úspěšné. Upstream Scribe zachován.
- git switch main, git merge --ff-only tul-writer/milestone-1 a git merge --allow-unrelated-histories --no-commit origin/main: zachování obou historií. Jediný konflikt add/add v README.md vyřešen plnou projektovou dokumentací a doplněním hlavního GitHub repozitáře; původní GitHub README zůstává v jeho commitu.
- Kontrola 835 dosažitelných Git blobů, z toho 812 textových, nezjistila shodu s kontrolovanými vzory privátních klíčů a známých GitHub/OpenAI/Anthropic/Google/AWS/Slack přístupových údajů. Jde o kontrolu známých vzorů, nikoli důkaz nepřítomnosti libovolného citlivého údaje.
- git check-ignore --no-index nad 25 příklady: všechny očekávané citlivé/generované cesty ignorovány, zdrojové soubory, oba lockfiles a sanitizované .env příklady povoleny. Kontrola sledovaných cest: žádný node_modules, target, output ani kontrolované soubory s tajemstvími.
- npm test: 7 prošlo, 0 selhalo. První pokus v sandboxu skončil na spawn EPERM před provedením testů; opakování mimo sandbox prošlo.
- npm run check: prošlo. npm run build: prošlo s dosavadními varováními o velikosti chunků a importech. Lokální logy v ignorovaném output/github-sync/.
- Rust testy a desktopový průchod se pro tento úkol neopakovaly: kód aplikace ani její chování se neměnily; jejich poslední výsledky jsou výše.

Kritérium finálního ověření uploadu: úspěšný běžný git push origin main bez force a shoda git rev-parse HEAD s git ls-remote origin refs/heads/main; tracking větev musí být origin/main. Výsledek GitHub Actions se posuzuje odděleně od úspěchu uploadu.
