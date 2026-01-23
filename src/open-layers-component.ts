import { html, css, unsafeCSS } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { BaseDataComponent } from './base-data-component';
import olStyles from 'ol/ol.css?inline';

@customElement('open-layers-component')
export class OpenLayersComponent extends BaseDataComponent {
  static styles = [
    css`
      ${unsafeCSS(olStyles)}
    `,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      #map {
        width: 100%;
        height: 100%;
      }
    `,
  ];

  @query('#map')
  mapContainer!: HTMLDivElement;

  private _map: Map | null = null;

  override firstUpdated() {
    this._initMap();
  }

  private _initMap() {
    if (this._map) return;

    this._map = new Map({
      target: this.mapContainer,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  }

  render() {
    return html`<div id="map"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'open-layers-component': OpenLayersComponent;
  }
}
