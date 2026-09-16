interface NoticeProps {
  tone?: "error" | "success" | "info";
  message: string;
}

const toneClasses: Record<NonNullable<NoticeProps["tone"]>, string> = {
  error: "border-rose-500/30 bg-rose-950/40 text-rose-100",
  success: "border-emerald-500/30 bg-emerald-950/40 text-emerald-100",
  info: "border-accent-strong/30 bg-accent-soft text-foreground/90",
};

export function Notice({ tone = "info", message }: NoticeProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      {message}
    </div>
  );
}
