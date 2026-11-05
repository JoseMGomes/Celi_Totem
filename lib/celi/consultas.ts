import { MINUTOS_EM_BREVE } from "./config";
import { chave, minutosDoDia, nomeSemTitulo } from "./texto";
import type {
  AulaExibida,
  AulaInfo,
  Professor,
  Sala,
  StatusAula,
} from "./tipos";

const MINUTOS_SEMANA = 7 * 24 * 60;

export function ordenarAulas<T extends AulaInfo>(aulas: T[]): T[] {
  return [...aulas].sort(
    (a, b) =>
      a.dia - b.dia ||
      a.inicioMin - b.inicioMin ||
      a.turma.localeCompare(b.turma, "pt-BR"),
  );
}

export function statusDaAula(aula: AulaInfo, agora: Date): StatusAula | null {
  if (aula.dia !== agora.getDay()) return null;
  const min = minutosDoDia(agora);
  if (min >= aula.fimMin) return "encerrada";
  if (min >= aula.inicioMin) return "agora";
  if (aula.inicioMin - min <= MINUTOS_EM_BREVE) return "em-breve";
  return "mais-tarde";
}

export function exibir(aulas: AulaInfo[], agora: Date): AulaExibida[] {
  return ordenarAulas(aulas).map((a) => ({ ...a, status: statusDaAula(a, agora) }));
}

/** Minutos até a aula começar, olhando pra frente na semana. Aula em andamento = 0. */
function minutosAte(aula: AulaInfo, agora: Date): number {
  const hoje = agora.getDay();
  const min = minutosDoDia(agora);
  if (aula.dia === hoje && min >= aula.inicioMin && min < aula.fimMin) return 0;
  let delta = ((aula.dia - hoje + 7) % 7) * 1440 + aula.inicioMin - min;
  if (delta <= 0) delta += MINUTOS_SEMANA;
  return delta;
}

/** Próxima aula (ou a que está rolando agora) dentro da semana. */
export function proximaAula<T extends AulaInfo>(
  aulas: T[],
  agora: Date,
): { aula: T; minutos: number } | null {
  let melhor: { aula: T; minutos: number } | null = null;
  for (const aula of aulas) {
    const minutos = minutosAte(aula, agora);
    if (!melhor || minutos < melhor.minutos) melhor = { aula, minutos };
  }
  return melhor;
}

/* ---------- Turmas ---------- */

export interface CursoResumo {
  nome: string;
  semestres: (number | null)[];
}

export function cursosDisponiveis(aulas: AulaInfo[]): CursoResumo[] {
  const mapa = new Map<string, { nome: string; semestres: Set<number | null> }>();
  for (const aula of aulas) {
    for (const curso of aula.cursos) {
      const k = chave(curso);
      const atual = mapa.get(k) ?? { nome: curso, semestres: new Set() };
      atual.semestres.add(aula.semestre);
      mapa.set(k, atual);
    }
  }
  return [...mapa.values()]
    .map((c) => ({
      nome: c.nome,
      semestres: [...c.semestres].sort((a, b) => (a ?? 99) - (b ?? 99)),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function aulasDaTurma(
  aulas: AulaInfo[],
  curso: string,
  semestre: number | null,
): AulaInfo[] {
  const k = chave(curso);
  return aulas.filter(
    (a) => a.semestre === semestre && a.cursos.some((c) => chave(c) === k),
  );
}

/* ---------- Professores ---------- */

export function letraInicial(professor: Professor): string {
  return chave(nomeSemTitulo(professor.nome)).charAt(0).toUpperCase() || "#";
}

export function letrasDosProfessores(professores: Professor[]): string[] {
  return [...new Set(professores.map(letraInicial))].sort();
}

export function aulasDoProfessor(aulas: AulaInfo[], professorId: number): AulaInfo[] {
  return aulas.filter((a) => a.professorId === professorId);
}

/* ---------- Salas ---------- */

export const SEM_BLOCO = "-";
export const TODOS_BLOCOS = "*";

export function blocosDasSalas(salas: Sala[]): string[] {
  const blocos = [...new Set(salas.map((s) => s.bloco ?? SEM_BLOCO))];
  return blocos.sort((a, b) => {
    if (a === SEM_BLOCO) return 1;
    if (b === SEM_BLOCO) return -1;
    return a.localeCompare(b, "pt-BR");
  });
}

export function salasDoBloco(salas: Sala[], bloco: string): Sala[] {
  if (bloco === TODOS_BLOCOS) return salas;
  return salas.filter((s) => (s.bloco ?? SEM_BLOCO) === bloco);
}

export function aulasDaSala(aulas: AulaInfo[], salaId: number): AulaInfo[] {
  return aulas.filter((a) => a.salaId === salaId);
}

/** "Sala 108C · Bloco C" */
export function localDaAula(aula: Pick<AulaInfo, "sala" | "bloco">): string {
  if (!aula.sala) return "sala a definir";
  return aula.bloco ? `${aula.sala} · Bloco ${aula.bloco}` : aula.sala;
}

/** "na Sala 108C", "no Laboratório de Hardware", "em Ateliê X". */
export function preposicaoLocal(aula: Pick<AulaInfo, "sala">): string {
  const nome = chave(aula.sala ?? "sala");
  if (/^(sala|biblioteca|quadra|oficina|cozinha|clinica|brinquedoteca)\b/.test(nome)) return "na";
  if (/^(laboratorio|lab|auditorio|anfiteatro|salao|espaco|ginasio|centro|bloco|estudio|nucleo|predio)\b/.test(nome)) return "no";
  return "em";
}
