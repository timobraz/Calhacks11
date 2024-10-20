import urllib.parse
from typing import Optional

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options


class SeleniumDriver:
    def __init__(self):
        # Set up Chrome options for headless browsing
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        # Initialize the WebDriver with headless options
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.set_window_size(1440, 1080)
        self.driver.get("https://www.google.com")

    def get(self, url: str):
        self.driver.get(url)

    def wait_until_loaded(self):
        def page_has_loaded(driver):
            return driver.execute_script("return document.readyState") == "complete"

        WebDriverWait(self.driver, 10).until(page_has_loaded)

    def save_screenshot(self, path: str):
        self.driver.save_screenshot(path)

    def reset(self):
        self.driver.quit()
        self.driver = webdriver.Chrome()
        self.driver.set_window_size(1440, 1080)
        self.driver.get("https://www.google.com")

    def click(self, selector: str, mouse_action: str, text: Optional[str]):
        if selector == "string" and text:
            # Find the first clickable element matching the text
            elements = self.driver.find_elements(
                By.XPATH, f"//*[contains(text(), '{text}')]"
            )
            selected_element = None
            for element in elements:
                if element.is_displayed() and element.is_enabled():
                    selected_element = element
                    break
        else:
            elements = self.driver.find_elements(By.XPATH, selector)
            selected_element = None
            if text:
                for element in elements:
                    if text in element.text:
                        selected_element = element
                        break
            else:
                if elements:
                    selected_element = elements[0]

        if selected_element:
            if mouse_action == "left_click":
                selected_element.click()
            elif mouse_action == "right_click":
                actions = webdriver.ActionChains(self.driver)
                actions.context_click(selected_element).perform()

    def input(self, selector: str, value: str):
        element = self.driver.find_elements(By.XPATH, selector)[0]
        element.clear()
        element.send_keys(value)

    def scroll(self, direction: str, amount: str):
        if direction == "up":
            scroll_value = f"-{amount}"
        else:
            scroll_value = amount
        self.driver.execute_script(f"window.scrollBy(0, {scroll_value});")

    def wait(self, duration: float):
        self.driver.implicitly_wait(duration / 1000.0)

    def search_google(self, query: str):
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.google.com/search?q={encoded_query}"
        self.driver.get(url)
        self.wait_until_loaded()

    def extract_significant_elements(self):
        """
        Function: extract_significant_elements

        Extracts specific elements from a webpage based on the given criteria:
        - All links with href shorter than a threshold and containing text.
        - All visible inputs with placeholder text.
        - All visible buttons with text.
        - All visible clickable items with text.
        - Excludes any elements off the page or without text.
        - Excludes any base64 data.
        """
        import re
        from selenium.webdriver.common.by import By

        # Set reasonable thresholds
        HREF_LENGTH_THRESHOLD = 100  # Max length of href to include
        TAG_LENGTH_THRESHOLD = 500  # Max length of outer HTML to consider
        elements_data = []

        # Precompile regex to detect base64 data
        base64_pattern = re.compile(r"data:\s*image\/[^;]+;base64,")

        # Get viewport dimensions once to improve performance
        viewport_width = self.driver.execute_script("return window.innerWidth;")
        viewport_height = self.driver.execute_script("return window.innerHeight;")

        # Helper function to check if element contains base64 data
        def contains_base64(element):
            outer_html = element.get_attribute("outerHTML")
            return bool(base64_pattern.search(outer_html))

        # Helper function to check if element has visible text
        def has_text(element):
            text = element.text.strip()
            return len(text) > 0

        # Helper function to check if element is within the viewport
        def is_in_viewport(element):
            rect = element.rect
            return (
                rect["width"] > 0
                and rect["height"] > 0
                and rect["x"] >= 0
                and rect["y"] >= 0
                and rect["x"] + rect["width"] <= viewport_width
                and rect["y"] + rect["height"] <= viewport_height
            )

        # Helper function to check if element is valid based on type
        def is_valid_element(element, element_type):
            base_checks = (
                element.is_displayed()
                and not contains_base64(element)
                and is_in_viewport(element)
            )
            if element_type == "input":
                placeholder = element.get_attribute("placeholder") or ""
                return base_checks and placeholder.strip()
            else:
                return base_checks and has_text(element)

        # Common function to collect attributes without exceeding the length threshold
        def collect_attributes(element):
            attributes = self.driver.execute_script(
                """
                var items = {}; 
                var attrs = arguments[0].attributes;
                for (var i = 0; i < attrs.length; i++) {
                    items[attrs[i].name] = attrs[i].value;
                }
                return items;
            """,
                element,
            )
            attr_length = sum(len(str(k)) + len(str(v)) for k, v in attributes.items())
            if attr_length > TAG_LENGTH_THRESHOLD:
                return {}
            return attributes

        # 1. Extract all links with href shorter than the threshold
        links = self.driver.find_elements(By.TAG_NAME, "a")
        for link in links:
            try:
                if not is_valid_element(link, "link"):
                    continue
                href = link.get_attribute("href")
                if not href or href.strip() == "":
                    # Try to get href from data-href or onclick attributes
                    href = link.get_attribute("data-href") or ""
                    if not href.strip():
                        onclick = link.get_attribute("onclick") or ""
                        if onclick.strip():
                            href = f"javascript:{onclick.strip()}"
                if href and len(href) <= HREF_LENGTH_THRESHOLD:
                    elements_data.append(
                        {
                            "type": "link",
                            "text": link.text.strip(),
                            "href": href.strip(),
                        }
                    )
            except Exception:
                continue

        # 2. Extract all visible inputs with placeholder text
        inputs = self.driver.find_elements(By.XPATH, "//input[@placeholder]")
        for input_elem in inputs:
            try:
                if not is_valid_element(input_elem, "input"):
                    continue
                attributes = collect_attributes(input_elem)
                if attributes:
                    elements_data.append(
                        {
                            "type": "input",
                            "attributes": attributes,
                        }
                    )
            except Exception:
                continue

        # 3. Extract all visible buttons with text
        buttons = self.driver.find_elements(
            By.XPATH, "//button[normalize-space(text())!='']"
        )
        for button in buttons:
            try:
                if not is_valid_element(button, "button"):
                    continue
                attributes = collect_attributes(button)
                if attributes:
                    elements_data.append(
                        {
                            "type": "button",
                            "text": button.text.strip(),
                            "attributes": attributes,
                        }
                    )
            except Exception:
                continue

        # 4. Extract all visible clickable items with text
        clickable_elements = self.driver.find_elements(
            By.XPATH, "//*[@onclick or @role='button' or @role='link']"
        )
        for elem in clickable_elements:
            try:
                if not is_valid_element(elem, "clickable"):
                    continue
                attributes = collect_attributes(elem)
                if attributes:
                    elements_data.append(
                        {
                            "type": "clickable",
                            "tag": elem.tag_name.lower(),
                            "text": elem.text.strip(),
                            "attributes": attributes,
                        }
                    )
            except Exception:
                continue

        return elements_data
