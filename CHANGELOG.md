# Changelog TUL Writer

Původní historie Scribe je v docs/upstream/CHANGELOG.md a v Git historii.

## Vývoj – 2026-11-06

- Tlačítko Údaje práce pro dodatečnou úpravu titulní strany semestrálky TUL: aktuální název, autoři, součást, předmět, rok, datum a verze se načtou ze zdroje. Změny zachovávají okolní LaTeX a mají samostatné body historie.
- Kontrola revizí zdroje i stylu, odmítnutí vlastních maker a nejednoznačných deklarací, přizpůsobení popisku počtu autorů a chráněné obnovení zdroje při chybě zápisu stylu. Pole jsou sdílená s průvodcem nového dokumentu.

## Ověření – 2026-11-06

- Zopakováno 11 frontendových a 36 Rust testů i dva skutečné PDF překlady. Živě ověřen český panel Soubory, popisky vzhledu šablony, odmítnutí cesty mimo projekt, uložení českých poznámek a založení semestrálky se dvěma autory až do PDF bez chyb a varování. Produkční kód se při tomto ověření neměnil; podrobnosti a neprovedené kontroly v docs/TEST_REPORT.md.

## 0.2 – podepsané aktualizace (2026-11-06)

- Vlastní aktualizace Windows x64 ze soukromých GitHub Releases, kontrola po spuštění a přes nabídku Help. Instalace vyžaduje kliknutí uživatele, ověřený podpis a úspěšné uložení otevřených souborů.
- Podpis instalačního balíčku je svázaný s verzí; odmítnutí změněného balíčku, nesouladu verze a cizích URL. Přihlášení přes GitHub CLI zůstává mimo frontend a projekt.
- Automatické testování, sestavení NSIS/MSI a publikace privátní aktualizace z main. Jedinečná verze major.minor.číslo-běhu, ochrana před publikováním staršího commitu a veřejným vydáním.
- Lokální šifrovaný podpisový klíč s DPAPI heslem, provisioning GitHub Actions secrets po výslovném schválení uživatele. Doplněny smluvní testy toku instalace a release nástrojů.
- Při skutečné síťové diagnostice nalezena a opravena chybějící inicializace TLS provideru před vytvořením HTTP klienta updateru.
- Windows CI používá bezpečnou pracovní cestu nezávislou na tečce na konci názvu GitHub repozitáře.
- Opraveno dohledání privátního draftu podle ID a párování podpisů při změně mezer na tečky v GitHub názvech; CI uchová sestavené artefakty i při chybě publikace a využívá Rust cache. Publisher vybírá pouze instalátory právě sestavené verze.

## Vývoj – 2026-11-05

- Panel Soubory, jeho tlačítka a místní nabídky jsou česky včetně zadávání názvů, validací a potvrzení přesunu do koše. Windows akce nově uvádí Průzkumníka místo Finderu.
- Strom souborů zobrazuje podklady jako Vzhled šablony a podsložku písem jako Vzhled šablony / Písma. Skutečné cesty a odkazy LaTeXu se nemění; původní cesta je v nápovědě.
- Průvodce novou semestrální prací rozdělen na výběr projektu a údaje titulní strany. Volba celé TUL, sedmi fakult nebo CXI, názvu, jednoho či více autorů (po řádcích), předmětu, roku a data/verze zadání; tlačítko Zpět zachová vyplnění.
- Předvyplnění nové kopie mění sedm očekávaných deklarací a pro skupinu popisek autorů v nové kopii stylu; speciální TeX znaky jsou ošetřené jako text. Neplatné údaje či nepodporovaná struktura šablony se odmítnou před založením složky. Původní archivy, literatura a text práce zůstávají zachované.

- Nastavitelný pracovní prostor pro nové dokumenty, uložený pro celý počítač; nový český dialog názvu a šablony. Každý projekt vzniká ve vlastní složce bez přepsání existujícího obsahu.
- Přibaleny nezměněné TUL předvolby semestrální práce, závěrečné práce, prezentace a posteru z uživatelského portálu včetně původních podkladů a licencí; uložena provenance a SHA-256.
- Nastavení překladače podle šablony, přímý XeLaTeX/LuaLaTeX a zpracování BibTeXu/Biberu. Diagnostika vícenásobného překladu zobrazuje poslední průchod a úplný log zůstává dostupný.

- Otevřené dokumenty používají kontrolu revize obsahu při ukládání; změna nebo odstranění na disku zastaví zápis a nabídne zachování lokálního textu nebo načtení z disku.
- Opraveno zavírání bočního editoru po neúspěšném uložení; panel zůstane otevřený. Souběžná uložení respektují revize a další psaní během zápisu zůstává neuložené.
- Jedinečné dočasné soubory při zápisu nahrazují předvídatelnou cestu .scribe-tmp; přidány regresní testy konfliktů a souběžných editorů.

- Zprovozněno vývojové prostředí na druhém Windows PC; ověřeno nativní sestavení a GUI průchod editace, uložení, kompilace a PDF náhledu. Výsledky zaznamenány v docs/TEST_REPORT.md.

- Propojení projektu s GitHub origin akabrt00/Word-LateX-atd. a větví main při zachování historie Scribe i původního GitHub commitu.
- Rozšířen .gitignore o lokální konfiguraci, přihlašovací údaje, klíče, cache a dočasné soubory.
- V AGENTS.md uloženo trvalé oprávnění automaticky commitovat a pushovat dokončené úkoly a ověřovat vzdálený commit.

## 0.1.0 – 2026-11-05

- Založen vlastní pracovní fork Scribe 1.2.3 se zachovanou MIT licencí.
- Přidán audit tří kandidátů, projektová vize, architektura, design systém, AI návrh a roadmapa.
- Samostatné jméno, desktop identifier, keyring service a vlastní ikona.
- Lokální Inter, světlý a tmavý TUL Writer motiv, česká úvodní obrazovka a zavíratelné AI centrum.
- Vypnut updater Scribe a automatické spouštění notebooků při kompilaci.
- Přímá kompilace MiKTeX pdflatex při nedostupném latexmk/Perlu; dva průchody, shell escape off a latexmkrc off.
- Po neúspěšné kompilaci se staré PDF nevrací jako nový výsledek.
- Kontrola kanonických předků u nových souborových cest.
- Ukázkový vícesouborový LaTeX projekt a nativní integrační test.
- Experiment zdrojových transakcí se 7 testy zachování maker, komentářů, citací, struktur a Unicode.
- Opravena detekce standardního Windows Python launcheru a pořadí importů AI centra.
- Ověřen celý nativní desktopový průchod a vytvořeny testovací EXE/MSI s licencemi.
- Vite aktualizován na 8.3.6 po auditovaných zranitelnostech výchozí verze.

Přesné výsledky a omezení ověření: docs/TEST_REPORT.md. Word Mode ani autonomní agent zatím nejsou implementovány.
