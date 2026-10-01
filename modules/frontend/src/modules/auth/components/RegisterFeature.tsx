import { Link } from "react-router-dom";
import { project } from "@/config/project";
import { PATHS } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";
import { RegisterForm } from "./RegisterForm";

/** Registro: marco de auth + formulario + enlace al inicio de sesión. */
export function RegisterFeature() {
  return (
    <AuthLayout
      title="Crear cuenta"
      description={`Regístrate para empezar a usar ${project.name}`}
      footer={
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to={PATHS.LOGIN} className="font-medium text-primary underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
