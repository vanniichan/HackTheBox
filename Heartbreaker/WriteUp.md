Delicate situation alert! The customer has just been alerted about concerning reports indicating a potential breach of their database, with information allegedly being circulated on the darknet market. As the Incident Responder, it's your responsibility to get to the bottom of it. Your task is to conduct an investigation into an email received by one of their employees, comprehending the implications, and uncovering any possible connections to the data breach. Focus on examining the artifacts provided by the customer to identify significant events that have occurred on the victim's workstation.

![image](https://hackmd.io/_uploads/BkJ9jIpogx.png)

# Heartbreaker
## Sherlock info
Name |Heartbreaker
|-|-|
Difficulty| Medium
Category | DFIR|

## Note from Scenario
- Thực hiện tấn công bằng Spearphishing
- Hoạt động liên quan đến Data exfiltration, lây lan 

## Tools use
- XStReader
- chainsaw
- ChatGPT

>### Comment
> Bài này còn nhiều cái hay để phân tích mà lười làm nên trả lời câu hỏi cho đủ rồi thôi :))

# Question 
1. The victim received an email from an unidentified sender. What email address was used for the suspicious emall?
2. It appears there's a link within the emall. Can you provide the complete URL where the malicious binary file was hosted?
3. The threat actor managed to identify the victim's AWS credentials. From which file type did the threat actor extract these credentials?
4. Provide the actual IAM credentials of the victim found within the artifacts.
5. When (UTC) was the malicious binary activated on the victim's workstation?
6. Following the download and execution of the binary file, the victim attempted to search for specific keywords on the internet. What were those keywords?
7. At what time (UTC) did the binary successfully send an Identical malicious emall from the victim's machine to all the contacts?
8. How many recipients were targeted by the distribution of the sald email excluding the victim's emall account?
9. Which legitimate program was utilized to obtain detalls regarding the domain controller?
10. Specify the domain (Including sub-domain If applicable) that was used to download the tool for exfiltration.
11. The threat actor attempted to conceal the tool to elude suspicion. Can you specify the name of the folder used to store and hide the file transfer program?
12. Under which MITRE ATT&CK technique does the action described in question `#11` fall?
13. Can you determine the minimum number of files that were compressed before they were extracted?
14. To exfiltrate data from the victim's workstation, the binary executed a command. Can you provide the complete command used for this action?

