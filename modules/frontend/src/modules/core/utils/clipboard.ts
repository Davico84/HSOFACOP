import { toast } from "sonner";

/** Copia el texto al portapapeles y avisa con `done` (o con un error si el navegador no lo permite). */
export async function copyToClipboard(text: string, done: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("No se pudo copiar. Cópialo a mano.");
  }
}
