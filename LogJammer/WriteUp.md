![image](https://hackmd.io/_uploads/rJUyH9p5Zl.png)

Bạn đã được trao cơ hội làm việc với vai trò Junior DFIR Consultant cho một công ty tư vấn lớn. Công ty tư vấn Forela-Security muốn đánh giá kiến thức của bạn về phân tích Windows Event Log. Chúng tôi tin rằng người dùng Cyberjunkie đã đăng nhập vào máy tính của mình và có thể đã thực hiện các hành vi độc hại. Hãy phân tích các event log được cung cấp và báo cáo lại

# LogJammer
## Sherlock info
Name |LogJammer
|-|-|
Difficulty| Easy
Category | DFIR|

## Note from Scenario
Cuộc xâm nhập bắt đầu vào lúc `14:37:09` ngày `27/03/2023`, khi user `cyberjunkie` thực hiện logon vào hệ thống. Chỉ ít phút sau, attacker bắt đầu tải tool SharpHound về `Downloads`. Tuy nhiên Windows Defender đã phát hiện và cách ly thành công tool. Attacker chuyển hướng sang làm yếu hàng phòng thủ cách thêm rule firewall tên là `Metasploit C2 Bypass`, cho phép dữ liệu từ máy nạn nhân gửi ra ngoài (`Outbound`) tới C2. Attacker tiến hành can thiệp sâu hơn bằng cách thay đổi các Audit Policy. Ngay sau đó, là tạo Persistence bằng cách tạo Task Scheduler chạy file script `Automation-HTB.ps1` hàng ngày. Cuối cùng, để xóa bỏ dấu vết về những thay đổi bất thường trên firewall, lúc `15:01:56`, attacker đã thực hiện lệnh xóa log của nó

## Tools use
- Event Viewer
- ChatGPT

>### Comment
> CDSA Preparation path

# Question 
1. When did the cyberjunkie user first successfully log into his computer? (UTC)
2. The user tampered with firewall settings on the system. Analyze the firewall event logs to find out the Name of the firewall rule added?
3. Whats the direction of the firewall rule?
4. The user changed audit policy of the computer. Whats the Subcategory of this changed policy?
5. The user "cyberjunkie" created a scheduled task. Whats the name of this task?
6. Whats the full path of the file which was scheduled for the task?
7. What are the arguments of the command?
8. The antivirus running on the system identified a threat and performed actions on it. Which tool was identified as malware by antivirus?
9. Whats the full path of the malware which raised the alert?
10. What action was taken by the antivirus?
11. The user used Powershell to execute commands. What command was executed by the user?
12. We suspect the user deleted some event logs. Which Event log file was cleared?
# Analysis
## Security.evtx
Dựa trên log `Security.evtx`, ta có thể xác định lần đăng nhập đầu tiên của user `cyberjunkie` tại Event ID `4624` lúc `3/27/2023 2:37:09 PM`
![image](https://hackmd.io/_uploads/HJo0YCRqZl.png)
> Từ mốc thời gian của event này, ta có thể xem đây là thời điểm bắt đầu đáng nghi và sử dụng làm mốc để khoanh vùng khoảng thời gian mà attacker có thể đã xâm nhập và thực hiện các hoạt động trên hệ thống

Vào thời điểm `3/27/2023 2:50:03 PM`, attacker đã sửa Policy trên máy 
![image-1](https://hackmd.io/_uploads/BJJg5R09We.png)
Cũng từ log này, ta phát hiện attacker đã tạo một Task Schedule (Event ID `4698`) vào lúc` 3/27/2023 2:51:21 PM`
![image-2](https://hackmd.io/_uploads/S19lcAR5-x.png)
Task này được lập lịch chạy hàng ngày file `.ps1` tại path  `C:\Users\CyberJunkie\Desktop\Automation-HTB.ps1` với option `A cyberjunkie@hackthebox.eu`. Để xem nội dung và mục đích của file này, ta sẽ tìm hiểu ở phần log [Powershell-Operational.evtx](#Powershell-Operational.evtx)
![image-3](https://hackmd.io/_uploads/ryMWqCCqZg.png)
## Windows Firewall-Firewall.evtx
Bắt đầu từ thời điểm user `cyberjunkie` đăng nhập, nhiều hành vi thêm, sửa, xóa rule trong Windows Firewall đã xuất hiện (Event ID `2004`)

Trong số này, một rule đáng chú ý mà attacker thêm là `Metasploit C2 Bypass` vào lúc `3/27/2023 2:44:43 PM`: 
- `Direction`: `Outbound`
- `Action`: `Allow`

![image-4](https://hackmd.io/_uploads/B19-5CAcZe.png)
Điều này có nghĩa là firewall không chặn các kết nối gửi dữ liệu ra ngoài, tạo điều kiện cho attacker liên lạc với C2
## Windows Defender-Operational.evtx
Để trả lời cho câu hỏi AV đã bắt được file mã độc nào, ta sẽ dựa vào thời gian attacker vào máy và Event ID `1116`
![image-5](https://hackmd.io/_uploads/S17zc0Cq-l.png)
Attacker đã tải mã độc có tên là `SharpHound` về `C:\Users\CyberJunkie\Downloads\`
> SharpHound là tool recon thông ti n Active Directory để vẽ được sơ đồ mối quan hệ, quyền hạn và đường đi tấn công từ đó xác định các user, group, server, và mối liên hệ giữa chúng

Vào lúc `3/27/2023 2:42:34 PM` Windows Defender đã detect và ngay sau đó file tool này đã được cách ly (`Quarantine`)
![image-6](https://hackmd.io/_uploads/Sy2GcCRqZg.png)
## Powershell-Operational.evtx
Như đã nói ở trên, attacker đã cho chạy file `Automation-HTB.ps1`, bây giờ ta sẽ xem log Powershell để biết nội dung và hành vi của file này. Sau khi rà một lượt lại chỉ thấy attacker chạy lệnh kiểm tra file hash của script này
```
Get-FileHash -Algorithm md5 .\Desktop\Automation-HTB.ps1
```
## System.evtx
Xem được event clear log, ta thường sẽ kiểm tra Event ID `1102` tại `Security` log hoặc Event ID `104` tại `System` log. Tuy nhiên log tại `Security` log lại không cho ra loại log nào bị xóa
![image-7](https://hackmd.io/_uploads/BkfXqRCcWx.png)
Tại `System` log ta thấy được vào lúc `3/27/2023 3:01:56 PM` file log `Microsoft-Windows-Windows Firewall With Advanced Security/Firewall ` đã bị xóa
![image-8](https://hackmd.io/_uploads/rkdQ50Cq-l.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/ryWD5RAcWe.png)
