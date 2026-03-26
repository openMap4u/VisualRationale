import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { DataController, FilterConfig } from '../api/data-controller';
import { DataConsumer } from '../api/data-consumer';

/**
 * Abstract base class for UI components that act as data filters.
 * Provides the core logic to communicate with a `DataController` and
 * apply generated filters to a list of target `DataConsumer`s.
 */
export abstract class AbstractFilterComponent extends LitElement {
  /**
   * The active `DataController` instance managing the datasets.
   */
  @property({ attribute: false })
  controller: DataController | null = null;

  /**
   * The name of the dataset to filter.
   */
  @property({ type: String, attribute: 'dataset-name' })
  datasetName: string = '';

  /**
   * A list of target `DataConsumer` instances that will receive the filtered data.
   */
  @property({ attribute: false })
  targets: DataConsumer[] = [];

  /**
   * Generates a `FilterConfig` based on the component's current UI state.
   * To be implemented by subclasses.
   *
   * @returns The generated `FilterConfig` or null if no filter is active.
   */
  abstract getFilter(): FilterConfig | null;

  /**
   * Applies the current filter to all target components via the `DataController`.
   * Should be called by subclasses whenever the user interacts with the filter UI.
   */
  protected updateTargets() {
    if (!this.controller || !this.datasetName) return;
    const filter = this.getFilter();

    this.targets.forEach(target => {
      if (filter) {
        this.controller!.updateFilter(this.datasetName, target, filter);
      }
    });
  }

  /**
   * Removes a specific filter from all target components via the `DataController`.
   *
   * @param filterId - The ID of the filter to remove.
   */
  protected removeFilterFromTargets(filterId: string) {
    if (!this.controller || !this.datasetName) return;
    this.targets.forEach(target => {
      this.controller!.removeFilter(this.datasetName, target, filterId);
    });
  }
}
