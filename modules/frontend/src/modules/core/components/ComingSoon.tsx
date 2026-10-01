import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

/** Marcador genérico para secciones aún no construidas. */
export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Construction className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">Próximamente: esta sección todavía está en construcción.</p>
    </section>
  );
}
