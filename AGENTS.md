# Pokyny pro vývoj TUL Writeru

Komunikujte česky. Kód a komentáře mohou být anglicky. Začněte README.md, ARCHITECTURE.md, DECISIONS.md a FEATURES.md. Respektujte původní MIT licenci Scribe. Nepřebírejte AGPL kód Oleafly bez výslovného rozhodnutí o licencování celého odvozeného díla.

## Pracovní postup

1. Zkontrolujte git status; neodstraňujte uživatelské změny.
2. Vymezte malý ověřitelný scénář a jeho rizika.
3. Zachovejte fungující CodeMirror, PDF.js a Tauri infrastrukturu.
4. Zdroj je autorita: nikdy nepřevádějte celý LaTeX přes HTML pro uložení.
5. Nové zásahy mají kontrolovat revizi, původní rozsah a podporovanou syntaxi; neznámé konstrukce ponechte.
6. Spusťte npm test, npm run check, npm run build a relevantní Rust testy. Pro celý milník proveďte desktopový průchod otevřít, změnit, uložit, kompilovat a zobrazit PDF.
7. Zaznamenejte přesné příkazy, prostředí, selhání a neprovedené kontroly do docs/TEST_REPORT.md.
8. Aktualizujte FEATURES.md, ROADMAP.md a CHANGELOG.md. Architektonickou změnu přidejte do DECISIONS.md.
9. Před lokálním commitem ověřte diff a nepřidávejte tajemství, target, node_modules či testovací výstupy.
10. Po dokončeném úkolu proveďte commit a push podle pravidel automatické synchronizace níže. Veřejné vydání aplikace a změny viditelnosti repozitáře nadále vyžadují samostatný pokyn uživatele.

## Automatická synchronizace s GitHubem

Uživatel dne 2026-11-05 výslovně povolil průběžné vytváření commitů a automatický push po každém dokončeném úkolu. Toto oprávnění platí i pro následující úkoly; nevyžadujte opakované potvrzení běžného commitu a push.

- Hlavní vzdálené úložiště je origin: https://github.com/akabrt00/Word-LateX-atd..git. Výchozí pracovní větev je main, která sleduje origin/main. Remote upstream zachovává původní Scribe a není cílem nahrávání našich změn.
- Uložte změny, zkontrolujte git status a diff, proveďte kontroly odpovídající úkolu a vylučte citlivé údaje i generované výstupy. Commitujte pouze změny související s úkolem; nepřidávejte cizí rozpracované změny.
- Vytvořte Git commit s krátkým věcným popisem a proveďte git push origin main. Pokud uživatel zadal jinou větev nebo právě pracuje na jiné větvi, respektujte ji a její změny bezpečně synchronizujte; nepřepisujte main přes jinou historii.
- Před push ověřte vzdálený stav. Pokud přibyly vzdálené commity, zachovejte je a bezpečně začleňte. Nepoužívejte force push ani nepřepisujte publikovanou historii bez výslovného souhlasu.
- Po push porovnejte SHA lokálního commitu s SHA odpovídající vzdálené větve (git ls-remote origin refs/heads/main pro main) a ověřte stav tracking větve. Úspěch push není totéž jako úspěch GitHub Actions.
- Jestliže není co commitovat, nevytvářejte prázdný commit; ověřte, zda již lokální stav odpovídá GitHubu.
- Při chybě autorizace nebo push zachovejte lokální commit, jasně popište nedokončenou synchronizaci a potřebný krok uživatele. Tokeny ani hesla nevypisujte, neukládejte do projektu ani nevkládejte do remote URL.

## Bezpečnost a pravdivost

AI API klíče nepatří do projektu ani logu; použijte OS credential store. Než připojíte skutečného poskytovatele, domluvte účet a rozsah odesílaných souborů. Neprohlašujte staticky nalezenou funkci za otestovanou. Selhání nebo přeskočení testu se nesmí vydávat za úspěch.

Kompilace nemá automaticky spouštět Python ani projektový latexmkrc. TeX s vypnutým shell escape stále není OS sandbox. Před veřejnou distribucí doplňte omezený worker, časový limit a explicitní trust flow.

## Kandidáti na opakovatelné skills

Navržené, zatím nevytvořené skills: latex-preservation-regression (korpus, náhodné transakce, no-op/undo), windows-desktop-release (toolchain, testy, podpis a čistá VM), document-agent-review (evidence, diff, oprávnění, rollback), tul-template-validation (verze, licence, metadata a kompilace). Do samostatných skills je převeďte až po ověření opakovaného workflow.
