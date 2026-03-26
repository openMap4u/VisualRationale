import { describe, it, expect, vi } from 'vitest';
import { customElement, style, select, provider, consumer, consumerSelect, getSignal } from './decorators';

describe('Decorators', () => {
    it('customElement should define a web component', () => {
        @customElement('test-element')
        class TestElement extends HTMLElement {}

        expect(customElements.get('test-element')).toBeDefined();
    });

    it('select should query an element', () => {
        class MockElement {
            shadowRoot: any;
            constructor() {
                this.shadowRoot = {
                    querySelector: vi.fn().mockReturnValue('mocked-element')
                };
            }
            @select('.test-class') testElement: any;
        }

        const el = new MockElement();
        expect(el.testElement).toBe('mocked-element');
        expect(el.shadowRoot.querySelector).toHaveBeenCalledWith('.test-class');
    });

    it('provider and consumer should share state using signals', () => {
        const testKey = 'test-signal';
        let updates = 0;

        class Provider {
            @provider(testKey) value: any;
        }

        class Consumer {
            @consumer(testKey) value: any;
            _disposers: any[] = [];
            onConsumerUpdate() {
                updates++;
            }
            connectedCallback() {
                // defined in decorator
            }
            disconnectedCallback() {
                // defined in decorator
            }
        }

        const p = new Provider();
        const c = new Consumer();

        // Initial setup
        c.connectedCallback();

        p.value = 'hello';

        expect(c.value).toBe('hello');
        expect(getSignal(testKey).value).toBe('hello');
        expect(updates).toBeGreaterThan(0);

        c.disconnectedCallback();
    });

    it('style should inject css into shadowRoot', () => {
        const cssString = 'div { color: red; }';

        @style(cssString)
        class StyledElement extends HTMLElement {
            constructor() {
                super();
            }
        }

        customElements.define('styled-element', StyledElement);
        const el = document.createElement('styled-element');
        document.body.appendChild(el);

        expect(el.shadowRoot).toBeDefined();
        const styleEl = el.shadowRoot!.querySelector('style');
        expect(styleEl).toBeDefined();
        expect(styleEl!.textContent).toBe(cssString);

        document.body.removeChild(el);
    });

    it('consumerSelect should share state and trigger updates only for specific attribute changes', () => {
        const testKey = 'test-signal-select';
        let updates = 0;

        class Provider {
            @provider(testKey) value: any;
        }

        class Consumer {
            @consumerSelect(testKey, 'attr1') value: any;
            _disposers: any[] = [];
            onConsumerUpdate() {
                updates++;
            }
            connectedCallback() {
                // defined in decorator
            }
            disconnectedCallback() {
                // defined in decorator
            }
        }

        const p = new Provider();
        const c = new Consumer();

        // Initial setup
        c.connectedCallback();

        p.value = { attr1: 'hello', attr2: 'world' };

        expect(c.value).toBe('hello');
        expect(updates).toBe(2);

        p.value = { ...p.value, attr2: 'new world' };
        expect(updates).toBe(2); // Should not trigger an update

        p.value = { ...p.value, attr1: 'new hello' };
        expect(updates).toBe(3); // Should trigger an update
        expect(c.value).toBe('new hello');

        c.disconnectedCallback();
    });
});
