/**
 * Cérebro da CELI: uma máquina de estados de conversa guiada.
 *
 * Cada `Passo` é um ponto da conversa. `responder(passo, base, agora)` é uma
 * função PURA que devolve a `Fala` da CELI naquele ponto: o que ela diz, a
 * expressão do rosto, as opções de resposta (botões) e, quando já sabe a
 * resposta, os cards de resultado.
 *
 * Como é pura, sempre que os dados do backend chegam/atualizam a fala é
 * recalculada sozinha — ex.: "só um instante..." vira a resposta de verdade.
 *
 * As frases vêm de `frases.ts`, sorteadas a partir do instante `agora`
 * (cada navegação sorteia uma versão diferente).
 */
import { LIMITE_LISTA_DIRETA_PROFESSORES } from "./config";
import {
  SEM_BLOCO,
  TODOS_BLOCOS,
  aulasDaSala,
  aulasDaTurma,
  aulasDoProfessor,
  blocosDasSalas,
  cursosDisponiveis,
  exibir,
  letraInicial,
  letrasDosProfessores,
  localDaAula,
  preposicaoLocal,
  proximaAula,
  salasDoBloco,
  statusDaAula,
} from "./consultas";
import { criarFrases, type Frases } from "./frases";
import {
  DIAS_CURTOS,
  DIAS_TITULO,
  NO_DIA,
  chave,
  diasRecorrentes,
  saudacao,
} from "./texto";
import type {
  AulaExibida,
  AulaInfo,
  Aviso,
  BaseConhecimento,
  Expressao,
  Professor,
  Recurso,
  Sala,
} from "./tipos";

/* ---------- Tipos da conversa ---------- */

export type Passo =
  | { tipo: "menu"; retorno?: boolean }
  | { tipo: "turma-curso" }
  | { tipo: "turma-semestre"; curso: string }
  | { tipo: "turma-resultado"; curso: string; semestre: number | null }
  | { tipo: "prof-modo" }
  | { tipo: "prof-curso" }
  | { tipo: "prof-lista-curso"; curso: string }
  | { tipo: "prof-letra" }
  | { tipo: "prof-lista"; letra: string | null }
  | { tipo: "prof-resultado"; professorId: number }
  | { tipo: "sala-bloco" }
  | { tipo: "sala-lista"; bloco: string }
  | { tipo: "sala-resultado"; salaId: number }
  | { tipo: "dia"; dia: number }
  | { tipo: "avisos" };

export type NomeIcone =
  | "aula"
  | "hoje"
  | "professor"
  | "sala"
  | "avisos"
  | "curso"
  | "semestre"
  | "letra"
  | "dia"
  | "bloco"
  | "recarregar";

export interface Opcao {
  id: string;
  rotulo: string;
  detalhe?: string;
  icone?: NomeIcone;
  /** Para onde a conversa vai ao tocar. */
  destino?: Passo;
  /** Ação especial em vez de navegar. */
  acao?: "recarregar";
  /** Marca a opção (ex.: dia selecionado). */
  ativa?: boolean;
}

export type Resultado =
  | {
      tipo: "aulas";
      titulo: string;
      aulas: AulaExibida[];
      agruparPorDia: boolean;
      destaqueId?: number;
      vazio?: string;
    }
  | {
      tipo: "professor";
      professor: Professor;
      aulas: AulaExibida[];
      destaqueId?: number;
    }
  | { tipo: "sala"; sala: Sala; aulas: AulaExibida[]; destaqueId?: number }
  | { tipo: "avisos"; avisos: Aviso[] };

export interface Fala {
  texto: string;
  expressao: Expressao;
  /**
   * Sem `resultado`: são as respostas da pergunta (conteúdo principal).
   * Com `resultado`: são filtros exibidos acima dele (ex.: dias da semana).
   */
  opcoes: Opcao[];
  /** cards = menu grande; lista = itens com detalhe; chips = botões curtos. */
  formato: "cards" | "lista" | "chips";
  resultado?: Resultado;
}

