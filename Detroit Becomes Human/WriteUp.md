![image](https://hackmd.io/_uploads/SkXENqJ2-x.png)
Alonzo Spire bị thu hút bởi AI sau khi nhận thấy gần đây việc sử dụng các công cụ AI để hỗ trợ công việc hằng ngày tăng mạnh. Anh ta tình cờ thấy một bài đăng được tài trợ trên mạng xã hội về một công cụ AI của Google. Bài đăng có lượng tiếp cận rất lớn, và trang đăng bài có hơn 200k người theo dõi. Không suy nghĩ nhiều, anh đã tải công cụ được cung cấp trong bài đăng. Nhưng sau khi cài đặt, anh không thể tìm thấy công cụ đó trên hệ thống của mình, điều này khiến anh nghi ngờ
# Detroit Becomes Human
## Sherlock info
Name |Detroit Becomes Human
|-|-|
Difficulty| Hard
Category | DFIR|
## Note from Scenario
Nạn nhân bị lừa tải xuống một file độc hại từ một bài đăng trên Facebook. Sau khi thực thi, file này đã sinh ra nhiều thành phần độc hại với các định dạng khác nhau, đồng thời lợi dụng PowerShell để thực thi các lệnh nhằm phục vụ mục đích tấn công
## Artifacts
Ta được cung cấp:
![image](https://hackmd.io/_uploads/SJvo8913Zl.png)
## Tools use
- MFTECmd
- Autopy
- ChatGPT
- Registry Explorer

>### Comment
> CDSA Preparation path - Một số quest lỏ vch

# Question 
1. What is the full link of a social media post which is part of the malware campaign, and was unknowingly opened by Alonzo spire?
2. Can you confirm the timestamp in UTC when alonzo visited this post?
3. Alonzo downloaded a file on the system thinking it was an AI Assistant tool. What is name of the archive file downloaded?
4. What was the full direct url from where the file was downloaded?
5. Alonzo then proceeded to install the newly download app, thinking that its a legit AI tool. What is the true product version which was installed?
6. When was the malicious product/package successfully installed on the system?
7. The malware used a legitimate location to stage its file on the endpoint. Can you find out the Directory path of this location?
8. The malware executed a command from a file. What is name of this file?
9. What are the contents of the file from question 8? Remove whitespace to avoid format issues
10. What was the command executed from this file according to the logs?
11. Under malware staging Directory, a js file resides which is very small in size. What is the hex offset for this file on the filesystem?
12. Recover the contents of this js file so we can forward this to our RE/MA team for further analysis and understanding of this infection chain. To sanitize he payload, remove whitespaces
13. Upon seeing no AI Assistant app being run, alonzo tried searching it from file explorer. What keywords did he use to search?
14. When did alonzo searched it?
15. After alonzo could not find any AI tool on the system, he became suspicious, contacted the security team and deleted the downloaded file. When was the file deleted by alonzo?
16. Looking back at the starting point of this infection, please find the md5 hash of the malicious installer
# Analysis
Đầu tiên là nạp artifact vào AutoSpy để nó phân tích hộ các trường cho dễ nhìn
![image](https://hackmd.io/_uploads/Bk5ui913be.png)
Thời gian của artifact được ghi nhận theo múi giờ GMT, tương đương với UTC trong ngữ cảnh các câu hỏi của Sherlock
## 1. What is the full link of a social media post which is part of the malware campaign, and was unknowingly opened by Alonzo spire?
Trong trường `Web History` trên AutopSpy, theo mô tả của câu hỏi, vào lúc `2024-03-19 04:30:00`, ghi nhận nạn nhân đã truy cập Facebook và xem một bài đăng liên quan đến việc sử dụng AI của Google Gemini
![image](https://hackmd.io/_uploads/SkAr09JnWg.png)
## 2. Can you confirm the timestamp in UTC when alonzo visited this post?
Đáp án có ở [Q1](#1-What-is-the-full-link-of-a-social-media-post-which-is-part-of-the-malware-campaign-and-was-unknowingly-opened-by-Alonzo-spire)
## 3. Alonzo downloaded a file on the system thinking it was an AI Assistant tool. What is name of the archive file downloaded?
Ở trường `Web Downloads` sẽ thấy được nạn nhân đã tải file `.rar` độc hại về
![image](https://hackmd.io/_uploads/SJ_m1jJ2-l.png)
## 4. What was the full direct url from where the file was downloaded?
Sau khi bấm link từ facebook, nạn nhân được redirect đến `https://drive.usercontent.google.com/u/2/uc?id=1z-SGnYJCPE0HA_Faz6N7mD5qf0E-A76H&export=download` để thực hiện tải file về máy
![image](https://hackmd.io/_uploads/H1M61iJ3Wg.png)
## 5. Alonzo then proceeded to install the newly download app, thinking that its a legit AI tool. What is the true product version which was installed?
Vì nạn nhân đã tiến hành cài đặt file sau khi giải nén `.rar`, ta dùng trường `Installed Programs` phát hiện file `Install v.3.32.3` đã được cài
![image](https://hackmd.io/_uploads/rkax-iJ3Wl.png)
## 6. When was the malicious product/package successfully installed on the system?
Từ [Q5](#5-Alonzo-then-proceeded-to-install-the-newly-download-app-thinking-that-its-a-legit-AI-tool-What-is-the-true-product-version-which-was-installed), có thể thấy thời gian cài nhưng không đúng bởi vì đó là thời gian nó bắt đầu cài đặt, đáp án nằm ở log `Application`
![image](https://hackmd.io/_uploads/HJxYKoy3Zx.png)
:::info
Trường `Installed Programs` của Autopsy đọc dữ liệu từ Registry (cụ thể là các key `Uninstall`). Thời gian mà Autopsy hiển thị là thời gian ghi lần cuối của cái Registry Key đó, tức là thời gian bắt đầu cài. Sau khi ghi tên vào Registry xong, trình cài đặt vẫn chưa dừng lại. Nó còn phải làm nốt các bước dọn dẹp như file tạm, đăng ký các file `.dll`,... nói chung là phải hoàn thành 100% thì mới ghi vào `Application` log
:::
## 7. The malware used a legitimate location to stage its file on the endpoint. Can you find out the Directory path of this location?
Dựa vào thời gian bắt đầu cài (`04:31:20`) ta sẽ trace vào file `$MFT` với filter `FileCreate` và nó là `Directory`. Ta thấy folder `nmmhkkegccagdldgiimedpic`, tên rất sus được tạo ở folder rất legit của Google `C:\Program Files (x86)\Google`
![image](https://hackmd.io/_uploads/S1-Dlyl2bl.png)
## 8. The malware executed a command from a file. What is name of this file?
Phân tích ở [Q7](#7-The-malware-used-a-legitimate-location-to-stage-its-file-on-the-endpoint-Can-you-find-out-the-Directory-path-of-this-location) ta sẽ thấy nó sinh ra file chạy từ command tên là `install.cmd`
![image](https://hackmd.io/_uploads/HJemI1g2Zl.png)
## 9. What are the contents of the file from question 8? Remove whitespace to avoid format issues
Để xem nội dung file `install.cmd` ta dùng lệnh 
```
MFTECmd.exe -f $MFT --de 51471
// --de là lấy Entry Number
```
![image](https://hackmd.io/_uploads/By4awyl2Ze.png)
## 10. What was the command executed from this file according to the logs?
Bởi vì nội dung file mà attacker đang muốn chạy là file `.ps1` nên đây sẽ là lệnh được chạy từ Powershell
![image](https://hackmd.io/_uploads/rJu4Y1e3Wg.png)
## 11. Under malware staging Directory, a js file resides which is very small in size. What is the hex offset for this file on the filesystem?
Tại stage folder có 2 file `.js` nhưng file `content.js` thì nhẹ hơn nên ta sẽ dùng MFTECmd để phân tíhc file này
![image](https://hackmd.io/_uploads/Hy1G8gg2-l.png) 

```
MFTECmd.exe -f C:\Users\DELL\Desktop\Triage\C\$MFT --de 64067
```
![image](https://hackmd.io/_uploads/HygDvll2bg.png)
## 12. Recover the contents of this js file so we can forward this to our RE/MA team for further analysis and understanding of this infection chain. To sanitize he payload, remove whitespaces
Từ Quest trên ta cũng thấy được nội dung file
![image](https://hackmd.io/_uploads/S1OKDgg2Zx.png)
## 13. Upon seeing no AI Assistant app being run, alonzo tried searching it from file explorer. What keywords did he use to search?
Sử dụng Registry value `WordWheelQuery` ta sẽ thấy lịch sử search box của Explorer
![image](https://hackmd.io/_uploads/r1Vbollhbl.png)
## 14. When did alonzo searched it?
![image](https://hackmd.io/_uploads/rJBfsel2be.png)
## 15. After alonzo could not find any AI tool on the system, he became suspicious, contacted the security team and deleted the downloaded file. When was the file deleted by alonzo?
Check trong thùng rác(Recycle Bin) ở AutoSpy là thấy
![image](https://hackmd.io/_uploads/HycFigx3Zx.png)
## 16. Looking back at the starting point of this infection, please find the md5 hash of the malicious installer
Tìm trên `Downloads` thấy được file `.msi`
![image](https://hackmd.io/_uploads/ByQclbg3Zl.png)
Search google để lấy hash 
![image](https://hackmd.io/_uploads/HJFyWWehbl.png)
> Install v.3.32.3 mới là tên thật của file độc này, còn file mà nạn nhân thấy bị đổi tên trông cho legit

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
