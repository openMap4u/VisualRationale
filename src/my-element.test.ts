import { describe, it, expect } from 'vitest';
import './my-element';
import { MyElement } from './my-element';

describe('MyElement', () => {
  it('renders with default values', async () => {
    document.body.innerHTML = '<my-element></my-element>';
    const el = document.body.querySelector('my-element') as MyElement;
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain('Hello, World!');
  });

  it('renders with a set name', async () => {
    document.body.innerHTML = '<my-element name="Test"></my-element>';
    const el = document.body.querySelector('my-element') as MyElement;
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain('Hello, Test!');
  });
});
