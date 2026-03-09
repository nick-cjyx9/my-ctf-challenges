import threading
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.timestamps = deque()
        self.lock = threading.Lock()

    def allow(self):
        with self.lock:
            now = time.time()
            while self.timestamps and now - self.timestamps[0] > self.period:
                self.timestamps.popleft()
            
            if len(self.timestamps) < self.max_calls:
                self.timestamps.append(now)
                return True
            return False

def get_tag_content(text, tag_name):
    if not text:
        return ""
    tag_upper = tag_name.upper()
    start_tag = f"<{tag_upper}>"
    end_tag = f"</{tag_upper}>"
    upper_text = text.upper()
    start_idx = upper_text.find(start_tag)
    if start_idx == -1:
        return ""
    end_idx = upper_text.rfind(end_tag)
    if end_idx == -1:
        return ""
    return text[start_idx + len(start_tag): end_idx]

class AdminBot:
    def __init__(self, password):
        self.username = "admin"
        self.password = password
        self.rate_limiter = RateLimiter(max_calls=30, period=60)

    def visit(self, target_url):
            
        if not self.rate_limiter.allow():
            print("[-] AdminBot: Rate limit exceeded (30/min)")
            return

        print(f"[*] AdminBot requested to visit: {target_url}")
        thread = threading.Thread(target=self._run_browser, args=(target_url,))
        thread.daemon = True
        thread.start()

    def _run_browser(self, target_url):
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(10)

            try:
                login_url = "http://127.0.0.1:5000/login"
                driver.get(login_url)
                
                username_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.NAME, "username"))
                )
                password_input = driver.find_element(By.NAME, "password")
                submit_btn = driver.find_element(By.TAG_NAME, "button")

                username_input.send_keys(self.username)
                password_input.send_keys(self.password)
                submit_btn.click()

                WebDriverWait(driver, 5).until(
                    lambda d: "login" not in d.current_url
                )
                print("[+] Login successful")

                print(f"[*] Visiting target: {target_url}")
                driver.get(target_url)
                time.sleep(5)
                print("[+] Visit complete")
                
            except Exception as e:
                print(f"[-] Bot Error during execution: {e}")
            finally:
                try:
                    driver.quit()
                except Exception:
                    pass
        except Exception as e:
            print(f"[-] Bot Setup Error: {e}")
