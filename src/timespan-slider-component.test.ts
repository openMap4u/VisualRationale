import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimespanSliderComponent } from './timespan-slider-component';
import { DataController } from './data-controller';
import { DataConsumer } from './data-consumer';

// Mock DataController (we only need the methods we use)
class MockDataController {
  updateFilter = vi.fn();
  removeFilter = vi.fn();
}

// Mock DataConsumer
class MockDataConsumer implements DataConsumer {
  data: any[] | null = null;
}

describe('TimespanSliderComponent', () => {
  let slider: TimespanSliderComponent;
  let controller: MockDataController;
  let consumer: MockDataConsumer;

  beforeEach(async () => {
    // Register component if not already registered
    if (!customElements.get('timespan-slider-component')) {
        try {
            // It might be already imported via index.ts in other tests or real app
            // But we need to make sure the class is defined.
            // Since we import the class directly, we can define it.
             customElements.define('timespan-slider-component', TimespanSliderComponent);
        } catch (e) {
            // ignore if already defined
        }
    }

    slider = new TimespanSliderComponent();
    controller = new MockDataController();
    consumer = new MockDataConsumer();

    slider.controller = controller as unknown as DataController;
    slider.dataset = 'test-dataset';
    slider.targets = [consumer];
    slider.min = 0;
    slider.max = 100;
    slider.start = 10;
    slider.end = 90;

    document.body.appendChild(slider);
    await slider.updateComplete;
  });

  afterEach(() => {
    if (slider.isConnected) {
        document.body.removeChild(slider);
    }
  });

  it('renders correctly', () => {
    const inputs = slider.shadowRoot?.querySelectorAll('input[type="range"]');
    expect(inputs?.length).toBe(2);
  });

  it('updates target filters when start input changes', async () => {
    const inputs = slider.shadowRoot?.querySelectorAll('input[type="range"]');
    const startInput = inputs![0] as HTMLInputElement;
    expect(startInput).toBeTruthy();

    startInput.value = '20';
    startInput.dispatchEvent(new Event('input'));
    await slider.updateComplete;

    expect(slider.start).toBe(20);
    expect(controller.updateFilter).toHaveBeenCalledWith('test-dataset', consumer, expect.objectContaining({
        id: 'timespan-filter'
    }));

    // Check predicate
    const filterCall = controller.updateFilter.mock.calls[0];
    const filter = filterCall[2];
    // Check if predicate works
    expect(filter.predicate({ timestamp: 20 })).toBe(true);
    expect(filter.predicate({ timestamp: 10 })).toBe(false); // < 20
    expect(filter.predicate({ timestamp: 90 })).toBe(true);
    expect(filter.predicate({ timestamp: 91 })).toBe(false); // > 90
  });

  it('updates target filters when end input changes', async () => {
    const inputs = slider.shadowRoot?.querySelectorAll('input[type="range"]');
    const endInput = inputs![1] as HTMLInputElement;
    expect(endInput).toBeTruthy();

    endInput.value = '80';
    endInput.dispatchEvent(new Event('input'));
    await slider.updateComplete;

    expect(slider.end).toBe(80);
    expect(controller.updateFilter).toHaveBeenCalled();
  });

  it('enforces min <= max constraints (start <= end)', async () => {
      // Set start > current end (90)
      const inputs = slider.shadowRoot?.querySelectorAll('input[type="range"]');
      const startInput = inputs![0] as HTMLInputElement;

      startInput.value = '95';
      startInput.dispatchEvent(new Event('input'));
      await slider.updateComplete;

      // Start should be capped at end (90)
      expect(slider.start).toBe(90);
      expect(startInput.value).toBe('90');
  });
});
