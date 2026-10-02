import { cn } from "@/modules/core/utils/cn";
import { ROW, ROW_LEADING, ROW_MIN } from "./printStyle";
import { PrintTitle } from "./PrintTitle";

interface PrintNumberedListProps {
  label: string;
  items: readonly string[] | null | undefined;
  /** Renglones que reserva el PDF. */
  lines: number;
}

/** Lista impresa numerada ("1. …") sobre renglones, con renglones en blanco hasta completar los del PDF. */
export function PrintNumberedList({ label, items, lines }: PrintNumberedListProps) {
  const list = items ?? [];
  const blank = Math.max(0, lines - list.length);
  return (
    <div className="flex flex-col">
      <PrintTitle>{label}</PrintTitle>
      <ol className="flex flex-col">
        {list.map((item, i) => (
          <li key={`${i}-${item}`} className={cn("border-b border-foreground wrap-break-word", ROW_MIN, ROW_LEADING)}>
            {i + 1}. {item}
          </li>
        ))}
      </ol>
      {Array.from({ length: blank }, (_, i) => (
        <span key={i} className={cn("block border-b border-foreground", ROW)} />
      ))}
    </div>
  );
}
