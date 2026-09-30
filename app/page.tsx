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

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [expression, setExpression] = useState<Expression>("dormindo");
  const [activeMenu, setActiveMenu] = useState<MenuState>("home");
  const [isNavigating, setIsNavigating] = useState(false);

  const [horaLocal, setHoraLocal] = useState("");
  const [dataLocal, setDataLocal] = useState("");
  const [lastInteraction, setLastInteraction] = useState(Date.now());

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
    sala: { titulo: "LOCALIZAR SALA", icone: MapPin },
    professor: { titulo: "CORPO DOCENTE", icone: Users },
    grade: { titulo: "GRADE DE AULAS", icone: CalendarDays },
  };

  const LayoutAtual = activeMenu !== "home" ? layoutInterno[activeMenu] : null;
  const IconeAtivo = LayoutAtual?.icone;

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
      if (Date.now() - lastInteraction > 30000) {
        setIsAwake(false);
        setActiveMenu("home");
        setIsNavigating(false);
        setExpression("dormindo");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAwake, lastInteraction]);

  useEffect(() => {
    if (avisos.length <= 1 || !isAwake || activeMenu !== "home") return;
    const interval = setInterval(() => {
      setAvisoIndex((prev) => (prev + 1) % avisos.length);
    }, 8000);
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

      setTimeout(async () => {
        setExpression("processando");
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
          setTimeout(() => setExpression("normal"), 1500);
        } catch (error) {
          console.log("API de avisos offline.");
          setAvisoStatus("error");
          setExpression("confuso");
          setTimeout(() => setExpression("normal"), 3500);
        }
      }, 1500);
    }
  };

  const navigateTo = async (menu: MenuState) => {
    setLastInteraction(Date.now());
    setIsNavigating(true);
    setExpression("processando");

    // GRADE
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
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
          setExpression("normal");
        }, 800);
      } catch (error) {
        setGradeStatus("error");
        setExpression("confuso");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
        }, 1500);
      }
    }
    // SALAS
    else if (menu === "sala") {
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
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
          setExpression("normal");
        }, 800);
      } catch (error) {
        setSalasStatus("error");
        setExpression("confuso");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
        }, 1500);
      }
    }
    // PROFESSORES
    else if (menu === "professor") {
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
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
          setExpression("normal");
        }, 800);
      } catch (error) {
        setProfessoresStatus("error");
        setExpression("confuso");
        setTimeout(() => {
          setActiveMenu(menu);
          setIsNavigating(false);
        }, 1500);
      }
    } else {
      setTimeout(() => {
        setActiveMenu(menu);
        setIsNavigating(false);
        setExpression("normal");
      }, 1500);
    }
  };

  const goHome = () => {
    setLastInteraction(Date.now());
    setActiveMenu("home");
    setExpression("normal");
  };

  if (!isMounted) return null;

  return (
    <main
      className="flex h-screen w-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#00E5FF] selection:text-black relative"
      onClick={handleInteraction}
    >
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[1000px] -translate-y-1/2 -translate-x-1/2 rounded-[100%] bg-[#00E5FF]/10 blur-[150px]"></div>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col w-full h-full p-8">
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
              onClick={() => goHome()}
              className="flex items-center gap-4 bg-white/5 hover:bg-[#00E5FF]/20 border border-white/10 hover:border-[#00E5FF]/50 transition-all rounded-2xl px-6 py-4 shadow-[0_0_20px_rgba(0,229,255,0.1)] group"
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
              <Clock3 size={28} className="text-[#00E5FF]" />
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

            {isAwake && activeMenu === "home" && (
              <motion.div
                key="layout-home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                    className="w-full flex-1 max-h-[500px] flex items-center justify-center z-20 drop-shadow-[0_0_15px_#00E5FF]"
                  >
                    <CeliFace expression={expression} />
                  </motion.div>

                  <AnimatePresence>
                    {!isNavigating && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-10 w-full h-[140px] flex flex-col justify-center rounded-3xl border border-white/10 bg-gradient-to-r from-transparent via-[#00E5FF]/5 to-transparent backdrop-blur-sm p-6 text-center shadow-[0_0_30px_rgba(0,229,255,0.05)]"
                      >
                        <p className="text-xs font-bold text-[#00E5FF]/70 uppercase tracking-[0.3em] mb-3 flex justify-center items-center gap-2">
                          <Megaphone size={14} /> MURAL INSTITUCIONAL
                        </p>
                        {avisoStatus === "loading" && (
                          <p className="text-lg font-medium text-slate-400 animate-pulse">
                            Sincronizando com a rede...
                          </p>
                        )}
                        {avisoStatus === "error" && (
                          <p className="text-lg font-bold text-red-400">
                            Falha de conexão com os servidores.
                          </p>
                        )}
                        {avisoStatus === "success" && avisos.length === 0 && (
                          <p className="text-lg font-medium text-slate-300">
                            Nenhum aviso para hoje.
                          </p>
                        )}
                        {avisoStatus === "success" && avisos.length > 0 && (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={avisoIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.5 }}
                            >
                              <p className="text-xl font-bold text-white px-6 line-clamp-2">
                                {avisos[avisoIndex]?.mensagem}
                              </p>
                            </motion.div>
                          </AnimatePresence>
                        )}
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
                          <CalendarDays
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {isAwake && activeMenu !== "home" && (
              <motion.div
                key="layout-interna"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center w-full h-full"
              >
                <motion.div
                  layoutId="celi-face"
                  className="h-[25%] w-full max-w-[400px] flex items-center justify-center shrink-0 z-20 drop-shadow-[0_0_10px_#00E5FF]"
                >
                  <CeliFace expression={expression} />
                </motion.div>

                <div className="w-full max-w-[1400px] flex-1 rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_-10px_50px_rgba(0,229,255,0.05)] p-10 flex flex-col mb-4 relative z-10 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6 shrink-0">
                    <h2 className="text-4xl font-extrabold text-[#00E5FF] uppercase tracking-widest flex items-center gap-4">
                      {IconeAtivo && <IconeAtivo size={36} />}
                      {LayoutAtual?.titulo}
                    </h2>

                    {activeMenu === "grade" && gradeStatus === "success" && (
                      <div className="flex gap-2">
                        {diasSemana.map((dia, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDiaSelecionado(index);
                            }}
                            className={`px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                              diaSelecionado === index
                                ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50"
                                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {dia.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full flex flex-col gap-5 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-[#00E5FF]/40 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {activeMenu === "grade" && (
                      <>
                        {gradeStatus === "loading" && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 animate-pulse">
                            <CalendarDays size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Carregando matriz da API...
                            </p>
                          </div>
                        )}
                        {gradeStatus === "error" && (
                          <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-4 p-10 border-2 border-dashed border-red-900 rounded-3xl bg-red-950/20">
                            <Ban size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Não foi possível carregar a grade.
                            </p>
                          </div>
                        )}
                        {gradeStatus === "success" &&
                          aulasFiltradas.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                              <CalendarDays size={64} />
                              <p className="text-2xl font-bold uppercase tracking-widest">
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
                              className="bg-white/5 border border-white/10 rounded-[1.5rem] p-8 flex items-center justify-between hover:bg-white/10 transition-colors shadow-lg shrink-0"
                            >
                              <div className="flex flex-col gap-2">
                                <h4 className="text-3xl font-bold text-white mb-2">
                                  {aula.semestre?.curso?.nome || "Curso Livre"}{" "}
                                  - {aula.semestre?.nome || "Semestre"}
                                </h4>
                                <p className="text-[#00E5FF] font-semibold flex items-center gap-3 text-xl">
                                  <Clock3 size={24} /> {aula.horarioInicio} às{" "}
                                  {aula.horarioFim}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-3 text-right">
                                <p className="text-slate-200 font-medium flex items-center gap-3 text-2xl bg-black/30 px-5 py-2 rounded-full border border-white/5">
                                  <MapPin
                                    size={24}
                                    className="text-[#00E5FF]"
                                  />{" "}
                                  Sala: {aula.sala?.nome || "A definir"}{" "}
                                  {aula.sala?.bloco &&
                                    `(Bl. ${aula.sala.bloco})`}
                                </p>
                                <p className="text-slate-400 flex items-center gap-3 text-lg mt-1">
                                  <Users size={20} className="text-[#00E5FF]" />{" "}
                                  Prof. {aula.professor?.nome || "A definir"}
                                </p>
                              </div>
                            </div>
                          ))}
                      </>
                    )}

                    {activeMenu === "sala" && (
                      <>
                        {salasStatus === "loading" && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 animate-pulse">
                            <MapPin size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Mapeando infraestrutura...
                            </p>
                          </div>
                        )}
                        {salasStatus === "error" && (
                          <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-4 p-10 border-2 border-dashed border-red-900 rounded-3xl bg-red-950/20">
                            <Ban size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Falha ao buscar locais.
                            </p>
                          </div>
                        )}
                        {salasStatus === "success" && salas.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                            <MapPin size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Nenhuma sala cadastrada.
                            </p>
                          </div>
                        )}
                        {salasStatus === "success" && salas.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {salas.map((sala) => (
                              <div
                                key={sala.id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 hover:border-[#00E5FF]/50 transition-colors shadow-lg group"
                              >
                                <div className="p-4 rounded-full bg-black/50 border border-white/5 group-hover:bg-[#00E5FF]/10 transition-colors">
                                  <MapPin
                                    size={32}
                                    className="text-slate-400 group-hover:text-[#00E5FF]"
                                  />
                                </div>
                                <div>
                                  <h4 className="text-2xl font-bold text-white mb-1">
                                    {sala.nome}
                                  </h4>
                                  <p className="text-[#00E5FF] font-semibold text-sm uppercase tracking-widest">
                                    {sala.bloco
                                      ? `Bloco ${sala.bloco}`
                                      : "Bloco Principal"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {activeMenu === "professor" && (
                      <>
                        {professoresStatus === "loading" && (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 animate-pulse">
                            <Users size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Buscando diretório acadêmico...
                            </p>
                          </div>
                        )}
                        {professoresStatus === "error" && (
                          <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-4 p-10 border-2 border-dashed border-red-900 rounded-3xl bg-red-950/20">
                            <Ban size={64} />
                            <p className="text-2xl font-bold uppercase tracking-widest">
                              Falha ao carregar diretório.
                            </p>
                          </div>
                        )}
                        {professoresStatus === "success" &&
                          professores.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                              <Users size={64} />
                              <p className="text-2xl font-bold uppercase tracking-widest">
                                Nenhum professor cadastrado.
                              </p>
                            </div>
                          )}
                        {professoresStatus === "success" &&
                          professores.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {professores.map((prof) => (
                                <div
                                  key={prof.id}
                                  className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-start gap-4 hover:bg-white/10 hover:border-[#00E5FF]/50 transition-colors shadow-lg group relative overflow-hidden"
                                >
                                  <div className="absolute -right-6 -top-6 rounded-full bg-[#00E5FF]/5 p-12 blur-2xl group-hover:bg-[#00E5FF]/20 transition-colors"></div>
                                  <div className="p-3 rounded-xl bg-black/50 border border-white/5 group-hover:bg-[#00E5FF]/10 transition-colors relative z-10">
                                    <Users
                                      size={28}
                                      className="text-slate-400 group-hover:text-[#00E5FF]"
                                    />
                                  </div>
                                  <div className="relative z-10">
                                    <p className="text-[#00E5FF] font-semibold text-xs uppercase tracking-widest mb-1">
                                      Docente
                                    </p>
                                    <h4
                                      className="text-xl font-bold text-white mb-1 line-clamp-1"
                                      title={prof.nome}
                                    >
                                      {prof.nome}
                                    </h4>
                                    <p className="text-slate-400 text-sm">
                                      {prof.email || "Contato Institucional"}
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
      </div>
    </main>
  );
}
