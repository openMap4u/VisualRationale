import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AbstractFilterComponent } from './abstract-filter-component';
import { FilterConfig } from './data-controller';

@customElement('timespan-slider-component')
export class TimespanSliderComponent extends AbstractFilterComponent {
  static styles = css`
    :host {
      display: block;
      padding: 10px;
    }
    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .inputs {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    input[type=range] {
        width: 100%;
    }
  `;

  @property({ type: String })
  field: string = 'timestamp';

  @property({ type: Number })
  min: number = 0;

  @property({ type: Number })
  max: number = 100;

  @property({ type: Number })
  start: number = 0;

  @property({ type: Number })
  end: number = 100;

  getFilter(): FilterConfig | null {
    return {
      id: 'timespan-filter',
      predicate: (item: any) => {
        const val = item[this.field];
        // Handle both numeric and date strings if possible, but for now strict comparison
        // assuming data matches the slider type (number).
        // If data is Date object or string, user should map it or use numeric timestamps.
        return val >= this.start && val <= this.end;
      },
      operator: 'AND'
    };
  }

  handleInput(e: Event, type: 'start' | 'end') {
    const target = e.target as HTMLInputElement;
    const val = Number(target.value);

    if (type === 'start') {
        // Prevent start from crossing end
        if (val > this.end) {
             this.start = this.end;
             target.value = this.end.toString();
        } else {
             this.start = val;
        }
    } else {
        // Prevent end from crossing start
        if (val < this.start) {
            this.end = this.start;
            target.value = this.start.toString();
        } else {
            this.end = val;
        }
    }
    this.updateTargets();
  }

  render() {
    return html`
      <div class="slider-container">
        <label>Timespan: ${this.start} - ${this.end}</label>
        <div class="inputs">
            <label>Start: <input
                type="range"
                min="${this.min}"
                max="${this.max}"
                .value="${this.start.toString()}"
                @input="${(e: Event) => this.handleInput(e, 'start')}"
            /></label>
            <label>End: <input
                type="range"
                min="${this.min}"
                max="${this.max}"
                .value="${this.end.toString()}"
                @input="${(e: Event) => this.handleInput(e, 'end')}"
            /></label>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'timespan-slider-component': TimespanSliderComponent;
  }
}
