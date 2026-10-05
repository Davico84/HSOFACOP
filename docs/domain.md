# Dominio de negocio — HS FACOP

Dimensión de **negocio** (sustituible por proyecto). Base de conocimiento del dominio: actores, glosario y modelo conceptual. Documento **vivo**: crece y se detalla a medida que cada capacidad se especifica y construye.

- Complementa `docs/vision.md` (objetivos + roadmap), `docs/architecture.md` (capas) y `docs/backend.md` (JPA/persistencia).
- Aquí va el **modelo conceptual** (entidades, relaciones, reglas de negocio de alto nivel). El **esquema físico** lo define Flyway (`modules/backend/.../db/migration`), no este documento.

> 📝 **Plantilla.** Las secciones marcadas con ✏️ son para rellenar en cada proyecto derivado. Lo marcado como *(construida)* describe lo que la plantilla ya trae.

---

## Actores del negocio ✏️

| Actor | Descripción | Rol de sistema (aprox.) |
|---|---|---|
| **Administrador** | Gestiona la aplicación: usuarios, configuración y métricas del panel. | `ADMIN` |
| **Usuario** | Usa las funcionalidades del producto dentro de su rol. | `USER` |
| **Tratante** | Alumno u odontólogo del posgrado (AEO/FACOP) que llena y corrige sus historias clínicas de ortodoncia. Solo ve las suyas. | `USER` |
| **Supervisor** | Docente que revisa y corrige las historias de todos los tratantes. | `ADMIN` |

> Los roles de sistema (`ADMIN`/`USER`) los define `authentication`; el mapeo fino de permisos se detalla al construir cada capacidad.

## Glosario de términos clave ✏️

| Término | Significado |
|---|---|
| Historia clínica de ortodoncia | Registro de un paciente según el formato de la clínica (PDF de 14 págs.): anamnesis, análisis facial, funcional, oclusal, de modelos y radiográfico, diagnóstico, planes y firmas. Se identifica con un número correlativo por tratante (`AEO-001`). |
| Anamnesis | Entrevista inicial: queja principal, antecedentes médicos, hábitos, estructura familiar. Un texto sin respuesta se imprime "No refiere". |
| Guía de análisis facial | Documento de la clínica con las opciones e ilustraciones de cada pregunta del análisis facial y sus valores normativos. |
| AFAI | Altura facial anteroinferior; en los patrones II y III se marca aumentada o disminuida (excluyentes). |
| Overjet | Resalte horizontal de los incisivos superiores, en milímetros. |
| Mordida cruzada / Brodie | Alteraciones transversales de la oclusión (posterior uni o bilateral; Brodie = mordida en tijera). |
| Curva de Spee | Curvatura del plano oclusal inferior; normal o alterada (con descripción). |
| Clase de Angle | Relación canina o molar por lado: Clase I, II o III, con detalle en fracción ("½ cúspide"). |
| MI / MIH / RC | Máxima intercuspidación, mordida habitual y relación céntrica; si MI o MIH difieren de RC, se registra la relación canina en RC. |
| Notación FDI | Numeración de piezas dentales: permanentes 11–48 y temporales 51–85. |
| Análisis transversal de los modelos | Anchos de arcada medidos en los modelos (mm): intercanino (AIS/AII) e intermolar (AMS/AMI) superior e inferior, borde WALA, X Pc, X´ Pc y X ideal (escrito a mano), y distancias WALA–EV por diente inferior. |
| Promedio intermolar | Referencia por sexo para AMS (54,0 mm hombres / 52,4 mm mujeres) y AMI (47,2 / 46,1 mm); se muestra la diferencia con la medida. |
| WALA–EV | Distancia del borde WALA (unión mucogingival) al eje vestibular (EV) de cada diente inferior; normas: canino 0,6, 1er premolar 0,8, 2do premolar 1,3, 1er molar 2,0, 2do molar 2,2 mm. |
| Análisis de Moyers | Predicción del espacio requerido para canino y premolares a partir de la suma de los incisivos inferiores (42, 41, 31, 32), con la tabla de Moyers al 75 % (suma redondeada al 0,5 mm; tabla de 19,5 a 29,0 mm). Diferencia = espacio disponible − requerido, por arcada y lado. |
| Análisis de Nance (Nance & Carey) | Discrepancia óseo dentaria por arcada: SA (espacio disponible o longitud de arco, medido) − ST (espacio requerido: suma de los anchos mesiodistales de 15→25 o 45→35, de mesial a mesial del 1er molar). Negativa = falta espacio. |
| Análisis de Bolton | Discrepancia de tamaño dentario entre arcadas (comparte con Nance solo caninos y premolares; incisivos y 1eros molares son propios): relación total (12 piezas, 1er molar a 1er molar; media 91,3 %, rango 87,5–94,8) y relación anterior (6 piezas; media 77,2 %, rango 74,5–80,4) = suma mandibular ÷ suma maxilar × 100. Sobre la media hay exceso mandibular; bajo la media, exceso maxilar (real, ideal y diferencia de esa arcada). |
| Predisposición de apiñamiento | Tabla 2 de la ficha de Moyers: el odontólogo anota qué arcada/lado resulta positivo (sobra espacio), nulo o negativo (falta espacio). |
| Apoderado | Quien firma por un paciente menor de 18 años. |
| Cupo de historias | Máximo de historias clínicas que un tratante (`USER`) puede crear; lo fija el `ADMIN` por cuenta. Sin cupo = sin límite. Al llegar al tope no crea más, pero edita e imprime las suyas. |