# Analysis
## Artifacts
![image](https://hackmd.io/_uploads/Bk0KFbiiee.png)

## Root cause
Như mô tả bài lab ta sẽ tập trung tìm nguyên nhân cốt lõi trước từ việc nạn nhân đã bị Spearphishing

### The sender
Path nơi lưu mail (outlook mail) mà nạn nhân nhận được mail
```
Users/ash.williams/AppData/Local/Microsoft/Outlook/
```

![image](https://hackmd.io/_uploads/BJbspZjsgg.png)

Ta sẽ sử dụng tool có tên là `XstReader` để phân tích file này

![image](https://hackmd.io/_uploads/S1uaGGssex.png)

Một mail đến từ **ImSecretlyYours@proton.me** với nội dung khá khả nghi rằng tải file này để có membership card để vào cửa nhưng khi kiểm tra kỹ thì nó đang trỏ đến 1 IP **44.206.187.144** đồng thời tải file y như [lab tấn công](#Attack-by-Spearphishing-Attachment)

### Social Engineẻr victim 
Khi nạn nhân nhận được mail họ đã tra trên mạng về loại membership card. Ban đầu dùng Edge nhưng bên trong chỉ có mỗi nội dung là tải firefox

![image](https://hackmd.io/_uploads/BkQkirTsgg.png)

Chuyển sang firefox thấy nạn nhân đã tìm hiểu về **Superstar cafe membership**

![image](https://hackmd.io/_uploads/ry5ocH6oge.png)

### IP Hosting
```
http://44.206.187.144:9000/Superstar_MemberCard.tiff.exe
```
![image](https://hackmd.io/_uploads/rk2-4Mjjex.png)

Tra trên VT khi sang tab `Relations` ta thấy được có rất nhiều file độc hại được tải về từ IP này. Lý do nó báo xanh vì nó là IP hosting 

![image](https://hackmd.io/_uploads/ryVm8Moslx.png)

## Malicious file activated
### Event ID Sysmon 1
Sau khi xác định được file mà T.A gửi cho nạn nhân ta sẽ xác định thời gian mà file này được cài và thực thi. Để làm được điều này, tìm đến log `Microsoft-Windows-Sysmon%4Operational.evtx` - **event ID 1 - Process Create**

![image](https://hackmd.io/_uploads/Sy8Ale6jxx.png)

Vào lúc **10:44:46** file này đã được tải về máy, cụ thể hơn sẽ được phân tích [phía dưới](#Event-ID-Sysmon-11). Đồng thời lúc **10:45:02** file này được chạy

![image](https://hackmd.io/_uploads/r1Svlgpslx.png)

Ngoài ra còn có các file khác để ta có thể xác định thời gian ví dụ như `ActivitiesCache.db`
```
/wb-ws-01/C/Users/ash.williams/AppData/Local/ConnectedDevicesPlatform/L.ash.williams/ActivitiesCache.db
```
![image](https://hackmd.io/_uploads/HyjMAJaiel.png)

![image](https://hackmd.io/_uploads/r1HURkToeg.png)

Tuy nhiên `startTime` của `ActivitiesCache.db` thường thể hiện thời điểm hành động được ghi nhận — ví dụ mở ứng dụng, mở/preview file, hoặc tương tác với một item trên Windows Timeline — nhưng không phải lúc nào cũng chính xác là thời gian “file được mở” ở mức filesystem. Do đó nó sẽ lệch vài giây. Có thể tham khả thứ tự ưu tiên [tại đây](https://hackmd.io/@TwentySeV/SkGwNJfSyg)
### Event ID Sysmon 10
Để xem được các ứng dụng mà **Superstar_MemberCard.tiff.exe** cố gắng mở và truy cập process khác. Ta sẽ dùng log **event ID 10 - ProcessAccess** 

```
chainsaw search  -t "Event.System.EventID: =10" /home/kali/Desktop/wb-ws-01/C/Windows/System32/winevt/logs/Microsoft-Windows-Sysmon%4Operational.evtx | grep -i image > logs.txt
```

Lệnh dưới cho ta thấy có 7 events mà các process bị lợi dụng -> **LoLBins**

![image](https://hackmd.io/_uploads/Skhf0r6oel.png)

Danh sách file 

Process | Count | Purpose
--|--|--
winscp.exe | 2| thực hiện file transfer, phân tích [bên dưới](#winscpexe)
gpresult.exe  |1|  hiển thị kết quả áp dụng Group Policy
outlook.exe |1| Lây lan như phân tích [bên dưới](#User-to-User-Spreading)
wmic.exe | 1|query hệ thống từ xa
**nltest.exe**  |1| query và thu thập thông tin về Domain Controller
msmpeng.exe |1| sử dụng Windows Defender (có tehẻ đang muốn bypass AV)

### Event ID Sysmon 11
Ở phần [trên](#Event-ID-Sysmon-1) để chắc chắn hơn việc tải file từ firefox, **Event ID 11 - File Create** sẽ giúp ta

![image](https://hackmd.io/_uploads/BJMIfeajlg.png)

Ngoài ra tại event này cũng thấy có khoảng **30 files** được **Superstar_MemberCard.tiff.exe** tạo ra. Để dễ nhìn hơn, ta dùng `chainsaw`
```
chainsaw search  -t "Event.System.EventID: =11" /home/kali/Desktop/wb-ws-01/C/Windows/System32/winevt/logs/Microsoft-Windows-Sysmon%4Operational.evtx | grep -i image > files.txt
```

Các file đều được tạo ở `Public Files`

![image](https://hackmd.io/_uploads/rkE0tlpsxx.png)

Sử dụng grep để filter
```
cat logs.txt | grep 'Public File'
```

![image](https://hackmd.io/_uploads/Syxjalaoge.png)

Trong đó **26 files** có định dạng `txt`, `docx`, `pdf`,.. chính là tài liệu mà **Superstar_MemberCard.tiff.exe** đang thu thập -> dạng mal stealer 

### Event ID Sysmon 22
Vì **Superstar_MemberCard.tiff.exe** đã sử dụng `winscp.com` nên ta sẽ sử dụng **Event ID 22 - DNSEvent** để xem nó kết nối đến C2 nào vvì hành vi sử dụng tool để tranfer file

```
chainsaw search  -t "Event.System.EventID: =22" /home/kali/Desktop/wb-ws-01/C/Windows/System32/winevt/logs/Microsoft-Windows-Sysmon%4Operational.evtx | grep -i image > files.txt
```

![image](https://hackmd.io/_uploads/ryB0QUTilg.png)

Đọc log và thấy nó đã kết nối đến **us.softradar.com**

![image](https://hackmd.io/_uploads/rktKQU6oee.png)

Vẫn là một [IP hosting](#IP-Hosting)
![image](https://hackmd.io/_uploads/rkPNNIpjxe.png)

![image](https://hackmd.io/_uploads/ByoQ4Laolg.png)

### User-to-User Spreading
Vào lúc **10:47:51** **Superstar_MemberCard.tiff.exe** muốn lan rộng file này nên nó tự gửi mail đính kèm chính nó gửi đến người dùng khác

![image](https://hackmd.io/_uploads/SJRUPSTjge.png)

Với số lượng lên đến **58** người

![image](https://hackmd.io/_uploads/HJgEAdBTjgl.png)

Ngoài ra, tại phần `Draft` ta thấy được T.A đã lấy được credential AWS của nạn nhân do đó đuôi file tại mail này vẫn là **.ost** và key lộ ra là **G/yHFTGQuM6St8SWySj**

![image](https://hackmd.io/_uploads/HJiVwMooex.png)
### winscp.exe
> [winscp.exe](https://winscp.net/eng/docs/introduction) là tool hợp pháp, tiện lợi cho admin nhưng cũng rất hữu dụng cho attacker vì khả năng upload/download mã hoá, scripting, và hoạt động "hợp pháp" dễ né phát hiện

Để cố gắng che giấu tool này bị nghi ngờ T.A đã giấu nó tại thư mục **HelpDesk-Tools** như một công cụ của đội IT-HelpDesk

![image](https://hackmd.io/_uploads/HkIuS8aogl.png)

Đây chính là techique [Masquerading](https://attack.mitre.org/techniques/T1036/) trong Mitre mà T.A đã sử dụng

Sau khi có trung gian vận chuyển, **Superstar_MemberCard.tiff.exe** sẽ lấy data gửi lên winscp. Việc thao tác lệnh sẽ xuất hiện ở **event ID 1 - Process Create**
```
C:\Users\Public\HelpDesk-Tools\WinSCP.com" /script="C:\Users\Public\HelpDesk-Tools\maintenanceScript.txt
```
![image](https://hackmd.io/_uploads/HkkNcLaoll.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
