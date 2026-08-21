![image](https://hackmd.io/_uploads/Hk2VK0Hr1e.png)

Máy chủ Windows của họ có khả năng đã bị tấn công thông qua lỗ hổng MOVEit CVE đang bị khai thác ngoài thực tế. Họ cung cấp các artifact từ quá trình triage để điều tra cách thức exploit, xác định hành động của attacker và thu thập thông tin phục vụ việc triển khai vào SOC. Trong số các artifact có một memory dump nhưng bị thiếu file VMSS, vì vậy có thể cần thực hiện phân tích memory forensic từ những dữ liệu cơ bản hiện có
# i-like-to
## Sherlock info
Name |i-like-to
|-|-|
Difficulty| Easy
Category | DFIR|
## Note from Scenario
Attacker scan từ địa chỉ IP nội bộ 10.255.254.3 để dò tìm hệ thống MOVEit Transfer với chuỗi khai thác của CVE-2023-34362. Sau khi khai thác thành công, attacker có được quyền truy cập vào hệ thống MOVEit và tiếp tục thực hiện các hoạt động sau khai thác, bao gồm truy cập các endpoint của ứng dụng và triển khai webshell để duy trì khả năng thực thi từ xa. Đồng thời, attacker đã compromise tài khoản moveitsvc, thể hiện qua các hoạt động brute-force trước đó và RDP vào hệ thống mover. Từ PowerShell history, attacker sử dụng wget để tải webshell từ một nguồn bên ngoài thay vì sử dụng chức năng upload của MOVEit. Sau khi có foothold, attacker tiếp tục thực thi các hoạt động trên máy chủ, trong đó Microsoft Defender phát hiện iis.exe và moveit.asp
## Artifacts
- Folder `Triage` từ KAPE
- File `moveit.sql` có vẻ là file làm việc của MOVEit
![image](https://hackmd.io/_uploads/r1gy6lNvzx.png)
- File vmem dùng phân tích memory để trả lời các câu hỏi phía sau
![image](https://hackmd.io/_uploads/HyWHplEPGx.png)
## Tools use
- REMnux
- MFTExplorer
- ChatGPT
- strings
- chainsaw

>### Comment
> Thấy webshell là thích

# Question 
1. Name of the ASPX webshell uploaded by the attacker?
2. What was the attacker's IP address?
3. What user agent was used to perform the initial attack?
4. When was the ASPX webshell uploaded by the attacker?
5. The attacker uploaded an ASP webshell which didn't work, what is its filesize in bytes?
6. Which tool did the attacker use to initially enumerate the vulnerable server?
7. We suspect the attacker may have changed the password for our service account. Please confirm the time this occurred (UTC)
8. Which protocol did the attacker utilize to remote into the compromised machine?
9. Please confirm the date and time the attacker remotely accessed the compromised machine?
10. What was the useragent that the attacker used to access the webshell?
11. What is the inst ID of the attacker?
12. What command was run by the attacker to retrieve the webshell?
13. What was the string within the title header of the webshell deployed by the TA?
14. What did the TA change the our moveitsvc account password to?
# Analysis
Như bài đề cập, bước đầu tiên là kiểm tra source code của file `moveit.sql` nhằm xác định phiên bản MOVEit Transfer đang được sử dụng. Từ đó có thể đối chiếu với các CVE đã biết để xác định lỗ hổng bị khai thác
![image](https://hackmd.io/_uploads/SJazHymPzx.png)
Ném cho ChatGPT phân tích lại biết được đây là của audit log của MOVEit Transfer, cụ thể là log ghi lại các hoạt động trong hệ thống MOVEit
![image](https://hackmd.io/_uploads/ryd8rJ7Pfe.png)
Trong log, ta phát hiện IP nội bộ `10.255.254.3` thực hiện các hành vi tấn công, qua đó trả lời được **Q2**
![image](https://hackmd.io/_uploads/ryU5BJ7Dzl.png)
Để thuận tiện cho việc phân tích, log được parse và đưa vào Timeline Explorer. Từ đây có thể xác định user-agent được sử dụng để thực hiện hoạt động scan là `Ruby` (**Q3**)
![image](https://hackmd.io/_uploads/Bym8fJ4wfl.png)
Ngoài ra, bảng dữ liệu còn cho thấy giá trị InsID là `1234` (**Q11**)
![image](https://hackmd.io/_uploads/By8Ozr4vfg.png)
Từ nội dung log có thể thấy attacker đang nhắm tới API `/Messages/Global Messaging`, một thành phần liên quan đến chuỗi khai thác của lỗ hổng unauthenticated SQL injection **CVE-2023-34362**
![image](https://hackmd.io/_uploads/ryfNN1NPMx.png)
> CVE-2023-34362 là lỗ hổng nghiêm trọng trong Progress MOVEit Transfer. Attacker từ xa có thể lợi dụng cách ứng dụng xử lý HTTP request và session để vượt qua các cơ chế kiểm soát, sau đó khai thác SQL injection nhằm leo thang đặc quyền lên mức quản trị viên. Đây là một exploit chain bao gồm nhiều vấn đề bảo mật khác nhau và đã được khai thác thực tế trong nhiều chiến dịch tấn công

Tại `Triage\uploads\auto\C%3A\inetpub`, access log ghi nhận nhiều hành vi đáng ngờ như hoạt động scan bằng Nmap (**Q6**) cũng như truy cập vào nhiều endpoint và file hệ thống của MOVEit, chẳng hạn `human.aspx`
![image](https://hackmd.io/_uploads/SJW5cyNDfg.png)
Hiện chỉ có `move.aspx` (**Q1**) và `moveit.asp` là webshell, các file còn lại đều là file hệ thống. Từ access log có thể xác định user-agent được attacker sử dụng để tương tác với webshell là: `Mozilla/5.0+(X11;+Linux+x86_64;+rv:102.0)+Gecko/20100101+Firefox/102.0` (**Q10**)

Đối với file `moveit.asp`, phân tích MFT cho thấy file có kích thước `1362` byte (**Q5**). Lý do tại sao attacker không sử dụng được ở dưới sẽ có câu trả lời
![image](https://hackmd.io/_uploads/ByLqHlEPfe.png)
Access log không cung cấp thời điểm chính xác webshell được tạo. Do đó, MFT được sử dụng để xác định timestamp đáng tin cậy nhất, cho thấy file xuất hiện vào thời điểm `2023-07-12 11:24:30` (**Q4**)
![image](https://hackmd.io/_uploads/BklTmg4PMg.png)

> Đang đúng theo chain của chuỗi khai thác

Các bản ghi trong `inetpub` cũng cho thấy nhiều dấu hiệu cho thấy chuỗi khai thác CVE-2023-34362 đã thành công
![image](https://hackmd.io/_uploads/HJ99CJEvGg.png)
Đối chiếu với báo cáo của Rapid7:
![image](https://hackmd.io/_uploads/HyS5fgNDGe.png)

Để trả lời các câu hỏi liên quan đến những lệnh đã được thực thi trên hệ thống, ta chuyển sang phân tích lịch sử command, một trong file đó là `ConsoleHost_history.txt` của PowerShell

Tại profile của user `moveitsvc.WIN-LR8T2EF8VHM.002`, lịch sử lệnh cho thấy attacker đã sử dụng `wget` để tải webshell từ bên ngoài về máy. Điều này cho thấy webshell không được đưa lên hệ thống thông qua chức năng upload của ứng dụng mà được tải trực tiếp từ một nguồn bên ngoài (**Q12**)
![image](https://hackmd.io/_uploads/S1JlESEvfe.png)
Từ các dấu vết thu thập được có thể kết luận tài khoản `moveitsvc.WIN-LR8T2EF8VHM.002` đã bị compromise
![image](https://hackmd.io/_uploads/rJBa49NPMe.png)
Không thu thập thêm được nhiều thông tin từ lịch sử PowerShell, vì vậy ta tiếp tục phân tích Windows Event Log. Sử dụng Chainsaw với `hunt` giúp nhanh chóng xây dựng bức tranh tổng quan về hoạt động của attacker:
```
C:\Users\DELL\Desktop\chainsaw>chainsaw_x86_64-pc-windows-msvc.exe hunt -s .\sigma -r .\rules --mapping ./mappings/sigma-event-logs-all.yml "C:\Users\DELL\Desktop\iliketo\Triage\Triage\uploads\auto\C%3A\Windows\System32\winevt" -o a.chainsaw
```
Kết quả phân tích cho thấy:
- Một tài khoản mới được tạo vào thời điểm `2023-06-13 10:01:05` trên hệ thống `WIN-LR8T2EF8VHM`, phù hợp với các lệnh đã xuất hiện trong `ConsoleHost_history.txt`
![image](https://hackmd.io/_uploads/rJTbA5EvMg.png)

- Microsoft Defender phát hiện hai file độc hại:
	+ `iis.exe` tại thời điểm `2023-07-12 11:03:40`
![image](https://hackmd.io/_uploads/SJWYmVSwzg.png)
	+ Webshell `moveit.asp` tại thời điểm `2023-07-12 11:16:35`. Đây nhiều khả năng là nguyên nhân khiến attacker không thể tiếp tục sử dụng webshell này
![image](https://hackmd.io/_uploads/Bk0o7ErDMe.png)

- Các sự kiện đăng nhập cho thấy attacker thực hiện brute-force đối với tài khoản `moveitsvc` và `administrator` trên thiết bị `mover`, bắt đầu từ `2023-06-13 08:00:04` và đăng nhập thành công qua RDP vào lúc `2023-07-12 11:11:18` (**Q8**, **Q9**)
![image](https://hackmd.io/_uploads/Sk1tEEBvzg.png)

- Event ID `4724` cho thấy mật khẩu của tài khoản đã bị reset vào thời điểm `2023-07-12 11:09:27` (**Q7**)
![image](https://hackmd.io/_uploads/rJfkFNHDGl.png)

Đối với hai câu hỏi cuối, MFT không thể cung cấp nội dung file do webshell có kích thước lớn hơn giới hạn dữ liệu resident (khoảng dưới 700 byte). Vì vậy, cần tiếp tục phân tích memory dump để thu thập nội dung và trả lời các câu hỏi còn lại
![image](https://hackmd.io/_uploads/HyacQdrDMx.png)
Đợi cả tiếng mà vẫn không chạy ra image info nên sử dụng `strings` cầu may
![image](https://hackmd.io/_uploads/H1A3eLBwMe.png)
```
strings I-like-to-27a787c5.vmem | grep "move.aspx"
```
Tương tự với **Q14**
```
root@remnux:/home/remnux/Desktop# strings I-like-to-27a787c5.vmem | grep "moveitsvc"
```
![image](https://hackmd.io/_uploads/SyQNXUSvfx.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/Byp0QLrDzx.png)