/* ---------- Helpers ---------- */

/** Fala de espera/erro quando um recurso necessário ainda não está disponível. */
function aguardar(f: Frases, ...recursos: Recurso<unknown>[]): Fala | null {
  const semDados = recursos.filter((r) => r.dados.length === 0);
  if (semDados.some((r) => r.status === "carregando")) {
    return { texto: f.aguardando(), expressao: "processando", opcoes: [], formato: "chips" };
  }
  if (semDados.some((r) => r.status === "erro")) {
    return {
      texto: f.erroConexao(),
      expressao: "confuso",
      opcoes: [
        { id: "recarregar", rotulo: "Tentar de novo", icone: "recarregar", acao: "recarregar" },
      ],
      formato: "chips",
    };
  }
  return null;
}

const comProfessor = (aula: AulaInfo) => (aula.professor ? `, com ${aula.professor}` : "");

/** "na Sala 108C · Bloco C" */
const noLocal = (aula: AulaInfo) => `${preposicaoLocal(aula)} ${localDaAula(aula)}`;

function quando(dia: number, agora: Date): string {
  const hoje = agora.getDay();
  if (dia === hoje) return "hoje";
  if (dia === (hoje + 1) % 7) return "amanhã";
  return NO_DIA[dia];
}

function rotuloSemestre(semestre: number | null): string {
  return semestre === null ? "Semestre único" : `${semestre}º semestre`;
}

function rotuloBloco(bloco: string): string {
  if (bloco === SEM_BLOCO) return "Outros locais";
  if (bloco === TODOS_BLOCOS) return "Todas as salas";
  return `Bloco ${bloco}`;
}

const simples = (texto: string, expressao: Expressao): Fala => ({
  texto,
  expressao,
  opcoes: [],
  formato: "chips",
});

/* ---------- Passos ---------- */

function menu(f: Frases, retorno: boolean, base: BaseConhecimento, agora: Date): Fala {
  const avisos = base.avisos.dados.length;
  return {
    texto: retorno ? f.maisAlgumaCoisa() : f.saudacao(saudacao(agora)),
    expressao: retorno ? "normal" : "feliz",
    formato: "cards",
    opcoes: [
      {
        id: "minha-aula",
        rotulo: "Onde é minha aula?",
        detalhe: "Descubra sala, horário e professor",
        icone: "aula",
        destino: { tipo: "turma-curso" },
      },
      {
        id: "hoje",
        rotulo: "Aulas de hoje",
        detalhe: "O que está rolando no campus",
        icone: "hoje",
        destino: { tipo: "dia", dia: agora.getDay() },
      },
      {
        id: "professor",
        rotulo: "Encontrar professor",
        detalhe: "Onde e quando cada um dá aula",
        icone: "professor",
        destino: { tipo: "prof-modo" },
      },
      {
        id: "sala",
        rotulo: "Encontrar sala",
        detalhe: "Bloco e ocupação das salas",
        icone: "sala",
        destino: { tipo: "sala-bloco" },
      },
      {
        id: "avisos",
        rotulo: "Mural de avisos",
        detalhe:
          avisos === 0
            ? "Nenhum aviso no momento"
            : `${avisos} ${avisos === 1 ? "aviso ativo" : "avisos ativos"}`,
        icone: "avisos",
        destino: { tipo: "avisos" },
      },
    ],
  };
}

function turmaCurso(f: Frases, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.aulas);
  if (espera) return espera;

  const cursos = cursosDisponiveis(base.aulas.dados);
  if (cursos.length === 0) return simples(f.semTurmas(), "confuso");

  return {
    texto: f.perguntaCurso(),
    expressao: "curioso",
    formato: "lista",
    opcoes: cursos.map((c) => ({
      id: `curso-${c.nome}`,
      rotulo: c.nome,
      detalhe:
        c.semestres.length === 1
          ? rotuloSemestre(c.semestres[0])
          : `${c.semestres.length} semestres`,
      icone: "curso",
      // Curso com um semestre só: pula a pergunta do semestre.
      destino:
        c.semestres.length === 1
          ? { tipo: "turma-resultado", curso: c.nome, semestre: c.semestres[0] }
          : { tipo: "turma-semestre", curso: c.nome },
    })),
  };
}

