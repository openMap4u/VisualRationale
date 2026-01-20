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
  spec: Signal<VisualizationSpec | null> | null = null;

  @property({ type: Array })
  data: any[] | null = null;

  @query('#vis')
  visContainer!: HTMLDivElement;

  private _view: any = null;
  private _renderId = 0;
  private _dispose: (() => void) | null = null;

  override updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    super.updated(changedProperties);
    if ((changedProperties.has('spec') || changedProperties.has('data')) && this.spec) {
      this.renderVega();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._dispose?.();
    this.finalizeView();
  }

  finalizeView() {
    if (this._view) {
      this._view.finalize();
      this._view = null;
    }
  }

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
