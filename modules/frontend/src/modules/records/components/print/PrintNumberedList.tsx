import { cn } from "@/modules/core/utils/cn";
import { ROW_LEADING, ROW_MIN } from "./printStyle";
import { PrintTitle } from "./PrintTitle";

interface PrintNumberedListProps {
  label: string;
  items: readonly string[] | null | undefined;
  /** Renglones que reservaba el PDF (referencia del original; ya no se dibujan). */
  lines: number;
}

/** Lista impresa numerada ("1. …"), sin renglones (eran para escribir a mano). */
export function PrintNumberedList({ label, items }: PrintNumberedListProps) {
  const list = items ?? [];
  return (
    <div className="flex flex-col">
      <PrintTitle>{label}</PrintTitle>
      <ol className="flex flex-col">
        {list.map((item, i) => (
          <li key={`${i}-${item}`} className={cn("wrap-break-word", ROW_MIN, ROW_LEADING)}>
            {i + 1}. {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
