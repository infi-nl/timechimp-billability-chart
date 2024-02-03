import { Time } from '../TimeChimpApi';
import { getWeek, getYear } from 'date-fns';

const LEAVE_TASKS = [
    'Bijzonder verlof',
    'Feestdag',
    'Tijd voor tijd',
    'Verlof',
];

type TimesByYearWeek = Record<string, Time[]>;

interface Stats {
    year: number;
    week: number;
    billableHours: number;
    nonBillableHours: number;
    leaveHours: number;
    totalHours: number;
    billableHoursPercentage: number;
    nonBillableHoursPercentage: number;
}

export interface RollingStats extends Stats {
    averageBillablePercentage: number;
}

export function calculateTimeStats(
    times: Time[],
    contractHours: number | undefined,
    showWeeks: number,
    rollWeeks: number,
) {
    const timesByYearWeek = groupTimesByYearWeek(times);
    removeLeaveOnlyWeeks(timesByYearWeek);
    const stats = calculateStatsPerWeek(timesByYearWeek, contractHours);
    const rollingStats = calculateRollingStats(stats, showWeeks, rollWeeks);
    return rollingStats.reverse();
}

function groupTimesByYearWeek(times: Time[]) {
    return times.reduce<TimesByYearWeek>((acc, time) => {
        const date = new Date(time.date);
        const yearWeek = `${getYear(date)}-${getWeek(date)}`;

        if (!acc[yearWeek]) {
            acc[yearWeek] = [];
        }

        acc[yearWeek].push(time);
        return acc;
    }, {});
}

function removeLeaveOnlyWeeks(timesByYearWeek: TimesByYearWeek) {
    Object.entries(timesByYearWeek).forEach(([yearWeekStr, times]) => {
        if (times.every((t) => LEAVE_TASKS.includes(t.taskName))) {
            delete timesByYearWeek[yearWeekStr];
        }
    });
}

function calculateStatsPerWeek(
    timesByYearWeek: TimesByYearWeek,
    contractHours?: number,
) {
    return Object.entries(timesByYearWeek)
        .map<Stats>(([yearWeekStr, times]) => {
            const billableHours = sum(
                times.filter((t) => t.billable).map((t) => t.hours),
            );
            let nonBillableHours = sum(
                times.filter((t) => !t.billable).map((t) => t.hours),
            );
            const excludedLeaveHours = sum(
                times
                    .filter(
                        (t) => !t.billable && LEAVE_TASKS.includes(t.taskName),
                    )
                    .map((t) => t.hours),
            );

            // If we are not calculating relative to contract hours,
            // exclude leave tasks from the non-billable (and thus total) hours.
            if (!contractHours) {
                nonBillableHours -= excludedLeaveHours;
            }
            const totalHours = billableHours + nonBillableHours;

            return {
                year: Number(yearWeekStr.substring(0, 4)),
                week: Number(yearWeekStr.substring(5)),
                billableHours,
                nonBillableHours,
                totalHours: sum(times.map((t) => t.hours)),
                leaveHours: sum(
                    times
                        .filter((t) => LEAVE_TASKS.includes(t.taskName))
                        .map((t) => t.hours),
                ),
                billableHoursPercentage: calculateHoursPercentage(
                    billableHours,
                    totalHours,
                    contractHours,
                ),
                nonBillableHoursPercentage: calculateHoursPercentage(
                    nonBillableHours,
                    totalHours,
                    contractHours,
                ),
            };
        })
        .sort((a, b) =>
            a.year === b.year ? b.week - a.week : b.year - a.year,
        );
}

function calculateHoursPercentage(
    hours: number,
    totalHours: number,
    contractHours?: number,
) {
    // Here we specifically want to use || instead of ??,
    // since we also want to use totalHours if contractHours is 0.
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return (100 * hours) / (contractHours || totalHours);
}

function calculateRollingStats(
    stats: Stats[],
    showWeeks: number,
    rollWeeks: number,
) {
    return stats.slice(0, showWeeks).map<RollingStats>((s, i) => {
        let totalBillablePercentage = 0;
        let count = 0;

        while (count < rollWeeks && i + count < stats.length) {
            totalBillablePercentage += stats[i + count].billableHoursPercentage;
            count++;
        }

        return {
            averageBillablePercentage: totalBillablePercentage / count,
            ...s,
        };
    });
}

function sum(n: number[]) {
    return n.reduce((acc, cur) => acc + cur, 0);
}
