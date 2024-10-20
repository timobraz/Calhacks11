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
                selected_element.click(button=2)

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
        from selenium.webdriver.common.by import By
        import re

        # Set reasonable thresholds
        HREF_LENGTH_THRESHOLD = 100  # Max length of href to include
        TAG_LENGTH_THRESHOLD = 500  # Max length of outer HTML to consider
        elements_data = []

        # Regex to detect base64 data
        base64_pattern = re.compile(r"data:\s*image\/[^;]+;base64,")

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
            return self.driver.execute_script(
                """
                var elem = arguments[0];
                var rect = elem.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            """,
                element,
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

        # 1. Extract all links with href shorter than the threshold
        links = self.driver.find_elements(By.TAG_NAME, "a")
        for link in links:
            try:
                if not is_valid_element(link, "link"):
                    continue
                href = link.get_attribute("href")
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
        inputs = self.driver.find_elements(By.TAG_NAME, "input")
        for input_elem in inputs:
            try:
                placeholder = input_elem.get_attribute("placeholder") or ""
                if not placeholder.strip():
                    continue
                if not is_valid_element(input_elem, "input"):
                    continue
                # Collect attributes
                attributes = self.driver.execute_script(
                    """
                    var items = {}; 
                    var attrs = arguments[0].attributes;
                    for (var i = 0; i < attrs.length; i++) {
                        items[attrs[i].name] = attrs[i].value;
                    }
                    return items;
                """,
                    input_elem,
                )
                attributes["placeholder"] = placeholder.strip()
                # Exclude inputs with attributes longer than the threshold
                attr_length = sum(
                    len(str(k)) + len(str(v)) for k, v in attributes.items()
                )
                if attr_length > TAG_LENGTH_THRESHOLD:
                    continue
                elements_data.append(
                    {
                        "type": "input",
                        "attributes": attributes,
                    }
                )
            except Exception:
                continue

        # 3. Extract all visible buttons with text
        buttons = self.driver.find_elements(By.TAG_NAME, "button")
        for button in buttons:
            try:
                if not is_valid_element(button, "button"):
                    continue
                # Collect attributes
                attributes = self.driver.execute_script(
                    """
                    var items = {}; 
                    var attrs = arguments[0].attributes;
                    for (var i = 0; i < attrs.length; i++) {
                        items[attrs[i].name] = attrs[i].value;
                    }
                    return items;
                """,
                    button,
                )
                # Exclude buttons with attributes longer than the threshold
                attr_length = sum(
                    len(str(k)) + len(str(v)) for k, v in attributes.items()
                )
                if attr_length > TAG_LENGTH_THRESHOLD:
                    continue
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
                # Collect attributes
                attributes = self.driver.execute_script(
                    """
                    var items = {}; 
                    var attrs = arguments[0].attributes;
                    for (var i = 0; i < attrs.length; i++) {
                        items[attrs[i].name] = attrs[i].value;
                    }
                    return items;
                """,
                    elem,
                )
                # Exclude elements with attributes longer than the threshold
                attr_length = sum(
                    len(str(k)) + len(str(v)) for k, v in attributes.items()
                )
                if attr_length > TAG_LENGTH_THRESHOLD:
                    continue
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
