# TUL Writer

Nezávislý studentský desktopový textový procesor pro Windows. Pracovní fork Scribe IDE (MIT), nikoli oficiální software TUL. Milník 0.1: skutečný LaTeX editor a lokální PDF kompilace. Word Mode a autonomní agent jsou následující etapy.

## Spuštění ve Windows

### Běžná práce s dokumentem

Zvolte **Nový dokument**, vyplňte průvodce a upravte dokument v editoru. **Uložit** v liště, nabídce **Soubor** nebo Ctrl+S v kterémkoli editoru uloží změny hlavního i bočního editoru a potvrdí dokončení. Funguje i při náhledu obrázku/PDF v hlavním panelu, pokud píšete v bočním editoru. Tlačítko **Překompilovat** samo nejprve uloží změny v obou editorech a potom zobrazí výsledek vedle textu; není nutné před ním zvlášť ukládat.

Hotový výsledek uložíte přes **Uložit PDF…** přímo nad náhledem nebo v nabídce **Soubor**. Vyberete jen umístění kopie. Ukládá se přesná zobrazená verze PDF; změna projektu nebo další kompilace během otevřeného dialogu ji nezamění. Po dalších úpravách textu zvolte **Překompilovat** znovu, aby se promítly také do výsledku.

Pokud se změny nepodaří uložit, kompilace se zastaví a text zůstane v editoru. Průběh rozlišuje ukládání, kompilaci a aktualizaci náhledu; uloženou kopii PDF potvrdí až export. Chyby a technický výstup najdete dole v kartách **Problémy** a **Podrobnosti**.

Dole je samostatně vidět **Neuložené změny** nebo **Otevřené změny uloženy**. Nad náhledem poznáte, zda PDF obsahuje poslední úpravy. Po dalším psaní se nabídne **Překompilovat** znovu; samotné uložení textu toto upozornění nezruší. Psaní během překladu také ponechá upozornění. Ukazatel sleduje změny v této relaci aplikace, nikoli úpravy souborů v jiných programech. PDF otevřené bez ověřeného překladu má aktuálnost neověřenou.

### Pracovní prostor a nové dokumenty

Úvod nabízí **Nový dokument**, **Otevřít projekt**, přímo dostupný import a poslední práce. Vedle nich je animovaná ilustrační ukázka psaní v barvách TUL Writeru, kterou lze pozastavit nebo přehrát znovu; respektuje nastavení omezeného pohybu. Pod **Další možnosti** najdete diagnostiku, zkratky a **Nastavit složku a šablonu…**; stejné nastavení je dostupné přes ozubené kolečko v editoru. Chybějící překladač LaTeXu tuto část automaticky otevře. Výchozí složka je systémová složka Dokumenty / TUL Writer. Nastavení se ukládá do uživatelské konfigurace aplikace a platí i po restartu pro všechny nové projekty na tomto PC.

**Nový dokument** požádá o název a šablonu a vytvoří vlastní podsložku ve zvoleném pracovním prostoru. Existující složku nepřepisuje ani neslučuje. Předvolená je TUL semestrální práce; k dispozici jsou také závěrečná práce, prezentace, poster a prázdný LaTeX dokument. Čtyři TUL balíčky jsou nezměněné offline kopie z portálu https://latex-tul.adamkabrt.chatgpt.site/templates; původ a kontrolní součty jsou v resources/templates/. Původní obecné šablony jsou pod **Další šablony…**.

Název složky se kontroluje už před vyplněním titulní strany; okolní mezery se odstraní. Název na titulní straně může být jiný. V druhém kroku stále vidíte šablonu a cílovou cestu. Pokud se vytvořený dokument nepodaří otevřít, průvodce ukáže jeho uloženou složku a nabídne **Zkusit otevřít znovu** bez opakovaného vytváření. Nový dokument otevře hlavní zdroj, i když v počítači zůstala stará relace stejné cesty; běžné otevření existujícího projektu dál obnovuje rozpracovanou kapitolu.

