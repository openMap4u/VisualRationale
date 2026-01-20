from playwright.sync_api import Page, expect, sync_playwright

def verify_chart(page: Page):
    page.goto("http://localhost:5173/")

    # Wait for the component to be present
    chart = page.locator("#chart")
    expect(chart).to_be_visible()

    # Wait for canvas (Vega renders to canvas or svg, usually canvas by default in vega-embed unless specified)
    # vega-embed usually creates a wrapper div inside.
    # We can check if the canvas exists inside #chart

    # Wait a bit for rendering
    page.wait_for_timeout(2000)

    # Take screenshot
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_chart(page)
        finally:
            browser.close()
