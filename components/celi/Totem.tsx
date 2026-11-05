"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Hand, House } from "lucide-react";
import CeliFace from "./CeliFace";
import BalaoFala from "./BalaoFala";
import Opcoes from "./Opcoes";
import Resultados from "./Resultados";
import Hud from "./Hud";
import Letreiro from "./Letreiro";
import AvisoSono from "./AvisoSono";
import { useBaseConhecimento } from "@/hooks/useBaseConhecimento";
import { useInatividade } from "@/hooks/useInatividade";
import { useVoz } from "@/hooks/useVoz";
import {
  TEMPO_ACORDANDO_MS,
  TEMPO_AVISO_SONO_MS,
  TEMPO_INATIVIDADE_MS,
  TEMPO_PENSANDO_MS,
  VOZ_ATIVA_PADRAO,
} from "@/lib/celi/config";
import { responder, type Opcao, type Passo } from "@/lib/celi/dialogo";
import { FRASES_ACORDAR } from "@/lib/celi/frases";
import type { Expressao } from "@/lib/celi/tipos";

// three.js só no navegador e em um chunk separado.
const FundoNeural = dynamic(() => import("./FundoNeural"), { ssr: false });

type Fase = "dormindo" | "acordando" | "conversa";

/** Um ponto da conversa + o instante em que foi aberto (base pro "agora"). */
interface Entrada {
  passo: Passo;
  em: number;
}

const ENTRADA_INICIAL: Entrada = { passo: { tipo: "menu" }, em: 0 };

/** Velocidade do fundo 3D conforme o humor da CELI. */
const ENERGIA: Record<Expressao, number> = {
  dormindo: 0.12,
  sonolento: 0.3,
  confuso: 0.6,
  normal: 0.8,
  curioso: 0.9,
  feliz: 1.1,
  animado: 1.6,
  processando: 2.8,
};

