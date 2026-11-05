"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { INTERVALO_LETREIRO_MS } from "@/lib/celi/config";
import type { Aviso } from "@/lib/celi/tipos";

/** Letreiro do rodapé com os avisos ativos, trocando sozinho. */
export default function Letreiro({ avisos }: { avisos: Aviso[] }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (avisos.length <= 1) return;
    const id = setInterval(() => setIndice((i) => i + 1), INTERVALO_LETREIRO_MS);
    return () => clearInterval(id);
  }, [avisos.length]);

  if (avisos.length === 0) return null;
  const atual = avisos[indice % avisos.length];

  return (
    <div className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl sm:px-6">
      <span className="absolute inset-y-0 left-0 w-1 bg-cyan-300 shadow-[0_0_16px_#00E5FF]" />
      <span className="flex shrink-0 items-center gap-2 border-r border-white/10 pr-4">
        <Megaphone className="h-6 w-6 animate-pulse text-cyan-300" />
        <span className="hidden font-display text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 sm:inline">
          Mural
        </span>
      </span>
      <div className="relative min-h-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={atual.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45 }}
            className="line-clamp-2 text-base font-semibold text-white sm:text-xl"
          >
            {atual.mensagem}
          </motion.p>
        </AnimatePresence>
      </div>
      {avisos.length > 1 && (
        <span className="shrink-0 font-display text-xs font-bold text-slate-500">
          {(indice % avisos.length) + 1}/{avisos.length}
        </span>
      )}
    </div>
  );
}
