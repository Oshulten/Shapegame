type ObserverCallback = (observedObject: any) => void;
interface Listener {
    subject: object,
    callback: ObserverCallback
}

export class Alerter {
    private proxy: any;
    private listeners: Listener[] = [];
    constructor(observedObject: any) {
        this.proxy = new Proxy(observedObject, {
            set: (target, property, value) => {
                target[property] = value;
                this.listeners.forEach((listener) => {
                    listener.callback.bind(listener.subject)(this.proxy);
                });
                return true;
            }
        });
    }

    registerListener(subject: object, callback: ObserverCallback) {
        this.listeners.push({
            subject,
            callback,
        });
    }

    deregisterListener(subject: object) {
        this.listeners = this.listeners.filter((listener) => listener.subject !== subject);
    }
}