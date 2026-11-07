const MS_DIA = 24 * 60 * 60 * 1000;

export function diaDe(fecha: Date, zona = 'America/Lima'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

export const hoyEnLima = (): string => diaDe(new Date());

const restarDia = (dia: string): string => new Date(Date.parse(dia) - MS_DIA).toISOString().slice(0, 10);

export interface Racha {
  actual: number;
  maxima: number;
}

export function calcularRacha(dias: string[], hoy: string): Racha {
  const unicos = Array.from(new Set(dias)).sort();
  if (unicos.length === 0) return { actual: 0, maxima: 0 };

  let maxima = 1;
  let corrida = 1;
  for (let i = 1; i < unicos.length; i++) {
    if (restarDia(unicos[i]) === unicos[i - 1]) {
      corrida++;
      if (corrida > maxima) maxima = corrida;
    } else {
      corrida = 1;
    }
  }

  const conActividad = new Set(unicos);
  let cursor: string;
  if (conActividad.has(hoy)) cursor = hoy;
  else if (conActividad.has(restarDia(hoy))) cursor = restarDia(hoy);
  else return { actual: 0, maxima };

  let actual = 0;
  while (conActividad.has(cursor)) {
    actual++;
    cursor = restarDia(cursor);
  }
  return { actual, maxima };
}
