import { signal, effect, Signal } from '@preact/signals-core';

/**
 * A class decorator that registers a custom web component.
 *
 * @param name - The tag name of the custom element (e.g., 'my-element').
 */
export function customElement(name: string) {
  return function (constructor: CustomElementConstructor) {
    if (!customElements.get(name)) {
      customElements.define(name, constructor);
    }
  };
}

/**
 * A property decorator that queries the DOM (or Shadow DOM) for an element.
 *
 * @param selector - The CSS selector to query for.
 */
export function select(selector: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return (this.shadowRoot || this).querySelector(selector);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

const signalsRegistry = new Map<string, Signal<any>>();

/**
 * Retrieves a reactive Signal from the registry by key, creating it if it doesn't exist.
 *
 * @param key - The unique identifier for the Signal.
 * @returns The Signal instance.
 */
export function getSignal(key: string) {
  if (!signalsRegistry.has(key)) {
    signalsRegistry.set(key, signal(undefined));
  }
  return signalsRegistry.get(key)!;
}

/**
 * A property decorator that binds a component property to a shared reactive Signal.
 * Setting the property updates the Signal, and reading it retrieves the Signal's value.
 * Used in conjunction with `@consumer`.
 *
 * @param key - The unique identifier for the shared Signal.
 */
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
      configurable: true,
    });
  };
}

/**
 * A property decorator that makes a component property reactive to changes in a shared Signal.
 * Automatically hooks into the custom element lifecycle to trigger re-renders or updates
 * when the Signal value changes. Used in conjunction with `@provider`.
 *
 * @param key - The unique identifier for the shared Signal to consume.
 */
export function consumer(key: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return getSignal(key).value;
      },
      enumerable: true,
      configurable: true,
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
