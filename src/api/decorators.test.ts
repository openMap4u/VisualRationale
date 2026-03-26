import { describe, it, expect, vi } from 'vitest';
import { customElement, select, provider, consumer, getSignal } from './decorators';

describe('Decorators', () => {
  it('customElement should define a web component', () => {
    @customElement('test-element')
    class TestElement extends HTMLElement {}

    // Use the class to avoid unused variable error
    expect(new TestElement()).toBeDefined();

    expect(customElements.get('test-element')).toBeDefined();
  });

  it('select should query an element', () => {
    class MockElement {
      shadowRoot: any;
      constructor() {
        this.shadowRoot = {
          querySelector: vi.fn().mockReturnValue('mocked-element'),
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
});
