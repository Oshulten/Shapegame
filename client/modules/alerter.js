export class Alerter {
    constructor(observedObject) {
        this.listeners = [];
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
    registerListener(subject, callback) {
        this.listeners.push({
            subject,
            callback,
        });
    }
    deregisterListener(subject) {
        this.listeners = this.listeners.filter((listener) => listener.subject !== subject);
    }
}
