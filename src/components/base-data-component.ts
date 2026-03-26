import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { DataConsumer } from '../api/data-consumer';

/**
 * Abstract base class for UI components that consume data.
 * Extends `LitElement` and implements `DataConsumer` to provide a reactive `data` property.
 */
export abstract class BaseDataComponent extends LitElement implements DataConsumer {
  /**
   * The reactive data property that triggers re-renders when updated.
   * Can be assigned static data or driven by a `DataController`.
   */
  @property({ attribute: false })
  data: any[] | null = null;
}
