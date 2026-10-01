import { defineConfig } from "orval";

/**
 * Genera el cliente tipado (tipos + hooks react-query) desde el contrato OpenAPI
 * versionado del backend. Salida en core/services/generated (versionada en git).
 * Fuente única: contracts/openapi.json. Ver capacidad api-type-contracts.
 */
export default defineConfig({
  odontorisas: {
    input: "../../contracts/openapi.json",
    output: {
      mode: "tags",
      target: "./src/modules/core/services/generated/endpoints.ts",
      schemas: "./src/modules/core/services/generated/model",
      client: "axios-functions",
      httpClient: "axios",
      clean: true,
      prettier: false,
      override: {
        mutator: {
          path: "./src/modules/core/config/httpClient.ts",
          name: "customInstance",
        },
        query: {
          useMutation: true,
          useQuery: true,
        },
      },
    },
  },
});
