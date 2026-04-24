import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  children: ReactNode;
  accent?: "neutral" | "warning" | "danger" | "success";
};

const ACCENT = {
  neutral: "accent-neutral",
  warning: "accent-warning",
  danger: "accent-danger",
  success: "accent-success"
};

export function SectionCard({ title, children, accent = "neutral" }: SectionCardProps) {
  return (
    <section className={`card panel ${ACCENT[accent]} ring-1 ring-white/20`}>
      <h3 className="card-title">{title}</h3>
      <div className="card-body">{children}</div>
    </section>
  );
}
