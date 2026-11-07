// Compile problems: the clickable list in the log panel and the underlines in the editor.
import { setDiagnostics, Diagnostic } from "@codemirror/lint";
import { $, current, logEl, logPanel, setLogView } from "./core";
import { Problem } from "./diagnostics";
import { view } from "./editor";
import { ICONS } from "./icons";
import { revealLine } from "./project";
import { renderProblemCount } from "./statusbar";
import { aiReady } from "./ai";

let problems: Problem[] = [];

export const problemCount = (severity: Problem["severity"]) => problems.filter((p) => p.severity === severity).length;

const plural = (n: number, one: string, few: string, many: string) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;

/** "2 errors, 1 warning", or "" when there is nothing to report. */
export function problemSummary(): string {
  const errors = problemCount("error");
  const warnings = problemCount("warning");
  return [errors && plural(errors, "chyba", "chyby", "chyb"), warnings && plural(warnings, "varování", "varování", "varování")].filter(Boolean).join(", ");
}

/** Replaces the problem list. `log` is the raw compiler output, kept behind the Output tab. */
export function setProblems(next: Problem[], log: string, visible: boolean, title = "Compile") {
  problems = next;
  logEl.textContent = log;

  const list = $("problems");
  const frag = document.createDocumentFragment();
  for (const problem of problems) {
    const row = document.createElement("button");
    row.className = `problem ${problem.severity}`;
    const icon = document.createElement("span");
    icon.className = "problem-icon";
    icon.innerHTML = problem.severity === "error" ? ICONS.error : ICONS.warn;
    const text = document.createElement("span");
    text.className = "problem-text";
    text.textContent = problem.message;
    if (problem.hint) {
      const hint = document.createElement("span");
      hint.className = "problem-hint";
      hint.textContent = problem.hint;
      text.appendChild(hint);
    }
    const where = document.createElement("span");
    where.className = "problem-where";
    where.textContent = problem.line ? `${problem.file}:${problem.line}` : problem.file;
    row.append(icon, text, where);
    // the model's fix for an error, reviewed before it goes in
    if (problem.severity === "error" && problem.line && aiReady()) {
      const fix = document.createElement("span");
      fix.className = "problem-fix";
      fix.textContent = "Fix";
      fix.title = "Ask the AI for a fix, and review it before it goes in";
      fix.setAttribute("role", "button");
      fix.onclick = (e) => {
        e.stopPropagation();
        import("./aiedit").then((m) => m.fixProblem(problem));
      };
      row.append(fix);
    }
    row.title = `${problem.message}${problem.hint ? `\n${problem.hint}` : ""}\n${where.textContent}`;
    row.onclick = () => revealLine(problem.file, problem.line);
    frag.appendChild(row);
  }
  if (!problems.length) {
    const none = document.createElement("div");
    none.className = "empty";
    none.textContent = title === "Compile" ? "Při posledním vytvoření PDF nebyly zjištěny problémy." : "Není co opravit.";
    frag.appendChild(none);
  }
  list.replaceChildren(frag);

  $("log-title").textContent = title === "Compile" ? "Vytvoření PDF" : title;
  $("log-tab-problems").textContent = problems.length ? `Problémy (${problems.length})` : "Problémy";
  // With nothing parsed out of a failed compile, the raw output is the only useful thing to show.
  setLogView(problems.length || !log ? "problems" : "output");
  logPanel.hidden = !visible;
  renderProblemCount();
  markProblemsInEditor();
}

export function clearProblems() {
  problems = [];
  $("problems").replaceChildren();
  $("log-tab-problems").textContent = "Problémy";
  renderProblemCount();
  markProblemsInEditor();
}

/** Underlines the open file's problems. Call after a compile and whenever a file is opened. */
export function markProblemsInEditor() {
  const doc = view.state.doc;
  const marks: Diagnostic[] = [];
  for (const problem of problems) {
    if (problem.file !== current || problem.line < 1 || problem.line > doc.lines) continue;
    const line = doc.line(problem.line);
    const indent = line.text.length - line.text.trimStart().length;
    marks.push({
      from: Math.min(line.from + indent, line.to),
      to: line.to,
      severity: problem.severity,
      message: problem.hint ? `${problem.message}\n${problem.hint}` : problem.message,
    });
  }
  view.dispatch(setDiagnostics(view.state, marks));
}
