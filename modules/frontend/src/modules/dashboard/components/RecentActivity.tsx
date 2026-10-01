import { Card } from "@/modules/core/ui/card";
import type { SampleActivity } from "../data/sampleData";

interface RecentActivityProps {
  items: SampleActivity[];
}

/** Lista de actividad reciente del dashboard. */
export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card>
      <section aria-labelledby="recent-activity-title" className="p-5">
        <h2 id="recent-activity-title" className="text-base font-semibold">
          Actividad reciente
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="truncate text-sm text-muted-foreground">{item.description}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
