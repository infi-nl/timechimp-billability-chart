export class TimeChimpApi {
    private async doFetch<T>(path: string): Promise<T> {
        const token = this.getToken();
        const url = `https://web.timechimp.com${path}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const body = await response.text();

        if (response.status >= 400) {
            throw new Error(`API error response (${response.status}): ${body}`);
        }

        return JSON.parse(body);
    }

    private getToken(): string {
        let token = window.localStorage.getItem('tc_auth_token');
        if (!token) {
            throw new Error('No token found in local storage');
        }

        // The token starts and ends with a double quote, remove that.
        // Though also account for the fact that this could change.
        if (token.startsWith('"')) {
            token = token.substring(1);
        }
        if (token.endsWith('"')) {
            token = token.substring(0, token.length - 1);
        }

        return token;
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
