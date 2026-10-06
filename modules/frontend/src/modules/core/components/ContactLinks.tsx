import { Mail, MessageCircle } from "lucide-react";
import { project, type SupportContact } from "@/config/project";
import { cn } from "@/modules/core/utils/cn";

interface ContactLinksProps {
  /** `onBrand` sobre el panel Roxo (texto blanco); `default` sobre el fondo de la app. */
  tone?: "onBrand" | "default";
  /** Título del bloque; `null` para no mostrarlo (cuando la frase previa ya lo introduce). */
  title?: string | null;
  /** Contacto a mostrar; por defecto, el de project.config.json. */
  contact?: SupportContact;
  className?: string;
}

/**
 * Contacto de soporte (WhatsApp con mensaje inicial y correo) desde project.config.json. Sin
 * contacto configurado no muestra nada. WhatsApp se abre en otra pestaña (avisado al lector de
 * pantalla); el correo, con `mailto:`.
 */
export function ContactLinks({ tone = "default", title = "¿Necesitas ayuda?", contact = project.contact, className }: ContactLinksProps) {
  if (!contact?.whatsapp && !contact?.email) return null;

  const onBrand = tone === "onBrand";
  const link = cn(
    "inline-flex items-center gap-2 rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2",
    onBrand ? "text-white/85 hover:text-white focus-visible:outline-white" : "text-foreground hover:text-primary focus-visible:outline-ring",
  );
  const message = encodeURIComponent(`Hola, necesito ayuda con ${project.name}`);

  return (
    <div className={className}>
      {title ? <p className={cn("text-sm font-medium", onBrand ? "text-white" : "text-foreground")}>{title}</p> : null}
      <ul className={cn("flex flex-col gap-1.5 text-sm", title && "mt-2")}>
        {contact.whatsapp ? (
          <li>
            <a href={`https://wa.me/${contact.whatsapp}?text=${message}`} target="_blank" rel="noopener noreferrer" className={link}>
              <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
              Escríbenos por WhatsApp{" "}
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          </li>
        ) : null}
        {contact.email ? (
          <li>
            <a href={`mailto:${contact.email}`} className={link}>
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              {contact.email}
            </a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
