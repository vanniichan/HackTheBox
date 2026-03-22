![image](https://hackmd.io/_uploads/rJ3vYk3qWe.png)

Janice từ bộ phận kế toán đang cảm thấy khó chịu! SOC đã liên hệ với cô để thông báo rằng thông tin đăng nhập của cô đã được threat intel team thấy trên web đen. Chúng ta đã tìm cách khôi phục một số file từ máy của cô ấy và gửi chúng cho nhà phân tích REM

# Loggy
## Sherlock info
Name |Loggy
|-|-|
Difficulty| Easy
Category | Malware Analysis|

## Note from Scenario
Janice trước đó đã tải file độc tên là `Loggy.exe` về máy, đây là mã độc Stealer, nó có chức năng keylogger và screenshot sau đó gửi về C2 thông qua giao thức FTP 

## Artifacts
Ta được cung cấp:
```
.
├── keylog.txt
├── Loggy.exe
├── screenshot_1718068575.png
├── screenshot_1718068581.png
├── screenshot_1718068593.png
└── screenshot_1718068600.png
```

## Tools use
- Virustotal
- Detect It Easy
- CFF Explorer
- Ghidra
- ChatGPT

>### Comment
> Chạy theo CDSA Preparation path chứ không cũng không làm cái sherlock này đâu, thuần mò :))

# Questions
1. What is the SHA-256 hash of this malware binary?
2. What programming language (and version) is this malware written in?
3. There are multiple GitHub repos referenced in the static strings. Which GitHub repo would most likely suggest the ability of this malware to exfiltrate data?
4. What dependency, expressed as a GitHub repo, supports Janice’s assertion that she thought she downloaded something that can just take screenshots?
5. Which function call suggests that the malware produces a file after execution?
6. You observe that the malware is exfiltrating data over FTP. What is the domain it is exfiltrating data to?
7. What are the threat actor’s credentials?
8. What file keeps getting written to disk?
9. When Janice changed her password, this was captured in a file. What is Janice's username and password?
10. What app did Janice have open the last time she ran the "screenshot app"?
# Answers
## 1. What is the SHA-256 hash of this malware binary?
`md5sum` lấy hash file check trên VT
![image](https://hackmd.io/_uploads/HyPdhknqWx.png)
## 2. What programming language (and version) is this malware written in?
Sử dụng `Detect It Easy` biết được con mã độc này viết bằng Go với ver `Compiler: Go(go1.22.3)`
![image](https://hackmd.io/_uploads/HyQwkx3qWg.png)
## 3. There are multiple GitHub repos referenced in the static strings. Which GitHub repo would most likely suggest the ability of this malware to exfiltrate data?
Ta sẽ sử dụng `strings` và `grep` để xem các link repo
![image](https://hackmd.io/_uploads/r1tUgehq-l.png)
strings ra rất nhiều link, chủ yếu là repo của go lang, đều là thư viện cho Go, chủ yếu dùng để tương tác với hệ thống Windows
```
github.com/lxn/win
github.com/jlaffaye/ftp
github.com/TheTitanrain/w32
github.com/kbinani/screenshot
```
Sử dụng chatgpt và biết được repo `github.com/jlaffaye/ftp` dùng để exfil data
![image](https://hackmd.io/_uploads/SkMzEg2q-g.png)
## 4. What dependency, expressed as a GitHub repo, supports Janice’s assertion that she thought she downloaded something that can just take screenshots?
Dựa vào Q3 ta cũng sẽ thấy được dependency của repo capture màn hình của Janice là `github.com/kbinani/screenshot`
## 5. Which function call suggests that the malware produces a file after execution?
Ta có sẽ sử dụng `CFF Explorer` để xem các function call được import. Từ ảnh sẽ thấy mã độc đã gọi đến `WriteFile`
![image](https://hackmd.io/_uploads/BJ84wrpq-g.png)
## 6. You observe that the malware is exfiltrating data over FTP. What is the domain it is exfiltrating data to?
Tại Q3 đã xác định mã độc sử dụng FTP để thực hiện hành vi exfiltration. Phân tích bằng Ghidra, tập trung vào các hàm liên quan đến kết nối mạng
![image](https://hackmd.io/_uploads/BJ3I0Kaqbx.png)
Decompile hàm `main.sendFilesViaFTP` cho thấy tham số truyền vào hàm `Dial` chứa chuỗi:
![image](https://hackmd.io/_uploads/B1pVCYp5-g.png)
## 7. What are the threat actor’s credentials?
Tương tự Q6 nhảy vào ta sẽ thấy được credential của T.A
![image](https://hackmd.io/_uploads/SJPORKT5Ze.png)
## 8. What file keeps getting written to disk?
File được liên tục ghi xuống disk chắc chắn là file của hành vi keyloger. Ta cũng thấy được khi thu ở [Artifacts](#Artifacts)
## 9. When Janice changed her password, this was captured in a file. What is Janice's username and password?
Đọc nội dung file `keylog.txt` thu được ở [Artifacts](#Artifacts) sau đó nhờ ChatGPT parse hộ credential:
![image](https://hackmd.io/_uploads/BJ-WgqT5Ze.png)
## 10. What app did Janice have open the last time she ran the "screenshot app"?
Cũng từ các screenshot thu được ở [Artifacts](#Artifacts) ta sẽ thấy Janice dùng ứng dụng gì
![image](https://hackmd.io/_uploads/SkZngqaq-g.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
