"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Expressao } from "@/lib/celi/tipos";

gsap.registerPlugin(useGSAP);

/* ------------------------------------------------------------------
 * Geometria (viewBox 0 0 400 300)
 * ------------------------------------------------------------------ */
const OLHO_E = { x: 130, y: 132 };
const OLHO_D = { x: 270, y: 132 };
const OLHO_RX = 46;
const OLHO_RY = 62;
const PUPILA_R = 20;
const BOCA_X = 200;

/* ------------------------------------------------------------------
 * Parâmetros do rosto. Cada expressão é só um conjunto de números;
 * o GSAP interpola entre eles e um único render escreve no SVG.
 * ------------------------------------------------------------------ */
interface Parametros {
  olhosVis: number; // opacidade dos olhos "normais"
  abertura: number; // abertura das pálpebras (1 = aberto)
  olhoEX: number;
  olhoEY: number;
  olhoDX: number;
  olhoDY: number;
  pupila: number; // escala da pupila
  olharX: number; // direção do olhar da expressão (-1..1)
  olharY: number;
  feliz: number; // olhos "^ ^"
  fechado: number; // olhos fechados "‿ ‿"
  giro: number; // anel girando (processando)
  sobEY: number; // sobrancelha esquerda: altura, ponta interna, curvatura
  sobEInt: number;
  sobEArco: number;
  sobDY: number;
  sobDInt: number;
  sobDArco: number;
  sobVis: number;
  bocaL: number; // meia-largura
  bocaY: number;
  bocaSup: number; // curva do lábio de cima (+ = pra baixo)
  bocaInf: number; // curva do lábio de baixo
  bocaInc: number; // inclinação (boca torta)
  bocaVis: number;
  pontos: number; // "..." no lugar da boca
  rubor: number;
  brilho: number;
  zzz: number;
}

const BASE: Parametros = {
  olhosVis: 1,
  abertura: 1,
  olhoEX: 1,
  olhoEY: 1,
  olhoDX: 1,
  olhoDY: 1,
  pupila: 1,
  olharX: 0,
  olharY: 0,
  feliz: 0,
  fechado: 0,
  giro: 0,
  sobEY: 50,
  sobEInt: 0,
  sobEArco: 8,
  sobDY: 50,
  sobDInt: 0,
  sobDArco: 8,
  sobVis: 1,
  bocaL: 40,
  bocaY: 236,
  bocaSup: 6,
  bocaInf: 14,
  bocaInc: 0,
  bocaVis: 1,
  pontos: 0,
  rubor: 0,
  brilho: 1,
  zzz: 0,
};

const EXPRESSOES: Record<Expressao, Parametros> = {
  normal: BASE,
  feliz: {
    ...BASE,
    olhosVis: 0,
    feliz: 1,
    sobEY: 40,
    sobDY: 40,
    sobEArco: 14,
    sobDArco: 14,
    bocaL: 54,
    bocaSup: 12,
    bocaInf: 46,
    rubor: 1,
  },
  animado: {
    ...BASE,
    abertura: 1.06,
    olhoEX: 1.1,
    olhoEY: 1.1,
    olhoDX: 1.1,
    olhoDY: 1.1,
    pupila: 1.3,
    sobEY: 32,
    sobDY: 32,
    sobEArco: 16,
    sobDArco: 16,
    bocaL: 34,
    bocaSup: -6,
    bocaInf: 44,
    rubor: 0.6,
  },
  curioso: {
    ...BASE,
    olhoEX: 1.05,
    olhoEY: 1.08,
    olhoDY: 0.82,
    olharX: 0.45,
    olharY: -0.4,
    sobEY: 30,
    sobEArco: 18,
    sobDY: 54,
    sobDInt: 4,
    sobDArco: 4,
    bocaL: 18,
    bocaSup: 2,
    bocaInf: 16,
  },
  processando: {
    ...BASE,
    olhosVis: 0.25,
    giro: 1,
    pupila: 0.6,
    sobEY: 46,
    sobDY: 46,
    sobEInt: 5,
    sobDInt: 5,
    sobEArco: 4,
    sobDArco: 4,
    bocaVis: 0,
    pontos: 1,
  },
  confuso: {
    ...BASE,
    olhoEX: 0.9,
    olhoEY: 0.78,
    olhoDX: 1.06,
    olhoDY: 1.1,
    olharX: -0.4,
    olharY: 0.3,
    sobEY: 56,
    sobEInt: 7,
    sobEArco: 2,
    sobDY: 34,
    sobDInt: -6,
    sobDArco: 12,
    bocaL: 34,
    bocaSup: 4,
    bocaInf: 8,
    bocaInc: 9,
  },
  sonolento: {
    ...BASE,
    abertura: 0.32,
    olharY: 0.5,
    sobEY: 62,
    sobDY: 62,
    sobEInt: -3,
    sobDInt: -3,
    sobEArco: 2,
    sobDArco: 2,
    bocaL: 22,
    bocaSup: 3,
    bocaInf: 9,
    brilho: 0.75,
  },
  dormindo: {
    ...BASE,
    olhosVis: 0,
    fechado: 1,
    sobEY: 66,
    sobDY: 66,
    sobEInt: -2,
    sobDInt: -2,
    sobEArco: -3,
    sobDArco: -3,
    sobVis: 0.5,
    bocaL: 14,
    bocaSup: 4,
    bocaInf: 4,
    brilho: 0.55,
    zzz: 1,
  },
};

