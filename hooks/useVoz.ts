"use client";

import { useCallback, useEffect, useRef } from "react";
import { textoParaVoz } from "@/lib/celi/texto";

function suportaVoz(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Voz da CELI via Web Speech API (nativa do navegador, sem custo).
 * Se o sistema não tiver voz em português instalada, ela simplesmente fica muda.
 */
export function useVoz(ativa: boolean) {
  const voz = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!suportaVoz()) return;
    const escolher = () => {
      const vozes = window.speechSynthesis.getVoices();
      voz.current =
        vozes.find((v) => v.lang.toLowerCase() === "pt-br") ??
        vozes.find((v) => v.lang.toLowerCase().startsWith("pt")) ??
        null;
    };
    escolher();
    window.speechSynthesis.addEventListener("voiceschanged", escolher);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", escolher);
  }, []);

  const calar = useCallback(() => {
    if (suportaVoz()) window.speechSynthesis.cancel();
  }, []);

  const falar = useCallback(
    (texto: string) => {
      if (!ativa || !suportaVoz() || !voz.current) return;
      window.speechSynthesis.cancel();
      const fala = new SpeechSynthesisUtterance(textoParaVoz(texto));
      fala.voice = voz.current;
      fala.lang = voz.current.lang;
      fala.rate = 1.05;
      fala.pitch = 1.3;
      window.speechSynthesis.speak(fala);
    },
    [ativa],
  );

  useEffect(() => {
    if (!ativa) calar();
  }, [ativa, calar]);

  return { falar, calar };
}
