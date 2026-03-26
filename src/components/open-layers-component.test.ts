import { describe, it, expect } from 'vitest';
import './open-layers-component';
import { OpenLayersComponent } from './open-layers-component';

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('OpenLayersComponent', () => {
  it('renders a map container', async () => {
    document.body.innerHTML = '<open-layers-component></open-layers-component>';
    const el = document.body.querySelector('open-layers-component') as OpenLayersComponent;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('#map')).toBeTruthy();
  });

  it('initializes the map', async () => {
    const el = document.createElement('open-layers-component') as OpenLayersComponent;
    document.body.appendChild(el);
    await el.updateComplete;

    // OpenLayers adds a .ol-viewport div to the target.
    const mapDiv = el.shadowRoot?.querySelector('#map');
    expect(mapDiv?.querySelector('.ol-viewport')).toBeTruthy();
  });
});