function turmaSemestre(f: Frases, curso: string, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.aulas);
  if (espera) return espera;

  const semestres =
    cursosDisponiveis(base.aulas.dados).find((c) => c.nome === curso)?.semestres ?? [];

  return {
    texto: f.perguntaSemestre(curso),
    expressao: "curioso",
    formato: "chips",
    opcoes: semestres.map((s) => ({
      id: `sem-${s ?? "unico"}`,
      rotulo: rotuloSemestre(s),
      icone: "semestre",
      destino: { tipo: "turma-resultado", curso, semestre: s },
    })),
  };
}

function turmaResultado(
  f: Frases,
  curso: string,
  semestre: number | null,
  base: BaseConhecimento,
  agora: Date,
): Fala {
  const espera = aguardar(f, base.aulas);
  if (espera) return espera;

  const aulas = exibir(aulasDaTurma(base.aulas.dados, curso, semestre), agora);
  const titulo = `${curso} · ${rotuloSemestre(semestre)}`;

  if (aulas.length === 0) {
    return {
      ...simples(f.turmaSemAulas(), "confuso"),
      resultado: { tipo: "aulas", titulo, aulas, agruparPorDia: true },
    };
  }

  const hoje = agora.getDay();
  const agoraMesmo = aulas.find((a) => a.status === "agora");
  const proxima = proximaAula(aulas, agora);
  const aulasHoje = aulas.filter((a) => a.dia === hoje);

  let texto: string;
  let expressao: Expressao = "feliz";
  let destaque: AulaExibida | undefined;

  if (agoraMesmo) {
    destaque = agoraMesmo;
    texto = f.aulaAgora(agoraMesmo.disciplina, noLocal(agoraMesmo), comProfessor(agoraMesmo));
    expressao = "animado";
  } else if (proxima && proxima.aula.dia === hoje && proxima.minutos < 1440) {
    const a = proxima.aula;
    destaque = a;
    texto = f.aulaHoje(a.disciplina, a.inicio, noLocal(a), comProfessor(a));
    if (aulasHoje.length > 1) texto += f.variasHoje(aulasHoje.length);
  } else if (proxima) {
    const a = proxima.aula;
    destaque = a;
    const abertura = aulasHoje.length > 0 ? f.aulasAcabaram() : f.semAulaHoje();
    texto = `${abertura} ${f.proximaAula(quando(a.dia, agora), a.disciplina, a.inicio, noLocal(a))}`;
    expressao = "normal";
  } else {
    texto = f.semanaDaTurma();
  }

  return {
    texto,
    expressao,
    formato: "chips",
    opcoes: [],
    resultado: { tipo: "aulas", titulo, aulas, agruparPorDia: true, destaqueId: destaque?.id },
  };
}

function profModo(f: Frases, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.professores);
  if (espera) return espera;

  const total = base.professores.dados.length;
  if (total <= LIMITE_LISTA_DIRETA_PROFESSORES) return profLista(f, null, base);

  const temCursos = cursosDisponiveis(base.aulas.dados).length > 0;
  return {
    texto: f.comoProcurarProf(),
    expressao: "curioso",
    formato: "lista",
    opcoes: [
      ...(temCursos
        ? [
            {
              id: "prof-por-curso",
              rotulo: "Pelo curso",
              detalhe: "Veja quem dá aula em cada curso",
              icone: "curso" as const,
              destino: { tipo: "prof-curso" } as Passo,
            },
          ]
        : []),
      {
        id: "prof-por-letra",
        rotulo: "Pela inicial do nome",
        detalhe: "Toque na primeira letra",
        icone: "letra",
        destino: { tipo: "prof-letra" },
      },
      {
        id: "prof-todos",
        rotulo: "Lista completa",
        detalhe: `${total} docentes`,
        icone: "professor",
        destino: { tipo: "prof-lista", letra: null },
      },
    ],
  };
}

