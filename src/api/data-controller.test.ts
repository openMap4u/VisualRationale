import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataController } from './data-controller';

// Mock VegaLiteComponent
class MockComponent {
    data: any[] | null = null;
}

describe('DataController', () => {
  let controller: DataController;
  let component1: any;

  beforeEach(() => {
    controller = new DataController();
    component1 = new MockComponent();

    // Mock fetch
    global.fetch = vi.fn();
  });

  it('loads data and notifies listeners', async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    controller.register('test-data', component1);
    await controller.load('test-data', 'http://example.com/data.json');

    expect(component1.data).toEqual(mockData);
  });

  it('filters data for subscribers', async () => {
    const mockData = [{ id: 1, val: 10 }, { id: 2, val: 20 }];
    controller.setData('test-data', mockData);

    controller.register('test-data', component1, (d: any) => d.val > 15);

    expect(component1.data).toEqual([{ id: 2, val: 20 }]);
  });

  it('updates existing subscribers when data changes', async () => {
      controller.register('test-data', component1);

      const data1 = [{ id: 1 }];
      controller.setData('test-data', data1);
      expect(component1.data).toEqual(data1);

      const data2 = [{ id: 2 }];
      controller.setData('test-data', data2);
      expect(component1.data).toEqual(data2);
  });

  it('provides initial data on registration', () => {
      const data = [{ id: 1 }];
      controller.setData('test-data', data);

      controller.register('test-data', component1);
      expect(component1.data).toEqual(data);
  });

  it('unregisters components', () => {
      controller.register('test-data', component1);
      controller.unregister('test-data', component1);

      controller.setData('test-data', [{ id: 1 }]);

      component1.data = null;
      controller.setData('test-data', [{ id: 2 }]);
      expect(component1.data).toBeNull();
  });

  it('supports adding and removing named filters', () => {
    const data = [{ id: 1, val: 10 }, { id: 2, val: 20 }, { id: 3, val: 30 }];
    controller.setData('test', data);
    controller.register('test', component1);

    // Initial state: all data
    expect(component1.data).toHaveLength(3);

    // Add filter: val > 15
    controller.addFilter('test', component1, {
        id: 'gt15',
        predicate: (d: any) => d.val > 15
    });

    // Should have 2 and 3
    expect(component1.data).toHaveLength(2);
    expect(component1.data).toEqual([{ id: 2, val: 20 }, { id: 3, val: 30 }]);

    // Remove filter
    controller.removeFilter('test', component1, 'gt15');
    expect(component1.data).toHaveLength(3);
  });

  it('supports AND/OR logic', () => {
      const data = [
          { id: 1, cat: 'A', val: 10 },
          { id: 2, cat: 'B', val: 20 },
          { id: 3, cat: 'A', val: 30 },
          { id: 4, cat: 'B', val: 40 }
      ];
      controller.setData('test', data);
      controller.register('test', component1);

      // Cat A
      controller.addFilter('test', component1, {
          id: 'catA',
          predicate: (d: any) => d.cat === 'A'
      });
      expect(component1.data).toEqual([
          { id: 1, cat: 'A', val: 10 },
          { id: 3, cat: 'A', val: 30 }
      ]);

      // AND val > 20 -> Only id 3
      controller.addFilter('test', component1, {
          id: 'valGt20',
          predicate: (d: any) => d.val > 20,
          operator: 'AND'
      });
      expect(component1.data).toEqual([
          { id: 3, cat: 'A', val: 30 }
      ]);

      // Remove both, add OR logic test
      controller.removeFilter('test', component1, 'catA');
      controller.removeFilter('test', component1, 'valGt20');

      // Cat A OR val > 35
      // Cat A: 1, 3. Val > 35: 4. Result: 1, 3, 4.

      controller.addFilter('test', component1, {
          id: 'catA',
          predicate: (d: any) => d.cat === 'A'
      });
      controller.addFilter('test', component1, {
          id: 'valGt35',
          predicate: (d: any) => d.val > 35,
          operator: 'OR'
      });

      expect(component1.data).toHaveLength(3);
      expect(component1.data).toEqual(expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 3 }),
          expect.objectContaining({ id: 4 })
      ]));
  });

  it('supports data transformation', () => {
      const data = [{ id: 1, val: 10 }, { id: 2, val: 20 }];
      controller.setData('test', data);
      controller.register('test', component1);

      controller.addTransform('test', component1, {
          id: 'double',
          transform: (data: any[]) => data.map(d => ({ ...d, val: d.val * 2 }))
      });

      expect(component1.data).toEqual([{ id: 1, val: 20 }, { id: 2, val: 40 }]);
  });
});