export default function Totem() {
  const { base, recarregar } = useBaseConhecimento();
  const [fase, setFase] = useState<Fase>("dormindo");
  const [atual, setAtual] = useState<Entrada>(ENTRADA_INICIAL);
  const [historico, setHistorico] = useState<Entrada[]>([]);
  const [pensando, setPensando] = useState(false);
  const [digitando, setDigitando] = useState(false);
  const [cocegas, setCocegas] = useState(false);
  const [vozAtiva, setVozAtiva] = useState(VOZ_ATIVA_PADRAO);
  const [fraseAcordar, setFraseAcordar] = useState<string>(FRASES_ACORDAR[0]);
  const { falar, calar } = useVoz(vozAtiva);

  /* ---------- Timers (todos cancelados ao dormir/desmontar) ---------- */
  const timers = useRef<number[]>([]);
  const agendar = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const limparTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
  }, []);
  useEffect(() => limparTimers, [limparTimers]);

  /* ---------- Conversa ---------- */
  const fala = useMemo(
    () => responder(atual.passo, base, new Date(atual.em)),
    [atual, base],
  );
  const chave = String(atual.em);

  const dormir = useCallback(() => {
    limparTimers();
    calar();
    setFase("dormindo");
    setHistorico([]);
    setAtual(ENTRADA_INICIAL);
    setPensando(false);
    setCocegas(false);
  }, [calar, limparTimers]);

  const { restanteMs, registrarAtividade } = useInatividade({
    ativo: fase !== "dormindo",
    limiteMs: TEMPO_INATIVIDADE_MS,
    avisoMs: TEMPO_AVISO_SONO_MS,
    onDormir: dormir,
  });

  const acordar = () => {
    if (fase !== "dormindo") return;
    setFraseAcordar(FRASES_ACORDAR[Math.floor(Math.random() * FRASES_ACORDAR.length)]);
    setFase("acordando");
    agendar(() => {
      setAtual({ passo: { tipo: "menu" }, em: Date.now() });
      setFase("conversa");
    }, TEMPO_ACORDANDO_MS);
  };

  const irPara = (passo: Passo) => {
    setPensando(true);
    calar();
    agendar(() => {
      setHistorico((h) => [...h, atual]);
      setAtual({ passo, em: Date.now() });
      setPensando(false);
    }, TEMPO_PENSANDO_MS);
  };

  const escolher = (opcao: Opcao) => {
    if (opcao.acao === "recarregar") recarregar();
    else if (opcao.destino) irPara(opcao.destino);
  };

  const voltar = () => {
    const anterior = historico[historico.length - 1];
    if (!anterior || pensando) return;
    setHistorico((h) => h.slice(0, -1));
    setAtual({ passo: anterior.passo, em: Date.now() });
  };

  const inicio = () => {
    if (pensando) return;
    setHistorico([]);
    setAtual({ passo: { tipo: "menu", retorno: true }, em: Date.now() });
  };

  const fazerCocegas = () => {
    if (fase !== "conversa" || cocegas) return;
    setCocegas(true);
    agendar(() => setCocegas(false), 1500);
  };

  // A CELI fala em voz alta cada resposta nova.
  useEffect(() => {
    if (fase === "conversa") falar(fala.texto);
  }, [fase, fala.texto, falar]);

  /* ---------- Rosto ---------- */
  const expressao: Expressao =
    fase === "dormindo"
      ? "dormindo"
      : fase === "acordando"
        ? "curioso"
        : restanteMs !== null
          ? "sonolento"
          : pensando
            ? "processando"
            : cocegas
              ? "feliz"
              : fala.expressao;

  const conversa = fase === "conversa";
  const temNavegacao = historico.length > 0 || atual.passo.tipo !== "menu";

  return (
    <main
      className="relative h-dvh w-screen overflow-hidden bg-[#02040a] text-white"
      onPointerDownCapture={() => {
        if (fase !== "dormindo") registrarAtividade();
      }}
      onClickCapture={() => {
        if (fase !== "dormindo") registrarAtividade();
      }}
      onClick={acordar}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Fundo */}
      <div className="absolute inset-0 z-0">
        <FundoNeural energia={ENERGIA[expressao]} />
      </div>
      <div className="celi-vinheta pointer-events-none absolute inset-0 z-0" />

      <Hud
        base={base}
        vozAtiva={vozAtiva}
        onAlternarVoz={() => setVozAtiva((v) => !v)}
        compacto={!conversa}
      />

      <div className="relative z-10 flex h-full flex-col gap-4 px-5 pb-5 pt-36 sm:px-10 sm:pb-8 sm:pt-44">
        <div
          className={`flex min-h-0 flex-1 gap-6 ${
            conversa
              ? "portrait:flex-col landscape:flex-row"
              : "flex-col items-center justify-center"
          }`}
        >
          {/* Rosto: sempre o mesmo elemento, só muda de tamanho/posição. */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
            onClick={fazerCocegas}
            className={
              conversa
                ? "shrink-0 portrait:h-[24vh] portrait:w-full landscape:h-full landscape:w-[38%]"
                : "h-[min(58vh,78vw)] w-full max-w-[1100px] shrink-0"
            }
          >
            <CeliFace expressao={expressao} falando={digitando && !pensando} />
          </motion.div>

          {!conversa && <ChamadaToque fase={fase} frase={fraseAcordar} />}

          {conversa && (
            <motion.section
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="flex min-h-0 min-w-0 flex-1 flex-col gap-4"
            >
              <BalaoFala key={`${chave}-${fala.texto}`} texto={fala.texto} onDigitando={setDigitando} />

              {/* Título + filtros (ex.: dias da semana): fora da rolagem, transparentes. */}
              {fala.resultado?.tipo === "aulas" && (
                <div className="flex shrink-0 flex-col gap-3">
                  <h3 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-slate-300">
                    {fala.resultado.titulo}
                  </h3>
                  {fala.opcoes.length > 0 && (
                    <Opcoes
                      opcoes={fala.opcoes}
                      formato="chips"
                      onEscolher={escolher}
                      chave={chave}
                      desabilitado={pensando}
                    />
                  )}
                </div>
              )}

              {/* Só a lista rola; o topo esmaece em vez de cortar seco. */}
              <div className="celi-scroll celi-esmaecer min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 pr-2 pt-6">
                {fala.resultado ? (
                  <Resultados
                    resultado={fala.resultado}
                    chave={chave}
                    onIr={(passo) => !pensando && irPara(passo)}
                  />
                ) : (
                  <Opcoes
                    opcoes={fala.opcoes}
                    formato={fala.formato}
                    onEscolher={escolher}
                    chave={chave}
                    desabilitado={pensando}
                  />
                )}
              </div>

              {temNavegacao && (
                <nav className="flex shrink-0 items-center gap-3 border-t border-white/10 pt-4">
                  {historico.length > 0 && (
                    <BotaoNav onClick={voltar} icone={<ArrowLeft className="h-6 w-6" />} rotulo="Voltar" />
                  )}
                  {atual.passo.tipo !== "menu" && (
                    <BotaoNav onClick={inicio} icone={<House className="h-6 w-6" />} rotulo="Início" />
                  )}
                </nav>
              )}
            </motion.section>
          )}
        </div>

        <Letreiro avisos={base.avisos.dados} />
      </div>

      <AnimatePresence>
        {restanteMs !== null && <AvisoSono key="aviso-sono" restanteMs={restanteMs} />}
      </AnimatePresence>

      <div className="celi-scanlines pointer-events-none absolute inset-0 z-[60]" />
    </main>
  );
}

function BotaoNav({
  onClick,
  icone,
  rotulo,
}: {
  onClick: () => void;
  icone: React.ReactNode;
  rotulo: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="celi-botao flex min-h-16 items-center gap-3 rounded-2xl px-5 text-lg font-bold uppercase tracking-wider text-white"
    >
      <span className="text-cyan-300">{icone}</span>
      {rotulo}
    </button>
  );
}

function ChamadaToque({ fase, frase }: { fase: Fase; frase: string }) {
  if (fase === "acordando") {
    return (
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-3xl font-black tracking-widest text-cyan-200 [text-shadow:0_0_24px_#00E5FF] sm:text-5xl"
      >
        {frase}
      </motion.p>
    );
  }
  return (
    <motion.div
      animate={{ opacity: [0.35, 1, 0.35], y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
      className="flex flex-col items-center gap-4 text-cyan-300"
    >
      <Hand className="h-12 w-12 drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
      <p className="text-center font-display text-xl font-black uppercase tracking-[0.35em] [text-shadow:0_0_20px_#00E5FF] sm:text-3xl">
        Toque na tela para acordar a CELI
      </p>
    </motion.div>
  );
}
