import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { DataConsumer } from './data-consumer';

export abstract class BaseDataComponent extends LitElement implements DataConsumer {
  @property({ attribute: false })
  data: any[] | null = null;
}
