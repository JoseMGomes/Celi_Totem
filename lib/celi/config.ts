/**
 * Ajustes de comportamento do totem. Tudo que é "tempo" ou "liga/desliga"
 * mora aqui pra não ficar espalhado pelos componentes.
 */

/** Tempo sem nenhum toque até a CELI perguntar "Ainda está aí?". */
export const TEMPO_INATIVIDADE_MS = 45_000;

/** Contagem regressiva do "Ainda está aí?" antes de dormir de vez. */
export const TEMPO_AVISO_SONO_MS = 15_000;

/** Intervalo de sincronização com o backend (aulas, salas, professores, avisos). */
export const INTERVALO_SINCRONIA_MS = 5 * 60_000;

/** Timeout de cada requisição. O backend no Render pode demorar no cold start. */
export const TIMEOUT_API_MS = 60_000;

/** Intervalo de troca dos avisos no letreiro do rodapé. */
export const INTERVALO_LETREIRO_MS = 10_000;

/** Pausa "pensando" entre a escolha de uma opção e a resposta. */
export const TEMPO_PENSANDO_MS = 450;

/** Duração do "Hum? Alguém aí?" ao acordar. */
export const TEMPO_ACORDANDO_MS = 1_400;

/** A CELI fala em voz alta (Web Speech API) por padrão? Dá pra desligar no botão do topo. */
export const VOZ_ATIVA_PADRAO = true;

/** Antecedência (em minutos) pra uma aula ser considerada "em breve". */
export const MINUTOS_EM_BREVE = 60;

/** Até quantos professores dá pra listar direto, sem perguntar a letra inicial. */
export const LIMITE_LISTA_DIRETA_PROFESSORES = 10;
