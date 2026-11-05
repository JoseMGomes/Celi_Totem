"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Opcoes {
  /** Só conta o tempo enquanto estiver ativo (CELI acordada). */
  ativo: boolean;
  /** Tempo sem toque até começar a contagem regressiva. */
  limiteMs: number;
  /** Duração da contagem regressiva ("Ainda está aí?"). */
  avisoMs: number;
  onDormir: () => void;
}

/**
 * Controla o cochilo da CELI.
 *
 * Retorna `restanteMs` (null enquanto não estiver no aviso) e
 * `registrarAtividade`, que deve ser chamado a cada toque na tela.
 */
export function useInatividade({ ativo, limiteMs, avisoMs, onDormir }: Opcoes) {
  const ultimaAtividade = useRef(0);
  const [restanteMs, setRestanteMs] = useState<number | null>(null);
  const dormir = useRef(onDormir);

  useEffect(() => {
    dormir.current = onDormir;
  }, [onDormir]);

  const registrarAtividade = useCallback(() => {
    ultimaAtividade.current = Date.now();
    setRestanteMs(null);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    ultimaAtividade.current = Date.now();

    const id = setInterval(() => {
      const parado = Date.now() - ultimaAtividade.current;
      if (parado >= limiteMs + avisoMs) {
        setRestanteMs(null);
        dormir.current();
      } else if (parado >= limiteMs) {
        setRestanteMs(limiteMs + avisoMs - parado);
      } else {
        setRestanteMs((r) => (r === null ? r : null));
      }
    }, 250);

    return () => clearInterval(id);
  }, [ativo, limiteMs, avisoMs]);

  return { restanteMs: ativo ? restanteMs : null, registrarAtividade };
}
