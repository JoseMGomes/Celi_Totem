"use client";

import { motion } from "framer-motion";
import { Hand } from "lucide-react";
import { TEMPO_AVISO_SONO_MS } from "@/lib/celi/config";

/**
 * Overlay "Ainda está aí?" com contagem regressiva antes da CELI dormir.
 * Qualquer toque na tela (capturado pela página) cancela.
 */
export default function AvisoSono({ restanteMs }: { restanteMs: number }) {
  const segundos = Math.ceil(restanteMs / 1000);
  const fracao = Math.max(0, Math.min(1, restanteMs / TEMPO_AVISO_SONO_MS));
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/55 pb-[12vh] backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        className="flex items-center gap-6 rounded-[2rem] border border-cyan-300/50 bg-[#02121a]/90 px-8 py-6 shadow-[0_0_60px_rgba(0,229,255,0.3)]"
      >
        <div className="relative grid h-32 w-32 place-items-center">
          <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="#00E5FF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - fracao)}
              style={{ transition: "stroke-dashoffset 0.25s linear", filter: "drop-shadow(0 0 8px #00E5FF)" }}
            />
          </svg>
          <span className="font-display text-4xl font-black text-white">{segundos}</span>
        </div>
        <div>
          <p className="text-3xl font-black text-white sm:text-4xl">Ainda está aí?</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-cyan-200">
            <Hand className="h-5 w-5" />
            Toque na tela pra continuar
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
