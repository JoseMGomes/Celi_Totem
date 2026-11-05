export const DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const DIAS_TITULO = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/** "no domingo", "na segunda-feira", ... */
export const NO_DIA = [
  "no domingo",
  "na segunda-feira",
  "na terça-feira",
  "na quarta-feira",
  "na quinta-feira",
  "na sexta-feira",
  "no sábado",
];

/** "aos domingos", "às segundas", ... */
const NOS_DIAS = [
  "aos domingos",
  "às segundas",
  "às terças",
  "às quartas",
  "às quintas",
  "às sextas",
  "aos sábados",
];

/** Remove acento, caixa e espaços extras — pra comparar textos. */
export function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function limparEspacos(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

/** "SALA 019B" -> "Sala 019B". Mantém como está o que já vem em caixa mista. */
export function suavizarCaixaAlta(texto: string): string {
  const limpo = limparEspacos(texto);
  if (limpo !== limpo.toUpperCase() || limpo === limpo.toLowerCase()) return limpo;
  return limpo
    .split(" ")
    .map((p) =>
      /^[A-ZÀ-Ý]{2,}$/.test(p) ? p[0] + p.slice(1).toLowerCase() : p,
    )
    .join(" ");
}

/** ["a"] -> "a"; ["a","b"] -> "a e b"; ["a","b","c"] -> "a, b e c" */
export function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** [1, 3] -> "às segundas e às quartas" */
export function diasRecorrentes(dias: number[]): string {
  const unicos = [...new Set(dias)].sort((a, b) => a - b);
  return juntar(unicos.map((d) => NOS_DIAS[d]));
}

export function saudacao(data: Date): string {
  const h = data.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function minutosDoDia(data: Date): number {
  return data.getHours() * 60 + data.getMinutes();
}

/** "19:00" -> 1140. Valor inválido vira 0. */
export function horarioParaMinutos(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Nome do professor sem o título ("Prof.", "Profª.", "Profa."). */
export function nomeSemTitulo(nome: string): string {
  return nome.replace(/^\s*prof(?:ª|a|º|essora|essor)?\.?\s*/i, "").trim();
}

/** Ajusta o texto pra síntese de voz (abreviações e emojis). */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/\bProfª\.?\s*/g, "Professora ")
    .replace(/\bProfa\.\s*/g, "Professora ")
    .replace(/\bProf\.\s*/g, "Professor ")
    .replace(/[—–]/g, ", ")
    .replace(/·/g, ", ")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