function profCurso(f: Frases, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.aulas, base.professores);
  if (espera) return espera;

  const cursos = cursosDisponiveis(base.aulas.dados);
  return {
    texto: f.perguntaCursoProf(),
    expressao: "curioso",
    formato: "lista",
    opcoes: cursos.map((c) => {
      const k = chave(c.nome);
      const qtd = new Set(
        base.aulas.dados
          .filter((a) => a.professorId !== null && a.cursos.some((x) => chave(x) === k))
          .map((a) => a.professorId),
      ).size;
      return {
        id: `prof-curso-${c.nome}`,
        rotulo: c.nome,
        detalhe: `${qtd} ${qtd === 1 ? "docente" : "docentes"}`,
        icone: "curso",
        destino: { tipo: "prof-lista-curso", curso: c.nome },
      };
    }),
  };
}

function profListaCurso(f: Frases, curso: string, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.aulas, base.professores);
  if (espera) return espera;

  const k = chave(curso);
  const aulasDoCurso = base.aulas.dados.filter((a) => a.cursos.some((c) => chave(c) === k));
  const profs = base.professores.dados.filter((p) =>
    aulasDoCurso.some((a) => a.professorId === p.id),
  );

  return {
    texto: f.profsDoCurso(curso, profs.length),
    expressao: "curioso",
    formato: "lista",
    opcoes: profs.map((p) => {
      // O que a pessoa ensina nesse curso — ajuda a reconhecer quem é.
      const disciplinas = [
        ...new Set(
          aulasDoCurso
            .filter((a) => a.professorId === p.id)
            .map((a) => (a.semestre ? `${a.disciplina} (${a.semestre}º sem.)` : a.disciplina)),
        ),
      ];
      const detalhe =
        disciplinas.length > 2
          ? `${disciplinas.slice(0, 2).join(" · ")} +${disciplinas.length - 2}`
          : disciplinas.join(" · ");
      return {
        id: `prof-${p.id}`,
        rotulo: p.nome,
        detalhe,
        icone: "professor",
        destino: { tipo: "prof-resultado", professorId: p.id },
      };
    }),
  };
}

function profLetra(f: Frases, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.professores);
  if (espera) return espera;

  const profs = base.professores.dados;
  if (profs.length <= LIMITE_LISTA_DIRETA_PROFESSORES) return profLista(f, null, base);

  return {
    texto: f.perguntaLetra(),
    expressao: "curioso",
    formato: "chips",
    opcoes: letrasDosProfessores(profs).map((l) => ({
      id: `letra-${l}`,
      rotulo: l,
      icone: "letra",
      destino: { tipo: "prof-lista", letra: l },
    })),
  };
}

function profLista(f: Frases, letra: string | null, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.professores);
  if (espera) return espera;

  const profs = base.professores.dados.filter(
    (p) => letra === null || letraInicial(p) === letra,
  );

  return {
    texto:
      letra === null
        ? f.quemProcura()
        : profs.length === 1
          ? f.umComLetra(letra)
          : f.variosComLetra(profs.length, letra),
    expressao: "curioso",
    formato: "lista",
    opcoes: profs.map((p) => {
      const qtd = aulasDoProfessor(base.aulas.dados, p.id).length;
      return {
        id: `prof-${p.id}`,
        rotulo: p.nome,
        detalhe:
          qtd === 0 ? "Sem aulas cadastradas" : `${qtd} ${qtd === 1 ? "aula" : "aulas"} por semana`,
        icone: "professor",
        destino: { tipo: "prof-resultado", professorId: p.id },
      };
    }),
  };
}

