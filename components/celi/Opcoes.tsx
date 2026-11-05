"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChevronRight } from "lucide-react";
import type { Fala, Opcao } from "@/lib/celi/dialogo";
import Icone from "./Icone";

gsap.registerPlugin(useGSAP);

interface Props {
  opcoes: Opcao[];
  formato: Fala["formato"];
  onEscolher: (opcao: Opcao) => void;
  /** Muda a cada passo da conversa — dispara a animação de entrada. */
  chave: string;
  desabilitado?: boolean;
}

export default function Opcoes({ opcoes, formato, onEscolher, chave, desabilitado }: Props) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // fromTo + clearProps: estado final explícito e sem estilo inline sobrando
      // (a transition CSS dos botões não pode "segurar" o transform no meio).
      gsap.fromTo(
        ".celi-opcao",
        { opacity: 0, y: 26, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "back.out(1.6)",
          delay: 0.15,
          clearProps: "opacity,transform,translate,scale",
        },
      );
    },
    { scope: raiz, dependencies: [chave] },
  );

  if (opcoes.length === 0) return null;

  const clicar = (o: Opcao) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!desabilitado) onEscolher(o);
  };

  if (formato === "cards") {
    return (
      <div ref={raiz} className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {opcoes.map((o, i) => (
          <button
            key={o.id}
            onClick={clicar(o)}
            className={`celi-opcao celi-botao group flex min-h-24 items-center gap-4 rounded-3xl p-4 text-left sm:p-5 ${
              opcoes.length % 2 === 1 && i === opcoes.length - 1 ? "sm:col-span-2" : ""
            }`}
          >
            {o.icone && (
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300 transition-colors group-active:bg-cyan-300 group-active:text-black sm:h-16 sm:w-16">
                <Icone nome={o.icone} className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold leading-tight text-white sm:text-xl">
                {o.rotulo}
              </span>
              {o.detalhe && (
                <span className="mt-1 block text-sm font-medium text-slate-400 sm:text-base">
                  {o.detalhe}
                </span>
              )}
            </span>
            <ChevronRight className="h-6 w-6 shrink-0 text-cyan-300/60" />
          </button>
        ))}
      </div>
    );
  }

  if (formato === "lista") {
    return (
      <div ref={raiz} className="grid w-full grid-cols-1 gap-3 xl:grid-cols-2">
        {opcoes.map((o) => (
          <button
            key={o.id}
            onClick={clicar(o)}
            className="celi-opcao celi-botao group flex min-h-20 items-center gap-4 rounded-2xl px-5 py-3 text-left"
          >
            {o.icone && (
              <Icone nome={o.icone} className="h-6 w-6 shrink-0 text-cyan-300" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-bold text-white">{o.rotulo}</span>
              {o.detalhe && (
                <span className="block text-sm font-medium text-slate-400">{o.detalhe}</span>
              )}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-cyan-300/60" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={raiz} className="flex w-full flex-wrap gap-3">
      {opcoes.map((o) => (
        <button
          key={o.id}
          onClick={clicar(o)}
          className={`celi-opcao flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold transition-colors active:scale-95 ${
            o.ativa
              ? "border border-cyan-300 bg-cyan-300 text-black shadow-[0_0_24px_rgba(0,229,255,0.6)]"
              : "celi-botao text-white"
          }`}
        >
          <span>{o.rotulo}</span>
          {o.detalhe && (
            <span className={`text-xs font-semibold uppercase tracking-wider ${o.ativa ? "text-black/70" : "text-emerald-300"}`}>
              · {o.detalhe}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
