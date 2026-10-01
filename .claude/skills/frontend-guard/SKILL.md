---
name: frontend-guard
description: Checklist obligatorio ANTES de crear o modificar un componente, hook, schema o pantalla del frontend de Mi Proyecto (modules/frontend). Úsalo al añadir una pantalla, un componente, un formulario, una validación Zod o un hook de React Query. No lo uses para backend, OpenSpec ni docs.
---

# Frontend Guard — comprueba antes de escribir

**No dupliques reglas aquí: la fuente de verdad es `docs/frontend.md`.** Este skill existe porque
esas reglas ya estaban escritas y aun así se incumplieron **tres veces seguidas** (sub-componentes
dentro de la screen, genéricos en el módulo, el skeleton dentro de la feature). El problema nunca
fue el contenido — fue no consultarlo. Esto es el paso que fuerza la consulta.

## 1. Lee la fuente de verdad

Antes de escribir código de `modules/frontend`, **lee `docs/frontend.md` §1 y §4.1**. Son quince
líneas. Si crees que ya te las sabes, es exactamente cuando se han incumplido.

## 2. Lo que la build ya impide (no lo pienses, te lo dirá)

- **Un archivo = un componente** → `react/no-multi-comp` en `screens/**` y `modules/*/components/**`.
  Un archivo con dos componentes **no compila**. `core/ui` está exento: allí una **familia** de
  primitivos comparte archivo (convención shadcn).
- Typecheck + lint corren en cada commit (husky + lint-staged).

## 3. Lo que NO se puede linter — el juicio (aquí es donde fallo)

Contesta **antes** de escribir:

| Pregunta | Si la respuesta es… |
|---|---|
| **¿Este componente conoce el dominio?** | **No** → va a `core/ui` (primitivo) o `core/components`, y **genérico** (`<T extends FieldValues>`). **Sí** → `modules/<cap>/components/`, componiéndose sobre el de core. Control: *"¿lo usaría otra capacidad?"* |
| **¿Estoy en una `screen`?** | Entonces es **una línea**: `return <XFeature />;`. Todo lo demás vive en el módulo. |
| **¿Estoy validando un formulario?** | Las reglas van al **schema Zod** de `modules/<cap>/schemas/`, **nunca** en el componente. `useForm({ mode: "onTouched" })`. El campo solo **pinta** el error. |
| **¿La validación existe en el backend?** | Entonces **debe existir igual aquí** (paridad, `docs/coding-style.md §7`). Comprueba el DTO del backend campo por campo: un `@PastOrPresent` sin su equivalente en Zod es un `400` esperando. |
| **¿Voy a crear un tipo o una forma de error a mano?** | **Para.** Sale del contrato (orval). Si no está, **el contrato está incompleto**: arréglalo ahí. |
| **¿Un color, un tamaño, una fuente hardcodeados?** | **Para.** Solo tokens: los colores se **derivan de la marca de cada clínica**. Un hex rompe la tematización por organización. |
| **¿Voy a añadir una librería?** | Mira antes `core/ui`. Si es de shadcn: `pnpm dlx shadcn@latest add <x>` — **nunca `init`** (reescribe `globals.css` y mata el branding). Verifica con `git diff` que no los tocó. |

## 4. Antes de fijar datos nuevos

Si el trabajo toca **campos de una entidad**: audita el modelo **antes** de escribir la migración.
Conjunto cerrado → **enum** (app + `CHECK` en BD + contrato → el cliente lo hereda). Formato →
validación en el boundary. **Nunca tipo numérico** para documentos ni teléfonos (se pierden los
ceros a la izquierda; los pasaportes son alfanuméricos) → `string` + regex.

## 5. Al terminar

`pnpm --filter odontorisas-frontend validate` (typecheck + lint + tests) **en verde**, y los
componentes nuevos con su test si tienen comportamiento (no solo maquetación).
