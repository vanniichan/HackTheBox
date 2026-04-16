![image](https://hackmd.io/_uploads/S1duzC42-g.png)
Quản lý của bạn vừa chuyển cho bạn một vụ việc từ một startup nhỏ tên là `cloud-guru-management ltd`. Công ty này hiện đang phát triển sản phẩm với đội ngũ lập trình viên của họ, nhưng CEO đã nhận được thông tin truyền miệng rằng tài sản trí tuệ (Intellectual Property) của họ đã bị đánh cắp và đang bị sử dụng ở nơi khác. Người dùng liên quan cho biết cô ấy có thể đã vô tình chia sẻ thư mục `Documents`, và cô ấy tin rằng cuộc tấn công xảy ra vào ngày 6 tháng 10. Ngoài ra, cô ấy cũng nói rằng cô không sử dụng máy tính vào ngày hôm đó
# Jinkies
## Sherlock info
Name |Streamer
|-|-|
Difficulty| Medium
Category | DFIR|
## Note from Scenario
Nạn nhân vô tình chia sẻ thư mục `Documents`  

## Artifacts
Ta được cung cấp:
![image](https://hackmd.io/_uploads/Bk_-pqfnWl.png)
## Tools use
- MFTECmd
- MFTExplorer
- AmcacheParser
- Autopsy
- ChatGPT

>### Comment
> CDSA Preparation path, bài lỏ, hacker lỏ, thuần guessing

# Question 
1. Which folders were shared on the host? (Please give your answer comma separated, like this: c:\program files\share1, D:\folder\share2)
2. What was the file that gave the attacker access to the users account?
3. How many user credentials were found in the file?
4. What is the NT hash of the users password?
5. Does this password match that found in the previous file? (Yes or No)
6. What was the time the attacker first interactively logged on to our users host?
7. What’s the first command the attacker issues into the Command Line?
8. What is the name of the file that the attacker steals?
9. What’s the domain name of the location the attacker ex-filtrated the file to?
10. What is the handle of the attacker?
# Analysis
## 1. Which folders were shared on the host? (Please give your answer comma separated, like this: c:\program files\share1, D:\folder\share2)
Xác định các share folder trên một host là bước quan trọng để biết dữ liệu nào đang được phơi bày ra mạng hoặc attacker có thể đã sử dụng shared nào để lateral movement

Sử dụng registry key `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\LanmanServer\Shares` để tìm ra các shared folder, tại đây ta thấy có 2 shared folder
![image](https://hackmd.io/_uploads/BJpT1xH2Zl.png)
## 2. What was the file that gave the attacker access to the users account?
Dựa vào [Q1](#1-Which-folders-were-shared-on-the-host-Please-give-your-answer-comma-separated-like-this-cprogram-filesshare1-Dfoldershare2) cùng với mô tả, nạn nhân đã vô tình chia sẻ folder `Documents` khiến cho attacker có được user account, ta sẽ xem tổng quan folder này chứa gì
![image](https://hackmd.io/_uploads/Bk8kfrHnWe.png)
Folder mà nạn nhân đã để lộ chứa project của webserver, ta có thể đoán được attacker có một số cách lấy được account:
- Đọc source code tìm bug khai thác server public
- Folder này chứa file config chứa credential, database

Lần đầu tiến tìm hiểu về file `.ipynb`, cứ tưởng bị ransom hay gì
![image](https://hackmd.io/_uploads/BJiImrHnbe.png)
Vì bên trong có rất nhiều file để xem nên ta sử dụng file `$MFT` để xem những file đã được truy cập cho nhanh
![image](https://hackmd.io/_uploads/H17JsBr3be.png)
Trong đó có một file chứa database với extension `.ibd`
![image](https://hackmd.io/_uploads/r1pVjSB3be.png)
![image](https://hackmd.io/_uploads/ByFwsBB3-l.png)
Muốn đọc file này khá là rắc rối nên ta nhờ ChatGPT parse hộ ra kết quả như ảnh dưới, nhìn cũng khá rõ rồi đấy chứ :) 
![image](https://hackmd.io/_uploads/ryJ2ArB3Zg.png)
Từ đây có thể kết luận đây là file mà attacker dùng để có credential của các user 
![image](https://hackmd.io/_uploads/Hk44kLH2Ze.png)
## 3. How many user credentials were found in the file?
File ChatGPT parse ra cứ cách một hàng là một cặp `username:credential`, ta sẽ chia 2 cho tổng số hàng
![image](https://hackmd.io/_uploads/B1xZlIB2Zg.png)
![image](https://hackmd.io/_uploads/B1_fe8HhZe.png)

```
216
```
## 4. What is the NT hash of the users password?
Để tìm giá trị NTLM hash ta sẽ dump 2 file `SAM` và `SYSTEM` sau đó dùng tool `secretsdump.py` sẽ ra
```
┌──(kali㉿kali)-[~/Desktop]
└─$ secretsdump.py -sam SAM -system SYSTEM LOCAL
```
![image](https://hackmd.io/_uploads/Hy1I9UHnWl.png)
## 5. Does this password match that found in the previous file? (Yes or No)
Đem password có được trong CyberChef cook với NThash
![image](https://hackmd.io/_uploads/rJQU3Ur2bx.png)
Kết quả trùng với đáp án ở Q4, cho thấy attacker vẫn dùng được password này
![image](https://hackmd.io/_uploads/HJUwn8Bn-x.png)
## 6. What was the time the attacker first interactively logged on to our users host?
Nhìn câu hỏi cũng biết ta sẽ dùng log `Security` để xem event id `4624`. Do attacker sẽ dùng credential để logon nên ta nghĩ đến Logon type 3 (tức là RDP)

Hiện tại trong log đã ghi lại 3 type, đó là 2 (do người dùng log bằng máy tính trực tiếp), 5 (do một service được cấu hình để chạy) và type 3

> Trước đó đọc log `network_connections.txt` tại folder `LiveResponse` ta cũng thấy đã có kết nối từ RDP với port điển hình 3389
![image](https://hackmd.io/_uploads/BJuqgwr2bl.png)
## 7. What’s the first command the attacker issues into the Command Line?
Kiểm tra log `Sysmon` với event id 1 để xem có `cmd.exe` được spawn không. Filter trước
```
PS C:\Users\DELL> Get-WinEvent -Path "C:\Users\DELL\Desktop\Jinkies_KAPE_output\TriageData\C\Windows\system32\winevt\logs\Microsoft-Windows-Sysmon%4Operational.evtx" -FilterXPath "*[System[(EventID=1)]]" | Where-Object { $_.ToXml() -match "cmd.exe" }
```
![image](https://hackmd.io/_uploads/SJnwFhAnWl.png)
Có thể thấy lệnh `net users` đang được dùng để recon máy. Tuy nhiên đây không phải đáp án
![image](https://hackmd.io/_uploads/B1P9z203Zg.png)
Vào thời điểm sớm hơn, attacker đã chạy `whoami` đầu tiên :))
![image](https://hackmd.io/_uploads/Bk1E73R2-l.png)
Và nó được mở bằng `Win + R` hoặc search
![image](https://hackmd.io/_uploads/ry5cmnRhZl.png)
## 8. What is the name of the file that the attacker steals?
Vì lệnh đầu tiên bắt đầu từ lúc `17:17:45` nên ta sẽ xem các lệnh về sau
![image](https://hackmd.io/_uploads/r1dF5h03be.png)
## 9. What’s the domain name of the location the attacker ex-filtrated the file to?
Đây là câu hỏi khá ảo ma khi ta đi lọc từng tí artifact xem có dấu hiệu của mã đọc kết nối đến C2 nhưng không =)) thuần tương tác của attacker khi dùng trình duyệt

Xem lịch sử tại `C\users\Velma\Appdata\Local\Google\Chrome\User Data\Default`. Kinh điển nhất là `paste.io` rồi
![image](https://hackmd.io/_uploads/SyGoph02bx.png)
## 10. What is the handle of the attacker?
Quest này hỏi chịu hẳn. Không hiểu gì?
![image](https://hackmd.io/_uploads/H1eNR2AhWg.png)
Search theo patern `README`, `.txt`, filter contain thư mục của user `velma`
![image](https://hackmd.io/_uploads/SJ3XbT0nZe.png)
Đọc nội dung
![image](https://hackmd.io/_uploads/BJGvk603-e.png)
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