Při prvním otevření pomůže krátký český průvodce: uložení textu, kompilace, export PDF a soubory projektu. Lze jej přeskočit nebo znovu otevřít přes **Nápověda → Průvodce prací s dokumentem**. Nezachytává šipky při psaní mimo kartu a po opuštění projektu se neobjeví opožděně.

Pro **TUL semestrální práci** následuje druhý krok: součást TUL (celá univerzita, sedm fakult nebo CXI), název práce, autoři (každý na samostatném řádku), předmět a rok. Pod **Datum a verze zadání** lze změnit datum titulní strany a verzi; výchozí je dnešní datum a verze 1. Název práce se nabídne podle názvu složky, ale může být jiný. **Zpět** zachová rozepsané údaje. Až **Vytvořit dokument** založí nový projekt a předvyplní sedm známých deklarací v semestralni-prace.tex. Znaky jako `%`, `&`, `_` či zpětné lomítko se vkládají jako obyčejný text. Lze zadat 1–20 autorů v požadovaném pořadí. Jména se na titulní straně zobrazí pod sebou; popisek se přizpůsobí na Autor práce nebo Autoři práce. Původní ZIP a text práce zůstávají zachované; u skupiny se pouze v nové kopii stylu upraví tento popisek. Osobní údaje se neukládají do globálního nastavení. Druhý krok mají také další tři TUL šablony (viz níže).

Nový projekt obsahuje .tulwriter/project.json s hlavním souborem a nastavením překladače. Semestrální práce používá pdfLaTeX + BibTeX, závěrečná práce XeLaTeX + Biber, prezentace XeLaTeX a poster LuaLaTeX. Tyto nástroje a potřebné TeX balíčky musí být lokálně dostupné. Pomocné skripty ani latexmkrc z balíčků se automaticky nespouštějí. Ukázkové údaje nahraďte vlastními podle návodů uvnitř projektu.

V otevřené semestrální práci TUL lze přes **Údaje práce** změnit titulní stranu i dodatečně. Formulář načítá aktuální údaje ze zdroje včetně ručních úprav v podporovaném tvaru. Před otevřením uloží hlavní i boční editor a boční panel zavře. **Uložit údaje** upraví pouze příslušné hodnoty, případně popisek Autor/Autoři práce; obsah práce zůstane zachovaný. Změny mají samostatný bod v historii. Pro nové PDF zvolte **Překompilovat**. Pokud se zdroj nebo styl mezitím změnil, formulář uložení odmítne a je potřeba jej znovu otevřít. Hodnoty s vlastními LaTeX makry se upravují přímo ve zdroji; tento formulář je nepřevádí.

**Údaje práce** fungují také v prezentacích TUL založených novým průvodcem: fakulta, název, autoři, pracoviště, datum, e-mail a telefon. Hodnoty se čtou z aktuálního main.tex; mění se pouze podporované deklarace, snímky a ostatní soubory se zachovají. Komentáře, BOM, konce řádků a nezměněné hodnoty se nepřepisují. Zdrojový seznam autorů oddělený čárkou a mezerou se zobrazí jako jednotlivé řádky; totéž platí pro čárky uvnitř titulů/jmen, protože tato šablona neuchovává původní členění seznamu. Vlastní makra, volitelné krátké názvy, jiné volby třídy či jiný způsob vložení data upravte přímo ve zdroji. Změněný nebo smazaný zdroj blokuje uložení a zachová rozepsaný formulář. Závěrečná práce a poster dodatečný formulář zatím nemají.

### Druhý krok dalších šablon

- **Závěrečná práce:** součást TUL, BP/DP, český a anglický název, autor, vedoucí, rok, varianta prohlášení a studijní program (kód, český a anglický název). Obor lze vynechat; pokud jej zadání uvádí, vyplňte všechny tři údaje. Před odevzdáním ověřte úvodní listy podle své fakulty.
- **Prezentace:** součást, název, autoři po řádcích, pracoviště a datum; e-mail a telefon jsou nepovinné.
- **Poster:** součást, název, autoři a pracoviště; podnázev, akce, kontakt a web jsou nepovinné. Rozvržení a vlastní obsah zůstávají podle šablony.

