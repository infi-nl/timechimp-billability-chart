export class TimeChimpApi {
    private async doFetch<T>(path: string): Promise<T> {
        const url = `https://app.timechimp.com${path}`;
        const response = await fetch(url);
        const body = await response.text();

        if (response.status >= 400) {
            throw new Error(`API error response (${response.status}): ${body}`);
        }

        return JSON.parse(body);
    }

    public getCurrentUser(): Promise<User> {
        return this.doFetch('/api/user/current');
    }

    public getUsers(): Promise<User[]> {
        return this.doFetch('/api/user');
    }

    public getTimesDateRange(start: string, end: string): Promise<Time[]> {
        return this.doFetch(`/api/time/daterange/${start}/${end}`);
    }
}

export interface User {
    id: number;
    userName: string;
}

export interface Time {
    userId: number;
    date: string;
    hours: number;
    billable: boolean;
    taskName: string;
}
