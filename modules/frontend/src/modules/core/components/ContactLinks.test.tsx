import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactLinks } from "./ContactLinks";
import { BrandPanel } from "./BrandPanel";
import { ServerWarmupScreen } from "./ServerWarmupScreen";
import { AuthLayout } from "@/modules/auth/components/AuthLayout";
import { project } from "@/config/project";

const whatsappLink = () => screen.getByRole("link", { name: /Escríbenos por WhatsApp/ });

describe("ContactLinks", () => {
  it("WhatsApp en otra pestaña con mensaje inicial, y correo con mailto", () => {
    render(<ContactLinks contact={{ whatsapp: "51959396384", email: "soporte@clinica.pe" }} />);

    expect(screen.getByText("¿Necesitas ayuda?")).toBeInTheDocument();
    const whatsapp = screen.getByRole("link", { name: "Escríbenos por WhatsApp (se abre en otra pestaña)" });
    expect(whatsapp).toHaveAttribute(
      "href",
      `https://wa.me/51959396384?text=${encodeURIComponent(`Hola, necesito ayuda con ${project.name}`)}`,
    );
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    const mail = screen.getByRole("link", { name: "soporte@clinica.pe" });
    expect(mail).toHaveAttribute("href", "mailto:soporte@clinica.pe");
    expect(mail).not.toHaveAttribute("target");
  });

  it("solo correo o solo WhatsApp muestra únicamente ese enlace", () => {
    const { rerender } = render(<ContactLinks contact={{ email: "soporte@clinica.pe" }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument();

    rerender(<ContactLinks contact={{ whatsapp: "51959396384" }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(whatsappLink()).toBeInTheDocument();
  });

  it("sin contacto no renderiza nada", () => {
    const { container } = render(<ContactLinks contact={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("project-foundation — Contacto de soporte en las pantallas de acceso", () => {
  it("Contacto en el panel de marca: '¿Necesitas ayuda?' con WhatsApp y correo de project.config.json", () => {
    render(<BrandPanel />);
    expect(screen.getByText("¿Necesitas ayuda?")).toBeInTheDocument();
    expect(whatsappLink()).toHaveAttribute("href", expect.stringContaining(`https://wa.me/${project.contact?.whatsapp}?text=`));
    expect(screen.getByRole("link", { name: project.contact?.email })).toHaveAttribute("href", `mailto:${project.contact?.email}`);
  });

  it("Contacto en móvil sin repetir: bajo el formulario solo en móvil; en escritorio solo en el panel", () => {
    render(
      <AuthLayout title="Iniciar sesión">
        <form aria-label="formulario" />
      </AuthLayout>,
    );
    const blocks = screen.getAllByText("¿Necesitas ayuda?");
    expect(blocks).toHaveLength(2);
    const panel = screen.getByRole("complementary");
    expect(panel).toHaveClass("hidden", "lg:flex");
    const [inPanel, underForm] = blocks.map((title) => panel.contains(title));
    expect(inPanel).toBe(true);
    expect(underForm).toBe(false);
    expect(blocks[1].parentElement).toHaveClass("lg:hidden");
  });

  it("Contacto en la espera larga: 'Si el problema continúa, escríbenos:' con los enlaces", () => {
    render(<ServerWarmupScreen elapsedSeconds={95} online onRetry={() => undefined} />);
    expect(screen.getByText("Si el problema continúa, escríbenos:")).toBeInTheDocument();
    expect(screen.queryByText("Si el problema continúa, avisa al administrador.")).not.toBeInTheDocument();
    // En el panel (escritorio) y bajo el mensaje.
    expect(screen.getAllByRole("link", { name: /Escríbenos por WhatsApp/ })).toHaveLength(2);
  });
});
