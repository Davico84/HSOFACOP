import { Link } from "react-router-dom";
import { project } from "@/config/project";
import { PATHS } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";
import { LoginForm } from "./LoginForm";

/** Inicio de sesión: marco de auth + formulario + enlace al registro. */
export function LoginFeature() {
  return (
    <AuthLayout
      title="Iniciar sesión"
      description={`Accede a tu panel de ${project.name}`}
      footer={
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to={PATHS.REGISTER} className="font-medium text-primary underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
