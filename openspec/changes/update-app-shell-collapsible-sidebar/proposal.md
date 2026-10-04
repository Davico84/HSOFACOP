## Why

En escritorio la barra lateral del shell ocupa 240 px fijos. En pantallas densas, como el formulario de la historia clínica con su columna de pasos, ese espacio le falta al contenido. A 1024 px quedan unos 430 px para el formulario; con la barra contraída a 64 px, unos 610 px, y a 1280 px más de 860 px.

El shell ya tiene una barra de solo íconos con tooltips, pero solo en tablet. La idea se revisó con un agente externo, que confirmó el botón con preferencia global y descartó contraer la barra automáticamente por ruta: eso desorienta, mueve el contenido al entrar y salir, y obligaría al shell a conocer rutas de negocio.

## What Changes

- **Botón para contraer y expandir la barra lateral, solo en escritorio** (≥ 1024 px). Contraída mide 64 px y muestra solo los íconos de las secciones y del cierre de sesión, con tooltip y nombre accesible. El botón refleja su estado con `aria-expanded`.
- **Preferencia global del usuario**, recordada en el navegador entre recargas y visitas. Si no se puede guardar, funciona en memoria. No hay reglas por ruta.
- **Logo**: con la barra contraída se muestra el ícono de la marca (`brand.favicon`); expandida, el logo completo.
- Transición del ancho sin saltos de texto; sin animación con `prefers-reduced-motion`.
- **Tablet y celular no cambian**: en tablet sigue la barra de íconos fija y en celular el cajón.
- **Ancho máximo del contenido:** en pantallas muy anchas (p. ej. 2679 px), el contenido se estiraba a todo el ancho. Los campos de texto pasaban de 1.500 px, las opciones quedaban a la izquierda con un gran vacío a la derecha, y el usuario y el tema de la cabecera quedaban lejos del contenido. El contenido del shell pasa a medir como máximo 1536 px (`max-w-screen-2xl`) y va centrado; la cabecera alinea su contenido a ese mismo ancho. La barra lateral sigue pegada a la izquierda. Revisado con un agente externo, que coincidió en el valor y en ponerlo en el shell.

## Non-goals

- Contraer la barra automáticamente según la pantalla o la ruta (descartado en la revisión).
- Atajo de teclado (Ctrl+B choca con los marcadores de Firefox y con la negrita en campos de texto). Se puede agregar después con otra combinación.
- Cambiar el cajón móvil o la cabecera.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `app-shell`: la barra lateral se puede contraer a solo íconos en escritorio y recuerda la preferencia; "Navegación responsive" se ajusta para que en escritorio sea expandida o contraída según el usuario; el contenido tiene un ancho máximo centrado.

## Impact

- **Frontend**: `store/useSidebarStore.ts` (Zustand con `persist`); `Sidebar`, `NavItem` y `SidebarLogoutButton` (modo contraído en escritorio y tooltips); `AppLayout` (pasa la preferencia y el botón, y limita el ancho de `<main>`); `Header` (contenido alineado al mismo ancho máximo).
- **Tests**: `AppLayout.test.tsx` y casos nuevos; el E2E responsive de la historia clínica sigue igual (la barra arranca expandida).
- **Backend / contrato**: sin cambios.