function profResultado(f: Frases, professorId: number, base: BaseConhecimento, agora: Date): Fala {
  const espera = aguardar(f, base.professores, base.aulas);
  if (espera) return espera;

  const professor = base.professores.dados.find((p) => p.id === professorId);
  if (!professor) return simples(f.naoAchei("esse cadastro"), "confuso");

  const aulas = exibir(aulasDoProfessor(base.aulas.dados, professorId), agora);
  const agoraMesmo = aulas.find((a) => a.status === "agora");
  const proximaHoje = aulas.find((a) => a.status === "em-breve" || a.status === "mais-tarde");

  let texto: string;
  let expressao: Expressao = "feliz";

  if (aulas.length === 0) {
    texto = f.profSemAulas(professor.nome);
    expressao = "confuso";
  } else if (agoraMesmo) {
    texto = f.profAgora(professor.nome, agoraMesmo.disciplina, noLocal(agoraMesmo));
    expressao = "animado";
  } else if (proximaHoje) {
    texto = f.profHoje(professor.nome, proximaHoje.inicio, proximaHoje.disciplina, noLocal(proximaHoje));
  } else {
    texto = f.profDias(professor.nome, diasRecorrentes(aulas.map((a) => a.dia)));
    expressao = "normal";
  }

  return {
    texto,
    expressao,
    formato: "chips",
    opcoes: [],
    resultado: {
      tipo: "professor",
      professor,
      aulas,
      destaqueId: (agoraMesmo ?? proximaHoje)?.id,
    },
  };
}

function salaBloco(f: Frases, base: BaseConhecimento, agora: Date): Fala {
  const espera = aguardar(f, base.salas);
  if (espera) return espera;

  const blocos = blocosDasSalas(base.salas.dados);
  if (blocos.length <= 1) return salaLista(f, TODOS_BLOCOS, base, agora);

  return {
    texto: f.perguntaBloco(),
    expressao: "curioso",
    formato: "chips",
    opcoes: [...blocos, TODOS_BLOCOS].map((b) => ({
      id: `bloco-${b}`,
      rotulo: rotuloBloco(b),
      icone: "bloco",
      destino: { tipo: "sala-lista", bloco: b },
    })),
  };
}

function salaLista(f: Frases, bloco: string, base: BaseConhecimento, agora: Date): Fala {
  const espera = aguardar(f, base.salas);
  if (espera) return espera;

  return {
    texto:
      bloco === TODOS_BLOCOS
        ? f.todasAsSalas()
        : bloco === SEM_BLOCO
          ? f.outrosLocais()
          : f.salasDoBloco(bloco),
    expressao: "curioso",
    formato: "chips",
    opcoes: salasDoBloco(base.salas.dados, bloco).map((s) => {
      const emUso = aulasDaSala(base.aulas.dados, s.id).some(
        (a) => statusDaAula(a, agora) === "agora",
      );
      return {
        id: `sala-${s.id}`,
        rotulo: s.nome,
        detalhe: emUso ? "Em aula agora" : undefined,
        icone: "sala",
        destino: { tipo: "sala-resultado", salaId: s.id },
      };
    }),
  };
}

function salaResultado(f: Frases, salaId: number, base: BaseConhecimento, agora: Date): Fala {
  const espera = aguardar(f, base.salas, base.aulas);
  if (espera) return espera;

  const sala = base.salas.dados.find((s) => s.id === salaId);
  if (!sala) return simples(f.naoAchei("essa sala"), "confuso");

  const aulas = exibir(aulasDaSala(base.aulas.dados, salaId), agora);
  const agoraMesmo = aulas.find((a) => a.status === "agora");
  const proximaHoje = aulas.find((a) => a.status === "em-breve" || a.status === "mais-tarde");

  const situacao = agoraMesmo
    ? f.salaAgora(agoraMesmo.disciplina, comProfessor(agoraMesmo))
    : proximaHoje
      ? f.salaHoje(proximaHoje.disciplina, proximaHoje.inicio)
      : aulas.length > 0
        ? f.salaLivreHoje()
        : f.salaSemAulas();

  return {
    texto: `${f.ondeFica(sala.nome, sala.bloco)} ${situacao}`,
    expressao: agoraMesmo ? "animado" : "feliz",
    formato: "chips",
    opcoes: [],
    resultado: { tipo: "sala", sala, aulas, destaqueId: (agoraMesmo ?? proximaHoje)?.id },
  };
}

