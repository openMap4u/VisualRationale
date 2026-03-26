import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A simple example Web Component to demonstrate Lit functionality.
 * Renders a greeting with a customizable name.
 */
@customElement('my-element')
export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
  `;

  /**
   * The name to greet. Defaults to 'World'.
   */
  @property()
  name = 'World';

  /**
   * Renders the component's HTML structure within its Shadow DOM.
   */
  render() {
    return html`<h1>Hello, ${this.name}!</h1>
      <slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
