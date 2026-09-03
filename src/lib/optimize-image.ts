const OPTIMIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Redimensiona y recomprime una imagen ANTES de subirla, para no ir
 * saturando Supabase Storage con fotos de celular o escaneos sueltos sin
 * comprimir. Corre en el navegador (canvas), no en el Worker: Cloudflare
 * Workers no tiene sharp/ImageMagick ni Canvas nativo, y el archivo ya se
 * lee completo en el cliente antes de subirse — este es el punto natural
 * para interceptarlo, sin depender de ninguna librería WASM server-side.
 *
 * PDFs y otros formatos no se tocan: no hay forma liviana de recomprimir el
 * contenido interno de un PDF escaneado sin un servicio externo.
 *
 * Nunca deja el archivo peor que como llegó: si falla la decodificación, o
 * el resultado optimizado no pesa menos que el original, devuelve el
 * archivo original sin modificar.
 */
export async function optimizeImageFile(
  file: File,
  opts?: { maxDimension?: number; quality?: number },
): Promise<File> {
  if (!OPTIMIZABLE_TYPES.has(file.type)) return file;
  const maxDimension = opts?.maxDimension ?? 2048;
  const quality = opts?.quality ?? 0.85;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type, quality),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}
