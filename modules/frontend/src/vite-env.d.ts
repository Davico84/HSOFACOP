/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Sin definir: localhost:8080 en desarrollo, mismo origen en producción. */
  readonly VITE_API_URL?: string;
}
