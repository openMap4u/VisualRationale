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

  @query('#vis')
  visContainer!: HTMLDivElement;

  private _view: any = null;
  private _renderId = 0;
  private _dispose: (() => void) | null = null;

  override updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('spec')) {
      this._dispose?.();
      if (this.spec) {
        this._dispose = effect(() => {
          const specValue = this.spec?.value;
          if (specValue) {
            this.renderVega(specValue);
          } else {
            this.finalizeView();
          }
        });
      }
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

  async renderVega(spec: VisualizationSpec) {
    if (!this.visContainer) return;

    this._renderId++;
    const currentRenderId = this._renderId;

    try {
      this.finalizeView();

      const result = await embed(this.visContainer, spec, { actions: false });

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
