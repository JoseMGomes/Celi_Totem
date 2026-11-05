export type Expressao =
  | "normal"
  | "feliz"
  | "animado"
  | "curioso"
  | "processando"
  | "confuso"
  | "sonolento"
  | "dormindo";

export interface Aviso {
  id: number;
  mensagem: string;
  ativo: boolean;
  dataExpiracao: string | null;
}

export interface Sala {
  id: number;
  nome: string;
  /** Letra do bloco já normalizada (maiúscula). `null` = sem bloco. */
  bloco: string | null;
}

export interface Professor {
  id: number;
  nome: string;
  email: string | null;
}

/**
 * Aula normalizada a partir de `/aulas`.
 *
 * Atenção ao modelo do backend: `semestre.nome` traz o CURSO + SEMESTRE
 * ("Engenharia Mecânica - 4° Semestre") e `semestre.curso.nome` traz a
 * DISCIPLINA ("Eletricidade Aplicada"). Aqui isso já vem separado.
 */
export interface AulaInfo {
  id: number;
  /** 0 = domingo ... 6 = sábado */
  dia: number;
  inicio: string;
  fim: string;
  inicioMin: number;
  fimMin: number;
  /** Nome original da turma, ex.: "Engenharia Mecânica - 4° Semestre". */
  turma: string;
  /** Cursos da turma (turmas compartilhadas têm mais de um). */
  cursos: string[];
  semestre: number | null;
  disciplina: string;
  salaId: number | null;
  sala: string | null;
  bloco: string | null;
  professorId: number | null;
  professor: string | null;
}

export type StatusAula = "agora" | "em-breve" | "mais-tarde" | "encerrada";

export interface AulaExibida extends AulaInfo {
  /** Só preenchido quando a aula é no dia de hoje. */
  status: StatusAula | null;
}

export type StatusRecurso = "carregando" | "ok" | "erro";

export interface Recurso<T> {
  dados: T[];
  status: StatusRecurso;
}

export interface BaseConhecimento {
  aulas: Recurso<AulaInfo>;
  salas: Recurso<Sala>;
  professores: Recurso<Professor>;
  avisos: Recurso<Aviso>;
  /** Momento da última sincronização 100% bem-sucedida. */
  sincronizadoEm: number | null;
  /** `false` quando a última tentativa de sincronia falhou em algum recurso. */
  online: boolean;
}
