"use client";

import { useEffect, useState } from "react";

/** Data/hora atual, atualizada a cada segundo. */
export function useRelogio(): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
}
