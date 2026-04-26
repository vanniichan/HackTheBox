![image](https://hackmd.io/_uploads/SyiGSmi6-l.png)
An APT group is using Hajj-themed phishing lures to target and steal WhatsApp data from government and diplomatic officials. Our team has gathered fragmented intelligence from public cybersecurity vendor reports, blog posts, and internal security alerts. Your task is to build a comprehensive profile of the threat actor responsible. You must connect the dots between different reports to answer questions about their identity, tools, and motives
# FortySeven-1
## Sherlock info
Name |FortySeven-1
|-|-|
Difficulty| Very Easy
Category | Threat Intelligent|
## Note from Scenario
Một số tatics & techique thu được từ các bài viết bên dưới:
- **Initial Access**
	+ **Spearphishing Attachment**: nhắm vào các khu vực apac 
	+ **Exploit Public-Facing Application**: khai thác bằng các CVE-2023–38831, CVE-2017-11882
- **Execution**
	+ **Command and Scripting Interpreter**: Sử dụng cả cmd và powershell
	+ **System Binary Proxy Execution**: Sử dụng file `.chm` có payload
	+ **Scheduled Task**: Tạo task để tạo file thực thi hoặc tải payload
- **Persistence**
	+ **Scheduled Task**: Tạo task giả danh "`Microsoft Update`" và một task kích hoạt dựa trên sự kiện thay đổi cấu hình mạng
	+ **Boot or Logon Autostart Execution**: Tạo shortcut của file thực thi và đặt vào folder `Startup`
	+ **Hijack Execution Flow: DLL Side-Loading**: Sử dụng kỹ thuật "Black-and-White". Nhóm sử dụng file thực thi hợp lệ(white file) để load `.dll` độc (black file)
- **Defense Evasion**
	+ **Obfuscated Files or Information**
	+ **Virtualization/Sandbox Evasion**: Kiểm tra môi trường Sandbox bằng cách đếm số lượng process đang chạy (nếu < 40 thì tự thoát)
	+ **Process Injection: Reflective PE Loading**: Sử dụng kỹ thuật Reflective loading (MemLoader HidenDesk, MemLoader Edge)
- **Discovery**
	+ **System Information Discovery**
	+ **Process Discovery**
- **Collection**
	+ **Email/Message Collection**: Mục tiêu WhatsApp
- **Command and Control**
	+ **Application Layer Protocol**: Giao tiếp với C2 qua HTTP/HTTPS
	+ **Ingress Tool Transfer**: Tận dụng các tool quản trị có sẵn trên Windows như `curl` hay `certutil` để tải lén các file bổ sung
- **Exfiltration**
	+ Exfiltration Over C2 Channel
# References
https://securelist.com/mysterious-elephant-apt-ttps-and-tools/117596/

https://medium.com/@knownsec404team/apt-k-47-mysterious-elephant-a-new-apt-organization-in-south-asia-5c66f954477

https://medium.com/@knownsec404team/unveiling-the-past-and-present-of-apt-k-47-weapon-asyncshell-5a98f75c2d68
# Q&A
1. What is the primary name of the APT group described in the SecureList report?
:::spoiler
Mysterious Elephant
:::
2. According to the Knownsec 404 team's analysis(Evidence -3), since which year has this group's attack activity been dated back to?
:::spoiler
2022
:::
3. The group uses a custom backdoor that communicates via Office Remote Procedure Call (ORPCBackdoor). According to the Knownsec 404 team's analysis(Evidence -2), what is the name of the first malicious exported entry function?
:::spoiler
GetFileVersionInfoByHandleEx(void)
:::
4. The previously mentioned backdoor checks for a file before creating persistence. What is the name of the file?
:::spoiler
ts.dat
:::
5. The use of the backdoor links the APT to another well-known South Asian APT group. What is the name of this other group?
:::spoiler
Bitter
:::
6. The APT group we are currently investigating has consistently used and updated another backdoor since 2023, with its C2 communication evolving from TCP to HTTPS. What is the name of this tool?
:::spoiler
Asyncshell-v2
:::
7. To evade sandbox analysis, the MemLoader HidenDesk tool checks the number of active processes before running. What is the minimum number of processes required for it to proceed?
:::spoiler
40
:::
8, The MemLoader HidenDesk tool creates a covert environment for its activities by creating and switching to a specific environment. What is the name of this hidden desktop?
:::spoiler
MalwareTech_Hidden
:::
9. The MemLoader HidenDesk tool achieves persistence by placing a shortcut in the autostart folder to ensure it runs after a system reboot. What is the MITRE ATT&CK ID for the 'Registry Run Keys / Startup Folder' technique?
:::spoiler
T1547.001
:::
10. The actor uses several custom exfiltration tools targeting WhatsApp. What is the name of the tool that recursively searches specific directories, including the “Desktop” and “Downloads” folders?
:::spoiler
Stom Exfiltrator
:::
11. Kaspersky's analysis highlights the actor's heavy use of scripts for execution and deploying payloads. What is the MITRE ATT&CK ID for the 'PowerShell' technique?
:::spoiler
T1059.001
:::
12. In their early attack chains, Mysterious Elephant used a downloader that was previously associated with the Origami Elephant group. What was the name of this downloader?
:::spoiler
Vtyrei
:::
13. In a January 2024 campaign delivering an Asyncshell payload, which CVE was exploited in the malicious archive file?
:::spoiler
CVE-2023-38831
:::
14. What is the MD5 hash of the ChromeStealer Exfiltrator sample named WhatsAppOB.exe?
:::spoiler
9e50adb6107067ff0bab73307f5499b6
:::
15. The intelligence describes multiple custom tools designed to upload stolen data to the actor's servers. According to the MITRE ATT&CK framework, what is the ID for the 'Exfiltration Over C2 Channel' technique?
:::spoiler
T1041
:::
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/SJqZSXo6-e.png)
