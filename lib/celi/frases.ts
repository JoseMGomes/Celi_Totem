/**
 * Banco de frases da CELI — várias versões de cada fala pra ela não soar
 * repetitiva. Pra adicionar uma frase nova, é só incluir mais um item na lista.
 *
 * O sorteio é determinístico pela `semente` (o instante em que o passo da
 * conversa foi aberto): a mesma tela mantém a mesma frase mesmo se os dados
 * forem re-sincronizados, mas cada nova navegação sorteia de novo.
 */

function misturar(semente: number, sal: string): number {
  let h = (2166136261 ^ (semente % 2147483647)) >>> 0;
  for (let i = 0; i < sal.length; i++) {
    h = Math.imul(h ^ sal.charCodeAt(i), 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}

export function sortear<T>(lista: readonly T[], semente: number, sal: string): T {
  return lista[misturar(semente, sal) % lista.length];
}

/** Frases ditas ao acordar (antes do menu). */
export const FRASES_ACORDAR = [
  "Hum?! Alguém aí?",
  "Opa! Acordei!",
  "Hã? Ah, oi!",
  "Bip bop... ligando!",
  "Iniciando sistemas...",
  "Ahh, que soneca boa!",
] as const;

export function criarFrases(semente: number) {
  const s = <T,>(sal: string, lista: readonly T[]) => sortear(lista, semente, sal);

  return {
    /* ---------- Menu ---------- */
    saudacao: (oi: string) =>
      s("saudacao", [
        `${oi}! Eu sou a CELI, a central eletrônica do CEUNSP. Como posso te ajudar?`,
        `${oi}! CELI online e pronta pra ajudar. O que você precisa?`,
        `Opa, ${oi.toLowerCase()}! Sou a CELI. Quer achar sua sala, um professor ou ver os avisos?`,
        `${oi}! Sistemas carregados e café virtual tomado. Em que posso ajudar?`,
        `${oi}! Que bom te ver por aqui. Me diz o que você procura.`,
        `${oi}! Aqui é a CELI, sua guia do campus. Por onde a gente começa?`,
      ]),
    maisAlgumaCoisa: () =>
      s("retorno", [
        "Posso te ajudar com mais alguma coisa?",
        "Mais alguma dúvida? Tô por aqui.",
        "E agora, o que mais você quer saber?",
        "Pronto! Quer consultar mais alguma coisa?",
        "Pode mandar a próxima pergunta!",
      ]),

    /* ---------- Espera / erro ---------- */
    aguardando: () =>
      s("aguardando", [
        "Só um instante, estou consultando a central do CEUNSP...",
        "Peraí, tô buscando isso nos meus circuitos...",
        "Conectando com a central... quase lá!",
        "Processando... só um segundinho.",
      ]),
    erroConexao: () =>
      s("erro", [
        "Hmm... não consegui falar com a central agora. Quer que eu tente de novo?",
        "Ops, minha conexão deu uma falhada. Tento de novo?",
        "Eita, a central não respondeu. Vamos tentar outra vez?",
      ]),
    naoAchei: (oque: string) =>
      s("nao-achei", [
        `Hmm, não achei ${oque}. Talvez o cadastro tenha mudado.`,
        `Ué, ${oque} sumiu dos meus registros. Pode ter sido atualizado.`,
      ]),

    /* ---------- Minha aula ---------- */
    perguntaCurso: () =>
      s("curso", [
        "Vamos achar sua aula! Primeiro: qual é o seu curso?",
        "Bora lá! Qual curso você faz?",
        "Me conta: de qual curso você é?",
        "Missão: encontrar sua aula. Primeiro passo: qual é o seu curso?",
        "Deixa comigo! Qual é o seu curso?",
      ]),
    semTurmas: () =>
      s("sem-turmas", [
        "Ainda não tenho nenhuma turma cadastrada. Procure a secretaria, tá?",
        "Hmm, meus registros de turmas estão vazios. A secretaria pode te ajudar!",
      ]),
    perguntaSemestre: (curso: string) =>
      s("semestre", [
        `Boa! ${curso}. E em qual semestre você está?`,
        `${curso}, ótima escolha! Qual semestre?`,
        `Anotado: ${curso}. Agora me diz o semestre.`,
        `Show! E você está em qual semestre de ${curso}?`,
        "Quase lá! Qual é o seu semestre?",
      ]),
    turmaSemAulas: () =>
      s("turma-vazia", [
        "Não encontrei aulas cadastradas para essa turma. Vale confirmar na secretaria.",
        "Hmm, essa turma ainda não tem aulas no meu sistema. A secretaria pode confirmar.",
      ]),
    aulaAgora: (disciplina: string, local: string, prof: string) =>
      s("aula-agora", [
        `Sua aula de ${disciplina} já começou! É ${local}${prof}. Corre!`,
        `Corre que já começou! ${disciplina}, ${local}${prof}.`,
        `Atenção: ${disciplina} está rolando agora, ${local}${prof}. Vai que dá tempo!`,
        `Ih, a aula de ${disciplina} já tá acontecendo! É ${local}${prof}.`,
      ]),
    aulaHoje: (disciplina: string, hora: string, local: string, prof: string) =>
      s("aula-hoje", [
        `Hoje você tem ${disciplina} às ${hora}, ${local}${prof}.`,
        `Achei! Hoje tem ${disciplina} às ${hora}, ${local}${prof}.`,
        `Sua próxima aula é ${disciplina}, às ${hora}, ${local}${prof}. Não se atrase!`,
        `Anota aí: ${disciplina}, às ${hora}, ${local}${prof}.`,
      ]),
    variasHoje: (qtd: number) =>
      s("varias-hoje", [
        ` Hoje são ${qtd} aulas, essa é a próxima.`,
        ` Você tem ${qtd} aulas hoje, essa vem primeiro.`,
      ]),
    semAulaHoje: () =>
      s("sem-aula-hoje", [
        "Hoje sua turma não tem aula.",
        "Hoje é folga pra sua turma!",
        "Nada de aula hoje pra você.",
        "Hoje sua turma está livre.",
      ]),
    aulasAcabaram: () =>
      s("acabaram", [
        "Suas aulas de hoje já terminaram.",
        "Por hoje acabou!",
        "Missão de hoje cumprida: as aulas já terminaram.",
      ]),
    proximaAula: (quando: string, disciplina: string, hora: string, local: string) =>
      s("proxima", [
        `A próxima é ${quando}: ${disciplina}, às ${hora}, ${local}.`,
        `Sua próxima aula é ${quando}: ${disciplina}, às ${hora}, ${local}.`,
        `Fica de olho: ${quando} tem ${disciplina}, às ${hora}, ${local}.`,
      ]),
    semanaDaTurma: () =>
      s("semana", ["Aqui está a semana da sua turma.", "Olha a agenda da sua turma!"]),

    /* ---------- Professores ---------- */
    perguntaLetra: () =>
      s("letra", [
        "Qual é a primeira letra do nome do professor ou da professora?",
        "Me dá uma pista: com que letra começa o nome?",
        "Vamos encontrar! Toque na primeira letra do nome.",
        "Com qual letra começa o nome de quem você procura?",
      ]),
    comoProcurarProf: () =>
      s("como-prof", [
        "Bora encontrar! Como você prefere procurar?",
        "Vamos achar essa pessoa! Por onde a gente começa?",
        "Deixa comigo. Quer procurar pelo curso, pela inicial ou ver todo mundo?",
      ]),
    perguntaCursoProf: () =>
      s("curso-prof", [
        "De qual curso é o professor ou a professora?",
        "Me diz o curso que eu mostro quem dá aula nele.",
        "Qual curso? Eu filtro os docentes pra você.",
      ]),
    profsDoCurso: (curso: string, qtd: number) =>
      s("profs-curso", [
        `Esses são os ${qtd} docentes de ${curso}. Quem você procura?`,
        `Em ${curso} dão aula essas ${qtd} pessoas. É alguma delas?`,
        `Achei ${qtd} docentes em ${curso}. Toque em quem você procura.`,
      ]),
    quemProcura: () =>
      s("quem", [
        "Aqui estão todos os docentes. Quem você procura?",
        "Essa é a lista completa. Qual docente você procura?",
      ]),
    umComLetra: (letra: string) =>
      s("um-letra", [
        `Com a letra ${letra} só encontrei uma pessoa. É essa?`,
        `Só tem uma pessoa com ${letra} aqui. Será que é essa?`,
      ]),
    variosComLetra: (qtd: number, letra: string) =>
      s("varios-letra", [
        `Encontrei ${qtd} com a letra ${letra}. Quem você procura?`,
        `Com ${letra} tenho ${qtd} pessoas. Qual delas?`,
        `Olha só quem começa com ${letra}. É alguma dessas ${qtd} pessoas?`,
      ]),
    profSemAulas: (nome: string) =>
      s("prof-vazio", [
        `Não encontrei aulas cadastradas para ${nome}.`,
        `Hmm, ${nome} ainda não tem aulas cadastradas aqui.`,
      ]),
    profAgora: (nome: string, disciplina: string, local: string) =>
      s("prof-agora", [
        `${nome} está em aula agora: ${disciplina}, ${local}.`,
        `Achei! ${nome} está dando aula de ${disciplina} neste momento, ${local}.`,
        `Neste momento, ${nome} está com a turma de ${disciplina}, ${local}.`,
      ]),
    profHoje: (nome: string, hora: string, disciplina: string, local: string) =>
      s("prof-hoje", [
        `${nome} tem aula hoje às ${hora}: ${disciplina}, ${local}.`,
        `Hoje ${nome} dá aula às ${hora}, ${local}: ${disciplina}.`,
        `Quer encontrar ${nome}? Hoje tem aula às ${hora}, ${local}.`,
      ]),
    profDias: (nome: string, dias: string) =>
      s("prof-dias", [
        `${nome} dá aula ${dias}. Os detalhes estão aqui embaixo.`,
        `Hoje não tem aula de ${nome}, mas tem ${dias}. Olha a agenda aqui embaixo.`,
        `${nome} costuma estar no campus ${dias}.`,
      ]),

    /* ---------- Salas ---------- */
    perguntaBloco: () =>
      s("bloco", [
        "Em qual bloco fica a sala? Se não souber, toque em “Todas as salas”.",
        "Sabe o bloco? Se não souber, toca em “Todas as salas” que eu mostro tudo.",
        "Me diz o bloco da sala — ou veja todas as salas.",
      ]),
    salasDoBloco: (bloco: string) =>
      s("salas-bloco", [
        `Essas são as salas do Bloco ${bloco}. Qual você procura?`,
        `Bloco ${bloco} na tela! Qual sala?`,
        `Aqui estão as salas do Bloco ${bloco}. Toque na que você quer.`,
      ]),
    todasAsSalas: () =>
      s("todas-salas", [
        "Essas são todas as salas que eu conheço. Qual você procura?",
        "Aqui está o mapa completo de salas. Qual delas?",
      ]),
    outrosLocais: () =>
      s("outros-locais", [
        "Esses são os outros locais do campus. Qual você procura?",
        "Aqui estão os outros espaços do campus. Qual deles?",
      ]),
    ondeFica: (sala: string, bloco: string | null) =>
      bloco
        ? s("onde-fica", [
            `${sala} fica no Bloco ${bloco}.`,
            `Encontrei! ${sala} fica no Bloco ${bloco}.`,
            `${sala}? Fica no Bloco ${bloco}.`,
          ])
        : s("onde-fica-sem", [`Achei: ${sala}.`, `Encontrei: ${sala}.`]),
    salaAgora: (disciplina: string, prof: string) =>
      s("sala-agora", [
        `Agora está rolando ${disciplina} lá${prof}.`,
        `Neste momento tem aula de ${disciplina} lá${prof}.`,
      ]),
    salaHoje: (disciplina: string, hora: string) =>
      s("sala-hoje", [
        `Hoje tem ${disciplina} lá às ${hora}.`,
        `Mais tarde, às ${hora}, tem ${disciplina} lá.`,
      ]),
    salaLivreHoje: () =>
      s("sala-livre", ["Hoje não tem aula cadastrada lá.", "Por hoje, está livre."]),
    salaSemAulas: () =>
      s("sala-vazia", [
        "Não tem nenhuma aula cadastrada lá.",
        "Ainda não tem aulas cadastradas nesse local.",
      ]),

    /* ---------- Aulas do dia ---------- */
    totalDoDia: (ehHoje: boolean, noDia: string, qtd: number) => {
      const aulas = `${qtd} ${qtd === 1 ? "aula" : "aulas"}`;
      return ehHoje
        ? s("total-hoje", [
            `Hoje tem ${aulas} no campus.`,
            `Hoje o campus tem ${aulas}.`,
            `Bora ver: hoje são ${aulas} no campus.`,
          ])
        : s("total-dia", [`${noDia} tem ${aulas}.`, `${noDia} são ${aulas} no campus.`]);
    },
    todasRolando: (qtd: number) =>
      qtd === 1
        ? s("rolando-1", [" Ela está acontecendo agora!", " Ela já está rolando!"])
        : s("rolando-todas", [" Todas estão acontecendo agora!", " Tá tudo rolando agora!"]),
    algumasRolando: (qtd: number) =>
      qtd === 1
        ? s("rolando-uma", [" Uma está acontecendo agora!", " Uma delas já começou!"])
        : s("rolando-algumas", [
            ` ${qtd} estão acontecendo agora!`,
            ` ${qtd} já estão rolando!`,
          ]),
    diaSemAula: (ehHoje: boolean, noDia: string) =>
      ehHoje
        ? s("hoje-vazio", [
            "Hoje não tem aula cadastrada. Quer ver outro dia?",
            "Hoje o campus está tranquilo, sem aulas cadastradas. Dá uma olhada nos outros dias!",
          ])
        : s("dia-vazio", [
            `${noDia} não tem aula cadastrada.`,
            `${noDia} o campus fica tranquilo, sem aulas.`,
          ]),

    /* ---------- Avisos ---------- */
    avisos: (qtd: number) =>
      qtd === 0
        ? s("avisos-0", [
            "O mural está tranquilo: nenhum aviso ativo agora.",
            "Nenhuma novidade no mural por enquanto.",
            "Mural limpinho! Nenhum aviso no momento.",
          ])
        : qtd === 1
          ? s("avisos-1", ["Tem 1 aviso no mural. Dá uma olhada!", "Tem uma novidade no mural!"])
          : s("avisos-n", [
              `Tem ${qtd} avisos no mural. Dá uma olhada!`,
              `Olha as novidades: ${qtd} avisos fresquinhos.`,
              `Separei os ${qtd} avisos do mural pra você.`,
            ]),
  };
}

export type Frases = ReturnType<typeof criarFrases>;
