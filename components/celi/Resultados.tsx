"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Clock3,
  DoorOpen,
  Mail,
  Megaphone,
  Pointer,
  UserRound,
} from "lucide-react";
import type { Passo, Resultado } from "@/lib/celi/dialogo";
import { DIAS_TITULO } from "@/lib/celi/texto";
import type { AulaExibida, Aviso, StatusAula } from "@/lib/celi/tipos";

gsap.registerPlugin(useGSAP);

const SELO: Record<StatusAula, { texto: string; classe: string }> = {
  agora: {
    texto: "Acontecendo agora",
    classe: "border-emerald-300/60 bg-emerald-400/15 text-emerald-300 celi-pulso",
  },
  "em-breve": { texto: "Começa em breve", classe: "border-amber-300/60 bg-amber-400/15 text-amber-200" },
  "mais-tarde": { texto: "Mais tarde", classe: "border-cyan-300/40 bg-cyan-400/10 text-cyan-200" },
  encerrada: { texto: "Encerrada", classe: "border-white/15 bg-white/5 text-slate-400" },
};

type Ir = (passo: Passo) => void;

/** Pílula de informação; vira botão quando dá pra navegar a partir dela. */
function Pilula({
  icone,
  children,
  destino,
  onIr,
}: {
  icone: React.ReactNode;
  children: React.ReactNode;
  destino?: Passo;
  onIr?: Ir;
}) {
  const base =
    "inline-flex min-h-12 items-center gap-2 rounded-xl border bg-black/40 px-3 py-2 text-base font-bold text-white sm:text-lg";
  if (!destino || !onIr) {
    return <span className={`${base} border-white/10`}>{icone}{children}</span>;
  }
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onIr(destino);
      }}
      className={`${base} border-cyan-300/40 transition-all active:scale-95 active:bg-cyan-300/20`}
    >
      {icone}
      {children}
      <ChevronRight className="h-4 w-4 text-cyan-300/70" />
    </button>
  );
}

