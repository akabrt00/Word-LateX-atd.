# Hlavní priorita: snadná práce s dokumentem

Uživatel dne 2026-11-07 určil jako alfa a omega projektu cestu **založit dokument → psát → uložit → získat PDF**. Následující iterace se věnují této cestě. Vizuální identita TUL Writeru a animovaná ukázka zůstávají; úspěchem je snazší práce, jasný výsledek a méně nutných rozhodnutí.

## Co už funguje

Aktuální názvosloví po dalším upřesnění uživatele: **Překompilovat** uloží otevřené změny a obnoví náhled, **Uložit PDF…** samostatně uloží zobrazenou verzi do počítače. Původní označení Vytvořit PDF v popisu předchozích iterací je překonané. Kompilace neotevírá exportní dialog, export nespouští kompilaci. Automatická kompilace při uložení/psaní zůstává volitelná a ve výchozím stavu vypnutá.

- Nový dokument má předvolenou složku a šablonu; průvodce předvyplní známé údaje a otevře založený projekt. Existující složku nepřepisuje.
- Otevřený zdroj se ukládá s kontrolou revize. Konflikt zachová rozepsaný text a zastaví navazující vytvoření PDF.
- Vytvoření PDF již ukládalo hlavní i boční editor automaticky; tato vlastnost musí být pro uživatele zřejmá.
- PDF se zobrazuje vedle zdroje a lze z něj uložit samostatnou kopii.

Jde o zjištění z kódu a dosavadních testů. Osobní průchod skutečným desktopovým oknem zůstává samostatnou kontrolou uživatele.

## První iterace: srozumitelná cesta k PDF

Překážky: technický název Kompilovat, anglické průběhové zprávy, nejasné automatické uložení a export pouze pod ikonou. Původní export navíc znovu četl soubor z disku, který se mohl od zobrazené verze lišit.

Změny:

1. Jedna akce **Vytvořit PDF** uloží otevřené změny a vytvoří náhled. Dostupná je v hlavní liště i v prázdném náhledu; původní klávesová zkratka zůstává.
2. Průběh rozlišuje ukládání, vytváření a hotový výsledek. Konflikt či chyba se nesmí tvářit jako úspěch.
3. **Uložit PDF…** má viditelný text a český dialog. Ukládá přesné bajty zobrazeného PDF zachycené před dialogem, i když se mezitím změní projekt nebo náhled. Nepřepisuje zdrojový soubor.
4. Dvojí stisk nespouští druhou operaci. Výsledek dokončený pro jiný projekt se nepromítne do jeho náhledu.

Přijetí: po úpravě zdroje stačí stisknout Vytvořit PDF; při úspěchu je vidět skutečná stránka a aktivní Uložit PDF. Zrušení uložení nic nevytváří. Chyba uložení zdroje nespouští překlad. Výsledek musí projít kontrolou skutečným PDF.js, revizními regresními testy a samostatným skutečným TeX překladem.

Stav první iterace: implementována a automaticky ověřena (21 kontrol hlavního postupu, 24 Node testů, backendové regrese a skutečný TeX export; podrobnosti v TEST_REPORT.md). Osobní desktopový průchod zůstává otevřený. Následuje rozlišení uloženého textu a aktuálnosti PDF.

## Druhá iterace: uložený text a aktuálnost PDF

Implementováno samostatné Neuložené změny / Otevřené změny uloženy a informace nad PDF s přímou akcí Vytvořit PDF. Uložení textu neobnovuje aktuálnost. Překlad zachytí revizi místních změn a psaní během jeho běhu ponechá upozornění. PDF načtené bez této revize má aktuálnost neověřenou. Stav nezahrnuje změny souborů v jiných programech a konzervativně vyžaduje nové PDF také po editaci vrácené přes undo. Automatické kontroly jsou v TEST_REPORT.md; osobní desktopový průchod zůstává otevřený.

## Navazující práce výhradně v této prioritě

Další automaticky ověřený celek: Uložit v liště, nabídce i obou editorech ukládá oba otevřené zdroje s potvrzením, nezávisle na fokusu. Ověřeny oba konflikty, částečné uložení, přepnutí projektu, dvojí stisk, další psaní i kompilace při uložení. Lišta se zalamuje v menším okně. Živý desktopový průchod zůstává na uživateli.

1. Při osobním průchodu ověřit srozumitelnost nového rozlišení uloženého textu a aktuálnosti PDF.
2. Prověřit dostupnost běžného uložení a jeho potvrzení pro hlavní i boční editor. Nevnášet nejasnost mezi uložením zdroje a uložením PDF.
3. Projít název dokumentu versus název složky, srozumitelnost šablon, validaci a návrat v průvodci. Zachovávat vyplněné údaje a předvolby; osobní údaje neukládat do globální konfigurace.
4. Prověřit první otevření hlavního souboru a orientaci mezi vlastním textem a podklady šablony.
5. Ověřit běžné chyby: chybějící překladač, chyba ve zdroji, změněný či smazaný soubor, nezapisovatelný cíl. Vždy musí být jasné, co zůstalo uložené a co může uživatel udělat dál.
6. S uživatelem osobně projít založení → napsání krátkého odstavce → uložení → PDF → zavření a opětovné otevření. Agent do té doby nepřebírá obrazovku.

## Odložené etapy

Rozšiřování metadat dalších šablon, úplná lokalizace všech vedlejších panelů, nové vizuální editory, odborné objekty, AI agent a distribuční rozšíření zatím nejsou samostatným cílem. Změny potřebné přímo k této hlavní cestě zůstávají součástí práce; hotový dílčí krok neznamená dokončení celé priority.
