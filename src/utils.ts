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
