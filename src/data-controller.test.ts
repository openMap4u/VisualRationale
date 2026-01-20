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
});
