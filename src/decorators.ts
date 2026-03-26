import { signal, effect, Signal } from '@preact/signals-core';

export function customElement(name: string) {
    return function (constructor: CustomElementConstructor) {
        if (!customElements.get(name)) {
            customElements.define(name, constructor);
        }
    };
}

export function style(cssString: string) {
    return function (constructor: any) {
        const originalConnected = constructor.prototype.connectedCallback;
        constructor.prototype.connectedCallback = function () {
            if (!this.shadowRoot) {
                this.attachShadow({ mode: 'open' });
            }
            if (!this._styleInjected) {
                const styleEl = document.createElement('style');
                styleEl.textContent = cssString;
                this.shadowRoot.appendChild(styleEl);
                this._styleInjected = true;
            }

            if (originalConnected) {
                originalConnected.call(this);
            }
        };
    };
}

export function select(selector: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get() {
                return (this.shadowRoot || this).querySelector(selector);
            },
            enumerable: true,
            configurable: true
        });
    };
}

const signalsRegistry = new Map<string, Signal<any>>();

export function getSignal(key: string) {
    if (!signalsRegistry.has(key)) {
        signalsRegistry.set(key, signal(undefined));
    }
    return signalsRegistry.get(key)!;
}

export function provider(key: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get() {
                return getSignal(key).value;
            },
            set(newVal: any) {
                getSignal(key).value = newVal;
            },
            enumerable: true,
            configurable: true
        });
    };
}

export function consumer(key: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get() {
                return getSignal(key).value;
            },
            enumerable: true,
            configurable: true
        });

        const originalConnected = target.connectedCallback;
        const originalDisconnected = target.disconnectedCallback;

        target.connectedCallback = function () {
            if (!this._disposers) {
                this._disposers = [];
            }
            const dispose = effect(() => {
                const val = getSignal(key).value;
                if (typeof this.onConsumerUpdate === 'function') {
                    this.onConsumerUpdate(propertyKey, val);
                } else if (typeof this.render === 'function') {
                    this.render();
                }
            });
            this._disposers.push(dispose);

            if (originalConnected) {
                originalConnected.call(this);
            }
        };

        target.disconnectedCallback = function () {
            if (this._disposers) {
                this._disposers.forEach((d: any) => d());
                this._disposers = [];
            }
            if (originalDisconnected) {
                originalDisconnected.call(this);
            }
        };
    };
}

export function consumerSelect(key: string, attribute: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get() {
                const state = getSignal(key).value;
                return state ? state[attribute] : undefined;
            },
            enumerable: true,
            configurable: true
        });

        const originalConnected = target.connectedCallback;
        const originalDisconnected = target.disconnectedCallback;

        target.connectedCallback = function () {
            if (!this._disposers) {
                this._disposers = [];
            }

            let prevValue: any;
            let initialized = false;

            const dispose = effect(() => {
                const state = getSignal(key).value;
                const val = state ? state[attribute] : undefined;

                if (!initialized || val !== prevValue) {
                    prevValue = val;
                    initialized = true;
                    if (typeof this.onConsumerUpdate === 'function') {
                        this.onConsumerUpdate(propertyKey, val);
                    } else if (typeof this.render === 'function') {
                        this.render();
                    }
                }
            });
            this._disposers.push(dispose);

            if (originalConnected) {
                originalConnected.call(this);
            }
        };

        target.disconnectedCallback = function () {
            if (this._disposers) {
                this._disposers.forEach((d: any) => d());
                this._disposers = [];
            }
            if (originalDisconnected) {
                originalDisconnected.call(this);
            }
        };
    };
}
