import { api } from "@/services/api";
import type { Aviso, AulaInfo, Professor, Sala } from "./tipos";
import {
  horarioParaMinutos,
  limparEspacos,
  suavizarCaixaAlta,
} from "./texto";

/* ---------- Formato cru que vem do backend ---------- */

interface SalaApi {
  id: number;
  nome: string;
  bloco: string | null;
}

interface ProfessorApi {
  id: number;
  nome: string;
  email: string | null;
}

interface AulaApi {
  id: number;
  diaDaSemana: number | string;
  horarioInicio: string;
  horarioFim: string;
  semestre?: { nome: string; curso?: { nome: string } | null } | null;
  sala?: SalaApi | null;
  professor?: ProfessorApi | null;
}

interface AvisoApi {
  id: number;
  mensagem: string;
  ativo: boolean;
  dataExpiracao: string | null;
}

/** O backend às vezes devolve `[...]` e às vezes `{ data: [...] }`. */
function extrairLista<T>(corpo: unknown): T[] {
  if (Array.isArray(corpo)) return corpo as T[];
  if (corpo && typeof corpo === "object") {
    const obj = corpo as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.avisos)) return obj.avisos as T[];
  }
  return [];
}

/* ---------- Normalização ---------- */

/** "c" -> "C"; "PRINCIPAL" -> "Principal"; "" -> null */
function normalizarBloco(bloco: string | null | undefined): string | null {
  const b = limparEspacos(bloco ?? "");
  if (b === "") return null;
  if (b.length <= 3) return b.toUpperCase();
  const suave = suavizarCaixaAlta(b);
  return suave.charAt(0).toUpperCase() + suave.slice(1);
}

function normalizarSala(s: SalaApi): Sala {
  return { id: s.id, nome: suavizarCaixaAlta(s.nome), bloco: normalizarBloco(s.bloco) };
}

function normalizarProfessor(p: ProfessorApi): Professor {
  const email = (p.email ?? "").trim();
  return { id: p.id, nome: limparEspacos(p.nome), email: email || null };
}

/**
 * "Engenharia Mecânica - 4° Semestre"            -> { cursos: ["Engenharia Mecânica"], semestre: 4 }
 * "1º Semestre - Administração"                  -> { cursos: ["Administração"], semestre: 1 }
 * "Eng. de Produção / Eng. Mecânica - 2° Semestre" -> { cursos: ["Eng. de Produção", "Eng. Mecânica"], semestre: 2 }
 */
export function interpretarTurma(nome: string): {
  cursos: string[];
  semestre: number | null;
} {
  const limpo = limparEspacos(nome);
  const achado = limpo.match(/(\d{1,2})\s*[°ºo]?\s*semestre/i);
  const semestre = achado ? Number(achado[1]) : null;
  const resto = achado ? limpo.replace(achado[0], " ") : limpo;
  const cursos = resto
    .replace(/^[\s\-–—|:]+|[\s\-–—|:]+$/g, "")
    .split("/")
    .map((c) => limparEspacos(c.replace(/^[\s\-–—|:]+|[\s\-–—|:]+$/g, "")))
    .filter(Boolean);
  return { cursos: cursos.length > 0 ? cursos : [limpo], semestre };
}

function normalizarAula(a: AulaApi): AulaInfo {
  const turma = limparEspacos(a.semestre?.nome ?? "Turma sem nome");
  const { cursos, semestre } = interpretarTurma(turma);
  const sala = a.sala ? normalizarSala(a.sala) : null;
  const professor = a.professor ? normalizarProfessor(a.professor) : null;
  return {
    id: a.id,
    dia: Number(a.diaDaSemana),
    inicio: a.horarioInicio,
    fim: a.horarioFim,
    inicioMin: horarioParaMinutos(a.horarioInicio),
    fimMin: horarioParaMinutos(a.horarioFim),
    turma,
    cursos,
    semestre,
    disciplina: limparEspacos(a.semestre?.curso?.nome ?? "Disciplina a definir"),
    salaId: sala?.id ?? null,
    sala: sala?.nome ?? null,
    bloco: sala?.bloco ?? null,
    professorId: professor?.id ?? null,
    professor: professor?.nome ?? null,
  };
}

function avisoValido(a: AvisoApi, agora: number): boolean {
  if (!a.ativo) return false;
  if (!a.dataExpiracao) return true;
  return new Date(a.dataExpiracao).getTime() > agora;
}

/* ---------- Buscas ---------- */

export async function buscarAulas(): Promise<AulaInfo[]> {
  const { data } = await api.get("/aulas");
  return extrairLista<AulaApi>(data)
    .map(normalizarAula)
    .filter((a) => a.dia >= 0 && a.dia <= 6)
    .sort((a, b) => a.dia - b.dia || a.inicioMin - b.inicioMin);
}

export async function buscarSalas(): Promise<Sala[]> {
  const { data } = await api.get("/salas");
  return extrairLista<SalaApi>(data)
    .map(normalizarSala)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }));
}

export async function buscarProfessores(): Promise<Professor[]> {
  const { data } = await api.get("/professores");
  return extrairLista<ProfessorApi>(data)
    .map(normalizarProfessor)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function buscarAvisos(): Promise<Aviso[]> {
  const { data } = await api.get("/avisos");
  const agora = Date.now();
  return extrairLista<AvisoApi>(data)
    .filter((a) => avisoValido(a, agora))
    .map((a) => ({
      id: a.id,
      mensagem: limparEspacos(a.mensagem),
      ativo: a.ativo,
      dataExpiracao: a.dataExpiracao,
    }));
}
