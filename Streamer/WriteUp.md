![image](https://hackmd.io/_uploads/H1ydiKzh-l.png)
Simon Stark là một developer tại Forela, gần đây đã lên kế hoạch stream một số buổi coding cùng đồng nghiệp và nhận được sự khen ngợi từ CEO cũng như các đồng nghiệp khác. Tuy nhiên, anh ấy đã vô tình cài đặt một phần mềm streaming phổ biến mà anh tìm thấy qua Google, và đó là một trong những đường link được quảng cáo (Google Ads) hiển thị ở vị trí đầu. Đáng tiếc, mọi chuyện đã diễn biến theo hướng xấu và một sự cố bảo mật đã xảy ra
# Streamer
## Sherlock info
Name |Streamer
|-|-|
Difficulty| Hard
Category | DFIR|
## Note from Scenario
Nạn nhân đã tải về file độc hại được ngụy trang dưới dạng phần mềm streaming OBS. Sau khi chạy file installer, mã độc được cài đặt và thực hiện hành vi điều khiển máy. Đồng thời tạo persistence bằng cách tạo file và lên lịch chạy định kỳ thông qua scheduled task có tên rất hợp pháp là `COMSurrogate`
## Artifacts
Ta được cung cấp:
![image](https://hackmd.io/_uploads/Bk_-pqfnWl.png)
## Tools use
- MFTECmd
- AmcacheParser
- Autopsy
- ChatGPT

>### Comment
> CDSA Preparation path

# Question 
1. What's the original name of the malicious zip file which the user downloaded thinking it was a legit copy of the software?
2. Simon Stark renamed the downloaded zip file to something else. What's the renamed Name of the file alongside the full path?
3. What's the timestamp when the file was renamed?
4. What's the Full URL from where the software was downloaded?
5. Dig down deeper and find the IP Address on which the malicious domain was being hosted
6. Multiple Source ports connected to communicate and download the malicious file from the malicious website. Answer the highest port number from which the machine connected to malicious website
7. The zip file had a malicious setup file in it which would install a piece of malware and a legit instance of OBS studio software so the user has no idea they got compromised. Find the hash of the setup file
8. The malicious software automatically installed a backdoor on the victim's workstation. What's the name and filepath of the backdoor?
9. Find the prefetch hash of the backdoor
10. The backdoor is also used as a persistence mechanism in a stealthy manner to blend in the environment. What's the name used for persistence mechanism to make it look legit?
11. What's the bogus/invalid randomly named domain which the malware tried to reach?
12. The malware tried exfiltrating the data to a s3 bucket. What's the url of s3 bucket?
13. What topic was simon going to stream about in week 1? Find a note or something similar and recover its content to answer the question
14. What's the name of Security Analyst who triaged the infected workstation?
15. What's the network path from where acquisition tools were run? Hint: Find the UNC Path. For example \ComputerName\Desktop\Folder\Tools
# Analysis
Đầu tiên là nạp artifact vào AutoSpy
![image](https://hackmd.io/_uploads/r1RILqM3Zl.png)
## 1. What's the original name of the malicious zip file which the user downloaded thinking it was a legit copy of the software?
Tại trường `Web History` ta sẽ thấy nạn nhân (Stark) đã tải file `OBS-Studio-28.1.2-Full-Installer-x64.zip` và nghĩ đây là file legit
![image](https://hackmd.io/_uploads/rkxIYLcM2bg.png)
## 2. Simon Stark renamed the downloaded zip file to something else. What's the renamed Name of the file alongside the full path?
Để xem được sự thay đổi các thành phần trong file, ta có thể sử dụng `$J`, filter theo trường `Update Reason` và tìm `OBS Stream`
![image-2](https://hackmd.io/_uploads/Skr9L5fhZe.png)
## 3. What's the timestamp when the file was renamed?
Thời gian file được đổi tên vào lúc `2023-05-05 10:22:23`
## 4. What's the Full URL from where the software was downloaded?
Tại trường `Zone.Identifier` tại file `$MFT` sẽ cho ta biết full URL nơi file độc hại được tải về
![image-3](https://hackmd.io/_uploads/SJki89fhWg.png)
## 5. Dig down deeper and find the IP Address on which the malicious domain was being hosted
Dựa vào log `Archive-Microsoft-Windows-DNS-Client%4Operational-2023-05-05-10-31-18-874.evtx` IP mà domain `obsproicet.net` đang trỏ tới là `13.232.96.186`
![image-4](https://hackmd.io/_uploads/rk8iL9z3bg.png)
## 6. Multiple Source ports connected to communicate and download the malicious file from the malicious website. Answer the highest port number from which the machine connected to malicious website
Trong artifacts thu thập được có log `pfirewall.log` ghi lại tất cả kết nối của máy ra ngoài bao gồm port nên từ đây ta có thể dễ dàng tìm được port cao nhất
![image-5](https://hackmd.io/_uploads/SyTjUqfhZg.png)
## 7. The zip file had a malicious setup file in it which would install a piece of malware and a legit instance of OBS studio software so the user has no idea they got compromised. Find the hash of the setup file
Từ [Q2]() ta đã biết folder file installer của mã độc nằm ở `\Program Files (x86)\StrLocalGate`
![image-6](https://hackmd.io/_uploads/SyQ385f3bg.png)
Trace theo log `Amcache_UnassociatedFileEntries` ta sẽ có file hash
![image](https://hackmd.io/_uploads/ryguqqf2-g.png)
## 8. The malicious software automatically installed a backdoor on the victim's workstation. What's the name and filepath of the backdoor?
Với câu hỏi trên, khi ta biết được file installer xuất hiện vào lúc `2023-05-05 10:23:14` thì chắc chắn sau đó backdoor sẽ xuất hiện, trace vào file `$J`
![image-7](https://hackmd.io/_uploads/r1RhIcGn-l.png)
## 9. Find the prefetch hash of the backdoor
Search trong folder `C\Windows\prefetch`
![image](https://hackmd.io/_uploads/ryhW3cG3Wl.png)
> Mục đích của hash này không phải để kiểm tra integrity mà để phân biệt các file có cùng tên nhưng nằm ở path khác nhau. Qua đó có thể phát hiện file fake hoặc xác định nhiều instance khác nhau
## 10. The backdoor is also used as a persistence mechanism in a stealthy manner to blend in the environment. What's the name used for persistence mechanism to make it look legit?
Sau thời gian file độc chạy, nó thực hiện loạt hành động như tạo file độc khác, chạy `cmd.exe`, chạy lệnh `ping`
![image-9](https://hackmd.io/_uploads/SJca8cfnZe.png)
Trong đó nó cũng tạo ra Task nhằm tạo persistent với tên task rất legit là `COMSurrogate`, nó giả mạo đây là task đang load COM 
![image-10](https://hackmd.io/_uploads/Hkr1PcG3Ze.png)
Mục đích thực sự của nó là chạy file `ker konoyogi\lat takewode libigax weloj jihi quimodo datex dob cijoyi mawiropo.exe` định kỳ
![image-11](https://hackmd.io/_uploads/Bk3kD5z2bl.png)
Tuy nhiên dựa vào log `$J` thì có vẻ như task này chưa chạy được nên không có file `.pf` của file persistent độc này
## 11. What's the bogus/invalid randomly named domain which the malware tried to reach?
Vẫn tiếp tục dựa vào thời gian file mã độc chạy từ `2023-05-05 10:23:14` và file `Archive-Microsoft-Windows-DNS-Client%4Operational-2023-05-05-10-31-18-874.evtx`, ta sẽ thấy được domain độc
![image-12](https://hackmd.io/_uploads/r1SgwczhWx.png)
## 12. The malware tried exfiltrating the data to a s3 bucket. What's the url of s3 bucket?
Vẫn từ log trên nhưng search theo pattern `s3` ta sẽ có một số domain sau
- `s3.nikecdn.com`
- `bbuseruploads.s3.amazonaws.com`
Tuy nhiên domain `s3.nikecdn.com` đã được ghi nhận kết nối trước khi mã độc chạy nên domain đúng là `bbuseruploads.s3.amazonaws.com`
![image-13](https://hackmd.io/_uploads/Hyhev9z2-l.png)
## 13. What topic was simon going to stream about in week 1? Find a note or something similar and recover its content to answer the question
Tại `C:\Users\twentysev123\Desktop\1\Streamer\Streamer\Acquisition\C\Users\Simon.stark\AppData\Roaming\Microsoft\Windows\Recent` ta sẽ thấy file note
![image-14](https://hackmd.io/_uploads/rkQZv9f3Zg.png)
Vào log `$MFT` lấy Entry Number để tiến hành đọc file
![image-15](https://hackmd.io/_uploads/H1qWwqz2-g.png)

```
MFTECmd.exe -f "C:\Users\twentysev123\Desktop\1\Streamer\Streamer\Acquisition\C\$MFT" --de 5443
```
![image-16](https://hackmd.io/_uploads/B1HGD5z2-l.png)
## 14. What's the name of Security Analyst who triaged the infected workstation?
Khi quan sát artifacts có thể thấy hệ thống đã được triage bằng KAPE. Sử dụng search pattern `KAPE`, ta phát hiện sự xuất hiện của tool `gkape.exe` trong folder thuộc về analyst `CyberJunkie`. Từ đó có thể suy luận rằng `CyberJunkie` chính là người đã thực hiện thu thập artifact trong quá trình điều tra
![image-17](https://hackmd.io/_uploads/ByozPqz2Wl.png)
## 15. What's the network path from where acquisition tools were run? Hint: Find the UNC Path. For example \\ComputerName\Desktop\Folder\Tools
Tại Registry key `UserAssist` ta sẽ thấy được thông tin về các file thực thi (thường là giao diện GUI như file `.exe`, `.lnk` shortcut) mà người dùng đã chạy thông qua Windows Explorer (click đúp chuột, chọn từ desktop hoặc Start menu)
![image-18](https://hackmd.io/_uploads/rkWmvqfnZx.png)
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
