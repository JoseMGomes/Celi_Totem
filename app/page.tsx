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
  ArrowLeft,
} from "lucide-react";

type MenuState = "home" | "sala" | "grade" | "professor" | "duvidas";

export default function Home() {
  const [isAwake, setIsAwake] = useState(false);
  const [expression, setExpression] = useState<Expression>("dormindo");
  const [activeMenu, setActiveMenu] = useState<MenuState>("home");
  const [isNavigating, setIsNavigating] = useState(false);
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
        setActiveMenu("home");
        setIsNavigating(false);
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

  const navigateTo = (menu: MenuState) => {
    setLastInteraction(Date.now());
    setIsNavigating(true);
    setExpression("processando");

    setTimeout(() => {
      setActiveMenu(menu);
      setIsNavigating(false);
      setExpression("normal");
    }, 1500);
  };

  const goHome = () => {
    setLastInteraction(Date.now());
    setActiveMenu("home");
    setExpression("normal");
  };

  return (
    <main
      className="flex h-screen w-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#00E5FF] selection:text-black cursor-pointer relative"
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
            className="absolute inset-0 z-10 flex flex-col w-full h-full p-8"
          >
            <header className="flex items-start justify-between w-full mb-4 shrink-0 z-20">
              {activeMenu === "home" ? (
                <div>
                  <h1 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-blue-500 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                    CELI
                  </h1>
                  <p className="text-xs font-bold tracking-[0.2em] text-[#00E5FF]/70 uppercase mt-1">
                    Central Eletrônica de Informação
                  </p>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goHome();
                  }}
                  className="flex items-center gap-4 bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 hover:border-[#00E5FF]/50 transition-all rounded-2xl px-6 py-4 shadow-[0_0_20px_rgba(0,229,255,0.1)] group z-50"
                >
                  <ArrowLeft
                    size={32}
                    className="text-slate-400 group-hover:text-[#00E5FF] transition-colors"
                  />
                  <span className="text-2xl font-bold uppercase tracking-widest text-slate-300 group-hover:text-white">
                    Voltar
                  </span>
                </button>
              )}

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

            <div className="flex flex-1 overflow-hidden mt-2 relative">
              <AnimatePresence mode="wait">
                {activeMenu === "home" && (
                  <motion.div
                    key="layout-home"
                    className="relative flex w-full h-full items-center justify-center"
                  >
                    <AnimatePresence>
                      {!isNavigating && (
                        <motion.div
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                          className="absolute left-0 top-0 bottom-0 w-[25%] flex flex-col gap-6 justify-center z-10"
                        >
                          <button
                            onClick={() => navigateTo("sala")}
                            className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl"
                          >
                            <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                              <MapPin
                                size={40}
                                className="text-slate-400 group-hover:text-[#00E5FF]"
                              />
                            </div>
                            <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                              Localizar
                              <br />
                              Sala
                            </span>
                          </button>

                          <button
                            onClick={() => navigateTo("professor")}
                            className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl"
                          >
                            <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                              <Users
                                size={40}
                                className="text-slate-400 group-hover:text-[#00E5FF]"
                              />
                            </div>
                            <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                              Buscar
                              <br />
                              Professor
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative w-[50%] h-full flex flex-col items-center justify-center z-10">
                      <motion.div
                        layoutId="celi-face"
                        className="w-full flex-1 max-h-[500px] flex items-center justify-center z-20"
                      >
                        <CeliFace expression={expression} />
                      </motion.div>

                      <AnimatePresence>
                        {!isNavigating && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-10 w-full rounded-3xl border border-white/10 bg-gradient-to-r from-transparent via-[#00E5FF]/5 to-transparent backdrop-blur-sm p-6 text-center shadow-[0_0_30px_rgba(0,229,255,0.05)]"
                          >
                            <p className="text-xs font-bold text-[#00E5FF]/70 uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
                              <Megaphone size={14} /> Mural Institucional
                            </p>
                            <p className="text-xl font-medium text-white leading-relaxed">
                              Nenhum comunicado ativo no momento.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {!isNavigating && (
                        <motion.div
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          transition={{ duration: 0.3 }}
                          className="absolute right-0 top-0 bottom-0 w-[25%] flex flex-col gap-6 justify-center z-10"
                        >
                          <button
                            onClick={() => navigateTo("grade")}
                            className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl"
                          >
                            <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                              <CalendarRange
                                size={40}
                                className="text-slate-400 group-hover:text-[#00E5FF]"
                              />
                            </div>
                            <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                              Grade
                              <br />
                              Completa
                            </span>
                          </button>

                          <button
                            onClick={() => navigateTo("duvidas")}
                            className="h-48 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-md hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/50 transition-all duration-300 flex flex-col items-center justify-center gap-5 group shadow-xl"
                          >
                            <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#00E5FF]/20 transition-colors">
                              <HelpCircle
                                size={40}
                                className="text-slate-400 group-hover:text-[#00E5FF]"
                              />
                            </div>
                            <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-widest text-center px-4">
                              Outras
                              <br />
                              Dúvidas
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {activeMenu !== "home" && (
                  <motion.div
                    key="layout-interna"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center w-full h-full"
                  >
                    <motion.div
                      layoutId="celi-face"
                      className="h-[25%] w-full max-w-[400px] flex items-center justify-center shrink-0 z-20"
                    >
                      <CeliFace expression={expression} />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="w-full max-w-[1400px] flex-1 rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_-10px_50px_rgba(0,229,255,0.05)] p-10 flex flex-col mb-4 relative z-10"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8 shrink-0">
                        <h2 className="text-4xl font-extrabold text-[#00E5FF] uppercase tracking-widest flex items-center gap-4">
                          {activeMenu === "grade" && (
                            <>
                              <CalendarRange size={36} /> Grade de Aulas
                            </>
                          )}
                          {activeMenu === "sala" && (
                            <>
                              <MapPin size={36} /> Localizar Sala
                            </>
                          )}
                          {activeMenu === "professor" && (
                            <>
                              <Users size={36} /> Buscar Professor
                            </>
                          )}
                          {activeMenu === "duvidas" && (
                            <>
                              <HelpCircle size={36} /> Dúvidas Frequentes
                            </>
                          )}
                        </h2>
                      </div>

                      <div className="flex-1 w-full flex flex-col gap-5 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-[#00E5FF]/40 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-8 flex items-center justify-between hover:bg-white/10 transition-colors">
                          <div>
                            <h4 className="text-3xl font-bold text-white mb-3">
                              Engenharia de Software - 1º Semestre
                            </h4>
                            <p className="text-[#00E5FF] font-semibold flex items-center gap-3 text-xl">
                              <Clock size={24} /> 19:00 às 20:40
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-200 font-medium flex items-center justify-end gap-3 text-2xl">
                              <MapPin size={24} /> Auditório Central
                            </p>
                            <p className="text-slate-400 flex items-center justify-end gap-3 mt-3 text-lg">
                              <Users size={20} /> Prof. Carlos Eduardo
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-8 flex items-center justify-between hover:bg-white/10 transition-colors">
                          <div>
                            <h4 className="text-3xl font-bold text-white mb-3">
                              Análise e Desenv. de Sistemas - 2º Semestre
                            </h4>
                            <p className="text-[#00E5FF] font-semibold flex items-center gap-3 text-xl">
                              <Clock size={24} /> 21:00 às 22:40
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-200 font-medium flex items-center justify-end gap-3 text-2xl">
                              <MapPin size={24} /> Sala 204 (Bl. B)
                            </p>
                            <p className="text-slate-400 flex items-center justify-end gap-3 mt-3 text-lg">
                              <Users size={20} /> Prof. Mariana Costa
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
