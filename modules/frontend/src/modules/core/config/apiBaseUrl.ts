/** Variables de entorno que deciden la URL base de la API. */
interface ApiEnv {
  VITE_API_URL?: string;
  DEV: boolean;
}

/**
 * URL base de la API. Con `VITE_API_URL` se usa ese valor. Sin ella: en desarrollo el backend
 * local (`http://localhost:8080`); en producción `""`, el **mismo origen** (Vercel reenvía `/api`
 * y `/auth` al backend), así la cookie de refresh es de primera parte. Ver docs/deployment.md.
 */
export function resolveApiBaseUrl({ VITE_API_URL, DEV }: ApiEnv): string {
  if (VITE_API_URL !== undefined && VITE_API_URL !== "") return VITE_API_URL;
  return DEV ? "http://localhost:8080" : "";
}
