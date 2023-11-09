import { Time } from '../TimeChimpApi';
import { getWeek } from 'date-fns';

const LEAVE_TASKS = ['Bijzonder verlof', 'Feestdag', 'Verlof'];

type TimesByWeek = Record<number, Time[]>;

interface Stats {
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
    showWeeks: number,
    rollWeeks: number,
) {
    const timesByWeek = groupTimesByWeek(times);
    removeLeaveOnlyWeeks(timesByWeek);
    const stats = calculateStatsPerWeek(timesByWeek);
    const rollingStats = calculateRollingStats(stats, showWeeks, rollWeeks);
    return rollingStats.reverse();
}

function groupTimesByWeek(times: Time[]) {
    return times.reduce<TimesByWeek>((acc, time) => {
        const week = getWeek(new Date(time.date));

        if (!acc[week]) {
            acc[week] = [];
        }

        acc[week].push(time);
        return acc;
    }, []);
}

function removeLeaveOnlyWeeks(timesByWeek: TimesByWeek) {
    Object.entries(timesByWeek).forEach(([weekStr, times]) => {
        if (times.every((t) => LEAVE_TASKS.includes(t.taskName))) {
            delete timesByWeek[Number(weekStr)];
        }
    });
}

function calculateStatsPerWeek(timesByWeek: TimesByWeek) {
    return Object.entries(timesByWeek)
        .map<Stats>(([weekStr, times]) => {
            const billableHours = sum(
                times.filter((t) => t.billable).map((t) => t.hours),
            );
            const nonBillableHours = sum(
                times
                    .filter(
                        (t) => !t.billable && !LEAVE_TASKS.includes(t.taskName),
                    )
                    .map((t) => t.hours),
            );
            const totalHoursWithoutLeave = billableHours + nonBillableHours;

            return {
                week: Number(weekStr),
                billableHours,
                nonBillableHours,
                totalHours: sum(times.map((t) => t.hours)),
                leaveHours: sum(
                    times
                        .filter((t) => LEAVE_TASKS.includes(t.taskName))
                        .map((t) => t.hours),
                ),
                billableHoursPercentage:
                    (100 * billableHours) / totalHoursWithoutLeave,
                nonBillableHoursPercentage:
                    (100 * nonBillableHours) / totalHoursWithoutLeave,
            };
        })
        .sort((a, b) => b.week - a.week);
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
