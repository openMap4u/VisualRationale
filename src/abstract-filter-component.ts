import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { DataController, FilterConfig } from './data-controller';
import { DataConsumer } from './data-consumer';

export abstract class AbstractFilterComponent extends LitElement {
  @property({ attribute: false })
  controller: DataController | null = null;

  @property({ type: String })
  dataset: string = '';

  @property({ attribute: false })
  targets: DataConsumer[] = [];

  abstract getFilter(): FilterConfig | null;

  protected updateTargets() {
    if (!this.controller || !this.dataset) return;
    const filter = this.getFilter();

    this.targets.forEach(target => {
      if (filter) {
        this.controller!.updateFilter(this.dataset, target, filter);
      }
    });
  }

  protected removeFilterFromTargets(filterId: string) {
    if (!this.controller || !this.dataset) return;
    this.targets.forEach(target => {
      this.controller!.removeFilter(this.dataset, target, filterId);
    });
  }
}