Zpět zachová vyplnění; při přepnutí typu zůstávají formuláře oddělené. Údaje se zapisují jen do nové kopie dokumentu, původní ZIP se nemění. Prázdný dokument druhý krok nemá. Dodatečná editace přes **Údaje práce** je dostupná pro semestrálku a podporované prezentace.

### Vývojové spuštění

Vyžaduje Node.js 24+, Rust stable MSVC, Microsoft C++ Build Tools (Desktop development with C++), Windows SDK a WebView2. Pro dokumenty nainstalujte MiKTeX nebo TeX Live. Tectonic je alternativní cesta s vlastním stahováním balíčků. MiKTeX latexmk vyžaduje Perl; bez něj aplikace použije pdflatex.

    npm ci
    npm run tauri dev

Otevřete složku examples/first-project. Upravte main.tex, uložte Ctrl+S a zvolte Překompilovat (Ctrl+Enter). Výsledek se zobrazí v pravém PDF panelu a uloží do build/main.pdf. Soubor sections/results.tex ověřuje vícesouborový projekt. V nabídce lze nastavit hlavní soubor. Projekt lze předat také argumentem --project ABSOLUTNI_CESTA výslednému EXE.

Pokud otevřený soubor mezitím změní nebo odstraní jiný program, uložení se zastaví. Volba „Ponechat moje úpravy“ zachová váš text v editoru; před načtením jiné verze jej můžete zkopírovat. „Načíst z disku“ výslovně nahradí neuložený obsah aktuálním souborem. Totéž platí pro boční editor a notebooky. Automatické sledování změn na pozadí a obnova po pádu zatím nejsou implementované.

    npm test
    npm run check
    npm run build
    cargo test --manifest-path src-tauri/Cargo.toml

Průchod vytvářecím průvodcem bez otevírání okna ověří `npm run test:workspace`. Použije samostatný dočasný profil Edge/Chrome a testovací IPC bez zápisu skutečných dokumentů nebo nastavení aplikace. Ve Windows se prohlížeč hledá automaticky; jinde nastavte `TUL_WRITER_TEST_BROWSER` na cestu k Chromium prohlížeči. Testuje návrat, přepínání šablon, zachování údajů, chybový stav, odesílaná metadata a ochranu proti dvojímu vytvoření.

`npm run test:opening` používá skutečný project.ts, document-files.ts a DocumentSession s testovacími adaptéry zbytku UI/IPC. Ověřuje otevření hlavního souboru versus obnovu kapitoly, chyby čtení, zachování rozepsané práce při konfliktu či psaní během zápisu a revizi při opakovaném uložení. `TUL_WRITER_TEST_SCREENSHOT=1` u testů průvodce a hlavní cesty uloží do output/ snímky TUL motivů při 820 × 620. Testovací server se před startem prohlížeče předehřívá; assertion chyby se automaticky neopakují.

Sdílený formulář pro dodatečnou editaci semestrálky a prezentace ověří `npm run test:metadata` ve stejném bezokenním prostředí, s testovacími adaptéry editoru. Kontroluje načtení, správné revize zápisu, konflikty, zámek během ukládání, přepnutí projektu a selhání následného načtení editoru.

Průchod vytvořením a uložením PDF ověří `npm run test:workflow`: skutečný PDF.js, syntetický dokument a testovací adaptéry editorů, překladu a nativního dialogu. Kontroluje uložení před překladem, chyby, opakované kliknutí, změnu projektu a shodu exportu se zobrazenou verzí. Reálný překlad a export testuje samostatný Rust integrační test v pdf_export.rs.

