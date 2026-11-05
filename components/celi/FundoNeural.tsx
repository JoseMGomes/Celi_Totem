"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COR = "#00E5FF";
const QTD_PARTICULAS = 1400;
const PROFUNDIDADE = 90;
const TAMANHO_GRADE = 200;
const DIVISOES_GRADE = 80;
const CELULA = TAMANHO_GRADE / DIVISOES_GRADE;

function gerarPosicoes(): Float32Array {
  const arr = new Float32Array(QTD_PARTICULAS * 3);
  for (let i = 0; i < QTD_PARTICULAS; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 90;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 50;
    arr[i * 3 + 2] = -Math.random() * PROFUNDIDADE;
  }
  return arr;
}

/** Textura de ponto redondo e suave (em vez do quadrado padrão). */
function gerarTexturaPonto(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function Cena({ energia }: { energia: number }) {
  const pontos = useRef<THREE.Points>(null);
  const grade = useRef<THREE.GridHelper>(null);
  const velocidade = useRef(energia);
  const alvo = useRef(energia);
  const [posicoes] = useState(gerarPosicoes);
  const [textura] = useState(gerarTexturaPonto);

  useEffect(() => {
    alvo.current = energia;
  }, [energia]);

  useEffect(() => {
    const material = grade.current?.material;
    if (material && !Array.isArray(material)) {
      material.transparent = true;
      material.opacity = 0.22;
    }
    return () => textura.dispose();
  }, [textura]);

  useFrame((state, dt) => {
    const delta = Math.min(dt, 0.05);
    velocidade.current = THREE.MathUtils.lerp(velocidade.current, alvo.current, delta * 1.8);
    const v = velocidade.current;

    // Partículas vêm na direção da câmera e voltam pro fundo.
    const geo = pontos.current?.geometry;
    if (geo) {
      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 2; i < pos.length; i += 3) {
        pos[i] += v * delta * 7;
        if (pos[i] > 6) pos[i] -= PROFUNDIDADE;
      }
      geo.attributes.position.needsUpdate = true;
      pontos.current!.rotation.z += delta * 0.015 * v;
      const mat = pontos.current!.material as THREE.PointsMaterial;
      mat.opacity = 0.35 + Math.min(v, 2) * 0.22;
    }

    // Grade "piso holográfico" andando.
    if (grade.current) {
      grade.current.position.z = -40 + ((state.clock.elapsedTime * v * 4) % CELULA);
    }

    // Câmera balança de leve.
    state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.12) * 1.2;
    state.camera.position.y = Math.cos(state.clock.elapsedTime * 0.1) * 0.6;
    state.camera.lookAt(0, 0, -30);
  });

  return (
    <>
      <fog attach="fog" args={["#02040a", 12, 80]} />
      <points ref={pontos}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posicoes, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={textura}
          color={COR}
          size={0.32}
          sizeAttenuation
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <gridHelper
        ref={grade}
        args={[TAMANHO_GRADE, DIVISOES_GRADE, COR, "#0a4a5c"]}
        position={[0, -11, -40]}
      />
    </>
  );
}

/**
 * Fundo 3D: campo de partículas + grade holográfica.
 * `energia` controla a velocidade (0.1 = dormindo, 1 = normal, 3 = processando).
 */
export default function FundoNeural({ energia }: { energia: number }) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 120 }}
    >
      <Cena energia={energia} />
    </Canvas>
  );
}
