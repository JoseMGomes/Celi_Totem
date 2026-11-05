"use client";

import dynamic from "next/dynamic";

/**
 * O totem é 100% interativo (relógio, timers, WebGL, voz), então roda só no
 * navegador — evita mismatch de hidratação com hora/data.
 */
const Totem = dynamic(() => import("./Totem"), {
  ssr: false,
  loading: () => <div className="h-dvh w-screen bg-[#02040a]" />,
});

export default function TotemCliente() {
  return <Totem />;
}
