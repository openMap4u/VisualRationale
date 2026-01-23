import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { DataController, FilterConfig } from './data-controller';
import { DataConsumer } from './data-consumer';

export abstract class AbstractFilterComponent extends LitElement {
  @property({ attribute: false })
  controller: DataController | null = null;

  @property({ type: String, attribute: 'dataset-name' })
  datasetName: string = '';

  @property({ attribute: false })
  targets: DataConsumer[] = [];

  abstract getFilter(): FilterConfig | null;

  protected updateTargets() {
    if (!this.controller || !this.datasetName) return;
    const filter = this.getFilter();

    this.targets.forEach(target => {
      if (filter) {
        this.controller!.updateFilter(this.datasetName, target, filter);
      }
    });
  }

  protected removeFilterFromTargets(filterId: string) {
    if (!this.controller || !this.datasetName) return;
    this.targets.forEach(target => {
      this.controller!.removeFilter(this.datasetName, target, filterId);
    });
  }
}
