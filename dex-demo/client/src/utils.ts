import { differenceInDays, format } from "date-fns";

export function formatDate(time: string): string {
    const date = new Date(time);
    const now = new Date();
    const days = differenceInDays(now, date);

    return `${format(date, 'yyyy-MM-dd HH:mm:ss')} (${days} days ago)`;
}

export function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    return format(date, "yyyy-MM-dd HH:mm:ss");
}