function CartaoAula({
  aula,
  destaque,
  ocultar,
  onIr,
}: {
  aula: AulaExibida;
  destaque: boolean;
  ocultar?: "professor" | "sala";
  onIr?: Ir;
}) {
  const encerrada = aula.status === "encerrada";
  return (
    <article
      className={`celi-item relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
        destaque
          ? "border-cyan-300/80 bg-cyan-400/[0.09] shadow-[0_0_40px_rgba(0,229,255,0.25)]"
          : "border-white/10 bg-white/[0.03]"
      } ${encerrada ? "opacity-55" : ""}`}
    >
      {destaque && <span className="absolute inset-y-0 left-0 w-1.5 bg-cyan-300 shadow-[0_0_18px_#00E5FF]" />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/80">{aula.turma}</p>
          <h4 className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">{aula.disciplina}</h4>
        </div>
        {aula.status && (
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${SELO[aula.status].classe}`}>
            {SELO[aula.status].texto}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-black/40 px-3 py-2 font-display text-base font-bold text-cyan-200 sm:text-lg">
          <Clock3 className="h-5 w-5" />
          {aula.inicio} – {aula.fim}
        </span>
        {ocultar !== "sala" && (
          <Pilula
            icone={<DoorOpen className="h-5 w-5 text-cyan-300" />}
            destino={aula.salaId ? { tipo: "sala-resultado", salaId: aula.salaId } : undefined}
            onIr={onIr}
          >
            {aula.sala ?? "Sala a definir"}
            {aula.bloco && <span className="font-semibold text-slate-400">· Bloco {aula.bloco}</span>}
          </Pilula>
        )}
        {ocultar !== "professor" && (
          <Pilula
            icone={<UserRound className="h-5 w-5 text-cyan-300" />}
            destino={
              aula.professorId ? { tipo: "prof-resultado", professorId: aula.professorId } : undefined
            }
            onIr={onIr}
          >
            <span className="font-semibold text-slate-200">{aula.professor ?? "Professor a definir"}</span>
          </Pilula>
        )}
      </div>
    </article>
  );
}

function ListaAulas({
  aulas,
  agruparPorDia,
  destaqueId,
  ocultar,
  vazio,
  onIr,
}: {
  aulas: AulaExibida[];
  agruparPorDia: boolean;
  destaqueId?: number;
  ocultar?: "professor" | "sala";
  vazio?: string;
  onIr?: Ir;
}) {
  if (aulas.length === 0) {
    return (
      <div className="celi-item flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-400">
        <CalendarClock className="h-12 w-12 opacity-60" />
        <p className="text-lg font-semibold">{vazio ?? "Nenhuma aula cadastrada."}</p>
      </div>
    );
  }

  const dica = onIr && (
    <p className="celi-item flex items-center gap-2 text-sm font-medium text-slate-400">
      <Pointer className="h-4 w-4 text-cyan-300/80" />
      {ocultar === "sala"
        ? "Toque no professor para saber mais"
        : ocultar === "professor"
          ? "Toque na sala para saber mais"
          : "Toque na sala ou no professor para saber mais"}
    </p>
  );

  if (!agruparPorDia) {
    return (
      <div className="flex flex-col gap-3">
        {dica}
        {aulas.map((a) => (
          <CartaoAula key={a.id} aula={a} destaque={a.id === destaqueId} ocultar={ocultar} onIr={onIr} />
        ))}
      </div>
    );
  }

  const dias = [...new Set(aulas.map((a) => a.dia))];
  return (
    <div className="flex flex-col gap-5">
      {dica}
      {dias.map((d) => (
        <section key={d} className="flex flex-col gap-3">
          <h5 className="celi-item flex items-center gap-3 font-display text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
            <span className="h-px w-6 bg-cyan-300/60" />
            {DIAS_TITULO[d]}
            {aulas.find((a) => a.dia === d)?.status !== null && (
              <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] tracking-widest text-black">HOJE</span>
            )}
            <span className="h-px flex-1 bg-gradient-to-r from-cyan-300/40 to-transparent" />
          </h5>
          {aulas
            .filter((a) => a.dia === d)
            .map((a) => (
              <CartaoAula key={a.id} aula={a} destaque={a.id === destaqueId} ocultar={ocultar} onIr={onIr} />
            ))}
        </section>
      ))}
    </div>
  );
}

function Cabecalho({
  icone,
  rotulo,
  titulo,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="celi-item flex items-center gap-4 rounded-3xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400/10 to-transparent p-5">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cyan-300/40 bg-black/50 text-cyan-300">
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/80">{rotulo}</p>
        <h3 className="truncate text-2xl font-black text-white sm:text-3xl">{titulo}</h3>
        {children}
      </div>
    </header>
  );
}

function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) {
    return (
      <div className="celi-item flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-400">
        <Megaphone className="h-12 w-12 opacity-60" />
        <p className="text-lg font-semibold">Nenhum aviso ativo no momento.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {avisos.map((a) => (
        <article key={a.id} className="celi-item flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <Megaphone className="mt-1 h-7 w-7 shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-snug text-white sm:text-xl">{a.mensagem}</p>
            {a.dataExpiracao && (
              <p className="mt-2 text-sm font-medium text-slate-400">
                Válido até{" "}
                {new Date(a.dataExpiracao).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Resultados({
  resultado,
  chave,
  onIr,
}: {
  resultado: Resultado;
  chave: string;
  /** Navega pra sala/professor ao tocar nas pílulas dos cards. */
  onIr?: Ir;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".celi-item",
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.45,
          stagger: 0.04,
          ease: "power3.out",
          delay: 0.1,
          clearProps: "opacity,transform,translate",
        },
      );
    },
    { scope: raiz, dependencies: [chave] },
  );

  return (
    <div ref={raiz} className="flex flex-col gap-4">
      {resultado.tipo === "aulas" && (
        <>
          {/* O título (e os filtros) ficam fora da rolagem, no Totem. */}
          <ListaAulas
            aulas={resultado.aulas}
            agruparPorDia={resultado.agruparPorDia}
            destaqueId={resultado.destaqueId}
            vazio={resultado.vazio}
            onIr={onIr}
          />
        </>
      )}

      {resultado.tipo === "professor" && (
        <>
          <Cabecalho icone={<UserRound className="h-8 w-8" />} rotulo="Docente" titulo={resultado.professor.nome}>
            {resultado.professor.email && (
              <p className="mt-1 flex items-center gap-2 truncate text-base font-medium text-slate-300">
                <Mail className="h-4 w-4 shrink-0 text-cyan-300" />
                {resultado.professor.email}
              </p>
            )}
          </Cabecalho>
          <ListaAulas
            aulas={resultado.aulas}
            agruparPorDia
            destaqueId={resultado.destaqueId}
            ocultar="professor"
            vazio="Nenhuma aula cadastrada para este docente."
            onIr={onIr}
          />
        </>
      )}

      {resultado.tipo === "sala" && (
        <>
          <Cabecalho
            icone={<DoorOpen className="h-8 w-8" />}
            rotulo={resultado.sala.bloco ? `Bloco ${resultado.sala.bloco}` : "Campus"}
            titulo={resultado.sala.nome}
          >
            <p className="mt-1 flex items-center gap-2 text-base font-medium text-slate-300">
              <Building2 className="h-4 w-4 text-cyan-300" />
              {resultado.aulas.some((a) => a.status === "agora") ? (
                <span className="font-bold text-emerald-300">Ocupada agora</span>
              ) : (
                <span>Livre neste momento</span>
              )}
            </p>
          </Cabecalho>
          <ListaAulas
            aulas={resultado.aulas}
            agruparPorDia
            destaqueId={resultado.destaqueId}
            ocultar="sala"
            vazio="Nenhuma aula cadastrada nesta sala."
            onIr={onIr}
          />
        </>
      )}

      {resultado.tipo === "avisos" && <ListaAvisos avisos={resultado.avisos} />}
    </div>
  );
}
