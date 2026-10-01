import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";
import { ComingSoonScreen } from "@/screens/ComingSoonScreen";
import { UsersScreen } from "@/screens/users/UsersScreen";
import { LoginView } from "@/screens/auth/LoginView";
import { RegisterView } from "@/screens/auth/RegisterView";
import { RequireAuth } from "@/modules/core/auth/RequireAuth";
import { RequireGuest } from "@/modules/core/auth/RequireGuest";
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
        ],
      },
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
