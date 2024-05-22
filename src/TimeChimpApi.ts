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

    /**
     * Get the user id based on the username.
     * Note that this is an admin-only endpoint,
     * so this will throw an error if called by an unauthorized user.
     */
    public async getUserByUserName(userName: string): Promise<User> {
        const users = await this.getUsers();
        const user = users.find((u) => u.userName === userName);

        if (!user) {
            throw new Error(`No user found with userName: ${userName}`);
        }
        return user;
    }

    public getCompany(): Promise<Company> {
        return this.doFetch('/api/company');
    }

    public getTasks(): Promise<Task[]> {
        return this.doFetch('/api/task');
    }
}

export interface User {
    id: number;
    userName: string;
    contractHours?: number;
}

export interface Time {
    userId: number;
    date: string;
    hours: number;
    billable: boolean;
    taskName: string;
}

export interface Company {
    theme?: Theme;
}

export interface Theme {
    mainColor?: string;
}

export interface Task {
    id: number;
    name: string;
    tagNames?: string[];
}
