![image](https://hackmd.io/_uploads/HJLhu1kjWg.png)
Một thành viên trong đội bảo mật đã tiến hành nghiên cứu và thử nghiệm trên một hệ điều hành được cho là cũ và không an toàn. Chúng tôi nghi ngờ hệ thống này có thể đã bị xâm nhập và đã thu thập được một bản memory dump của nó. Chúng tôi muốn xác nhận những hành động mà attacker đã thực hiện, cũng như liệu có tài sản nào khác trong môi trường bị ảnh hưởng hay không
# Recollection
## Sherlock info
Name |Recollection
|-|-|
Difficulty| Easy
Category | DFIR|
## Note from Scenario
Nạn nhân trong quá trình tìm hiểu về SIEM và mã độc đã truy cập MalwareBazaar và vô tình tải về một file độc hại. Mã độc này thuộc nhóm stealer, ransomware và loader, được thực thi thông qua lệnh PowerShell bị obfuscate, từ đó thực hiện các hành vi như đánh cắp dữ liệu, mã hóa file của nạn nhân và tải xuống thêm một file giả mạo có tên gần giống phần mềm hợp pháp của Microsoft
## Tools use
- Volatility2
- Volatility3
- SQLite
- ChatGPT

>### Comment
> CDSA Preparation path

# Question 
1. What is the Operating System of the machine?
2. When was the memory dump created?
3. After the attacker gained access to the machine, the attacker copied an obfuscated PowerShell command to the clipboard. What was the command?
4. The attacker copied the obfuscated command to use it as an alias for a PowerShell cmdlet. What is the cmdlet name?
5. A CMD command was executed to attempt to exfiltrate a file. What is the full command line?
6. Following the above command, now tell us if the file was exfiltrated successfully?
7. The attacker tried to create a readme file. What was the full path of the file?
8. What was the Host Name of the machine?
9. How many user accounts were in the machine?
10. In the "\Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge" folder there were some sub-folders where there was a file named passwords.txt. What was the full file location/path?
11. A malicious executable file was executed using command. The executable EXE file's name was the hash value of itself. What was the hash value?
12. Following the previous question, what is the Imphash of the malicous file you found above?
13. Following the previous question, tell us the date in UTC format when the malicious file was created?
14. What was the local IP address of the machine?
15. There were multiple PowerShell processes, where one process was a child process. Which process was its parent process?
16. Attacker might have used an email address to login a social media. Can you tell us the email address?
17. Using MS Edge browser, the victim searched about a SIEM solution. What is the SIEM solution's name?
18. The victim user downloaded an exe file. The file's name was mimicking a legitimate binary from Microsoft with a typo (i.e. legitimate binary is powershell.exe and attacker named a malware as powershall.exe). Tell us the file name with the file extension?
# Analysis
## 1. What is the Operating System of the machine?
Sử dụng plugin `imageinfo`, output cho biết bản mem dump này là của **Windows 7**
![image](https://hackmd.io/_uploads/B1GxcJJsZe.png)
## 2. When was the memory dump created?
Từ Q1 ta cũng thấy được thời gian file được dump ra
## 3. After the attacker gained access to the machine, the attacker copied an obfuscated PowerShell command to the clipboard. What was the command?
Sử dụng vol2, plugin `clipboard` hỗ trợ ta tìm khi attacker copy
![image](https://hackmd.io/_uploads/S1u8VlJj-g.png)
## 4. The attacker copied the obfuscated command to use it as an alias for a PowerShell cmdlet. What is the cmdlet name?
Chạy command trên bằng powershell ta sẽ thấy nó được viết tắt cho `iex`
![image](https://hackmd.io/_uploads/SyW8vxJsZg.png)
> IEX (Invoke-Expression) là một lệnh trong PowerShell dùng để thực thi một chuỗi (string) như là lệnh PowerShell

Do đáp đó đáp án là `Invoke-Expression`
## 5. A CMD command was executed to attempt to exfiltrate a file. What is the full command line?
Khi chạy plugin `cmdscan` ta sẽ thấy command attacker đang thực hiện hành vi đọc nội dung file `Confidential.txt` sau đó ghi vào file `pass.txt` của user `pulice` qua IP `192.168.0.171`
![image](https://hackmd.io/_uploads/ryXGhg1sbg.png)
## 6. Following the above command, now tell us if the file was exfiltrated successfully?
Vì attacker dùng UNC path tức là có liên quan đến kết nối ra IP nên ta sẽ dùng `netscan` để kiểm tra xem `conshost.exe` có kết nối nào đến `192.168.0.171` không

Sau khi kiểm tra thì không có, do đóattacker đã exfiltrate file thất bại
## 7. The attacker tried to create a readme file. What was the full path of the file?
Ban đầu mình dùng plugin `filescan` và `handles` để xem file này đã được ghi hoặc process nào đã ghi file `readme` chưa nhưng lại không có output gì 
![image](https://hackmd.io/_uploads/ryKWWZksZg.png)
Sau đó mới chợt nhớ ra lệnh powershell thu được ở trên chưa decode. Sử dụng Cyberchef ta có kết quả nhưng có vẻ như lệnh này chưa chạy thành công do file không được ghi xuống
![image](https://hackmd.io/_uploads/S1RqxZkobx.png)
Confirm đúng như dự đoán bằng cách dùng `consoles`
![image](https://hackmd.io/_uploads/rJTkfWyoZx.png)
## 8. What was the Host Name of the machine?
Từ [Q7](#7-The-attacker-tried-to-create-a-readme-file-What-was-the-full-path-of-the-file), khi đi confirm ta thấy attacker đã chạy `net users`, ở output ta sẽ thấy hostname
![image](https://hackmd.io/_uploads/HkPVQ-ki-x.png)
## 9. How many user accounts were in the machine?
Từ [Q8](#8-What-was-the-Host-Name-of-the-machine), có 3 user
## 10. In the "\Device\HarddiskVolume2\Users\user\AppData\Local\Microsoft\Edge" folder there were some sub-folders where there was a file named passwords.txt. What was the full file location/path?
Ta biết được file tên là `passwords.txt`, sử dụng `filescan` sau đó grep chuỗi 
![image](https://hackmd.io/_uploads/B1aGUZyjbe.png)
## 11. A malicious executable file was executed using command. The executable EXE file’s name was the hash value of itself. What was the hash value?
Từ [Q4](#4-The-attacker-copied-the-obfuscated-command-to-use-it-as-an-alias-for-a-PowerShell-cmdlet-What-is-the-cmdlet-name) ta đã thấy file này và được chạy 
![image](https://hackmd.io/_uploads/rJB28-ksZg.png)
## 12. Following the previous question, what is the Imphash of the malicous file you found above?
Sử dụng VirusTotal ta có được giá trị của Imphash
![image](https://hackmd.io/_uploads/rkRfvWkjbl.png)
> Imphash là hash của danh sách import này theo chuẩn. Gía trị này sinh ra nhằm để nhận dạng file PE giống nhau về import table, ngay cả khi các byte khác nhau (ví dụ, compile lại hoặc pack lại)
## 13. Following the previous question, tell us the date in UTC format when the malicious file was created?
[Q12](#12-Following-the-previous-question-what-is-the-Imphash-of-the-malicous-file-you-found-above) cho thấy thời gian file này được tạo vào thời điểm `2022-06-22 11:49:04`
![image](https://hackmd.io/_uploads/Byj6DbJsZg.png)
## 14. What was the local IP address of the machine?
Khi sử dụng `netscan` từ [Q6](#6-Following-the-above-command-now-tell-us-if-the-file-was-exfiltrated-successfully) ta cũng sẽ thấy được các IP xuất hiện lặp lại bên `LocalAddr`, đây chính là IP của máy thực hiện for mem
![image](https://hackmd.io/_uploads/ryMXjsXjWg.png)
## 15. There were multiple PowerShell processes, where one process was a child process. Which process was its parent process?
Dùng `pstree` để xem mối quan hệ cha con, ở đây là tìm bố của `powershell.exe`
![image](https://hackmd.io/_uploads/SJNVToXi-g.png)
## 16. Attacker might have used an email address to login a social media. Can you tell us the email address?
Search theo pattern `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}\b` để tìm email, kết quả cho ra cả tỉ mail :)
![image](https://hackmd.io/_uploads/SJBoB3Qjbg.png)

Tuy nhiên ở [Q7](#7-The-attacker-tried-to-create-a-readme-file-What-was-the-full-path-of-the-file) khi tạo file readme cho nạn nhân, attacker có để tên `mafia` nên dựa vào đây để filter tiếp

Nhờ ChatGPT hỗ trợ cho nhanh :))
```
\b[A-Za-z0-9._%+-]*mafia[A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}\b
```
Kết quả 
![image](https://hackmd.io/_uploads/HyQIUnQsbg.png)
## 17. Using MS Edge browser, the victim searched about a SIEM solution. What is the SIEM solution's name?
Plugin `filescan` hỗ trợ ta tìm file, theo mặc định, lịch sử duyệt web trên MS Edge của người dùng sẽ được cache tại `Microsoft\Edge\User Data\Default\History`
![image](https://hackmd.io/_uploads/rkxQ1aVj-l.png)

Dump file về và sử dụng SQLite để xem lịch sử, có thể thấy người dùng có hiểu biết nhất định về bảo mật khi đang tìm hiểu SIEM Wazuh và MalwareBazaar, tuy nhiên có khả năng đã vô tình thực thi một file độc hại trong quá trình tải về
![image](https://hackmd.io/_uploads/BycKMGIiZe.png)
File nạn nhân tải về trong lịch sử trùng với file được phát hiện là tấn công máy
![image](https://hackmd.io/_uploads/H1nLrz8obl.png)
## 18. The victim user downloaded an exe file. The file's name was mimicking a legitimate binary from Microsoft with a typo (i.e. legitimate binary is powershell.exe and attacker named a malware as powershall.exe). Tell us the file name with the file extension?
Thường khi tải file về nó sẽ nằm ở folder `Downloads` nên ta sẽ sử dụng kết hợp `filescan` để list các file và `grep` để tìm các file nằm ở đó
![image](https://hackmd.io/_uploads/r1pj72QjWx.png)

> csrss.exe là process quan trọng của Windows là cầu nối giữa user mode và kernel mode hỗ trơh quản lý console và một phần giao diện
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/H14WtZ1sWx.png)
