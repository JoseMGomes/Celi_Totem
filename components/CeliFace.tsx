"use client";

import { motion, Variants } from "framer-motion";

export type Expression =
  | "normal"
  | "feliz"
  | "curioso"
  | "processando"
  | "confuso"
  | "dormindo";

interface CeliFaceProps {
  expression: Expression;
}

export default function CeliFace({ expression }: CeliFaceProps) {
  const neonCyan = "#00E5FF";

  const eyebrowLeft = {
    normal: { d: "M 48 26 Q 60 20 72 26", opacity: 1 },
    feliz: { d: "M 45 15 Q 60 5 75 15", opacity: 1 },
    curioso: { d: "M 42 12 Q 60 -5 76 15", opacity: 1 },
    processando: { d: "M 52 22 Q 60 18 68 22", opacity: 1 },
    confuso: { d: "M 45 20 Q 60 25 75 32", opacity: 1 },
    dormindo: { d: "M 48 35 Q 60 38 72 35", opacity: 0.5 },
  };

  const eyebrowRight = {
    normal: { d: "M 128 26 Q 140 20 152 26", opacity: 1 },
    feliz: { d: "M 125 15 Q 140 5 155 15", opacity: 1 },
    curioso: { d: "M 126 30 Q 140 32 154 28", opacity: 1 },
    processando: { d: "M 132 22 Q 140 18 148 22", opacity: 1 },
    confuso: { d: "M 125 12 Q 140 8 155 12", opacity: 1 },
    dormindo: { d: "M 128 35 Q 140 38 152 35", opacity: 0.5 },
  };

  const eyeGroupLeft = {
    normal: { scaleX: 1, scaleY: 1, opacity: 1 },
    feliz: { opacity: 0, scaleX: 1, scaleY: 1 },
    curioso: { scaleX: 1, scaleY: 1, opacity: 1 },
    processando: { opacity: 0, scaleX: 1, scaleY: 1 },
    confuso: { scaleX: 1, scaleY: 0.9, opacity: 1 },
    dormindo: { opacity: 0, scaleX: 1, scaleY: 0.1 },
  };

  const eyeGroupRight = {
    normal: { scaleX: 1, scaleY: 1, opacity: 1 },
    feliz: { opacity: 0, scaleX: 1, scaleY: 1 },
    curioso: { scaleX: 1, scaleY: 0.85, opacity: 1 },
    processando: { opacity: 0, scaleX: 1, scaleY: 1 },
    confuso: { scaleX: 1.05, scaleY: 1.1, opacity: 1 },
    dormindo: { opacity: 0, scaleX: 1, scaleY: 0.1 },
  };

  const pupilLeft = {
    normal: { cx: 60, cy: 65 },
    feliz: { cx: 60, cy: 65 },
    curioso: { cx: 68, cy: 52 },
    processando: { cx: 60, cy: 65 },
    confuso: { cx: 55, cy: 70 },
    dormindo: { cx: 60, cy: 60 },
  };

  const pupilRight = {
    normal: { cx: 140, cy: 65 },
    feliz: { cx: 140, cy: 65 },
    curioso: { cx: 148, cy: 52 },
    processando: { cx: 140, cy: 65 },
    confuso: { cx: 145, cy: 55 },
    dormindo: { cx: 140, cy: 60 },
  };

  const dashedEye: Variants = {
    normal: { opacity: 0, strokeDashoffset: 0 },
    feliz: { opacity: 0, strokeDashoffset: 0 },
    curioso: { opacity: 0, strokeDashoffset: 0 },
    confuso: { opacity: 0, strokeDashoffset: 0 },
    dormindo: { opacity: 0, strokeDashoffset: 0 },
    processando: {
      opacity: 1,
      strokeDashoffset: [0, -160],
      transition: {
        opacity: { duration: 0.2 },
        strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" },
      },
    },
  };

  const happyEye = {
    normal: { opacity: 0, y: 10 },
    feliz: { opacity: 1, y: 0 },
    curioso: { opacity: 0, y: 10 },
    processando: { opacity: 0, y: 10 },
    confuso: { opacity: 0, y: 10 },
    dormindo: { opacity: 0, y: 10 },
  };

  const sleepingEye = {
    normal: { opacity: 0 },
    feliz: { opacity: 0 },
    curioso: { opacity: 0 },
    processando: { opacity: 0 },
    confuso: { opacity: 0 },
    dormindo: { opacity: 1 },
  };

  const mouthVariants = {
    normal: { d: "M 30 15 Q 50 20 70 15", opacity: 1 },
    feliz: { d: "M 20 5 Q 50 25 80 5", opacity: 1 },
    curioso: { d: "M 40 18 Q 50 16 60 18", opacity: 1 },
    processando: { opacity: 0 },
    confuso: { d: "M 35 24 Q 50 18 65 12", opacity: 1 },
    dormindo: { d: "M 40 18 Q 50 16 60 18", opacity: 0.5 },
  };

  const processingMouth: Variants = {
    normal: { opacity: 0 },
    feliz: { opacity: 0 },
    curioso: { opacity: 0 },
    confuso: { opacity: 0 },
    dormindo: { opacity: 0 },
    processando: {
      opacity: 1,
      transition: { repeat: Infinity, repeatType: "reverse", duration: 0.8 },
    },
  };

  const zzzVariants: Variants = {
    hidden: { opacity: 0, x: 0, y: 0, scale: 0.5 },
    visible: (custom: number) => ({
      opacity: [0, 1, 0.8, 0],
      x: [0, 10, 20],
      y: [0, -15, -30],
      scale: [0.5, 1.2, 1.4],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        delay: custom * 0.8,
        ease: "easeInOut",
        times: [0, 0.4, 0.7, 1],
      },
    }),
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox="0 -30 200 180" // MAGIA: Isso resolve o Zzz cortado e os olhos cortados
        className="w-full h-full max-h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id="left-eye-clip">
            <ellipse cx="60" cy="60" rx="16" ry="26" />
          </clipPath>
          <clipPath id="right-eye-clip">
            <ellipse cx="140" cy="60" rx="16" ry="26" />
          </clipPath>
        </defs>

        <motion.text x="135" y="45" fill={neonCyan} fontSize="14" fontWeight="bold" opacity="0" variants={zzzVariants} initial="hidden" custom={0} animate={expression === "dormindo" ? "visible" : "hidden"}>Z</motion.text>
        <motion.text x="150" y="30" fill={neonCyan} fontSize="20" fontWeight="bold" opacity="0" variants={zzzVariants} initial="hidden" custom={1} animate={expression === "dormindo" ? "visible" : "hidden"}>Z</motion.text>
        <motion.text x="170" y="15" fill={neonCyan} fontSize="26" fontWeight="bold" opacity="0" variants={zzzVariants} initial="hidden" custom={2} animate={expression === "dormindo" ? "visible" : "hidden"}>Z</motion.text>

        <motion.path variants={eyebrowLeft} initial="normal" animate={expression} transition={{ type: "spring", stiffness: 150, damping: 12 }} fill="transparent" stroke={neonCyan} strokeWidth="3" strokeLinecap="round" />
        <motion.path variants={eyebrowRight} initial="normal" animate={expression} transition={{ type: "spring", stiffness: 150, damping: 12 }} fill="transparent" stroke={neonCyan} strokeWidth="3" strokeLinecap="round" />

        <motion.g variants={eyeGroupLeft} initial="normal" animate={expression} style={{ originX: "60px", originY: "60px" }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
          <ellipse cx="60" cy="60" rx="16" ry="26" fill="transparent" stroke={neonCyan} strokeWidth="4" />
          <motion.circle r="6" fill={neonCyan} variants={pupilLeft} initial="normal" animate={expression} clipPath="url(#left-eye-clip)" />
        </motion.g>

        <motion.g variants={eyeGroupRight} initial="normal" animate={expression} style={{ originX: "140px", originY: "60px" }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
          <ellipse cx="140" cy="60" rx="16" ry="26" fill="transparent" stroke={neonCyan} strokeWidth="4" />
          <motion.circle r="6" fill={neonCyan} variants={pupilRight} initial="normal" animate={expression} clipPath="url(#right-eye-clip)" />
        </motion.g>

        <motion.ellipse cx="60" cy="60" rx="16" ry="26" fill="transparent" stroke={neonCyan} strokeWidth="4" strokeDasharray="8 8" variants={dashedEye} initial="normal" animate={expression} />
        <motion.ellipse cx="140" cy="60" rx="16" ry="26" fill="transparent" stroke={neonCyan} strokeWidth="4" strokeDasharray="8 8" variants={dashedEye} initial="normal" animate={expression} />

        <motion.path d="M 44 65 A 16 26 0 0 1 76 65" fill="transparent" stroke={neonCyan} strokeWidth="4" strokeLinecap="round" variants={happyEye} initial="normal" animate={expression} />
        <motion.path d="M 124 65 A 16 26 0 0 1 156 65" fill="transparent" stroke={neonCyan} strokeWidth="4" strokeLinecap="round" variants={happyEye} initial="normal" animate={expression} />

        <motion.path d="M 46 65 Q 60 75 74 65" fill="transparent" stroke={neonCyan} strokeWidth="4" strokeLinecap="round" variants={sleepingEye} initial="normal" animate={expression} />
        <motion.path d="M 126 65 Q 140 75 154 65" fill="transparent" stroke={neonCyan} strokeWidth="4" strokeLinecap="round" variants={sleepingEye} initial="normal" animate={expression} />

        <motion.path variants={mouthVariants} initial="normal" animate={expression} transition={{ type: "spring", stiffness: 150, damping: 12 }} fill="transparent" stroke={neonCyan} strokeWidth="4" strokeLinecap="round" transform="translate(50, 90)" />

        <motion.g variants={processingMouth} initial="normal" animate={expression} transform="translate(50, 90)">
          <circle cx="35" cy="15" r="2.5" fill={neonCyan} />
          <circle cx="50" cy="15" r="2.5" fill={neonCyan} />
          <circle cx="65" cy="15" r="2.5" fill={neonCyan} />
        </motion.g>
      </svg>
    </div>
  );
}