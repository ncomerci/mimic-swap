/**
 * Genera una expresión CRON (con segundos) para ejecutarse cada 24h
 * a partir del timestamp actual + offset en segundos, en hora UTC.
 *
 * @param offsetSeconds - Cantidad de segundos a sumar al momento actual (por defecto 90).
 * @param baseDate - Fecha base opcional desde la que se calcula (por defecto la hora actual).
 * @returns Objeto con hora actual, hora objetivo UTC y expresión CRON generada.
 */
export function generateUtcCron(
  offsetSeconds: number = 90,
  baseDate: Date = new Date()
): { now: number; targetUtc: number; cron: string } {
  const targetTime = new Date(baseDate.getTime() + offsetSeconds * 1000)

  const second = targetTime.getUTCSeconds()
  const minute = targetTime.getUTCMinutes()
  const hour = targetTime.getUTCHours()

  const cron = `${second} ${minute} ${hour} * * *`

  return {
    now: baseDate.getTime(),
    targetUtc: targetTime.getTime(),
    cron,
  }
}

/**
 * Genera una versión semántica (semver) aleatoria con solo los tres números básicos
 *
 * @param majorRange - Rango para el número mayor (por defecto 0-10)
 * @param minorRange - Rango para el número menor (por defecto 0-99)
 * @param patchRange - Rango para el número de parche (por defecto 0-99)
 * @returns Una versión semántica aleatoria como string (ej: "3.45.12")
 */
export function generateRandomSemver(
  majorRange: [number, number] = [0, 10],
  minorRange: [number, number] = [0, 99],
  patchRange: [number, number] = [0, 99]
): string {
  const major = Math.floor(Math.random() * (majorRange[1] - majorRange[0] + 1)) + majorRange[0]
  const minor = Math.floor(Math.random() * (minorRange[1] - minorRange[0] + 1)) + minorRange[0]
  const patch = Math.floor(Math.random() * (patchRange[1] - patchRange[0] + 1)) + patchRange[0]

  return `${major}.${minor}.${patch}`
}
