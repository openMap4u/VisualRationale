import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AbstractFilterComponent } from './abstract-filter-component';
import { FilterConfig } from '../api/data-controller';
import { tailwindStyles } from '../tailwind';

/**
 * A Web Component that provides a dual-handle slider for filtering data by a numeric range.
 * Extends `AbstractFilterComponent` to integrate with `DataController` and apply
 * filters to target data consumers.
 */
@customElement('timespan-slider-component')
export class TimespanSliderComponent extends AbstractFilterComponent {
  static styles = [
    tailwindStyles,
    css`
      :host {
        display: block;
      }
      .slider-container {
        position: relative;
        height: 2rem;
        width: 100%;
      }
      .slider-track {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 0.5rem;
        width: 100%;
        background-color: #e5e7eb; /* gray-200 */
        border-radius: 9999px;
        z-index: 1;
      }
      .slider-range {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 0.5rem;
        background-color: #3b82f6; /* blue-500 */
        border-radius: 9999px;
        z-index: 2;
      }
      input[type=range] {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        height: 2rem;
        pointer-events: none;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        margin: 0;
        z-index: 3;
      }
      input[type=range]::-webkit-slider-thumb {
        pointer-events: auto;
        -webkit-appearance: none;
        appearance: none;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        background: #2563eb; /* blue-600 */
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
      input[type=range]::-moz-range-thumb {
        pointer-events: auto;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        background: #2563eb;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
    `,
  ];

  /**
   * The field name in the dataset to filter by. Defaults to 'timestamp'.
   */
  @property({ type: String })
  field: string = 'timestamp';

  /**
   * The minimum allowed value of the slider.
   */
  @property({ type: Number })
  min: number = 0;

  /**
   * The maximum allowed value of the slider.
   */
  @property({ type: Number })
  max: number = 100;

  /**
   * The current selected start value of the range.
   */
  @property({ type: Number })
  start: number = 0;

  /**
   * The current selected end value of the range.
   */
  @property({ type: Number })
  end: number = 100;

  /**
   * Generates a filter configuration based on the current slider range.
   *
   * @returns The generated `FilterConfig` or null if no filter should be applied.
   */
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

  /**
   * Handles user interaction with the slider input elements.
   * Ensures the start handle cannot cross the end handle, and vice versa.
   * Updates target components after a successful input.
   *
   * @param e - The input event from the slider.
   * @param type - Which slider handle triggered the event ('start' or 'end').
   */
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
    const range = this.max - this.min;
    const startPercent = range === 0 ? 0 : ((this.start - this.min) / range) * 100;
    const endPercent = range === 0 ? 100 : ((this.end - this.min) / range) * 100;
    const widthPercent = endPercent - startPercent;

    return html`
      <div class="flex flex-col gap-1 p-2">
        <label class="text-sm font-medium text-gray-700">Timespan: ${this.start} - ${this.end}</label>
        <div class="slider-container">
          <div class="slider-track"></div>
          <div
            class="slider-range"
            style="left: ${startPercent}%; width: ${widthPercent}%"
          ></div>
          <input
            type="range"
            min="${this.min}"
            max="${this.max}"
            .value="${this.start.toString()}"
            @input="${(e: Event) => this.handleInput(e, 'start')}"
            aria-label="Start time"
          />
          <input
            type="range"
            min="${this.min}"
            max="${this.max}"
            .value="${this.end.toString()}"
            @input="${(e: Event) => this.handleInput(e, 'end')}"
            aria-label="End time"
          />
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
