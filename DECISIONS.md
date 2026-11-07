# Rozhodnutí

Upřesnění názvosloví od uživatele 2026-11-07: v aktuálním UI se akce z ADR-014/015 jmenuje **Překompilovat**, nikoli Vytvořit PDF. Uloží změny a obnoví náhled. **Uložit PDF…** zůstává samostatný export; tento rozdíl má být patrný i v průběhu a potvrzení výsledku. Implementace překladu, revizí a snapshot exportu se nemění.

## ADR-015 – Uložení zdroje a aktuálnost náhledu (2026-11-07)

Stav uložení editorů je nezávislý na PDF. DocumentProgress sleduje neuložené cesty a monotónní revizi změn celé otevřené práce. Každá editace včetně opakovaného psaní do již změněného editoru posune revizi; potvrzené uložení pouze odstraní danou cestu z neuložených. Přejmenování bočního souboru přenese tuto cestu. Hlavní a boční soubor se navzájem nemohou označit za uložené.

Build po uložení editorů zachytí revizi a preview ji při úspěšném vykreslení přiřadí ke konkrétnímu PDF. Novější editace během překladu nebo vykreslení ponechá PDF zastaralé. Samotné uložení, neúspěšný překlad ani export neobnoví aktuálnost. PDF otevřené jinou cestou bez této revize je neověřené. Změna projektu resetuje stav; změna hlavního souboru, údajů práce nebo konfliktní reload jej zneplatní. Resize zachovává původní revizi PDF a během překladu nezahajuje konkurenční načítání.

Jde o konzervativní sledování změn v relaci, nikoli porovnávání obsahu nebo sledování externích souborů: vrácení textu přes undo může stále vyžadovat nové PDF. UI tuto hranici uvádí v popisu ukazatele. Původní revizní ochrana zápisu DocumentSession zůstává autoritou pro skutečné uložení; tento model ji nenahrazuje a nezavádí autosave.

## ADR-014 – Export zobrazeného PDF a kontext hlavního toku (2026-11-07)

V rámci uživatelem určené priority běžné pracovní cesty používá hlavní akce název Vytvořit PDF; ukládá hlavní a boční editor jako dosud. Projekt a hlavní soubor se zachytí při zahájení. Po asynchronních krocích se kontroluje, že kontext stále odpovídá; dokončený výsledek jiného projektu nesmí přepsat aktuální náhled. Preview publikuje lastPdf až po úspěšném vykreslení, nikoli před načtením. Nejde o nový compiler worker ani jeho cancel/timeout.

Uložit PDF ukládá právě zobrazenou verzi. Původní opakované čtení souboru přes copy_out mohlo po dalším překladu nebo změně projektu vrátit jiná data. PdfExportFlow proto získá bajty z konkrétního PDF.js dokumentu a název původního projektu před otevřením dialogu. Během jednoho exportu nezakládá další dialog; zrušení nic nezapisuje a chyba dovolí opakování. Ostatní použití copy_out zůstávají samostatná.

Nativní dialog určí cílovou cestu. Raw příkaz export_pdf předává bajty a percent-encoded x-dest, bez JSON pole jednotlivých bajtů. Backend požaduje absolutní cestu s příponou .pdf a hlavičku %PDF-; nejde o obecnou validaci formátu. Dočasný soubor vznikne ve zvolené složce, provede se flush a atomická náhrada. Původní cíl zůstává zachovaný při neplatném vstupu nebo selhání přípravy. Příkaz nevybírá jiný soubor a nepřepisuje LaTeX zdroj.

Uložený zdroj a aktuálnost PDF jsou odlišné stavy. Tato iterace nezavádí autosave, watcher ani indikátor zastaralého PDF po další editaci; tyto UX potřeby zůstávají v hlavní prioritě docs/UX_WORKFLOW.md.

## ADR-013 – Dodatečná úprava údajů prezentace (2026-11-07)

Formulář Údaje práce podporuje vedle semestrálky také nové prezentace tul-presentation s main.tex. Sdílený frontend načte tagovaný snapshot z read_document_details; zápis používá typově oddělené save_semester_details a save_presentation_details. Před načtením se uloží a uzavře boční editor, kontroluje se projekt a stav hlavního editoru. Zkratky aplikace se zadrží v modálu. Úspěšný zápis a následné selhání načtení editoru se hlásí odlišně, aby se nenabízel další zápis se starou revizí.

Prezentace má sedm podporovaných jednořádkových deklarací v preambuli: documentclass, title, author, institute, authorMail, authorPhone a date. Přijímá se aspect169 a nejvýše jedna známá fakultní volba; FA se čte jako FUA. Pracoviště musí obsahovat přesný řízený dovětek se zobrazením insertdate z vytvářecího průvodce. Datum se dekóduje z českého kalendářního dne, text jen ze známých escapování. Seznam autorů se čte podle čárky a mezery; původní rozdělení jmen s čárkami není ve zdroji zachované. Krátké názvy, vlastní makra, zanořené deklarace, explicitní skupiny, změny catcode a nejednoznačná syntaxe se odmítají, nikoli normalizují.

Zápis kontroluje SHA-256 přesných načtených bajtů, společný WRITE_LOCK a revizi těsně před atomickou náhradou main.tex. Před skutečnou změnou uloží samostatný původní stav historie. No-op historii nevytváří. Patche se řadí podle původních offsetů, nikoli pořadí polí; totéž opravuje ručně přeuspořádané deklarace semestrálky. Nezměněné hodnoty, komentáře, BOM, konce řádků a celé snímky zůstávají zachované. Třída, grafika, nastavení a jiné soubory se nepřepisují. Nejde o obecný parser nebo expanzi TeXu; přetrvávají omezení optimistické kontroly souběhu podle ADR-007.

