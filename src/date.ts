import { formatISO } from 'date-fns';

export function toIsoDate(date: number | Date) {
    return formatISO(date, { representation: 'date' });
}
