import { formatISO, hoursToMinutes } from 'date-fns';

export function toIsoDate(date: number | Date) {
    return formatISO(date, { representation: 'date' });
}

export function hoursToClockNotation(hours: number) {
    const wholeHours = Math.trunc(hours).toString().padStart(2, '0');
    const minutes = hoursToMinutes(hours % 1)
        .toString()
        .padStart(2, '0');
    return `${wholeHours}:${minutes}`;
}