---

## Fuente de verdad (local-first)

| Tipo de información | Vive en |
|---|---|
| Modelo de dominio (este doc) | `docs/domain.md` (local) |
| Comportamiento / casos de uso | `openspec/specs/<cap>/spec.md` (Scenarios) |
| Framing de user story ("como X quiero Y") | `proposal.md` del change |
| Backlog / tickets | *(opcional)* — hoy: local. Futuro híbrido: Jira |

> **Nota para el futuro híbrido (Jira).** Si más adelante se adopta Jira: sigue siendo **la capa de backlog**, nunca la fuente de verdad del dominio ni de lo construido. Regla: una sola fuente por tipo de info; el change referencia `JIRA-<id>` de forma cruzada. El dominio y las specs permanecen locales.

---

## Convenciones

- **Nivel de detalle**: aquí se listan entidades y campos **conceptuales** clave. Los tipos exactos, longitudes y validaciones finas se fijan en el `spec.md`/`design.md` de cada capacidad y en la migración Flyway correspondiente.
- Toda entidad tiene `id` (PK) y campos de auditoría (`createdAt`, `updatedAt`) salvo que se indique.
- Identificadores en inglés (convención de código); ver `docs/backend.md`.

---

## Entidades por capacidad

### `authentication` → **User** *(construida)*
Cuenta de acceso al sistema.
- `email` (único), `passwordHash` (BCrypt), `role` (`ADMIN` | `USER`), `fullName`, `createdAt`/`updatedAt`.
- Bloqueo temporal por intentos fallidos (`add-login-lockout`): `failedLoginAttempts` (fallos consecutivos, se resetea con un login correcto o al fallar tras expirar el bloqueo) y `lockedUntil` (fin del bloqueo automático; nulo = sin bloqueo). Solo los modifican `UPDATE` atómicos; la entidad los lee pero no los escribe.
- Estado administrativo (`users`, `add-user-account-status`): `status` (`ACTIVE` | `DISABLED`), **independiente** de `lockedUntil` (si compartieran campo, expirar el bloqueo automático reactivaría una cuenta deshabilitada a mano). Las cuentas nuevas nacen `ACTIVE`; solo un `ADMIN` cambia el estado, y solo de cuentas `USER`; una cuenta `DISABLED` no inicia ni renueva sesión.
- Cupo de historias (`users` + `orthodontic-records`, `add-record-quota`): `recordQuota` (entero 0–9999 o nulo = sin límite, por defecto nulo). Solo aplica a cuentas `USER` y solo lo cambia un `ADMIN` (a una cuenta `ADMIN` responde 409); el `ADMIN` nunca se limita. El uso es la cantidad de historias con ese `author` (no se guarda). Se controla al crear, bajo el mismo bloqueo de la fila del autor que el correlativo (dos creaciones simultáneas no pasan el tope); cupo lleno → 409 `record-quota-reached`. Un cupo por debajo de lo creado se permite y no toca las existentes; editar no consulta el cupo.
- Candidatos para cambios posteriores de `users` (perfil, alta por admin, roles): `username`, `phone`.

