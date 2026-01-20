from playwright.sync_api import Page, expect, sync_playwright

def verify_vega_lite(page: Page):
    page.goto("http://localhost:5173/")

    # Inject the component and spec
    page.evaluate("""
        const el = document.createElement('vega-lite-component');
        el.style.width = '500px';
        el.style.height = '300px';
        el.style.display = 'block';
        el.spec = {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "description": "A simple bar chart with embedded data.",
          "data": {
            "values": [
              {"a": "A", "b": 28},
              {"a": "B", "b": 55},
              {"a": "C", "b": 43}
            ]
          },
          "mark": "bar",
          "encoding": {
            "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
            "y": {"field": "b", "type": "quantitative"}
          }
        };
        document.body.appendChild(el);
    """)

    # Wait for the visualization to appear
    # vega-embed usually creates a canvas or svg inside the container.
    # Since we are in shadow dom, we need to be careful with selectors.
    # Playwright pierces shadow DOM by default.
    expect(page.locator("vega-lite-component").locator("canvas, svg").first).to_be_visible()

    # Wait a bit for rendering to finish
    page.wait_for_timeout(1000)

    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_vega_lite(page)
        finally:
            browser.close()
