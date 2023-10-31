import getWeekDateFns from 'date-fns/getWeek';

export function getWeek(date: string | Date) {
    return getWeekDateFns(new Date(date));
}

export function toIsoDate(date: number | Date) {
    return new Date(date).toISOString().slice(0, 10);
}
