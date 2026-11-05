"use client";

import { Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { useRelogio } from "@/hooks/useRelogio";
import type { BaseConhecimento } from "@/lib/celi/tipos";

interface Props {
  base: BaseConhecimento;
  vozAtiva: boolean;
  onAlternarVoz: () => void;
  compacto: boolean;
}

function horaCurta(ms: number): string {
  return new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Barra superior: identidade da CELI, status da conexão, voz e relógio. */
export default function Hud({ base, vozAtiva, onAlternarVoz, compacto }: Props) {
  const agora = useRelogio();
  const sincronizando = base.sincronizadoEm === null && base.online;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-8">
      <div>
        <h1 className="font-display text-4xl font-black tracking-[0.25em] text-transparent [text-shadow:0_0_24px_rgba(0,229,255,0.55)] bg-gradient-to-r from-cyan-300 via-cyan-100 to-white bg-clip-text sm:text-5xl">
          CELI
        </h1>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 sm:text-xs">
          Central Eletrônica de Informação
        </p>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs">
          {base.online ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-amber-300" />
          )}
          <span className={base.online ? "text-emerald-300/90" : "text-amber-300/90"}>
            {sincronizando
              ? "Sincronizando..."
              : base.online
                ? `Online · ${base.sincronizadoEm ? horaCurta(base.sincronizadoEm) : ""}`
                : base.sincronizadoEm
                  ? `Offline · dados de ${horaCurta(base.sincronizadoEm)}`
                  : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 sm:gap-4">
        {!compacto && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAlternarVoz();
            }}
            className="celi-botao pointer-events-auto grid h-14 w-14 place-items-center rounded-2xl sm:h-16 sm:w-16"
            aria-label={vozAtiva ? "Desligar voz" : "Ligar voz"}
          >
            {vozAtiva ? (
              <Volume2 className="h-6 w-6 text-cyan-300 sm:h-7 sm:w-7" />
            ) : (
              <VolumeX className="h-6 w-6 text-slate-400 sm:h-7 sm:w-7" />
            )}
          </button>
        )}
        <div className="flex flex-col items-end">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-2 backdrop-blur-md sm:px-6 sm:py-3">
            <span className="font-display text-3xl font-black tabular-nums tracking-wider text-white sm:text-4xl">
              {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold capitalize tracking-wider text-slate-400 sm:text-sm">
            {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
      </div>
    </header>
  );
}