## ADR-011 – Druhý krok všech TUL předvoleb (2026-11-06)

Vytvářecí průvodce má druhý krok pro semestrálku, závěrečnou práci, prezentaci a poster; prázdný dokument je jednokrokový. Závěrečná práce má jednoho autora a volbu BP/DP, prezentace a poster uspořádaný seznam 1–20 autorů zobrazovaný podle šablony čárkami. Obor je volitelný, ale všechny tři údaje oboru musí být vyplněné společně. Nevyplněný obor odstraní jen ukázkovou deklaraci TULbranch. Varianty prohlášení používají již přibalené male/female; formulář nepotvrzuje platnost úvodních listů konkrétní fakulty.

Frontend uchovává rozpracované formuláře odděleně podle typu jako odpojené DOM uzly; v dokumentu je připojený jen aktuální formulář, takže se neopakují ID. Zpět ani změna šablony nepřenáší osobní údaje do jiné šablony či globálního nastavení. Backend přijímá samostatný tagovaný objekt TemplateDetails, kontroluje soulad se zvolenou šablonou a provede všechny validace i transformace před vytvořením složky. Vyžaduje jedinečné přesné vzory z pevných přibalených verzí a změny aplikuje podle původních rozsahů odzadu. Vstup uživatele se vkládá jako escapovaný obyčejný text.

FUA se pro starší třídy tulthesis/tulpresentation mapuje na jejich podporovanou volbu FA, pro poster na FUA; uživatel stále vybírá FUA. Mění se pouze nové kopie main.tex a příslušného souboru údajů. Původní ZIP, třídy, grafika, písma a vlastní ukázkový obsah se zachovávají; u závěrečné práce se v main.tex mění ještě známá volba ThesisStart. Dodatečný editační formulář Údaje práce je nadále pouze pro semestrálky podle ADR-010; tento krok rozšiřuje zakládání dokumentů.

## ADR-010 – Údaje existující semestrální práce (2026-11-06)

Formulář čte aktuální LaTeX a neudržuje druhou databázi metadat. Podporuje pouze projekty tul-semester s očekávaným hlavním souborem. Konzervativní parser rozpozná sedm jednořádkových deklarací v preambuli, vyžaduje jejich jednoznačnost a dekóduje pouze známé textové escapování a řízené zalomení autorů. Vlastní makra, redefinice nebo neznámá syntaxe jsou důvodem k odmítnutí formuláře. Nezměněné hodnoty ani jejich mezery se nepřepisují; změněné hodnoty se aplikují do původních rozsahů odzadu. Tělo, okolní komentáře, BOM a konce řádků zůstávají zachované.

Načtení vrací revize zdroje i stylu. Uložení pod sdíleným WRITE_LOCK kontroluje oba soubory před změnami a znovu každý těsně před atomickou výměnou. Pokud selže druhý zápis, první se obnoví pouze při shodě s právě zapsanými bajty; při cizí souběžné změně se nepřepisuje a chyba výslovně oznámí částečné uložení. Před změnami vznikají samostatné body v historii a tyto zápisy se neslučují do časové skupiny. Nejde o atomickou transakci více souborů při pádu procesu ani o odstranění omezení závodu s cizími procesy z ADR-007.

Dialog před načtením uloží hlavní editor a uloží/zavře boční editor; neúspěšné uložení formulář zablokuje. Modální formulář zadrží aplikační klávesové zkratky. Po úspěchu se hlavní soubor načte s novou revizí; PDF se aktualizuje až explicitní kompilací. Vytvářecí a editační formulář sdílejí pole, ale editace nikdy nemění globální pracovní prostor.

## ADR-009 – Předvyplnění nové semestrální práce (2026-11-05)

Průvodce metadaty je omezen na pevně přibalenou semestrální šablonu 1.3. Dva kroky oddělují složku a šablonu od údajů titulní strany. Osobní údaje se neukládají jako globální předvolba. Datum se nabízí podle místního kalendáře a verze zadání jako 1; uživatel je může změnit.

Autoři jsou uspořádaný seznam 1–20 jmen, každé nejvýše 200 znaků. Víceřádkové pole převádí každý neprázdný řádek na jedno jméno; pořadí i shodná jména zachovává. Backend každé jméno samostatně validuje a escapuje, teprve potom přidá vlastní LaTeX zalomení řádku. Pro skupinu změní v nové kopii stylu pouze přesně očekávaný popisek Autor práce na Autoři práce. Neznámý nebo opakovaný vzor odmítne před založením složky. Původní archiv se nemění.

Backend vyžaduje metadata pro nové semestrální projekty a odmítá je u ostatních typů. Před jakýmkoli založením adresáře ověří známou součást TUL, délku a jednořádkový text, čtyřciferný rok a skutečný kalendářní den. Text escapuje po jednotlivých znacích pro LaTeX. Transformuje jen sedm konkrétních deklarací před begin{document}, každou přesně jednou, pomocí původních rozsahů aplikovaných odzadu. Neznámá nebo změněná struktura je chyba, nikoli důvod ke generickému přepisu dokumentu. Originální ZIP i podklady zůstávají nezměněné; vlastní text, komentáře, BOM a konce řádků se zachovávají.

## ADR-012 – Podepsané aktualizace instalované aplikace (2026-11-06)

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
