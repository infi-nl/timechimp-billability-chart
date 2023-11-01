import getWeekDateFns from 'date-fns/getWeek';

export function getWeek(date: string | Date) {
    // See: https://date-fns.org/v2.30.0/docs/getWeek
    return getWeekDateFns(new Date(date), {
        // Weeks start on a Monday.
        weekStartsOn: 1,
        // Week number 1 should contain the 4th on January.
        firstWeekContainsDate: 4,
    });
}

export function toIsoDate(date: number | Date) {
    return new Date(date).toISOString().slice(0, 10);
}
