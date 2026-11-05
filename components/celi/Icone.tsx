import {
  BookOpen,
  Building2,
  CalendarDays,
  DoorOpen,
  GraduationCap,
  Layers,
  Megaphone,
  RotateCcw,
  Type,
  UserRound,
  type LucideProps,
} from "lucide-react";
import type { NomeIcone } from "@/lib/celi/dialogo";

const MAPA: Record<NomeIcone, React.ComponentType<LucideProps>> = {
  aula: BookOpen,
  hoje: CalendarDays,
  professor: UserRound,
  sala: DoorOpen,
  avisos: Megaphone,
  curso: GraduationCap,
  semestre: Layers,
  letra: Type,
  dia: CalendarDays,
  bloco: Building2,
  recarregar: RotateCcw,
};

export default function Icone({ nome, ...props }: { nome: NomeIcone } & LucideProps) {
  const C = MAPA[nome];
  return <C {...props} />;
}
