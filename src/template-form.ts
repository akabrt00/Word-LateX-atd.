import { authorsFromLines } from "./semester-authors";
import { faculties } from "./semester-form";

const input = (id: string, label: string, required = true, max = 200, type = "text") =>
  `<label>${label}<input id="${id}" type="${type}" maxlength="${max}" ${required ? "required" : ""} ${type === "number" ? 'min="1900" max="9999" step="1"' : type === "date" ? 'min="1900-01-01" max="9999-12-31"' : ""}/></label>`;
const unit = `<label>Fakulta nebo součást TUL<select id="template-faculty" required>${faculties.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></label>`;
const title = input("template-title", "Název", true, 300);
const authors = `<label>Autoři<textarea id="template-authors" rows="3" required maxlength="4000" aria-describedby="template-authors-hint"></textarea></label><p id="template-authors-hint" class="semester-authors-hint">Každého autora napište na samostatný řádek, nejvýše 20 jmen.</p>`;
const optional = (summary: string, content: string) => `<details class="semester-extra"><summary>${summary}</summary>${content}</details>`;

export const templateHeadings: Record<string, string> = {
  "tul-thesis": "Údaje závěrečné práce", "tul-presentation": "Údaje prezentace", "tul-poster": "Údaje posteru",
};

export const templateFields: Record<string, string> = {
  "tul-thesis": `${unit}<div class="semester-grid"><label>Typ práce<select id="thesis-type"><option value="BP">Bakalářská práce</option><option value="DP">Diplomová práce</option></select></label>${input("thesis-year", "Rok odevzdání", true, 4, "number")}</div>
    ${title}${input("thesis-title-en", "Anglický název", true, 300)}
    ${input("thesis-author", "Autor práce")}${input("thesis-supervisor", "Vedoucí práce včetně titulů")}
    <label>Varianta prohlášení<select id="thesis-declaration"><option value="male">Mužský rod</option><option value="female">Ženský rod</option></select></label>
    ${input("thesis-programme-code", "Kód studijního programu", true, 80)}${input("thesis-programme", "Studijní program česky")}${input("thesis-programme-en", "Studijní program anglicky")}
    ${optional("Studijní obor — pokud jej vaše zadání uvádí", `${input("thesis-branch-code", "Kód oboru", false, 80)}${input("thesis-branch", "Název oboru česky", false)}${input("thesis-branch-en", "Název oboru anglicky", false)}<p class="workspace-detail">Vyplňte všechny tři údaje oboru, nebo je ponechte prázdné.</p>`)}
    <p class="workspace-detail">Údaje převezměte ze zadání. Před odevzdáním zkontrolujte požadované úvodní listy a prohlášení podle své fakulty; šablona obsahuje ukázkový text.</p>`,
  "tul-presentation": `${unit}${title}${authors}${input("presentation-institute", "Pracoviště")}${input("presentation-date", "Datum prezentace", true, 10, "date")}
    ${optional("Kontakt — nepovinné", input("presentation-email", "E-mail", false) + input("presentation-phone", "Telefon", false, 80))}`,
  "tul-poster": `${unit}${title}${input("poster-subtitle", "Podnázev — nepovinné", false, 300)}${authors}${input("poster-department", "Pracoviště")}
    ${optional("Akce a kontakt — nepovinné", input("poster-event", "Akce nebo konference", false) + input("poster-contact", "Kontaktní e-mail", false) + input("poster-website", "Web", false))}`,
};

export function readTemplateDetails(container: HTMLElement, template: string) {
  const value = (id: string) => container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${id}`)!.value;
  const common = { faculty: value("template-faculty"), title: value("template-title") };
  switch (template) {
    case "tul-thesis": return { kind: "thesis", ...common, workType: value("thesis-type"), titleEn: value("thesis-title-en"), author: value("thesis-author"), supervisor: value("thesis-supervisor"), year: Number(value("thesis-year")), declaration: value("thesis-declaration"), programmeCode: value("thesis-programme-code"), programme: value("thesis-programme"), programmeEn: value("thesis-programme-en"), branchCode: value("thesis-branch-code"), branch: value("thesis-branch"), branchEn: value("thesis-branch-en") };
    case "tul-presentation": return { kind: "presentation", ...common, authors: authorsFromLines(value("template-authors")), institute: value("presentation-institute"), date: value("presentation-date"), email: value("presentation-email"), phone: value("presentation-phone") };
    case "tul-poster": return { kind: "poster", ...common, subtitle: value("poster-subtitle"), authors: authorsFromLines(value("template-authors")), department: value("poster-department"), contact: value("poster-contact"), website: value("poster-website"), event: value("poster-event") };
    default: throw new Error("Neznámý formulář šablony.");
  }
}
