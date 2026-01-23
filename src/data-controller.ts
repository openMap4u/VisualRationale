import { DataConsumer } from './data-consumer';

export type FilterPredicate = (item: any) => boolean;
export type TransformFn = (data: any[]) => any[];

export interface FilterConfig {
  id: string;
  predicate: FilterPredicate;
  operator?: 'AND' | 'OR';
}

export interface TransformConfig {
  id: string;
  transform: TransformFn;
}

interface Subscriber {
  component: DataConsumer;
  filters: FilterConfig[];
  transforms: TransformConfig[];
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

  register(datasetName: string, component: DataConsumer, filter?: FilterPredicate) {
    if (!this.subscribers.has(datasetName)) {
      this.subscribers.set(datasetName, new Set());
    }

    const filters: FilterConfig[] = [];
    if (filter) {
        filters.push({ id: 'initial', predicate: filter, operator: 'AND' });
    }

    this.subscribers.get(datasetName)!.add({
        component,
        filters,
        transforms: []
    });

    // Initial update if data exists
    if (this.datasets.has(datasetName)) {
      const sub = this.getSubscriber(datasetName, component);
      if (sub) {
        this.updateComponent(sub, this.datasets.get(datasetName)!);
      }
    }
  }

  unregister(datasetName: string, component: DataConsumer) {
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

  addFilter(datasetName: string, component: DataConsumer, filter: FilterConfig) {
      const sub = this.getSubscriber(datasetName, component);
      if (sub) {
          sub.filters.push({ ...filter, operator: filter.operator || 'AND' });
          this.refreshSubscriber(datasetName, sub);
      }
  }

  updateFilter(datasetName: string, component: DataConsumer, filter: FilterConfig) {
      const sub = this.getSubscriber(datasetName, component);
      if (sub) {
          const index = sub.filters.findIndex(f => f.id === filter.id);
          if (index !== -1) {
              sub.filters[index] = { ...filter, operator: filter.operator || 'AND' };
          } else {
              sub.filters.push({ ...filter, operator: filter.operator || 'AND' });
          }
          this.refreshSubscriber(datasetName, sub);
      }
  }

  removeFilter(datasetName: string, component: DataConsumer, filterId: string) {
      const sub = this.getSubscriber(datasetName, component);
      if (sub) {
          sub.filters = sub.filters.filter(f => f.id !== filterId);
          this.refreshSubscriber(datasetName, sub);
      }
  }

  addTransform(datasetName: string, component: DataConsumer, transform: TransformConfig) {
      const sub = this.getSubscriber(datasetName, component);
      if (sub) {
          sub.transforms.push(transform);
          this.refreshSubscriber(datasetName, sub);
      }
  }

  removeTransform(datasetName: string, component: DataConsumer, transformId: string) {
      const sub = this.getSubscriber(datasetName, component);
      if (sub) {
          sub.transforms = sub.transforms.filter(t => t.id !== transformId);
          this.refreshSubscriber(datasetName, sub);
      }
  }

  private getSubscriber(datasetName: string, component: DataConsumer): Subscriber | undefined {
      const subs = this.subscribers.get(datasetName);
      if (subs) {
          for (const sub of subs) {
              if (sub.component === component) return sub;
          }
      }
      return undefined;
  }

  private refreshSubscriber(datasetName: string, sub: Subscriber) {
      const data = this.datasets.get(datasetName);
      if (data) {
          this.updateComponent(sub, data);
      }
  }

  private notify(datasetName: string) {
    const data = this.datasets.get(datasetName);
    if (!data) return;
    const subs = this.subscribers.get(datasetName);
    if (subs) {
      for (const sub of subs) {
        this.updateComponent(sub, data);
      }
    }
  }

  private updateComponent(sub: Subscriber, data: any[]) {
    let dataToSet = data;

    // Apply filters
    if (sub.filters.length > 0) {
        dataToSet = dataToSet.filter(item => {
             let acc = sub.filters[0].predicate(item);
             for (let i = 1; i < sub.filters.length; i++) {
                 const f = sub.filters[i];
                 const val = f.predicate(item);
                 if (f.operator === 'OR') {
                     acc = acc || val;
                 } else {
                     acc = acc && val;
                 }
             }
             return acc;
        });
    }

    // Apply transforms
    for (const t of sub.transforms) {
        dataToSet = t.transform(dataToSet);
    }

    sub.component.data = dataToSet;
  }
}
