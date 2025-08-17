![image](https://hackmd.io/_uploads/S1ajeuJKle.png)

Gladys is a new joiner in the company, she has recieved an email informing her that the IT department is due to do some work on her PC, she is guided to call the IT team where they will inform her on how to allow them remote access. The IT team however are actually a group of hackers that are attempting to attack Forela.

# TickTock
## Sherlock info
Name |TickTock
|-|-|
Difficulty| Medium
Category | DFIR|

## Note from Scenario
- Thực hiện tấn công bằng C2 
- Hoạt động liên quan đến cố gắng mã hóa (Ransomwere)

## Tools use
- EvtxECmd.exe
- Timeline Explorer
- CyberChef
- ChatGPT

>### Comment
> Lâu lâu quay lại làm tí

# Question 
1. What was the name of the executable that was uploaded as a C2 Agent?
2. What was the session id for in the initial access?
3. The attacker attempted to set a bitlocker password on the `C:` drive what was the password?
4. What name was used by the attacker?
5. What IP address did the C2 connect back to?
6. What category did Windows Defender give to the C2 binary file?
7. What was the filename of the powershell script the attackers used to manipulate time?
8. What time did the initial access connection start?
9. What is the SHA1 and SHA2 sum of the malicious binary?
10. How many times did the powershell script change the time on the machine?
11. What is the SID of the victim user?

# Analysis
## Initial Analysis
Vì EventLog rất hữu ích nên ta bước đầu tiên là parse nó ra trước
```
C:\Users\DELL\Desktop\ticktock\Collection\C\Windows\System32\winevt\logs>EvtxECmd.exe -d . --csv .
```

## SID victim user
Mục đích của tìm SID khá đơn giản:
- Định danh chính xác user
- Mapping log với user: Trong Event Log (Security, Sysmon, AppLocker…), nhiều sự kiện chỉ lưu SID, không lưu username rõ ràng
- Xác định thư mục profile tương ứng: Mỗi SID có thư mục trong C:\Users\ (ví dụ C:\Users\gladys gắn với SID ...-1001)
- Khi hunting IOC (indicator of compromise), dùng SID sẽ chính xác hơn username
- Một số kỹ thuật T.A dùng để tạo user giả mạo / đổi username, nhưng DFIR vẫn có thể dựa vào SID để nhận diện là cùng một tài khoản.

Với cả đốg lợi ích trên, ta sẽ đi tìm SID

![image](https://hackmd.io/_uploads/Bycbz5yKxl.png)

## merlin.exe 
### MPDetection-05032023-114843.log
Ở câu hỏi đầu tiên ta sẽ tìm C2 Agent (tức là file được T.A gán vào mail để phishing), điều đầu tiên ta có thể làm là kiểm tra Defender xem nó có bắt được file nào không. 

> Vì Sherlock này có mỗi con AV này và tùy thuộc vào độ may mắn trong thực tế khi file này được các con AV này bắt. Tốt nhất khi được cho có thì vẫn nên check

![image](https://hackmd.io/_uploads/HJgGiYyFex.png)

Một số thông tin có thể confirm đây là 1 C2 Agent [tại đây](https://merlin-c2.readthedocs.io/en/latest/) 

![image](https://hackmd.io/_uploads/rkpyS_JFee.png)

Ta sẽ lấy IoCs, cụ thể là SHA phục vụ mục đích sau này và cũng để trả lời cho câu hỏi số 9

![image](https://hackmd.io/_uploads/H1bEhFkYxg.png)

### MPLog-07102015-052145.log
Với ảnh trên ta chỉ đúng được 1 nửa và nửa còn lại mình phải tìm hint mới hiểu nó là gì =)) ta sẽ lấy nó ở log defender tiếp

![image](https://hackmd.io/_uploads/SJRbatyKeg.png)

:::info
Nhiều công cụ, CSDL cũ (SIEM, AV, threat feed) vẫn lưu IOC bằng SHA1. Đó là lý do phải tìm cả 2 
:::

### Network connection
Nhìn bên dưới ta thấy được luôn nó đang thực hiện kết nối ra bên ngoài vốn đặc tính của C2) 

![image](https://hackmd.io/_uploads/r1QZy9yYge.png)

Kiểm tra nội dung của log cũng thấy được nó đang kết nối về IP `52.56.142.81`

![image](https://hackmd.io/_uploads/rkuLy9yKgl.png)

## powershell.exe
:::info
Việc set bitlocker password BitLocker chỉ có thể được bật qua các API / công cụ Windows sẵn có, nên các process ngoài không thể “tự nghĩ ra” cách khác ngoài việc gọi lại các API hoặc công cụ chuẩn

Có 2 cách mà T.A sẽ set BitLocker:
- Gọi command line tool (`manage-bde.exe`)
- Gọi trực tiếp Windows API / PowerShell cmdlet
:::

Từ thông tin trên, ta tìm `manage-bde.exe` từ EventLog không thấy xuất hiện, nên khả năng cao T.A đã sử dụng PowerShell

![image](https://hackmd.io/_uploads/rJs_Ws1Ygx.png)

Sử dụng Cyberchef decode

![image](https://hackmd.io/_uploads/BJGleiJYle.png)

## Invoke-TimeWizard.ps1
### ConsoleHost_history.txt
Khi nói đến việc thực thi file PS thi ta có thể nghĩ ngay đến một file chuyên lưu lịch sử thực thi và chạy file PS, đó chính là `ConsoleHost_history.txt`

![image](https://hackmd.io/_uploads/H1l1_u1Yex.png)

> Nhìn tên file thôi cũng biết nó định làm gì rồi =))

### EvtxECmd_Output.csv
Nội dung file này trên mạng chưa có. Tuy nhiên, để sau có thể xử lí nhanh khi gặp lại hoặc nâng cấp rule ta có thể tìm hiểu thêm về hành vi script này làm gì.

Phân tích ở hình dưới có thể thấy Event Log cũng nhận ra hành vi thay đổi thời gian. Cụ thể, `Invoke-TimeWizard.ps1` đang thay đổi thời gian và được chạy bởi file `TeamView.exe`, điều đáng ngờ file này lại ở `/Temp` nên đây  chắc chắn là file giả mạo mà T.A cho vào hệ thống thực hiện remote

![image](https://hackmd.io/_uploads/B1TzZFkFel.png)

## Event ID: 4616 
Câu hỏi tiếp theo hỏi về file PS đã thay đổi thời gian bao nhiêu lần trên máy. Để trả lời cho câu hỏi này ta tìm đến event thông báo về việc hệ thống bị thay đổi thời gian

![image](https://hackmd.io/_uploads/Bye9XF1tgl.png)

Sử dụng Timeline Explorer để filter tiếp

![image](https://hackmd.io/_uploads/HJIzFKkYxl.png)

Tiếp tục filter file được chạy bằng `powershell.exe` (vì nó là `.ps1`)

![image](https://hackmd.io/_uploads/ryCFKtyKee.png)

## TeamView.exe
Mặc dù là file giả mạo nhưng không hiểu sao nó lại có cả log cho mình phân tích

### TVNetwork.log
File này nhìn rất khó hiểu nên ta sẽ chuyển qua file `TeamViewer15_LogFile.log`

![image](https://hackmd.io/_uploads/rkHwH5yFgx.png)

### TeamViewer15_LogFile.log
![image](https://hackmd.io/_uploads/HyFgD9ytxl.png)

Sau khi nhờ ChatGPT phân tích hộ log này :)) ta có được thời gian và session id trả lời cho câu hỏi 2 và 8

![image](https://hackmd.io/_uploads/HJrov51tel.png)

#### Name was used by the attacker
Sau khi mò mãi không thấy tên attacker (do câu hỏi lỏ quá) thì mình quyết định dùng hint và nó nằm ở phần log này =))

![image](https://hackmd.io/_uploads/SkwJA9kKex.png)

![image](https://hackmd.io/_uploads/H1exCcktge.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/B1F4CckFex.png)
