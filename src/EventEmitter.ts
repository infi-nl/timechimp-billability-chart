export type EventHandler<T> = (value: T) => void | Promise<void>;

export class EventEmitter<T = void> {
    private listeners: EventHandler<T>[] = [];

    public addListener(l: EventHandler<T>) {
        this.listeners.push(l);
    }

    public fire(value: T) {
        this.listeners.forEach((h) => h(value));
    }
}
