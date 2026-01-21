import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import embed, { VisualizationSpec } from 'vega-embed';
import { effect, Signal } from '@preact/signals-core';

@customElement('vega-lite-component')
export class VegaLiteComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    #vis {
      width: 100%;
      height: 100%;
    }
  `;

  @property({ attribute: false })
  spec: Signal<VisualizationSpec | null> | VisualizationSpec | null = null;

  @property({ type: Array })
  data: any[] | null = null;

  @query('#vis')
  visContainer!: HTMLDivElement;

  private _view: any = null;
  private _renderId = 0;
  private _dispose: (() => void) | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (this.spec && this.spec instanceof Signal) {
      this._setupSpecEffect();
    }
  }

  override updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('spec')) {
      if (this.spec instanceof Signal) {
        this._setupSpecEffect();
      } else {
        // Dispose existing effect if we switched from Signal to plain object
        if (this._dispose) {
          this._dispose();
          this._dispose = null;
        }
        this.renderVega();
      }
    } else if (changedProperties.has('data')) {
      this.renderVega();
    }
  }

  private _setupSpecEffect() {
    if (this._dispose) {
      this._dispose();
      this._dispose = null;
    }

    // Only setup effect if it is a signal
    const spec = this.spec;
    if (spec instanceof Signal) {
      this._dispose = effect(() => {
        // Access value to ensure tracking
        spec.value;
        this.renderVega();
      });
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._dispose) {
      this._dispose();
      this._dispose = null;
    }
    this.finalizeView();
  }

  finalizeView() {
    if (this._view) {
      this._view.finalize();
      this._view = null;
    }
  }

  async renderVega() {
    // If container is not ready, we can't render.
    // This might happen if effect runs before first render.
    if (!this.visContainer) return;

    this._renderId++;
    const currentRenderId = this._renderId;

    try {
      this.finalizeView();

      const spec = this.spec;
      let currentSpec: VisualizationSpec | null = null;
      if (spec instanceof Signal) {
        currentSpec = spec.value;
      } else {
        currentSpec = spec;
      }

      if (!currentSpec) {
          return;
      }

      let specToRender: any = currentSpec;
      if (this.data) {
        specToRender = { ...specToRender, data: { values: this.data } };
      }

      const result = await embed(this.visContainer, specToRender, { actions: false });

      if (this._renderId !== currentRenderId) {
        // A new render started while we were waiting, so discard this result
        result.view.finalize();
        return;
      }

      this._view = result.view;
      this.dispatchEvent(new CustomEvent('vega-rendered', { detail: { view: this._view } }));
    } catch (error) {
      if (this._renderId === currentRenderId) {
        console.error('Error rendering Vega-Lite chart:', error);
        this.dispatchEvent(new CustomEvent('vega-error', { detail: { error } }));
      }
    }
  }

  render() {
    return html`<div id="vis"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vega-lite-component': VegaLiteComponent;
  }
}
