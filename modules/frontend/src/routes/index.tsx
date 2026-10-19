import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";
import { ComingSoonScreen } from "@/screens/ComingSoonScreen";
import { UsersScreen } from "@/screens/users/UsersScreen";
import { ProfileScreen } from "@/screens/users/ProfileScreen";
import { RecordsListScreen } from "@/screens/records/RecordsListScreen";
import { RecordFormScreen } from "@/screens/records/RecordFormScreen";
import { RecordPrintScreen } from "@/screens/records/RecordPrintScreen";
import { LoginView } from "@/screens/auth/LoginView";
import { RegisterView } from "@/screens/auth/RegisterView";
import { ResetPasswordView } from "@/screens/auth/ResetPasswordView";
import { RequireAuth } from "@/modules/core/auth/RequireAuth";
import { RequireGuest } from "@/modules/core/auth/RequireGuest";
import { RequireRole } from "@/modules/core/auth/RequireRole";
import { RECORD_EDITOR_ROLES } from "@/modules/core/config/sections";
import { RouteError } from "@/modules/core/components/RouteError";
import { PATHS } from "./paths";
import { sectionRoute } from "./sectionRoute";

/**
 * Zonas de la app (exportadas para montarlas en tests con `createMemoryRouter`
 * sin el bootstrap de sesión de `RootLayout`):
 * - RequireGuest: rutas de auth (solo sin sesión), sin shell
 * - RequireAuth → AppLayout: rutas privadas dentro del shell (sidebar + header), una
 *   sección por subárbol (`sectionRoute`), con su guard de rol si la sección declara roles
 */
export const appRoutes: RouteObject[] = [
  // Nueva contraseña con un enlace de restablecimiento: pública, con o sin sesión.
  { path: PATHS.RESET_PASSWORD, element: <ResetPasswordView /> },
  {
    element: <RequireGuest />,
    children: [
      { path: PATHS.LOGIN, element: <LoginView /> },
      { path: PATHS.REGISTER, element: <RegisterView /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Una sección por subárbol: ruta y roles salen de core/config/sections.
          sectionRoute("home", [{ index: true, element: <DashboardScreen /> }]),
          sectionRoute("moduleA", [{ index: true, element: <ComingSoonScreen title="Módulo A" /> }]),
          sectionRoute("moduleB", [{ index: true, element: <ComingSoonScreen title="Módulo B" /> }]),
          sectionRoute("users", [{ index: true, element: <UsersScreen /> }]),
          sectionRoute("profile", [{ index: true, element: <ProfileScreen /> }]),
          sectionRoute("records", [
            { index: true, element: <RecordsListScreen /> },
            {
              // El formulario: solo USER y ADMIN (la coordinación abre la vista preliminar).
              element: <RequireRole roles={RECORD_EDITOR_ROLES} />,
              children: [
                { path: "nueva", element: <RecordFormScreen /> },
                { path: ":id", element: <RecordFormScreen /> },
              ],
            },
          ]),
        ],
      },
      // Impresión: protegida pero SIN el shell (ni menú ni cabecera en el papel).
      { path: `${PATHS.RECORDS}/:id/imprimir`, element: <RecordPrintScreen /> },
    ],
  },
];

// RootLayout (bootstrap de sesión + splash) envuelve ambas zonas.
// errorElement en la raíz: captura errores de render y rutas no encontradas (404).
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: appRoutes,
  },
]);
