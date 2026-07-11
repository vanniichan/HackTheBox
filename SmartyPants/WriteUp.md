![image](https://hackmd.io/_uploads/BkAYEeAXMg.png)
CTO của Forela, `Dutch`, lưu trữ các file quan trọng trên một hệ thống Windows riêng biệt vì domain environment của Forela thường xuyên bị xâm nhập do phải tiếp xúc với nhiều ngành công nghiệp khác nhau. Vào ngày 24 tháng 01 năm 2025, điều tồi tệ nhất mà chúng tôi lo ngại đã trở thành hiện thực khi một attacker truy cập vào file server, cài đặt các tiện ích để hỗ trợ hoạt động của chúng, đánh cắp các file quan trọng, sau đó xóa chúng khiến việc khôi phục không còn khả thi. Nhóm đã ngay lập tức được thông báo về hành vi tống tiền của những attacker, và hiện chúng đang yêu cầu một khoản tiền chuộc. Trong khi nhóm pháp lý của chúng tôi xử lý tình huống này, chúng ta cần nhanh chóng tiến hành triage (đánh giá, phân loại ban đầu sự cố) để xác định phạm vi và mức độ ảnh hưởng của vụ việc. Ghi chú từ quản lý: Vài ngày trước, theo khuyến nghị từ một nghiên cứu về an ninh mạng, chúng tôi đã bật `SmartScreen` Debug Logs trên toàn bộ các máy nhằm tăng cường khả năng quan sát. Các event này có thể cung cấp những thông tin ban đầu một cách nhanh chóng, vì vậy hãy đảm bảo chúng được khai thác và sử dụng trong quá trình điều tra
# SmartyPants
## Sherlock info
Name |SmartyPants
|-|-|
Difficulty| Very Easy
Category | DFIR 
## Note from Scenario
Attacker đã xâm nhập vào máy chủ `CTO-FILESVR` thông qua RDP với tài khoản `Dutch`. Sau khi giành được quyền truy cập, attacker sử dụng trình duyệt trên hệ thống để tải xuống và triển khai các công cụ phục vụ cho mục đích thu thập, tìm kiếm và xử lý dữ liệu. Tiếp đó, attacker sử dụng công cụ tìm kiếm file để rà soát hệ thống, xác định và truy cập vào các tài liệu có giá trị, bao gồm những tài liệu liên quan đến hoạt động nội bộ và thông tin nhạy cảm. Sau khi thu thập được dữ liệu mục tiêu, attacker triển khai một ứng dụng lưu trữ đám mây nhằm chuyển các file ra khỏi hệ thống nạn nhân, thực hiện hành vi đánh cắp dữ liệu. Cuối cùng, để giảm khả năng phát hiện và ngăn cản quá trình điều tra, attacker tiến hành các hoạt động xóa dữ liệu và xóa dấu vết trên hệ thống
## Artifacts
Ta được cung cấp thuần các file event log:
![image](https://hackmd.io/_uploads/HJ-J_gCmzl.png)
## Tools use
- Timeline Explorer
- EvtxECmd

>### Comment
> Đây là bài thực hành sau khi đọc blog sử dụng smartscreen log để tìm ra các hành vi của người dùng. Tham khảo bài tại đây: hackthebox.com/blog/smartscreen-logs-evidence-execution

# Question
1. The attacker logged in to the machine where Dutch saves critical files, via RDP on 24th January 2025. Please determine the timestamp of this login.
2. The attacker downloaded a few utilities that aided them for their sabotage and extortion operation. What was the first tool they downloaded and installed?
3. They then proceeded to download and then execute the portable version of a tool that could be used to search for files on the machine quickly and efficiently. What was the full path of the executable?
4. What is the execution time of the tool from task 3?
5. The utility was used to search for critical and confidential documents stored on the host, which the attacker could steal and extort the victim. What was the first document that the attacker got their hands on and breached the confidentiality of that document?
6. Find the name and path of second stolen document as well.
7. The attacker installed a Cloud utility as well to steal and exfiltrate the documents. What is name of the cloud utility?
8. When was this utility executed?
9. The Attacker also proceeded to destroy the data on the host so it is unrecoverable. What utility was used to achieve this?
10. The attacker cleared 2 important logs, thinking they covered all their tracks. When was the security log cleared?
# Analysis
Vì lượng event rất lớn, ta sẽ sử dụng `EvtxECmd` đểp parse log, hỗ trợ map các event và dùng `Timeline Explorer` cho tiện
```
EvtxECmd.exe -d "C:\Users\DELL\Desktop\Logs" --csv "C:\Users\DELL\Desktop\Logs\a" --csvf combinedLogs
```
## 1. The attacker logged in to the machine where Dutch saves critical files, via RDP on 24th January 2025. Please determine the timestamp of this login
Câu hỏi cho ta thông tin rất rõ ràng để for
- Login bằng RDP -> `Security Log` + `Event ID 4624` + `Logon type 10`
- 24th January 2025 -> `24/01/2025`

Lỏ cái là không có event này trong event log :))
![image](https://hackmd.io/_uploads/SJctLmyVfl.png)
Tuy nhiên thì vẫn còn 1 hy vọng ở event log `Microsoft-Windows-TerminalServices-RemoteConnectionManager%4Operational.evtx`:
- Login bằng RDP -> `RemoteConnectionManager` + `Event ID 1149`
- 24th January 2025 -> `24/01/2025`

![image](https://hackmd.io/_uploads/H1DrF7J4Ge.png)
Duy nhất 1 phiên remote vào máy từ user `Dutch` với máy `CTO-FILESVR` vào lúc `2025-01-24 10:15:14`
## 2. The attacker downloaded a few utilities that aided them for their sabotage and extortion operation. What was the first tool they downloaded and installed?
Hành vi download file về sẽ được record thông qua 1 số source event log sau:
- Application.evtx
- Microsoft-Windows-PowerShell
- Sysmon
- Microsoft-Windows-Bits-Client
- Microsoft-Windows-SmartScreen%4Debug

Sau khi phân tích các source:
- **Application**: Chỉ có duy nhất 1 event (`1033`) nhưng lại là event cập nhật Windows
![image](https://hackmd.io/_uploads/H1gnsX14Mx.png)
- **Sysmon**: Máy không cài log Sysmon
- **PowerShell**: Không ghi nhận event `4104`
- **Bits**: Các event (`59`, `60`, `61`) đều là cập nhật Edge
![image](https://hackmd.io/_uploads/S1j0nQyNzl.png)
- **SmartScreen**: Filter contain `path` vì nó chứa các file được thực thi. Sort theo time để tìm ra first tool
![image](https://hackmd.io/_uploads/HyOGe4JVze.png)

> Log `SmartScreen` được record khi:
>+ file có nguồn gốc từ Internet
>+ người dùng sử dụng Microsoft Edge (hoặc các ứng dụng sử dụng bộ API của Windows) để tải, đọc file
>+ sử dụng ứng dụng UWP (Universal Windows Platform)

Mà attacker đang sử dụng Edge (bằng chứng ở việc log đầu tiên đã record) cho việc đọc và tải file. Nên ta có thể dựa vào đây để điều tra:
![image](https://hackmd.io/_uploads/SkQejSJEMe.png)
Confirm lại bằng `Event ID 4688` tại `Security` log
![image](https://hackmd.io/_uploads/H1mEyUkEfg.png)
Không có log trong thười điểm đó :)). Cứ như bị xóa
## 3. They then proceeded to download and then execute the portable version of a tool that could be used to search for files on the machine quickly and efficiently. What was the full path of the executable?
Câu hỏi này có thể đoán nhanh được đó là `Everything` vì:
- used to search for files
- quickly and efficiently

Tìm full path được tải cũng từ `SmartScreen` log
![image](https://hackmd.io/_uploads/BJfwWEyVzx.png)
## 4. What is the execution time of the tool from task 3?
Time được record event ghi nhận từ [Q3](#3-They-then-proceeded-to-download-and-then-execute-the-portable-version-of-a-tool-that-could-be-used-to-search-for-files-on-the-machine-quickly-and-efficiently-What-was-the-full-path-of-the-executable) chính là đáp án
## 5. The utility was used to search for critical and confidential documents stored on the host, which the attacker could steal and extort the victim. What was the first document that the attacker got their hands on and breached the confidentiality of that document?
Như đã giải thích ở [Q2](#2-The-attacker-downloaded-a-few-utilities-that-aided-them-for-their-sabotage-and-extortion-operation-What-was-the-first-tool-they-downloaded-and-installed), file `.pdf` mà attacker đọc có thể đã cài mặc định đọc bằng Edge do đó mà file này xuất hiện trong log
![image](https://hackmd.io/_uploads/BylGz4kEMl.png)
## 6. Find the name and path of second stolen document as well.
![image](https://hackmd.io/_uploads/BJETzVkVfl.png)
## 7. The attacker installed a Cloud utility as well to steal and exfiltrate the documents. What is name of the cloud utility?
MEGAsync thuộc MEGA là một ứng dụng lưu trữ đám mây cho phép đồng bộ và tải file lên máy chủ từ xa
![image](https://hackmd.io/_uploads/ryL7EVJ4Ge.png)

![image](https://hackmd.io/_uploads/SJJyN4J4Ge.png)
## 8. When was this utility executed?
![image](https://hackmd.io/_uploads/H1McNE1VGg.png)
## 9. The Attacker also proceeded to destroy the data on the host so it is unrecoverable. What utility was used to achieve this?
Ngay sau hành vi tải file ta ghi nhận được hành vi phá hủy data qua `File Shredder`. `File Shredder` là tool dùng để xóa file vĩnh viễn (secure file deletion), khiến data rất khó hoặc không thể khôi phục bằng các phần mềm phục hồi dữ liệu thông thường
![image](https://hackmd.io/_uploads/SyeUSE14Gl.png)
Log `SmartScreen` đã record sự xuất hiện của tool
![image](https://hackmd.io/_uploads/r1btHNy4Mx.png)
## 10. The attacker cleared 2 important logs, thinking they covered all their tracks. When was the security log cleared?
Về việc log đã bị clear (Có thể là nguyên nhân `event ID 4624` và `event ID 4688` không record thông tin logon) ta có thể xem ở source log `Security` với `Event ID 1102`
![image](https://hackmd.io/_uploads/Hk4UI4kNGg.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/rJmOU4JNMg.png)
