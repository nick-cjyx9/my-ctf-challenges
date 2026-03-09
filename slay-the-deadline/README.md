# Slay The Deadline - CTF Challenge

## Overview

A Flask-based Todo application with a hidden vulnerability in its content extraction logic and Unicode handling.

## Vulnerability

The application stores todos as raw XML-like strings.
The `get_tag_content` function (used to display todo content) calculates indices on the UPPERCASE version of the string but slices the ORIGINAL string.
Certain Unicode characters (like [`ß`](https://symbl.cc/cn/00DF/) ) expand when converted to uppercase (`SS`), causing the slice indices to shift. I gain this idea from <https://iter.ca/p/ctf/dctf22-blazingfast/>
This desync allows an attacker to read past the intended content boundary.

## Exploit Chain

1. **XSS via Username**:
    * The application does not sanitize usernames during registration.
    * Usernames are stored in the `<author>` tag, located *after* the content in the raw string.
    * By creating a todo with many `ß` characters, the `get_tag_content` function overshoots the content and includes the `<author>` tag in the output.
    * Since the output is rendered with `|safe`, the malicious username (containing `<script>`) executes XSS.

2. **CSRF to Modify Admin Todo**:
    * The XSS payload forces the Admin (simulated via `/report`) to send a POST request to `/edit/<admin_todo_id>`.
    * This request modifies the Admin's "Flag Todo" content to include a Unicode payload (`ß` chain).

3. **Flag Leak**:
    * The Admin's todo contains a `<flag>` tag *after* the content.
    * When the Admin views their own modified todo (triggered by the attacker via XSS/CSRF or just by the nature of the bot), the `get_tag_content` function overshoots and includes the `<flag>` tag in the rendered page.
    * The XSS payload can then read the page content (containing the flag) and exfiltrate it to the attacker.

## Running

1. Run the application: `docker-compose up --build`
2. Access at `http://127.0.0.1:5000`

## Admin Bot

The challenge includes a built-in admin bot that simulates an admin user visiting shared todos.
In `utils.py`, the `AdminBot` class uses Selenium (if available) or simply prints the URL (if not).
The Docker container includes Chromium and Chromedriver to support the full exploit chain.
**Note:** The bot is rate-limited to 30 visits per minute.

## Exploit

A proof-of-concept exploit script is provided in `exp.py`.
Usage: `python solution/exp.py http://127.0.0.1:5000`
