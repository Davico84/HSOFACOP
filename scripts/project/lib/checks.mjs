// Comprobaciones del entorno local para avisar en el asistente (no bloquean).
import { execFileSync } from "node:child_process";
import net from "node:net";

/** ¿Algo acepta conexiones en host:port? (detecta puertos publicados por Docker en Windows) */
function accepts(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(400, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

/** ¿No se puede abrir el puerto para escuchar? */
function cannotListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => server.close(() => resolve(false)));
    server.listen(port, "0.0.0.0");
  });
}

/**
 * ¿Hay algo usando ya ese puerto de esta máquina? Se combinan dos pruebas porque en
 * Windows un puerto publicado por Docker puede no impedir `listen` pero sí aceptar conexiones.
 */
export async function portInUse(port) {
  if (await accepts("127.0.0.1", port)) return true;
  return cannotListen(port);
}

/** `docker …` silencioso; devuelve la salida o `null` si Docker no está disponible o falla. */
function docker(args, input) {
  try {
    return execFileSync("docker", args, {
      encoding: "utf8",
      input,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

const lines = (out) => (out ?? "").split(/\r?\n/).filter(Boolean);

/** ¿Existe ya un contenedor Docker con ese nombre (en marcha o parado)? Sin Docker: false. */
export function containerExists(name) {
  return lines(docker(["ps", "-a", "--filter", `name=^/${name}$`, "--format", "{{.Names}}"])).includes(name);
}

/** ¿Ese contenedor está en marcha? */
export function containerRunning(name) {
  return lines(docker(["ps", "--filter", `name=^/${name}$`, "--format", "{{.Names}}"])).includes(name);
}

/** ¿Ese contenedor (en marcha) publica ese puerto del host? (p. ej. "0.0.0.0:5436->5432/tcp") */
export function containerPublishes(name, port) {
  const ports = docker(["ps", "--filter", `name=^/${name}$`, "--format", "{{.Ports}}"]) ?? "";
  return new RegExp(`:${port}->`).test(ports);
}

/**
 * ¿Existe el volumen de datos del proyecto? compose.yaml usa el nombre del contenedor como
 * nombre de proyecto, así que el volumen es `<contenedor>_pgdata`. Ahí viven usuario y clave.
 */
export function volumeExists(container) {
  const volume = `${container}_pgdata`;
  return lines(docker(["volume", "ls", "--filter", `name=^${volume}$`, "--format", "{{.Name}}"])).includes(volume);
}

/**
 * Cambia la contraseña del usuario dentro del Postgres del contenedor (conexión local, sin
 * pedir la actual). El SQL va por stdin para que la clave no aparezca en la línea de comandos.
 * Devuelve `null` si fue bien o el mensaje de error.
 */
export function syncPassword(container, user, database, password) {
  const ident = `"${user.replace(/"/g, '""')}"`;
  const literal = `'${password.replace(/'/g, "''")}'`;
  try {
    execFileSync("docker", ["exec", "-i", container, "psql", "-U", user, "-d", database, "-v", "ON_ERROR_STOP=1", "-q"], {
      encoding: "utf8",
      input: `ALTER USER ${ident} WITH PASSWORD ${literal};\n`,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return null;
  } catch (e) {
    return (e.stderr || e.message || "error desconocido").toString().trim();
  }
}
