"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CeliFace, { Expression } from "@/components/CeliFace";
import {
  Clock3,
  Hand,
  MapPin,
  CalendarDays,
  Users,
  CircleHelp,
  Megaphone,
  ArrowLeft,
  Ban,
} from "lucide-react";
import { api } from "@/services/api";

type MenuState = "home" | "sala" | "grade" | "professor";

interface Aviso {
  id: number;
  mensagem: string;
  ativo: boolean;
  dataExpiracao: string | null;
}

interface Aula {
  id: number;
  diaDaSemana: number;
  horarioInicio: string;
  horarioFim: string;
  semestre?: { nome: string; curso?: { nome: string } };
  sala?: { nome: string; bloco: string | null };
  professor?: { nome: string };
}

interface Sala {
  id: number;
  nome: string;
  bloco: string | null;
}

interface Professor {
  id: number;
  nome: string;
  email: string | null;
}

const diasSemana = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const frasesBoasVindas = [
  "Olá! O que você procura hoje?",
  "Bem-vindo! Posso ajudá-lo a encontrar a sua sala?",
  "Precisa de consultar o horário das aulas?",
  "Estou conectada. Toque num dos módulos abaixo!",
  "Olá! Sou a CELI, como posso ajudar?",
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [expression, setExpression] = useState<Expression>("dormindo");
  const [activeMenu, setActiveMenu] = useState<MenuState>("home");
  const [isNavigating, setIsNavigating] = useState(false);

  const [horaLocal, setHoraLocal] = useState("");
  const [dataLocal, setDataLocal] = useState("");
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  const [mensagemCeli, setMensagemCeli] = useState("Zzz...");

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisoIndex, setAvisoIndex] = useState(0);
  const [avisoStatus, setAvisoStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [todasAulas, setTodasAulas] = useState<Aula[]>([]);
  const [aulasFiltradas, setAulasFiltradas] = useState<Aula[]>([]);
  const [gradeStatus, setGradeStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [diaSelecionado, setDiaSelecionado] = useState<number>(
    new Date().getDay(),
  );

  const [salas, setSalas] = useState<Sala[]>([]);
  const [salasStatus, setSalasStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [professoresStatus, setProfessoresStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const layoutInterno = {
    sala: { titulo: "MAPA DE SALAS", icone: MapPin },
    professor: { titulo: "CORPO DOCENTE", icone: Users },
    grade: { titulo: "GRADE DE AULAS", icone: CalendarDays },
  };

  const LayoutAtual = activeMenu !== "home" ? layoutInterno[activeMenu] : null;
  const IconeAtivo = LayoutAtual?.icone;

  const sortearFrase = () =>
    frasesBoasVindas[Math.floor(Math.random() * frasesBoasVindas.length)];

  useEffect(() => {
    setIsMounted(true);
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
      if (Date.now() - lastInteraction > 15000) {
        setIsAwake(false);
        setActiveMenu("home");
        setIsNavigating(false);
        setExpression("dormindo");
        setMensagemCeli("Zzz...");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAwake, lastInteraction]);

  useEffect(() => {
    if (avisos.length <= 1 || !isAwake || activeMenu !== "home") return;
    const interval = setInterval(() => {
      setAvisoIndex((prev) => (prev + 1) % avisos.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [avisos, isAwake, activeMenu]);

  useEffect(() => {
    if (todasAulas.length > 0) {
      const filtradas = todasAulas.filter(
        (a) => Number(a.diaDaSemana) === diaSelecionado,
      );
      setAulasFiltradas(filtradas);
    } else {
      setAulasFiltradas([]);
    }
  }, [diaSelecionado, todasAulas]);

  const handleInteraction = async () => {
    setLastInteraction(Date.now());
    if (!isAwake) {
      setIsAwake(true);
      setExpression("curioso");
      setMensagemCeli("Hum? Alguém aí?");

      setTimeout(async () => {
        setExpression("processando");
        setMensagemCeli("A sincronizar com o CEUNSP...");
        setAvisoStatus("loading");

        try {
          const response = await api.get("/avisos");
          const listaRecebida = Array.isArray(response.data?.data)
            ? response.data.data
            : Array.isArray(response.data)
              ? response.data
              : response.data?.avisos || [];

          const avisosAtivos = listaRecebida.filter((a: Aviso) => {
            if (!a.ativo) return false;
            if (a.dataExpiracao) return new Date(a.dataExpiracao) > new Date();
            return true;
          });

          setAvisos(avisosAtivos);
          setAvisoStatus("success");
          setExpression("feliz");
          setMensagemCeli(sortearFrase());
          setTimeout(() => setExpression("normal"), 1500);
        } catch (error) {
          setAvisoStatus("error");
          setExpression("confuso");
          setMensagemCeli("Puxa, perdi a ligação com a central.");
          setTimeout(() => setExpression("normal"), 3500);
        }
      }, 1500);
    }
  };

  const navigateTo = async (menu: MenuState) => {
    setLastInteraction(Date.now());
    setIsNavigating(true);
    setExpression("processando");
    setMensagemCeli("A procurar informações...");

    if (menu === "grade") {
      setGradeStatus("loading");
      setTodasAulas([]);
      setDiaSelecionado(new Date().getDay());

      try {
        const response = await api.get("/aulas");
        const lista = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setTodasAulas(lista);
        setGradeStatus("success");
        setMensagemCeli("Aqui está a Grade de Aulas!");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
          setExpression("normal");
        }, 800);
      } catch (error) {
        setGradeStatus("error");
        setExpression("confuso");
        setMensagemCeli("Erro ao procurar a grade.");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
        }, 1500);
      }
    } else if (menu === "sala") {
      setSalasStatus("loading");
      setSalas([]);

      try {
        const response = await api.get("/salas");
        const lista = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setSalas(lista);
        setSalasStatus("success");
        setMensagemCeli("Encontrei estas salas para si.");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
          setExpression("normal");
        }, 800);
      } catch (error) {
        setSalasStatus("error");
        setExpression("confuso");
        setMensagemCeli("Não consegui ler as salas.");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
        }, 1500);
      }
    } else if (menu === "professor") {
      setProfessoresStatus("loading");
      setProfessores([]);

      try {
        const response = await api.get("/professores");
        const lista = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setProfessores(lista);
        setProfessoresStatus("success");
        setMensagemCeli("Aqui está o Corpo Docente.");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
          setExpression("normal");
        }, 800);
      } catch (error) {
        setProfessoresStatus("error");
        setExpression("confuso");
        setMensagemCeli("Diretório indisponível.");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
        }, 1500);
      }
    }
  };

  const goHome = () => {
    setLastInteraction(Date.now());
    setActiveMenu("home");
    setExpression("normal");
    setMensagemCeli(sortearFrase());
  };

  if (!isMounted) return null;

  return (
    <main
      className="flex h-screen w-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#00E5FF] selection:text-black relative"
      onClick={handleInteraction}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-[#030712]">
        <div className="absolute top-1/2 left-1/2 h-[1200px] w-[1200px] -translate-y-1/2 -translate-x-1/2 rounded-[100%] bg-[#00E5FF]/5 blur-[200px]"></div>
      </div>

      {/* ELEMENTOS FLUTUANTES (Garantem que não ocupam espaço físico do layout) */}
      <div className="absolute top-6 sm:top-10 left-6 sm:left-10 z-50">
        {activeMenu === "home" ? (
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
              CELI
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] text-slate-300 uppercase mt-1">
              Central Eletrónica de Informação
            </p>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goHome();
            }}
            className="flex items-center gap-4 bg-white/10 hover:bg-[#00E5FF]/20 border border-white/20 hover:border-[#00E5FF]/50 transition-all rounded-3xl px-6 py-4 sm:px-8 sm:py-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95 group"
          >
            <ArrowLeft
              size={28}
              className="text-[#00E5FF] transition-colors sm:w-9 sm:h-9 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
            />
            <span className="text-xl sm:text-3xl font-bold uppercase tracking-widest text-white">
              Voltar
            </span>
          </button>
        )}
      </div>

      <div className="absolute top-6 sm:top-10 right-6 sm:right-10 z-50 flex flex-col items-end">
        <div className="flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 sm:px-8 sm:py-4 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
          <Clock3
            size={24}
            className="text-[#00E5FF] sm:w-8 sm:h-8 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
          />
          <span className="text-3xl sm:text-5xl font-black tracking-wider text-white">
            {horaLocal}
          </span>
        </div>
        <p className="text-sm sm:text-lg font-semibold text-slate-300 capitalize tracking-wider mt-2 sm:mt-4 mr-3">
          {dataLocal}
        </p>
      </div>

      {/* CONTEÚDO CENTRALIZADO (Isolado e protegido de overflow) */}
      {/* pt-[120px] dá espaço exato para passar por baixo dos botões absolutos do Header */}
      <div className="w-full h-full flex flex-col justify-between items-center z-10 pt-[120px] pb-6 sm:pb-8 px-6 sm:px-10 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {/* === ECRÃ A DORMIR === */}
          {!isAwake && (
            <motion.div
              key="standby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              {/* O max-h garante que nunca empurrará o layout para fora */}
              <div className="w-full flex-1 min-h-0 max-h-[50vh] flex items-center justify-center drop-shadow-[0_0_35px_#00E5FF]">
                <CeliFace expression="dormindo" />
              </div>

              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
                className="shrink-0 mt-8 mb-4 flex flex-col items-center gap-4 text-[#00E5FF]"
              >
                <Hand
                  size={48}
                  className="drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                />
                <p className="text-2xl sm:text-4xl font-black uppercase tracking-[0.4em] drop-shadow-[0_0_20px_#00E5FF] text-center">
                  Toque na tela para iniciar
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* === ECRÃ HOME === */}
          {isAwake && activeMenu === "home" && (
            <>
              {/* 1. CELI & BALÃO (flex-1 min-h-0 = Absorve apenas o espaço restante) */}
              <motion.div
                key="home-face"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-h-0 flex flex-col items-center justify-center w-full z-40"
              >
                <AnimatePresence mode="wait">
                  {!isNavigating && (
                    <motion.div
                      key={mensagemCeli}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-fit max-w-[85%] mx-auto bg-[#00E5FF]/10 border border-[#00E5FF]/40 backdrop-blur-xl px-6 py-3 sm:px-10 sm:py-4 rounded-3xl shadow-[0_0_30px_rgba(0,229,255,0.3)] flex flex-col items-center relative mb-4 shrink-0"
                    >
                      <p className="text-white font-bold text-lg sm:text-2xl tracking-widest text-center">
                        {mensagemCeli}
                      </p>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#00E5FF]/40"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* O max-h garante que nunca cortará o rodapé */}
                <motion.div
                  layoutId="celi-face"
                  className="w-full flex-1 min-h-0 max-h-[45vh] flex items-center justify-center z-20 drop-shadow-[0_0_35px_#00E5FF]"
                >
                  <CeliFace expression={expression} />
                </motion.div>
              </motion.div>

              {/* 2. ÁREA INFERIOR (shrink-0 garante que tem sempre o seu tamanho fixo, empurrando o resto para cima) */}
              <motion.div
                key="home-bottom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-4 sm:gap-6 shrink-0 mt-4"
              >
                <AnimatePresence>
                  {!isNavigating && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      transition={{ duration: 0.4 }}
                      className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 z-20"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo("grade");
                        }}
                        className="bg-white/5 border border-white/20 hover:border-[#00E5FF]/80 hover:bg-white/10 rounded-[2.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 group relative overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 rounded-3xl bg-black/40 border border-white/10 group-hover:bg-[#00E5FF]/20 transition-colors relative z-10">
                          <CalendarDays className="w-10 h-10 sm:w-14 sm:h-14 text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-colors" />
                        </div>
                        <div className="relative z-10 text-center">
                          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#00E5FF] transition-colors">
                            Grade Completa
                          </h3>
                          <p className="text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-widest">
                            Consultar Horários
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo("sala");
                        }}
                        className="bg-white/5 border border-white/20 hover:border-[#00E5FF]/80 hover:bg-white/10 rounded-[2.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 group relative overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 rounded-3xl bg-black/40 border border-white/10 group-hover:bg-[#00E5FF]/20 transition-colors relative z-10">
                          <MapPin className="w-10 h-10 sm:w-14 sm:h-14 text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-colors" />
                        </div>
                        <div className="relative z-10 text-center">
                          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#00E5FF] transition-colors">
                            Localizar Sala
                          </h3>
                          <p className="text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-widest">
                            Mapa da Instituição
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo("professor");
                        }}
                        className="bg-white/5 border border-white/20 hover:border-[#00E5FF]/80 hover:bg-white/10 rounded-[2.5rem] p-5 sm:p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 group relative overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 rounded-3xl bg-black/40 border border-white/10 group-hover:bg-[#00E5FF]/20 transition-colors relative z-10">
                          <Users className="w-10 h-10 sm:w-14 sm:h-14 text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-colors" />
                        </div>
                        <div className="relative z-10 text-center">
                          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#00E5FF] transition-colors">
                            Corpo Docente
                          </h3>
                          <p className="text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-widest">
                            Buscar Professor
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mural Institucional */}
                <AnimatePresence>
                  {!isNavigating && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden shrink-0 min-h-[100px] sm:min-h-[120px]"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#00E5FF] shadow-[0_0_20px_#00E5FF]"></div>

                      <div className="flex items-center gap-4 pr-4 sm:pr-8 mr-4 sm:mr-8 border-r border-white/10 pl-4 shrink-0">
                        <div className="p-3 bg-[#00E5FF]/10 rounded-2xl border border-[#00E5FF]/30 animate-pulse">
                          <Megaphone
                            size={24}
                            className="text-[#00E5FF] sm:w-8 sm:h-8 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
                          />
                        </div>
                        <div className="hidden sm:flex flex-col">
                          <span className="text-[#00E5FF] font-black uppercase tracking-widest text-xl">
                            Mural
                          </span>
                          <span className="text-slate-300 font-bold uppercase tracking-[0.3em] text-xs">
                            Institucional
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 relative flex items-center h-full">
                        {avisoStatus === "loading" && (
                          <p className="text-lg sm:text-xl font-medium text-[#00E5FF]/70 animate-pulse">
                            A sincronizar comunicados...
                          </p>
                        )}
                        {avisoStatus === "error" && (
                          <p className="text-lg sm:text-xl font-bold text-red-400">
                            Falha de ligação à central.
                          </p>
                        )}
                        {avisoStatus === "success" && avisos.length === 0 && (
                          <p className="text-lg sm:text-xl font-medium text-slate-300">
                            Nenhum aviso ativo de momento.
                          </p>
                        )}

                        {avisoStatus === "success" && avisos.length > 0 && (
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={avisoIndex}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.5 }}
                              className="text-base sm:text-2xl font-bold text-white line-clamp-2 leading-relaxed w-full pr-4"
                            >
                              {avisos[avisoIndex]?.mensagem}
                            </motion.p>
                          </AnimatePresence>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}

          {isAwake && activeMenu !== "home" && (
            <motion.div
              key="layout-interna"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center w-full h-full"
            >
              {/* Rosto e Balão no Ecrã Interno */}
              <motion.div
                layoutId="celi-face"
                className="h-[25vh] min-h-[150px] w-full flex flex-col items-center justify-center shrink-0 z-20 pb-2 mt-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={mensagemCeli}
                  className="w-fit max-w-[90%] bg-[#00E5FF]/10 border border-[#00E5FF]/40 backdrop-blur-md px-6 py-2 sm:px-8 sm:py-3 rounded-full shadow-lg relative mb-4 shrink-0"
                >
                  <p className="text-[#00E5FF] font-bold text-sm sm:text-lg tracking-widest">
                    {mensagemCeli}
                  </p>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-[#00E5FF]/40"></div>
                </motion.div>
                <div className="w-full flex-1 min-h-0 flex justify-center drop-shadow-[0_0_25px_#00E5FF]">
                  <CeliFace expression={expression} />
                </div>
              </motion.div>

              {/* PAINEL DE DADOS - Flexível, consome todo o resto da tela */}
              <div className="w-full flex-1 min-h-0 rounded-[2rem] sm:rounded-[3rem] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_-20px_80px_rgba(0,229,255,0.1)] p-6 sm:p-10 flex flex-col relative z-10 overflow-hidden mt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-6 mb-6 shrink-0 relative gap-4">
                  <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-white uppercase tracking-widest flex items-center gap-4 sm:gap-6">
                    {IconeAtivo && (
                      <div className="p-2 sm:p-4 bg-[#00E5FF]/10 rounded-xl sm:rounded-2xl border border-[#00E5FF]/30 text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                        <IconeAtivo className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                    )}
                    {LayoutAtual?.titulo}
                  </h2>

                  {/* Seletor de Dias */}
                  {activeMenu === "grade" && gradeStatus === "success" && (
                    <div className="flex gap-1 sm:gap-2 bg-black/40 p-1 sm:p-2 rounded-xl border border-white/5 overflow-x-auto w-full sm:w-auto">
                      {diasSemana.map((dia, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiaSelecionado(index);
                          }}
                          className={`px-3 py-2 sm:px-5 sm:py-3 rounded-lg font-black text-sm sm:text-base uppercase tracking-wider transition-all ${
                            diaSelecionado === index
                              ? "bg-[#00E5FF] text-black shadow-[0_0_20px_#00E5FF]"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {dia.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0 w-full flex flex-col gap-4 sm:gap-6 overflow-y-auto pr-2 sm:pr-4 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-black/40 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#00E5FF]/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#00E5FF]/50 transition-colors pb-6">
                  {/* GRADE */}
                  {activeMenu === "grade" && (
                    <>
                      {gradeStatus === "loading" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#00E5FF]/50 gap-6 animate-pulse">
                          <CalendarDays
                            size={80}
                            className="drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                          />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            A consultar a base de dados...
                          </p>
                        </div>
                      )}
                      {gradeStatus === "error" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-6">
                          <Ban size={80} />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            Falha de Comunicação.
                          </p>
                        </div>
                      )}
                      {gradeStatus === "success" &&
                        aulasFiltradas.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6">
                            <CalendarDays size={80} className="opacity-50" />
                            <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                              Nenhuma aula marcada para{" "}
                              {diasSemana[diaSelecionado]}.
                            </p>
                          </div>
                        )}

                      {gradeStatus === "success" &&
                        aulasFiltradas.length > 0 &&
                        aulasFiltradas.map((aula) => (
                          <div
                            key={aula.id}
                            className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between hover:border-[#00E5FF]/50 hover:bg-white/5 transition-all shadow-xl shrink-0 group gap-6"
                          >
                            <div className="flex flex-col gap-2">
                              <h4 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#00E5FF] transition-colors drop-shadow-md">
                                {aula.semestre?.curso?.nome || "Curso Livre"}
                              </h4>
                              <p className="text-lg sm:text-xl font-bold tracking-widest text-slate-300 uppercase">
                                {aula.semestre?.nome || "Semestre Único"}
                              </p>
                              <div className="inline-flex items-center gap-3 bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-4 py-2 rounded-full mt-2 w-fit">
                                <Clock3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                                <span className="text-[#00E5FF] font-black text-lg sm:text-xl tracking-wider">
                                  {aula.horarioInicio} às {aula.horarioFim}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col lg:items-end gap-3 sm:gap-4 text-left lg:text-right">
                              <div className="bg-black/60 border border-white/10 px-6 sm:px-8 py-3 rounded-2xl flex items-center gap-4 group-hover:border-[#00E5FF]/40 transition-colors w-fit lg:w-auto shadow-inner">
                                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                                <div>
                                  <p className="text-slate-300 font-bold text-xs tracking-widest uppercase text-left">
                                    Local da Aula
                                  </p>
                                  <p className="text-white font-black text-xl sm:text-2xl drop-shadow-md">
                                    {aula.sala?.nome || "A definir"}{" "}
                                    {aula.sala?.bloco &&
                                      `(Bl. ${aula.sala.bloco})`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 bg-white/5 px-4 sm:px-6 py-2 rounded-full border border-white/5 w-fit lg:w-auto">
                                <Users className="w-5 h-5 text-slate-300" />
                                <span className="text-slate-200 font-bold text-base sm:text-lg uppercase tracking-wider">
                                  Prof. {aula.professor?.nome || "A definir"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </>
                  )}

                  {/* SALAS */}
                  {activeMenu === "sala" && (
                    <>
                      {salasStatus === "loading" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#00E5FF]/50 gap-6 animate-pulse">
                          <MapPin
                            size={80}
                            className="drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                          />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            A mapear infraestrutura...
                          </p>
                        </div>
                      )}
                      {salasStatus === "error" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-6">
                          <Ban size={80} />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            Falha de Comunicação.
                          </p>
                        </div>
                      )}
                      {salasStatus === "success" && salas.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6">
                          <MapPin size={80} className="opacity-50" />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            Nenhuma sala registada.
                          </p>
                        </div>
                      )}

                      {salasStatus === "success" && salas.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                          {salas.map((sala) => (
                            <div
                              key={sala.id}
                              className="bg-gradient-to-b from-white/5 to-black/60 border border-white/10 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 sm:gap-6 hover:border-[#00E5FF]/50 hover:bg-white/5 transition-all shadow-xl group relative overflow-hidden"
                            >
                              <div className="absolute -top-10 -right-10 bg-[#00E5FF]/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-[#00E5FF]/20 transition-colors"></div>
                              <div className="p-4 sm:p-6 rounded-[2rem] bg-black/80 border border-white/10 group-hover:border-[#00E5FF]/40 transition-colors relative z-10 shadow-inner">
                                <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                              </div>
                              <div className="relative z-10">
                                <h4 className="text-xl sm:text-3xl font-black text-white mb-2 sm:mb-3 drop-shadow-md">
                                  {sala.nome}
                                </h4>
                                <span className="inline-block bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm">
                                  {sala.bloco
                                    ? `Bloco ${sala.bloco}`
                                    : "Bloco Principal"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* PROFESSORES */}
                  {activeMenu === "professor" && (
                    <>
                      {professoresStatus === "loading" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#00E5FF]/50 gap-6 animate-pulse">
                          <Users
                            size={80}
                            className="drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                          />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            A procurar no diretório...
                          </p>
                        </div>
                      )}
                      {professoresStatus === "error" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-6">
                          <Ban size={80} />
                          <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                            Falha de Comunicação.
                          </p>
                        </div>
                      )}
                      {professoresStatus === "success" &&
                        professores.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-6">
                            <Users size={80} className="opacity-50" />
                            <p className="text-xl sm:text-3xl font-black uppercase tracking-widest text-center">
                              Nenhum docente registado.
                            </p>
                          </div>
                        )}

                      {professoresStatus === "success" &&
                        professores.length > 0 && (
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {professores.map((prof) => (
                              <div
                                key={prof.id}
                                className="bg-gradient-to-r from-white/5 to-black/60 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex items-center gap-6 hover:border-[#00E5FF]/50 hover:bg-white/5 transition-all shadow-xl group relative overflow-hidden"
                              >
                                <div className="absolute -left-10 top-1/2 -translate-y-1/2 bg-[#00E5FF]/5 w-40 h-40 rounded-full blur-3xl group-hover:bg-[#00E5FF]/20 transition-colors"></div>
                                <div className="p-4 sm:p-5 rounded-[2rem] bg-black/80 border border-white/10 group-hover:border-[#00E5FF]/40 transition-colors relative z-10 shrink-0 shadow-inner">
                                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                                </div>
                                <div className="relative z-10 flex-1">
                                  <p className="text-[#00E5FF] font-black text-xs uppercase tracking-widest mb-1 drop-shadow-sm">
                                    Docente
                                  </p>
                                  <h4 className="text-xl sm:text-2xl font-black text-white mb-2 line-clamp-1 drop-shadow-md">
                                    {prof.nome}
                                  </h4>
                                  <p className="text-slate-300 font-bold text-sm sm:text-base bg-black/40 w-fit px-3 py-1 rounded-xl border border-white/10 truncate max-w-full">
                                    {prof.email || "Sem e-mail registado"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
