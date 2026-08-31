// Trabaja alrededor de un bug conocido de npm (npm/cli#4828): al instalar,
// npm "planifica" bien el paquete opcional específico de plataforma que
// necesita Rolldown (usado internamente por Vite 8) — incluso el
// package-lock.json que genera lo describe como instalado, con su
// integrity y todo — pero nunca lo termina escribiendo en disco. Como el
// lockfile queda "convencido" de que ya está, ni un `npm install` normal
// ni un `npm install <paquete>` posterior lo reinstalan: ambos ven el
// lockfile y responden "up to date" sin tocar nada. Sin el binario nativo,
// "vite build" falla con "Cannot find native binding" — que es exactamente
// lo que rompía el deploy en Cloudflare (su entorno de build es Linux x64).
//
// La solución que sí funciona de forma confiable: bajar el tarball del
// paquete con `npm pack` (una simple descarga, no pasa por la lógica de
// instalación de npm que tiene el bug) y extraerlo nosotros mismos con
// `tar`, sin pedirle nada a npm más que el archivo.
//
// Corre como "postinstall". Solo actúa en Linux x64 (la plataforma de los
// builds de Cloudflare) y solo si el binario todavía no está presente; en
// cualquier otro caso no hace nada. Si algo falla, avisa por consola pero
// nunca hace fallar el install — en el peor caso el build vuelve a fallar
// con el mismo error de antes y hay que investigar de nuevo.

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const BINDING_PACKAGE = "@rolldown/binding-linux-x64-gnu";
const BINDING_VERSION = "1.2.6";

if (process.platform !== "linux" || process.arch !== "x64") {
  process.exit(0);
}

const installDir = path.join(__dirname, "..", "node_modules", "@rolldown", "binding-linux-x64-gnu");
const nativeFile = path.join(installDir, "rolldown-binding.linux-x64-gnu.node");

if (fs.existsSync(nativeFile)) {
  process.exit(0);
}

console.log(`[ensure-native-bindings] Falta ${BINDING_PACKAGE}, descargando el paquete directamente...`);

let tmpDir;
try {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rolldown-binding-"));
  execFileSync("npm", ["pack", `${BINDING_PACKAGE}@${BINDING_VERSION}`, "--silent"], {
    cwd: tmpDir,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const tarball = fs.readdirSync(tmpDir).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack no generó ningún .tgz");

  fs.mkdirSync(installDir, { recursive: true });
  execFileSync("tar", ["-xzf", path.join(tmpDir, tarball), "-C", installDir, "--strip-components=1"], {
    stdio: ["ignore", "ignore", "inherit"],
  });

  if (!fs.existsSync(nativeFile)) {
    throw new Error("Se extrajo el paquete pero falta el binario nativo esperado.");
  }
  console.log(`[ensure-native-bindings] ${BINDING_PACKAGE} instalado correctamente en ${installDir}.`);
} catch (error) {
  console.warn(
    `[ensure-native-bindings] No se pudo instalar ${BINDING_PACKAGE} automáticamente. ` +
      `Si "vite build" falla con "Cannot find native binding", corré manualmente:\n` +
      `  npm pack ${BINDING_PACKAGE}@${BINDING_VERSION} && tar -xzf ${BINDING_PACKAGE.replace("@rolldown/", "rolldown-")}-${BINDING_VERSION}.tgz -C node_modules/@rolldown/binding-linux-x64-gnu --strip-components=1`,
  );
  console.warn(error instanceof Error ? error.message : error);
} finally {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
}
