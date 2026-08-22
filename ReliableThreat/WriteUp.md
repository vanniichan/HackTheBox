![image](https://hackmd.io/_uploads/ryJAtRUwzx.png)
Chúng ta phát hiện một sự cố bảo mật nghiêm trọng liên quan đến việc mã nguồn bị lộ trái phép. Một nhân viên bị nghi ngờ có liên quan, nhưng người này phủ nhận và cho biết không tải hoặc cài đặt phần mềm bên ngoài. Chúng ta cần điều tra để xác định nguyên nhân rò rỉ, làm rõ trách nhiệm và đưa ra giải pháp xử lý phù hợp
# ReliableThreat
## Sherlock info
Name |ReliableThreat
|-|-|
Difficulty| Medium
Category | DFIR|
## Note from Scenario
Máy tính của người dùng bị xâm nhập thông qua một extension độc trên Visual Studio Code. Extension này chứa JavaScript được obfuscate nhằm thực thi mã độc khi được kích hoạt. Attacker tiếp tục tạo persistent bằng cách thay đổi Registry thông qua COM Hijacking. Sau khi có quyền kiểm soát, attacker tiến hành tìm kiếm các project trên máy và phát hiện một Git repository Laravelsau đó đã chỉnh sửa file biến nó thành webshell
## Artifacts
- File mem
- File `.ad1` thường được tạo bởi FTK Imager

![image](https://hackmd.io/_uploads/SJdZq08vfl.png)
## Tools use
- FTK Imager
- voltility
- git
- REMNux
- VirusTotal
- ChatGPT

>### Comment
> Hôm nay sẽ speedrun bài này xem có xong luôn trong ngày thứ 7 này không :)) Đây là bài được ôn lại kỹ năng for dùng git

# Question
1. What is the application that starts the suspicious chain of processes?
2. Provide the full path of the malicious file used to gain initial access.
3. What user input, when executed, will run the malicious code?
4. What are the hostname and port used to establish a reverse shell?
5. What is the display name of the developer who created this malicious file?
6. What time was the malicious file released? (UTC)
7. Provide the SID for the user who has been compromised.
8. Provide the full path of the suspicious executable being run during the infection chain.
9. The threat actor has modified the Windows registry to include a new entry. This change ensures that whenever a legitimate component runs, it triggers the malicious process, allowing the threat actor to maintain control of the system. Specify the name of the legitimate component.
10. Which MITRE technique corresponds to the previous action?
11. The threat actor has identified the location for all projects and manipulated one of the project files. Could you provide details about the malicious code that was added by the threat actor?
# Analysis
Hầu hết các câu hỏi đầu đều yêu cầu phân tích memory trước, vì vậy chúng ta sẽ đi sử dụng vol.py trước

