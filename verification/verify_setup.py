from playwright.sync_api import sync_playwright

def verify(page):
    page.goto("http://localhost:5173/")
    # Wait for the element to be visible
    page.wait_for_selector("my-element")
    # Take screenshot
    page.screenshot(path="verification/verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify(page)
    browser.close()
