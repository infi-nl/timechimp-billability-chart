export type EventHandler = () => void | Promise<void>;

export class EventEmitter {
    private listeners: EventHandler[] = [];

    public addListener(l: EventHandler) {
        this.listeners.push(l);
    }

    public fire() {
        this.listeners.forEach((h) => h());
    }
}
