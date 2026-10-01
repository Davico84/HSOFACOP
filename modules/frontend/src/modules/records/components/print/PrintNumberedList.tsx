interface PrintNumberedListProps {
  label: string;
  items: readonly string[] | null | undefined;
  /** Renglones que reserva el PDF. */
  lines: number;
}

/** Lista impresa numerada ("1. …"), con renglones en blanco hasta completar los del PDF. */
export function PrintNumberedList({ label, items, lines }: PrintNumberedListProps) {
  const list = items ?? [];
  const blank = Math.max(0, lines - list.length);
  return (
    <div className="flex flex-col">
      <h2 className="mt-2 text-sm font-bold uppercase">{label}</h2>
      <ol className="flex flex-col">
        {list.map((item, i) => (
          <li key={`${i}-${item}`} className="min-h-[1.6em] border-b border-foreground wrap-break-word">
            {i + 1}. {item}
          </li>
        ))}
      </ol>
      {Array.from({ length: blank }, (_, i) => (
        <span key={i} className="block h-[1.6em] border-b border-foreground" />
      ))}
    </div>
  );
}
