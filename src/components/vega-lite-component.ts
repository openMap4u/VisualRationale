import { html, css, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import embed, { VisualizationSpec } from 'vega-embed';
import { effect, Signal } from '@preact/signals-core';
import { BaseDataComponent } from './base-data-component';

/**
 * A Web Component that wraps vega-embed to render Vega-Lite specifications.
 * Inherits reactive `data` property from `BaseDataComponent`.
 * Supports both static `VisualizationSpec` objects and reactive Signals for the spec.
 * Emits `vega-rendered` upon successful render, and `vega-error` upon failure.
 */
@customElement('vega-lite-component')
export class VegaLiteComponent extends BaseDataComponent {
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

  /**
   * The Vega-Lite visualization specification.
   * Can be a plain object or a `@preact/signals-core` Signal for reactivity.
   */
  @property({ attribute: false })
  spec: Signal<VisualizationSpec | null> | VisualizationSpec | null = null;

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
        void spec.value;
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

  /**
   * Cleans up the current vega-embed view, releasing resources to prevent memory leaks.
   */
  finalizeView() {
    if (this._view) {
      this._view.finalize();
      this._view = null;
    }
  }

  /**
   * Renders the Vega-Lite visualization using the current `spec` and `data`.
   * Handles async race conditions and ensures only the most recent render result is kept.
   */
  async renderVega() {
    if (!this.visContainer || !this.spec) return;

    this._renderId++;
    const currentRenderId = this._renderId;

    try {
      this.finalizeView();

      // Access signal value if it's a signal, otherwise use it directly (if changed to plain object later)
      // The type says Signal<VisualizationSpec | null> | null
      const currentSpec = this.spec instanceof Signal ? this.spec.value : this.spec;

      if (!currentSpec) return;

      let specToRender = currentSpec;
      if (this.data) {
        specToRender = { ...currentSpec, data: { values: this.data } } as any;
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