/** Valores "vivos" que somam por cima da expressão. */
interface Vivo {
  piscar: number;
  saccX: number;
  saccY: number;
  toqueX: number;
  toqueY: number;
  fala: number;
}

const COR = "#00E5FF";
const lim = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Props {
  expressao: Expressao;
  /** Enquanto true, a boca mexe como se estivesse falando. */
  falando?: boolean;
  className?: string;
}

export default function CeliFace({ expressao, falando = false, className }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const p = useRef<Parametros>({ ...EXPRESSOES[expressao] });
  const vivo = useRef<Vivo>({ piscar: 1, saccX: 0, saccY: 0, toqueX: 0, toqueY: 0, fala: 0 });
  const exprAtual = useRef<Expressao>(expressao);
  const exprAnterior = useRef<Expressao>(expressao);

  /* ---------- Render: escreve os parâmetros atuais no SVG ---------- */
  useGSAP(
    () => {
      const pegar = (nome: string) =>
        raiz.current?.querySelector<SVGElement>(`[data-celi="${nome}"]`) ?? null;
      const el = {
        face: pegar("face"),
        olhoE: pegar("olhoE"),
        olhoD: pegar("olhoD"),
        pupE: pegar("pupE"),
        pupD: pegar("pupD"),
        brilhoE: pegar("brilhoE"),
        brilhoD: pegar("brilhoD"),
        feliz: pegar("feliz"),
        fechado: pegar("fechado"),
        giro: pegar("giro"),
        sobE: pegar("sobE"),
        sobD: pegar("sobD"),
        boca: pegar("boca"),
        pontos: pegar("pontos"),
        rubor: pegar("rubor"),
        zzz: pegar("zzz"),
      };

      const render = () => {
        const v = p.current;
        const r = vivo.current;
        const set = (alvo: SVGElement | null, attr: string, val: string | number) =>
          alvo?.setAttribute(attr, String(val));

        // Olhos (escala em torno do centro de cada olho).
        const abre = Math.max(0.02, v.abertura * r.piscar);
        const olho = (alvo: SVGElement | null, c: { x: number; y: number }, sx: number, sy: number) =>
          set(alvo, "transform", `translate(${c.x} ${c.y}) scale(${sx} ${Math.max(0.02, sy * abre)}) translate(${-c.x} ${-c.y})`);
        olho(el.olhoE, OLHO_E, v.olhoEX, v.olhoEY);
        olho(el.olhoD, OLHO_D, v.olhoDX, v.olhoDY);
        set(el.olhoE, "opacity", v.olhosVis);
        set(el.olhoD, "opacity", v.olhosVis);

        // Pupilas: expressão + passeio do olhar + toque na tela.
        const ox = lim(v.olharX + r.saccX + r.toqueX, -1, 1) * 18;
        const oy = lim(v.olharY + r.saccY + r.toqueY, -1, 1) * 26;
        const raio = PUPILA_R * v.pupila;
        for (const [pup, brilho, c] of [
          [el.pupE, el.brilhoE, OLHO_E],
          [el.pupD, el.brilhoD, OLHO_D],
        ] as const) {
          set(pup, "cx", c.x + ox);
          set(pup, "cy", c.y + oy);
          set(pup, "r", raio);
          set(brilho, "cx", c.x + ox - raio * 0.35);
          set(brilho, "cy", c.y + oy - raio * 0.35);
          set(brilho, "r", raio * 0.28);
        }

        set(el.feliz, "opacity", v.feliz);
        set(el.fechado, "opacity", v.fechado);
        set(el.giro, "opacity", v.giro);

        // Sobrancelhas.
        set(el.sobE, "d", `M 92 ${v.sobEY} Q 130 ${v.sobEY - v.sobEArco} 168 ${v.sobEY + v.sobEInt}`);
        set(el.sobD, "d", `M 232 ${v.sobDY + v.sobDInt} Q 270 ${v.sobDY - v.sobDArco} 308 ${v.sobDY}`);
        set(el.sobE, "opacity", v.sobVis);
        set(el.sobD, "opacity", v.sobVis);

        // Boca: dois arcos (lábio de cima e de baixo) — quando se afastam, ela "abre".
        const w = v.bocaL + r.fala * 4;
        const ly = v.bocaY + v.bocaInc;
        const ry = v.bocaY - v.bocaInc;
        const sup = v.bocaY + v.bocaSup;
        const inf = v.bocaY + v.bocaInf + r.fala * 24;
        set(el.boca, "d", `M ${BOCA_X - w} ${ly} Q ${BOCA_X} ${sup} ${BOCA_X + w} ${ry} Q ${BOCA_X} ${inf} ${BOCA_X - w} ${ly} Z`);
        set(el.boca, "fill-opacity", lim((inf - sup) / 70, 0, 0.45));
        set(el.boca, "opacity", v.bocaVis);

        set(el.pontos, "opacity", v.pontos);
        set(el.rubor, "opacity", v.rubor * 0.9);
        set(el.zzz, "opacity", v.zzz);
        set(el.face, "opacity", v.brilho);
      };

      gsap.ticker.add(render);
      render();
      return () => gsap.ticker.remove(render);
    },
    { scope: raiz },
  );

  /* ---------- Vida: piscar, olhar em volta, respirar, Zzz ---------- */
  useGSAP(
    () => {
      const r = vivo.current;

      const piscar = () => {
        const e = exprAtual.current;
        if (e !== "dormindo" && e !== "processando" && e !== "feliz") {
          const tl = gsap.timeline();
          tl.to(r, { piscar: 0.05, duration: 0.07, ease: "power2.in" }).to(r, {
            piscar: 1,
            duration: 0.13,
            ease: "power2.out",
          });
          if (Math.random() < 0.2) {
            tl.to(r, { piscar: 0.05, duration: 0.07 }).to(r, { piscar: 1, duration: 0.13 });
          }
        }
        gsap.delayedCall(gsap.utils.random(2.2, 6), piscar);
      };
      gsap.delayedCall(1.5, piscar);

      const passear = () => {
        const e = exprAtual.current;
        const parado = e === "dormindo" || e === "processando" || Math.random() < 0.35;
        gsap.to(r, {
          saccX: parado ? 0 : gsap.utils.random(-0.55, 0.55),
          saccY: parado ? 0 : gsap.utils.random(-0.35, 0.3),
          duration: 0.18,
          ease: "power2.out",
        });
        gsap.delayedCall(gsap.utils.random(1.2, 3.4), passear);
      };
      gsap.delayedCall(2, passear);

      // Respiração do rosto inteiro.
      gsap.to(raiz.current, {
        y: -8,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // Zzz subindo (só aparecem quando o parâmetro zzz > 0).
      gsap.utils.toArray<SVGTextElement>(".celi-z").forEach((z, i) => {
        gsap.fromTo(
          z,
          { opacity: 0, x: 0, y: 0, scale: 0.5, transformOrigin: "50% 50%" },
          {
            keyframes: [
              { opacity: 1, x: 8, y: -14, scale: 1.1, duration: 1 },
              { opacity: 0, x: 18, y: -34, scale: 1.4, duration: 1.4 },
            ],
            repeat: -1,
            delay: i * 0.8,
            ease: "sine.inOut",
          },
        );
      });

      // Anel de processamento girando.
      gsap.to(".celi-giro", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 1.4,
        repeat: -1,
        ease: "none",
      });
    },
    { scope: raiz },
  );

  /* ---------- Troca de expressão ---------- */
  useEffect(() => {
    const anterior = exprAnterior.current;
    exprAtual.current = expressao;
    exprAnterior.current = expressao;

    const indo = expressao === "dormindo";
    gsap.to(p.current, {
      ...EXPRESSOES[expressao],
      duration: indo ? 1.4 : 0.5,
      ease: indo ? "sine.inOut" : "back.out(1.7)",
      overwrite: "auto",
    });

    // Acordando: "boot" com glitch e varredura.
    if (anterior === "dormindo" && expressao !== "dormindo" && svg.current) {
      gsap
        .timeline()
        .to(svg.current, { opacity: 0.3, skewX: 8, duration: 0.05 })
        .to(svg.current, { opacity: 1, skewX: -4, duration: 0.05 })
        .to(svg.current, { opacity: 0.5, skewX: 0, duration: 0.04 })
        .to(svg.current, { opacity: 1, duration: 0.2 });
      gsap.fromTo(
        svg.current.querySelector('[data-celi="scan"]'),
        { attr: { y: -30 }, opacity: 0.9 },
        { attr: { y: 310 }, opacity: 0, duration: 0.7, ease: "power2.in" },
      );
    }
  }, [expressao]);

  /* ---------- Boca falando ---------- */
  useEffect(() => {
    const r = vivo.current;
    if (!falando) {
      gsap.to(r, { fala: 0, duration: 0.15, overwrite: true });
      return;
    }
    const t = gsap.to(r, {
      fala: "random(0.15, 1)",
      duration: 0.11,
      repeat: -1,
      repeatRefresh: true,
      ease: "sine.inOut",
      overwrite: true,
    });
    return () => {
      t.kill();
    };
  }, [falando]);

  /* ---------- Olhos seguem o toque na tela ---------- */
  useEffect(() => {
    const r = vivo.current;
    let volta: gsap.core.Tween | null = null;
    const aoTocar = (e: PointerEvent) => {
      if (exprAtual.current === "dormindo" || !svg.current) return;
      const caixa = svg.current.getBoundingClientRect();
      const cx = caixa.left + caixa.width / 2;
      const cy = caixa.top + caixa.height * 0.45;
      const dx = lim((e.clientX - cx) / (caixa.width * 0.9), -1, 1);
      const dy = lim((e.clientY - cy) / (caixa.height * 0.9), -1, 1);
      gsap.to(r, { toqueX: dx, toqueY: dy, duration: 0.25, ease: "power3.out", overwrite: "auto" });
      volta?.kill();
      volta = gsap.delayedCall(1.8, () => {
        gsap.to(r, { toqueX: 0, toqueY: 0, duration: 0.6, ease: "power2.inOut" });
      });
    };
    window.addEventListener("pointerdown", aoTocar);
    return () => {
      window.removeEventListener("pointerdown", aoTocar);
      volta?.kill();
    };
  }, []);

  return (
    <div ref={raiz} className={`flex h-full w-full items-center justify-center ${className ?? ""}`}>
      <svg
        ref={svg}
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full overflow-visible"
        style={{ filter: `drop-shadow(0 0 10px ${COR}) drop-shadow(0 0 28px rgba(0,229,255,0.45))` }}
        aria-hidden
      >
        <defs>
          <clipPath id="celi-clip-e" clipPathUnits="userSpaceOnUse">
            <ellipse cx={OLHO_E.x} cy={OLHO_E.y} rx={OLHO_RX - 3} ry={OLHO_RY - 3} />
          </clipPath>
          <clipPath id="celi-clip-d" clipPathUnits="userSpaceOnUse">
            <ellipse cx={OLHO_D.x} cy={OLHO_D.y} rx={OLHO_RX - 3} ry={OLHO_RY - 3} />
          </clipPath>
          <radialGradient id="celi-iris" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={COR} stopOpacity="0.22" />
            <stop offset="100%" stopColor={COR} stopOpacity="0.04" />
          </radialGradient>
        </defs>

        <g data-celi="face">
          {/* Zzz */}
          <g data-celi="zzz" fill={COR} fontWeight="900" fontFamily="var(--font-display), sans-serif">
            <text className="celi-z" x="300" y="70" fontSize="22">Z</text>
            <text className="celi-z" x="322" y="46" fontSize="30">Z</text>
            <text className="celi-z" x="350" y="20" fontSize="40">Z</text>
          </g>

          {/* Sobrancelhas */}
          <path data-celi="sobE" fill="none" stroke={COR} strokeWidth="7" strokeLinecap="round" />
          <path data-celi="sobD" fill="none" stroke={COR} strokeWidth="7" strokeLinecap="round" />

          {/* Olhos normais */}
          {(
            [
              ["E", OLHO_E, "celi-clip-e"],
              ["D", OLHO_D, "celi-clip-d"],
            ] as const
          ).map(([lado, c, clip]) => (
            <g key={clip} data-celi={`olho${lado}`}>
              <ellipse
                cx={c.x}
                cy={c.y}
                rx={OLHO_RX}
                ry={OLHO_RY}
                fill="url(#celi-iris)"
                stroke={COR}
                strokeWidth="7"
              />
              <g clipPath={`url(#${clip})`}>
                <circle data-celi={`pup${lado}`} cx={c.x} cy={c.y} r={PUPILA_R} fill={COR} />
                <circle data-celi={`brilho${lado}`} cx={c.x} cy={c.y} r={6} fill="#E6FDFF" />
              </g>
            </g>
          ))}

          {/* Anel de processamento */}
          <g data-celi="giro" opacity="0">
            {[OLHO_E, OLHO_D].map((c, i) => (
              <g key={i} transform={`translate(${c.x} ${c.y})`}>
                <g className="celi-giro">
                  <circle r="40" fill="none" stroke={COR} strokeWidth="7" strokeDasharray="34 18" strokeLinecap="round" />
                  <circle r="20" fill="none" stroke={COR} strokeWidth="4" strokeDasharray="8 10" opacity="0.6" />
                </g>
              </g>
            ))}
          </g>

          {/* Olhos felizes ^ ^ */}
          <g data-celi="feliz" opacity="0" fill="none" stroke={COR} strokeWidth="9" strokeLinecap="round">
            <path d="M 90 150 Q 130 92 170 150" />
            <path d="M 230 150 Q 270 92 310 150" />
          </g>

          {/* Olhos fechados (dormindo) */}
          <g data-celi="fechado" opacity="0" fill="none" stroke={COR} strokeWidth="8" strokeLinecap="round">
            <path d="M 92 134 Q 130 162 168 134" />
            <path d="M 232 134 Q 270 162 308 134" />
          </g>

          {/* Bochechas */}
          <g data-celi="rubor" opacity="0" stroke={COR} strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7">
            {[52, 306].map((x) => (
              <g key={x}>
                <line x1={x} y1={214} x2={x + 10} y2={202} />
                <line x1={x + 16} y1={214} x2={x + 26} y2={202} />
                <line x1={x + 32} y1={214} x2={x + 42} y2={202} />
              </g>
            ))}
          </g>

          {/* Boca */}
          <path data-celi="boca" fill={COR} stroke={COR} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />

          {/* Processando: ... */}
          <g data-celi="pontos" opacity="0" fill={COR}>
            {[170, 200, 230].map((x, i) => (
              <circle key={x} cx={x} cy={240} r="7" className="celi-ponto" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </g>

          {/* Varredura do boot */}
          <rect data-celi="scan" x="-20" y="-30" width="440" height="6" fill={COR} opacity="0" />
        </g>
      </svg>
    </div>
  );
}
