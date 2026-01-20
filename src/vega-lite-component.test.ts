import { describe, it, expect } from 'vitest';
import './vega-lite-component';
import { VegaLiteComponent } from './vega-lite-component';

describe('VegaLiteComponent', () => {
  it('renders a container', async () => {
    document.body.innerHTML = '<vega-lite-component></vega-lite-component>';
    const el = document.body.querySelector('vega-lite-component') as VegaLiteComponent;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('#vis')).toBeTruthy();
  });

  it('accepts a spec and emits vega-rendered event', async () => {
    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "values": [] },
      "mark": "bar",
      "encoding": {}
    };

    const el = document.createElement('vega-lite-component') as VegaLiteComponent;
    document.body.appendChild(el);

    const rendered = new Promise((resolve) => {
      el.addEventListener('vega-rendered', resolve, { once: true });
    });

    el.spec = spec as any;

    await rendered;

    expect(el.spec).toEqual(spec);
    expect(el.shadowRoot?.querySelector('#vis')).toBeTruthy();
  });
});
