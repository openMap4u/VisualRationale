import { describe, it, expect } from 'vitest';
import './vega-lite-component';
import { VegaLiteComponent } from './vega-lite-component';
import { signal } from '@preact/signals-core';
import { VisualizationSpec } from 'vega-embed';

describe('VegaLiteComponent', () => {
  it('renders a container', async () => {
    document.body.innerHTML = '<vega-lite-component></vega-lite-component>';
    const el = document.body.querySelector('vega-lite-component') as VegaLiteComponent;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('#vis')).toBeTruthy();
  });

  it('accepts a spec signal and emits vega-rendered event', async () => {
    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "values": [] },
      "mark": "bar",
      "encoding": {}
    };

    const el = document.createElement('vega-lite-component') as VegaLiteComponent;
    document.body.appendChild(el);

    const specSignal = signal<VisualizationSpec | null>(spec as any);
    el.spec = specSignal;

    const rendered = new Promise((resolve) => {
      el.addEventListener('vega-rendered', resolve, { once: true });
    });

    await rendered;

    expect(el.spec).toBe(specSignal);
    expect(el.shadowRoot?.querySelector('#vis')).toBeTruthy();
  });

  it('updates when signal value changes', async () => {
     const spec1 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "values": [] },
      "mark": "bar",
      "encoding": {}
    };
     const spec2 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "values": [] },
      "mark": "point",
      "encoding": {}
    };

    const el = document.createElement('vega-lite-component') as VegaLiteComponent;
    document.body.appendChild(el);

    const specSignal = signal<VisualizationSpec | null>(spec1 as any);
    el.spec = specSignal;

    // Wait for first render
    await new Promise((resolve) => el.addEventListener('vega-rendered', resolve, { once: true }));

    // Setup listener for second render
    const rendered2 = new Promise((resolve) => {
      el.addEventListener('vega-rendered', resolve, { once: true });
    });

    // Update signal
    specSignal.value = spec2 as any;

    await rendered2;
    expect(true).toBe(true);
  });

  it('updates visualization when data property is set', async () => {
    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "values": [] },
      "mark": "bar",
      "encoding": {
        "x": {"field": "a", "type": "ordinal"},
        "y": {"field": "b", "type": "quantitative"}
      }
    };

    const el = document.createElement('vega-lite-component') as VegaLiteComponent;
    document.body.appendChild(el);

    // Need to use signal here
    const specSignal = signal<VisualizationSpec | null>(spec as any);
    el.spec = specSignal;

    await new Promise((resolve) => el.addEventListener('vega-rendered', resolve, { once: true }));

    const data = [
      {a: 'A', b: 28}, {a: 'B', b: 55}, {a: 'C', b: 43}
    ];

    let view: any;
    const renderedAgain = new Promise<void>((resolve) => {
      el.addEventListener('vega-rendered', (e: any) => {
        view = e.detail.view;
        resolve();
      }, { once: true });
    });

    el.data = data;

    await renderedAgain;

    expect(view).toBeTruthy();
    expect(el.data).toEqual(data);
  });
});