function aulasDoDia(f: Frases, dia: number, base: BaseConhecimento, agora: Date): Fala {
  const espera = aguardar(f, base.aulas);
  if (espera) return espera;

  const hoje = agora.getDay();
  const ehHoje = dia === hoje;
  const aulas = exibir(base.aulas.dados.filter((a) => a.dia === dia), agora);
  const rolando = aulas.filter((a) => a.status === "agora").length;
  const noDia = NO_DIA[dia].replace(/^n/, "N");

  let texto: string;
  if (aulas.length === 0) {
    texto = f.diaSemAula(ehHoje, noDia);
  } else {
    texto = f.totalDoDia(ehHoje, noDia, aulas.length);
    if (ehHoje && rolando > 0) {
      texto += rolando === aulas.length ? f.todasRolando(rolando) : f.algumasRolando(rolando);
    }
  }

  // Dias da semana que têm aula (sempre inclui o dia escolhido e hoje).
  const dias = new Set(base.aulas.dados.map((a) => a.dia));
  dias.add(dia);
  dias.add(hoje);

  return {
    texto,
    expressao: aulas.length === 0 ? "normal" : rolando > 0 ? "animado" : "feliz",
    formato: "chips",
    resultado: {
      tipo: "aulas",
      titulo: ehHoje ? `Hoje · ${DIAS_TITULO[dia]}` : DIAS_TITULO[dia],
      aulas,
      agruparPorDia: false,
      vazio: `Nenhuma aula ${ehHoje ? "hoje" : NO_DIA[dia]}.`,
    },
    opcoes: [...dias]
      .sort((a, b) => a - b)
      .map((d) => ({
        id: `dia-${d}`,
        rotulo: DIAS_CURTOS[d],
        detalhe: d === hoje ? "hoje" : undefined,
        icone: "dia",
        ativa: d === dia,
        destino: { tipo: "dia", dia: d },
      })),
  };
}

function avisos(f: Frases, base: BaseConhecimento): Fala {
  const espera = aguardar(f, base.avisos);
  if (espera) return espera;

  const lista = base.avisos.dados;
  return {
    texto: f.avisos(lista.length),
    expressao: lista.length === 0 ? "normal" : "feliz",
    formato: "chips",
    opcoes: [],
    resultado: { tipo: "avisos", avisos: lista },
  };
}

/* ---------- Entrada ---------- */

export function responder(passo: Passo, base: BaseConhecimento, agora: Date): Fala {
  const f = criarFrases(agora.getTime());
  switch (passo.tipo) {
    case "menu":
      return menu(f, Boolean(passo.retorno), base, agora);
    case "turma-curso":
      return turmaCurso(f, base);
    case "turma-semestre":
      return turmaSemestre(f, passo.curso, base);
    case "turma-resultado":
      return turmaResultado(f, passo.curso, passo.semestre, base, agora);
    case "prof-modo":
      return profModo(f, base);
    case "prof-curso":
      return profCurso(f, base);
    case "prof-lista-curso":
      return profListaCurso(f, passo.curso, base);
    case "prof-letra":
      return profLetra(f, base);
    case "prof-lista":
      return profLista(f, passo.letra, base);
    case "prof-resultado":
      return profResultado(f, passo.professorId, base, agora);
    case "sala-bloco":
      return salaBloco(f, base, agora);
    case "sala-lista":
      return salaLista(f, passo.bloco, base, agora);
    case "sala-resultado":
      return salaResultado(f, passo.salaId, base, agora);
    case "dia":
      return aulasDoDia(f, passo.dia, base, agora);
    case "avisos":
      return avisos(f, base);
  }
}
