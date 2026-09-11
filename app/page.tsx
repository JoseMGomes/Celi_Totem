"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CeliFace, { Expression } from "@/components/CeliFace";
import {
  Clock,
  Hand,
  MapPin,
  CalendarRange,
  Users,
  HelpCircle,
  Megaphone,
} from "lucide-react";

export default function Home() {
  const [isAwake, setIsAwake] = useState(false);
  const [expression, setExpression] = useState<Expression>("dormindo");
  const [horaLocal, setHoraLocal] = useState("");
  const [dataLocal, setDataLocal] = useState("");
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  useEffect(() => {
    const atualizarRelogio = () => {
      const agora = new Date();
      setHoraLocal(
        agora.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setDataLocal(
        agora.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        }),
      );
    };
    atualizarRelogio();
    const interval = setInterval(atualizarRelogio, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAwake) return;
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction > 30000) {
        setIsAwake(false);
        setExpression("dormindo");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAwake, lastInteraction]);

  const handleInteraction = () => {
    setLastInteraction(Date.now());
    if (!isAwake) {
      setIsAwake(true);
      setExpression("curioso");
      setTimeout(() => setExpression("normal"), 2000);
    }
  };

  return (
    <main
      className="flex h-screen w-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#00E5FF] selection:text-black cursor-pointer"
      onClick={handleInteraction}
    >
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[1000px] -translate-y-1/2 -translate-x-1/2 rounded-[100%] bg-[#00E5FF]/10 blur-[150px]"></div>
      </div>

      <AnimatePresence mode="wait">
        {!isAwake && (
          <motion.div
            key="standby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#030712]/90 backdrop-blur-sm"
          >
            <div className="w-full max-w-[800px] h-[50vh]">
              <CeliFace expression="dormindo" />
            </div>

            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
              }}
              className="absolute bottom-20 flex flex-col items-center gap-4 text-[#00E5FF]"
            >
              <Hand size={40} />
              <p className="text-2xl font-bold uppercase tracking-[0.4em] drop-shadow-[0_0_15px_#00E5FF]">
                Toque para iniciar
              </p>
            </motion.div>
          </motion.div>
        )}

        {isAwake && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col w-full h-full p-8"
          >

            <header className="flex items-start justify-between w-full mb-4">
              <div>
                <h1 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-blue-500 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                  CELI
                </h1>
                <p className="text-xs font-bold tracking-[0.2em] text-[#00E5FF]/70 uppercase mt-1">
                  Central Eletrônica de Informação
                </p>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                  <Clock size={28} className="text-[#00E5FF]" />
                  <span className="text-4xl font-black tracking-wider text-white">
                    {horaLocal}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#00E5FF]/80 capitalize tracking-wider mt-3 mr-2">
                  {dataLocal}
                </p>
              </div>
            </header>

            <div className="flex flex-1 items-center justify-between gap-8 h-full">
              <div className="w-[25%] flex flex-col gap-6 h-full justify-center">
                <button className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl">
                  <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                    <MapPin
                      size={40}
                      className="text-slate-400 group-hover:text-[#00E5FF] transition-colors"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                    Localizar
                    <br />
                    Sala
                  </span>
                </button>

                <button className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl">
                  <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                    <Users
                      size={40}
                      className="text-slate-400 group-hover:text-[#00E5FF] transition-colors"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                    Buscar
                    <br />
                    Professor
                  </span>
                </button>
              </div>

              <div className="w-[50%] h-full flex flex-col items-center justify-center relative">
                <div className="w-full flex-1 max-h-[500px] flex items-center justify-center">
                  <CeliFace expression={expression} />
                </div>

                <div className="w-full mt-4 rounded-3xl border border-white/10 bg-gradient-to-r from-transparent via-[#00E5FF]/5 to-transparent backdrop-blur-sm p-6 text-center shadow-[0_0_30px_rgba(0,229,255,0.05)]">
                  <p className="text-xs font-bold text-[#00E5FF]/70 uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
                    <Megaphone size={14} /> Mural Institucional
                  </p>
                  <p className="text-xl font-medium text-white leading-relaxed">
                    Nenhum comunicado ativo no momento.
                  </p>
                </div>
              </div>

              <div className="w-[25%] flex flex-col gap-6 h-full justify-center">
                <button className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl">
                  <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                    <CalendarRange
                      size={40}
                      className="text-slate-400 group-hover:text-[#00E5FF] transition-colors"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                    Grade
                    <br />
                    Completa
                  </span>
                </button>

                <button className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl">
                  <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                    <HelpCircle
                      size={40}
                      className="text-slate-400 group-hover:text-[#00E5FF] transition-colors"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                    Outras
                    <br />
                    Dúvidas
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
