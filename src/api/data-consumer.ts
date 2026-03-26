/**
 * Interface representing a component that consumes data.
 * Components implementing this interface can be registered with a DataController
 * to receive reactive data updates.
 */
export interface DataConsumer {
  /**
   * The data currently assigned to the component.
   * Updates to this property should ideally trigger a re-render or visualization update.
   */
  data: any[] | null | undefined;
}