Xác định profile trước, ta xác định được đây là bản dump đến từ Windows 10 built 15063
![image](https://hackmd.io/_uploads/HkFYlJDvGx.png)
```
vol.py -f memdump.dmp --profile=Win10x64_15063
```
## 1. What is the application that starts the suspicious chain of processes?
Đầu tiên xác định xem có process độc nào đang chạy không:
![image](https://hackmd.io/_uploads/H1IgfJvvfe.png)
Ảnh trên cho thấy bị lỗi gì đó, sử dụng `ChatGPT` thì nó bảo lỗi profile :))
![image](https://hackmd.io/_uploads/HkEwG1vwzg.png)
Đúng là như vậy, sau khi chuyển sang `Win10x64` nó ra khác hơn. Oke, dùng `Win10x64_18362` là ngon nhất
![image](https://hackmd.io/_uploads/SyMrmkvvfe.png)
Câu hỏi đã gợi ý **application that starts the suspicious chain of processes** nên ta sẽ dùng `pstree` để xem cha con
![image](https://hackmd.io/_uploads/HyxWBkvvMe.png)
Có thể thấy `Code.exe` của VSCode khá là bất thường nhất khi sinh ra 1 lúc nhiều process y hệt nó, đồng thời gọi cả `cmd.exe` (ưu tiên chứ không phải bất thường, cần phân tích thêm)
Có thể thấy `Code.exe` của VSCode có dấu hiệu khá đáng chú ý, đặc biệt là việc tạo nhiều process cùng tên đồng thời gọi `cmd.exe`. Tuy nhiên, đây chưa đủ cơ sở để kết luận là bất thường, vì VSCode vốn sử dụng `cmd.exe`
## 2. Provide the full path of the malicious file used to gain initial access
Vì đang nghi ngờ `Code.exe` nên sẽ phân tích cụ thể con này trước. Đầu tiên xem path của nó có nằm ở vị trí bất thường không bằng `filescan`

Khi `grep` `Code.exe` lại không có kết quả gì. Search rộng theo kiểu `vcsode`, thấy được nhiều file extension, chú ý nhất có 2 file:
- devsense.php.ls.exe (file `.exe` thì để ý)
- 0xs1rx58d3v.chatgpt-b0t-0.0.1 (có ký tự `0` nên để ý)

Search gg với file `devsense.php.ls.exe` trônng có vẻ bình thường
![image](https://hackmd.io/_uploads/ryx0_1wPGg.png)

Ngược lại thì `0xs1rx58d3v.chatgpt-b0t-0.0.1` ra cả writeup bài nên khả năng đây là đáp án. Full path của file này:
```
\Device\HarddiskVolume3\Users\User2\.vscode\extensions\0xs1rx58d3v.chatgpt-b0t-0.0.1
|
|
v
C:\Users\User2\.vscode\extensions\0xs1rx58d3v.chatgpt-b0t-0.0.1 
```
Search gg thấy đây là [extension độc bị xóa khỏi Marketplace](https://github.com/microsoft/vsmarketplace/blob/main/RemovedPackages.md)
![image](https://hackmd.io/_uploads/BkmRPQPwzg.png)
## 3. What user input, when executed, will run the malicious code?
Câu này khá khoai khi dùng `cmdline` chưa thấy kết quả. Tuy nhiên ta lại khai thác được cục vàng mới đó là `RuntimeBroker.exe` lại nằm ở path lạ được gọi từ `cmd.exe` với pid đã thấy ở trên (độc)
![image](https://hackmd.io/_uploads/Bkfsn1wPfl.png)
Vì chưa được tiếp xúc với kiểu extension trên VScode gây thực thi nên mình có tìm hint đó là đọc trực tiếp file `.js` kia

Get file về với `dumpfiles`. Mặc dù báo lỗi nhưng ta vẫn dump file về được
![image](https://hackmd.io/_uploads/ry4fVxPPMe.png)
File `.js` có một đoạn obfuscate rất sus:
![image](https://hackmd.io/_uploads/SkVrVMPDMx.png)
Đem lên ChatGPT nhờ nó phân tích đoạn này xem có được không. Khi user chạy `help` đoạn code obfuscate sẽ được thực thi. Tuy nhiên cmd lại không được ghi nhận. Khá là ảo, cái này mình cần tìm hiểu thêm :v
![image](https://hackmd.io/_uploads/rkcONGPvMx.png)
Thông tin khi chạy lệnh `help` trên:
- Tạo file `.lock` để thực thi mã độc và tránh tạo nhiều kết nối tới C2
![image](https://hackmd.io/_uploads/ByKvrMwDGl.png)
- Tạo kênh đến C2 `6.tcp.eu.ngrok.io` với port `1337`
![image](https://hackmd.io/_uploads/ByDqSfwPMe.png)
- Tạo reverse shell
![image](https://hackmd.io/_uploads/ByXyLzDDzg.png)
## 4. What are the hostname and port used to establish a reverse shell?
Câu trả lời đã có từ [Q3](#3-What-user-input-when-executed-will-run-the-malicious-code)
## 5. What is the display name of the developer who created this malicious file?
Từ [Q2](#2-Provide-the-full-path-of-the-malicious-file-used-to-gain-initial-access) ta cũng có đáp án từ tên nằm ở folder chứa extension với người tạo ra là tác giả bài Sherlock luôn
![image](https://hackmd.io/_uploads/SJDh8fPwMg.png)
## 6. What time was the malicious file released? (UTC)
[Q2](#2-Provide-the-full-path-of-the-malicious-file-used-to-gain-initial-access)
## 7. Provide the SID for the user who has been compromised
Plugin `getsids` hỗ trợ ta thấy được SID + việc xác định nguồn nhiễm chạy từ `Code.exe` ta sẽ xác định được + `User2` vì extension tồn tại trên folder của profile này
![image](https://hackmd.io/_uploads/SkLkoXwPGg.png)
## 8. Provide the full path of the suspicious executable being run during the infection chain
Ở [Q3](#3-What-user-input-when-executed-will-run-the-malicious-code) ta thấy process độc lạ là `RuntimeBroker.exe`
## 9. The threat actor has modified the Windows registry to include a new entry. This change ensures that whenever a legitimate component runs, it triggers the malicious process, allowing the threat actor to maintain control of the system. Specify the name of the legitimate component
Đến câu này đổ đi khả năng sẽ phân tích từ file `.ad1`

Với câu hỏi trên, ta sẽ xem thường nó modify vàoi giá trị nào trên Registry, đồng thời Q10 cũng có đề cập đến. Hỏi ChatGPT
![image](https://hackmd.io/_uploads/BkTj27wPGg.png)
Kỹ thuật được lợi dụng khả năng cao là **COM Hijacking**. Tuy nhiên kỹ thuật này việc detect với file dump khá là mất thời gian vì `GUID` rất nhiều

Một cách để có được thông tin này đó là cầu may các sandbox hoặc các platform đã từng chạy mã độc trước đó để xác định. Dump file hoặc lấy hash file độc trước. Có mỗi file là `Temp.exe`, có vẻ chính là nó
![image](https://hackmd.io/_uploads/SytpgNvPGe.png)
Upload lên VT
![image](https://hackmd.io/_uploads/S1wZXVvwGx.png)
Search gg cho thấy GUID này là của `Recycle Bin`
![image](https://hackmd.io/_uploads/H1IKE4PPMx.png)
## 10. Which MITRE technique corresponds to the previous action?
Đã xác định từ [Q9](#9-The-threat-actor-has-modified-the-Windows-registry-to-include-a-new-entry-This-change-ensures-that-whenever-a-legitimate-component-runs-it-triggers-the-malicious-process-allowing-the-threat-actor-to-maintain-control-of-the-system-Specify-the-name-of-the-legitimate-component) kỹ thuật tương đương với **T1546.015**
![image](https://hackmd.io/_uploads/ByNqHNvPGe.png)
## 11. The threat actor has identified the location for all projects and manipulated one of the project files. Could you provide details about the malicious code that was added by the threat actor?
Câu này là câu ảo ma nhất vì cho mình ôn lại for git nên thấy nó kéo độ khó lên Medium =))

Vì attacker compromised `User2` nên đã sửa file trong `Project`. Get folder này về trước. Dùng lệnh dưới có mục đích báo cho Git rằng ta tin tưởng folder repository này, để Git cho phép thực hiện các thao tác như `git log`, `git status`, `git checkout`... dù owner của folder không trùng với user hiện tại
```
git config --global --add safe.directory "C:/Users/DELL/Desktop/ReliableThreat/Project/laravel-11.1.4"
```
Sử dụng `git log` để xem các sự thanh đổi của từng repo, một trong số đó:
![image](https://hackmd.io/_uploads/BJl_4IDvMe.png)
`laravel-11.1.4` có thay đổi lớn vì đây là repository được chỉnh sửa gần đây nhất. Sử dụng `git diff` để tìm những thay đổi mới nhất đối với repository và xuất hiện code PHP sú này:
![image](https://hackmd.io/_uploads/Sy3LVIwDMl.png)
Đoạn code từ ảnh trên đang sửa code ở `public/index.php` biến nó thành webshell với query
```
http://target/index.php?s1=<command>
```

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
