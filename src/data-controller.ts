import { VegaLiteComponent } from './vega-lite-component';

type FilterPredicate = (item: any) => boolean;

interface Subscriber {
  component: VegaLiteComponent;
  filter?: FilterPredicate;
}

export class DataController {
  private datasets: Map<string, any[]> = new Map();
  private subscribers: Map<string, Set<Subscriber>> = new Map();

  async load(datasetName: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
      }
      const data = await response.json();
      this.setData(datasetName, data);
    } catch (error) {
      console.error(`Error loading dataset ${datasetName}:`, error);
      throw error;
    }
  }

  setData(datasetName: string, data: any[]) {
    this.datasets.set(datasetName, data);
    this.notify(datasetName);
  }

  getData(datasetName: string): any[] | undefined {
    return this.datasets.get(datasetName);
  }

  register(datasetName: string, component: VegaLiteComponent, filter?: FilterPredicate) {
    if (!this.subscribers.has(datasetName)) {
      this.subscribers.set(datasetName, new Set());
    }
    this.subscribers.get(datasetName)!.add({ component, filter });

    // Initial update if data exists
    if (this.datasets.has(datasetName)) {
      this.updateComponent(component, this.datasets.get(datasetName)!, filter);
    }
  }

  unregister(datasetName: string, component: VegaLiteComponent) {
    const subs = this.subscribers.get(datasetName);
    if (subs) {
      for (const sub of subs) {
        if (sub.component === component) {
          subs.delete(sub);
          return;
        }
      }
      if (subs.size === 0) {
        this.subscribers.delete(datasetName);
      }
    }
  }

  private notify(datasetName: string) {
    const data = this.datasets.get(datasetName);
    if (!data) return;
    const subs = this.subscribers.get(datasetName);
    if (subs) {
      for (const sub of subs) {
        this.updateComponent(sub.component, data, sub.filter);
      }
    }
  }

  private updateComponent(component: VegaLiteComponent, data: any[], filter?: FilterPredicate) {
    const dataToSet = filter ? data.filter(filter) : data;
    component.data = dataToSet;
  }
}
