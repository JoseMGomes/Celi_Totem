"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INTERVALO_SINCRONIA_MS } from "@/lib/celi/config";
import {
  buscarAulas,
  buscarAvisos,
  buscarProfessores,
  buscarSalas,
} from "@/lib/celi/dados";
import type { BaseConhecimento, Recurso } from "@/lib/celi/tipos";

const BASE_INICIAL: BaseConhecimento = {
  aulas: { dados: [], status: "carregando" },
  salas: { dados: [], status: "carregando" },
  professores: { dados: [], status: "carregando" },
  avisos: { dados: [], status: "carregando" },
  sincronizadoEm: null,
  online: true,
};

/** Resultado novo substitui; falha mantém o que já tinha em cache. */
function mesclar<T>(anterior: Recurso<T>, resultado: PromiseSettledResult<T[]>): Recurso<T> {
  if (resultado.status === "fulfilled") return { dados: resultado.value, status: "ok" };
  return {
    dados: anterior.dados,
    status: anterior.dados.length > 0 ? "ok" : "erro",
  };
}

/**
 * Mantém a "memória" da CELI: busca tudo no backend ao abrir o totem e
 * re-sincroniza periodicamente. Se o backend cair, segue usando o último
 * dado bom (o totem não pode ficar sem resposta por causa de um soluço de rede).
 */
export function useBaseConhecimento() {
  const [base, setBase] = useState<BaseConhecimento>(BASE_INICIAL);
  const montado = useRef(true);

  const sincronizar = useCallback(async () => {
    const resultados = await Promise.allSettled([
      buscarAulas(),
      buscarSalas(),
      buscarProfessores(),
      buscarAvisos(),
    ]);
    if (!montado.current) return;

    const [aulas, salas, professores, avisos] = resultados;
    const tudoOk = resultados.every((r) => r.status === "fulfilled");

    setBase((ant) => ({
      aulas: mesclar(ant.aulas, aulas),
      salas: mesclar(ant.salas, salas),
      professores: mesclar(ant.professores, professores),
      avisos: mesclar(ant.avisos, avisos),
      sincronizadoEm: tudoOk ? Date.now() : ant.sincronizadoEm,
      online: tudoOk,
    }));
  }, []);

  useEffect(() => {
    montado.current = true;
    void sincronizar();
    const id = setInterval(() => void sincronizar(), INTERVALO_SINCRONIA_MS);
    return () => {
      montado.current = false;
      clearInterval(id);
    };
  }, [sincronizar]);

  /** Disparado pelo botão "Tentar de novo": volta pro estado de carregamento e busca já. */
  const recarregar = useCallback(() => {
    setBase((ant) => {
      const marcar = <T,>(r: Recurso<T>): Recurso<T> =>
        r.dados.length > 0 ? r : { ...r, status: "carregando" };
      return {
        ...ant,
        aulas: marcar(ant.aulas),
        salas: marcar(ant.salas),
        professores: marcar(ant.professores),
        avisos: marcar(ant.avisos),
      };
    });
    void sincronizar();
  }, [sincronizar]);

  return { base, recarregar };
}