### `authentication` → **RefreshToken** *(construida)*
Token de refresco persistido para rotación y revocación real (logout). Se guarda el **hash** del token, nunca el valor en claro.
- `user` (FK), `tokenHash` (único), `expiresAt`, `revoked`, `createdAt`. El access token es JWT stateless (no se persiste).

### `orthodontic-records` → **OrthodonticRecord** *(construida, fases 1 y 2)*
Historia clínica de ortodoncia de un paciente. Columnas para lo que se lista o busca; el contenido clínico va en JSON (JSONB) tipado por paso.
- `author` (FK `User`, nunca cambia) y `recordSeq` / `recordNumber`: correlativo **por autor** (`AEO-001`, `AEO-002`…), asignado al crear y no editable.
- Paciente embebido (sin registro maestro de pacientes): `patientName` (obligatorio), `documentType` (`DNI` 8 dígitos | `FOREIGNER_CARD` 9 | `PASSPORT` 6–12, solo dígitos) + `documentNumber`, `patientSex` (`FEMALE` | `MALE`), `birthDate`, `birthPlace`, `address`, `phone`, `treatmentStartDate`, `treatingDentist` (por defecto el autor).
- Edad **calculada** (años cumplidos a la fecha de inicio de tratamiento o a hoy); menor de 18 → firma el apoderado.
- `content` (JSON, `schemaVersion` 7): anamnesis, análisis facial, funcional, oclusal y extra, análisis de modelos (`models.transversal`, `models.moyers`, `models.nance` y `models.bolton` —guarda sus incisivos y 1eros molares; caninos y premolares son los de Nance—: anchos de pieza en 4,0–13,0 mm y demás medidas en 0–99,9 mm, con un decimal, fechas de análisis no futuras, predisposición de apiñamiento y conclusiones escritas, interpretaciones; las diferencias con promedios y normas, la suma de incisivos, el requerido de Moyers, el ST y la discrepancia de Nance y las relaciones de Bolton se calculan, no se guardan), radiográfico, diagnóstico y planes, firmas. Los campos condicionados se descartan al guardar si su condición no se cumple.
- `searchText` (paciente + documento + número, sin tildes ni mayúsculas) para la búsqueda; `version` para detectar ediciones concurrentes (409).
- Reglas: un `USER` solo alcanza sus historias (una ajena responde 404); un `ADMIN` alcanza todas y al guardar conserva el autor. No se borran.
- Notas de evolución: no se registran en el sistema; se imprime la hoja en blanco (pág. 14 del PDF) y se llena a mano (decisión del usuario).

---

## Diagrama ER (conceptual)

> Se amplía con cada capacidad de negocio.

```mermaid
erDiagram
    User ||--o{ RefreshToken : "tiene"
    User ||--o{ OrthodonticRecord : "es autor de"

    User {
        Long id PK
        String email UK
        String passwordHash
        String role
        String fullName
        int failedLoginAttempts
        DateTime lockedUntil
        String status
        Integer recordQuota
    }
    RefreshToken {
        Long id PK
        Long userId FK
        String tokenHash UK
        DateTime expiresAt
        Boolean revoked
    }
    OrthodonticRecord {
        Long id PK
        Long authorId FK
        int recordSeq
        String recordNumber
        String patientName
        String documentType
        String documentNumber
        String patientSex
        Date birthDate
        Date treatmentStartDate
        String searchText
        Json content
        Long version
    }
```

---

## Cómo se actualiza este documento

1. Al proponer una capacidad (`/opsx:propose`), su `design.md` detalla las entidades/campos nuevos.
2. Al implementarla, la migración Flyway crea el esquema real.
3. Al archivar el change, se **consolida** aquí la parte del dominio afectada (entidades, campos, relaciones y reglas ya construidas), manteniendo el ER al día.
