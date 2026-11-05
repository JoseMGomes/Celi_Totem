"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import gsap from "gsap";

interface Props {
  texto: string;
  /** Avisado no início/fim da digitação — usado pra mexer a boca da CELI. */
  onDigitando?: (digitando: boolean) => void;
}

/**
 * Balão da CELI com efeito de digitação. Deve ser montado com `key={texto}`
 * pra reiniciar a cada fala nova.
 */
export default function BalaoFala({ texto, onDigitando }: Props) {
  const [visiveis, setVisiveis] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const avisar = useEffectEvent((d: boolean) => onDigitando?.(d));

  useEffect(() => {
    const estado = { n: 0 };
    avisar(true);
    gsap.fromTo(
      caixa.current,
      { opacity: 0, y: 14, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" },
    );
    const t = gsap.to(estado, {
      n: texto.length,
      duration: Math.min(4.5, Math.max(0.5, texto.length / 48)),
      ease: "none",
      onUpdate: () => setVisiveis(Math.round(estado.n)),
      onComplete: () => avisar(false),
    });
    return () => {
      t.kill();
      avisar(false);
    };
  }, [texto]);

  const digitando = visiveis < texto.length;

  return (
    <div
      ref={caixa}
      className="relative w-full rounded-3xl border border-cyan-300/40 bg-cyan-400/[0.07] px-6 py-4 shadow-[0_0_40px_rgba(0,229,255,0.18),inset_0_0_30px_rgba(0,229,255,0.06)] backdrop-blur-xl sm:px-8 sm:py-5"
      aria-live="polite"
    >
      <span className="absolute -top-3 left-6 rounded-full border border-cyan-300/50 bg-[#02121a] px-3 py-0.5 font-display text-[10px] font-bold tracking-[0.35em] text-cyan-300 sm:text-xs">
        CELI
      </span>
      <p className="text-xl font-semibold leading-snug text-white sm:text-2xl xl:text-3xl">
        <span>{texto.slice(0, visiveis)}</span>
        {digitando && <span className="celi-cursor" aria-hidden />}
        <span className="opacity-0" aria-hidden>
          {texto.slice(visiveis)}
        </span>
      </p>
    </div>
  );
}