Pro úplnou Rust sadu včetně notebooků použijte Python s requirements-test.txt. Ve Windows lze vytvořit .tools/test-python přes py -m venv, nainstalovat pip install -r requirements-test.txt a přidat jeho Scripts do PATH pro testovací příkaz. Aplikace umí najít také standardní Windows launcher py.

Přímý pdflatex běží dvakrát pro odkazy; automatická bibliografie a alternativní enginy vyžadují další konfiguraci/latexmk. Nejde o sandbox pro cizí nedůvěryhodné projekty. Notebooky se při kompilaci automaticky nespouštějí.

## Instalátor

    npm run tauri build

Tauri vytváří NSIS EXE a WiX MSI v src-tauri/target/release/bundle. Pro podepsané lokální sestavení jsou potřeba TAURI_SIGNING_PRIVATE_KEY a TAURI_SIGNING_PRIVATE_KEY_PASSWORD mimo projekt. Stav skutečného sestavení a ověření je v docs/TEST_REPORT.md. Nezaměňovat sestavený instalátor za ověřenou instalaci.

### Aktualizace nainstalované aplikace

Od verze 0.2 má TUL Writer vlastní podepsaný aktualizační kanál. Starší verze 0.1 vyžaduje jednorázovou ruční instalaci nové verze z [privátních vydání](https://github.com/akabrt00/Word-LateX-atd./releases/latest). Poté aplikace nabídne novější vydání při spuštění; kontrolu lze vyvolat také přes **Help → Zkontrolovat aktualizace…**. Instalace začne až tlačítkem **Aktualizovat a restartovat**, po ověření podpisu a úspěšném uložení otevřených editorů.

Soukromé stahování vyžaduje [GitHub CLI](https://cli.github.com/) a jednorázové `gh auth login --hostname github.com` k účtu s přístupem k repozitáři na každém PC. Token zůstává v backendu. Pro běžné používání není potřeba Git checkout, Node.js ani Rust. TeX a WebView2 jsou nadále nutné. Nová verze je dostupná až po úspěšném sestavení v GitHub Actions, nikoli okamžitě po změně zdrojů. Podrobný postup a omezení: [docs/UPDATES.md](docs/UPDATES.md).

## Dokumentace

- PROJECT_VISION.md: cíle a hranice.
- docs/TECHNICAL_AUDIT.md: zdroje, licence, srovnání a zjištění.
- ARCHITECTURE.md: současná a cílová architektura.
- DESIGN_SYSTEM.md: ověřené barvy, typografie a komponenty.
- AI_AGENT_DESIGN.md: poskytovatelé, oprávnění a projektová paměť.
- FEATURES.md: implementováno vs. plán.
- ROADMAP.md: etapy a konkrétní příští kroky.
- DECISIONS.md: architektonická rozhodnutí.
- CHANGELOG.md: vlastní změny; docs/upstream obsahuje původní dokumentaci Scribe.
- AGENTS.md: opakovatelný vývojový postup.

## Původ a licence

Základ: Scribe-IDE/Scribe, commit 08168f3208c32609ae5404016e9306c185f69f37 (1.2.3).
Původní MIT licence a copyright George Kiritsis zůstávají v LICENSE. Nový kód je poskytován za stejných podmínek MIT. Nebyl převzat kód Oleafly ani WordCraft. Přehled dalších licencí a hranic distribuce je v THIRD_PARTY_NOTICES.md. Hlavní vzdálené úložiště je soukromý GitHub repozitář [akabrt00/Word-LateX-atd.](https://github.com/akabrt00/Word-LateX-atd.) pod remote origin; větev main sleduje origin/main. Git remote upstream slouží ke sledování původního Scribe. Po dokončených úkolech se změny automaticky commitují a nahrávají podle AGENTS.md. Počáteční GitHub commit s původním označením Word-LateX-atd. zůstává součástí historie.

AI je ve výchozím stavu vypnutá. Tento milník nevyžaduje API klíč a žádný nový provider adapter neodesílá požadavky. Převzaté integrační cesty nejsou potvrzením přístupu k modelům ani náhradou API účtu.
