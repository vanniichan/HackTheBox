![image](https://hackmd.io/_uploads/ByfbGES0gg.png)

Alonzo phát hiện các file lạ trên máy tính của mình. Đánh giá tình hình cho thấy có cơ sở tin rằng một cuộc tấn công Kerberoasting có thể đã xảy ra trong mạng

# Campfire-1
## Sherlock info
Name |Campfire-1
|-|-|
Difficulty| Very easy
Category | DFIR|

## Note from Scenario
Attacker đã dùng một máy workstation để chạy `PowerView.ps1` nhằm thu thập thông tin AD, sau đó chạy `Rubeus.exe` để thực hiện Kerberoasting - yêu cầu TGS cho account dịch vụ `MSSQLService` của `alonzo.spire`, nhận TGS được mã hóa bằng `RC4`, lưu ciphertext rồi sẽ crack offline để lấy mật khẩu service. Hoạt động này được ghi lại cả trên DC (Event ID `4769`) và trên workstation (Event ID `4104`, Prefetch chứa `RUBEUS.EXE`)

## Tools use
- Event Viewer
- PECmd
- Timeline Explorer
- EvtxECmd

>### Comment
> Được phân tích logs từ DC và endpoint nơi hoạt động tấn công Kerberoast, chủ yếu là tìm hiểu về tấn công liên quan đến AD

# Question 
1. Analyzing Domain Controller Security Logs, can you confirm the date & time when the kerberoasting activity occurred?
2. What is the Service Name that was targeted?
3. It is really important to identify the Workstation from which this activity occurred. What is the IP Address of the workstation?
4. Now that we have identified the workstation, a triage including PowerShell logs and Prefetch files are provided to you for some deeper insights so we can understand how this activity occurred on the endpoint. What is the name of the file used to Enumerate Active directory objects and possibly find Kerberoastable accounts in the network?
5. When was this script executed?
6. What is the full path of the tool used to perform the actual kerberoasting attack?
7. When was the tool executed to dump credentials?

# Analysis
## Artifacts
![image](https://hackmd.io/_uploads/ryeF2B0pel.png)
Ta được cung cấp:
1. Security Logs từ DC
2. PowerShell-Operational Logs từ workstation bị ảnh hưởng
3. Prefetch Files từ workstation bị ảnh hưởng

## Domain Controller
### Parse Security Logs
Đầu tiên là parse Security Logs từ DC để phân tích
```
EvtxECmd.exe -f "C:\Users\DELL\Desktop\New folder\Triage\Domain Controller\SECURITY-DC.evtx" --csv "C:\Users\DELL\Desktop\output.csv"
```
![image](https://hackmd.io/_uploads/r1iHCNBAlx.png)

### Event ID 4769 
Event này log khi có một tài khoản yêu cầu vé dịch vụ (TGS) từ Domain Controller (KDC) để truy cập vào một service trong domain

Tấn công Kerberoasting tạo nhiều Event ID **4769** vì attacker yêu cầu vé TGS của tài khoản service để trích xuất hash

![image](https://hackmd.io/_uploads/Sk7ReBBAxg.png)

Trong môi trường thực tế, số lượng event rất lớn, mỗi lần user xác thực với một hệ thống thông qua Kerberos sẽ có khoảng 10 đến 20 request/mỗi user mỗi ngày. Một cách để tìm dấu hiệu của Kerberoasting là kiểm tra số lượng log lớn bất thường đối với một user. Tuy nhiên, với tổng cộng chỉ 16 record ở đây thì có vẻ không khả thi

### RC4 Encrypted TGS
RC4, khóa dùng để mã hóa phần dữ liệu ticket lấy trực tiếp từ NTLM hash của tài khoản dịch vụ tức không có salt. Attacker có thể làm offline brute-force/dictionary attack để phục hồi mật khẩu rất nhanh

Attacker (thường user domain bình thường) yêu cầu TGS cho SPN của tài khoản service. Nếu DC trả vé TGS được mã hóa bằng RC4, attacker ghi lại ciphertext rồi crack offline để lấy mật khẩu tài khoản service

### Attacker manipulates the request to get RC4 Encrypted TGS
Nếu attacker có quyền trên máy client, họ có thể sửa cấu hình Kerberos trên máy đó hoặc dùng công cụ để gửi TGS-REQ với danh sách enctype do họ muốn (ví dụ chỉ gửi RC4) để KDC xử lý

![image](https://hackmd.io/_uploads/HyYCDTSRgl.png)

Tham khảo:
[Kerberoasting Revisited](https://specterops.io/blog/2019/02/20/kerberoasting-revisited/?utm_source=chatgpt.com)
[Kerberoasting: Requesting RC4 Encrypted TGS when AES is Enabled](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/kerberoasting-requesting-rc4-encrypted-tgs-when-aes-is-enabled?utm_source=chatgpt.com)

### Filter RC4 Encrypted TGS
Dựa vào phân tích ở trên, ta sẽ tìm các bản ghi sử dụng RC4 encryption type

![image](https://hackmd.io/_uploads/Hk-cKTSAge.png)

Tham khảo:
[Hunting down DES in order to securely deploy Kerberos](https://learn.microsoft.com/vi-vn/archive/blogs/askds/hunting-down-des-in-order-to-securely-deploy-kerberos)

![image](https://hackmd.io/_uploads/B1G7cTrAxl.png)

Xác định được thời gian vào lúc **2024-05-21 03:18:09** hoạt động kerberoasting bắt đầu xảy ra

Tại trường `service name` ta thấy attacker đang thực hiện Kerberoasting nhắm vào tài khoản dịch vụ của SQL Server trong domain (**MSSQLService**)

![image](https://hackmd.io/_uploads/Sys0qTr0gl.png)

Tại `Event Data` ta đã thấy **172.17.79.129** là IP từ nơi gửi yêu cầu TGS tới KDC tức máy đã yêu cầu ticket cho **MSSQLService**  với mục tiêu nhắm đến là `alonzo.spire`

![image](https://hackmd.io/_uploads/Bylqp26H0xl.png)

![image](https://hackmd.io/_uploads/HJAIJCB0gx.png)

## Workstation
### Analyze Powershell log
Khi nói về script để enum AD thì có script khá nổi tiếng đó là [PowerView](https://github.com/PowerShellMafia/PowerSploit/tree/master/Recon), thường thì sẽ kiểm tra file này có trong workstation trước nhưng mà theo quy trình thì ta sẽ phân tíhc theo event id  : )

Đầu tiên là parse log
```
EvtxECmd.exe -f "C:\Users\DELL\Desktop\New folder\Triage\Workstation\Powershell-Operational.evtx" --csv "C:\Users\DELL\Desktop\output.csv"
```
![image](https://hackmd.io/_uploads/SkPOLArRel.png)

#### Event ID 4104
Thông thường event 4688 sẽ cho biết `powershell.exe` đã được chạy với các tham số nhưng không thể cho biết chính xác nội dung code trong script block. Blog [Investigating PowerShell: Command and Script Logging](https://www.crowdstrike.com/en-us/blog/investigating-powershell-command-and-script-logging/) với event 4104 cho phép ta thấy nội dung script block đó để so với các script trên mạng

![image](https://hackmd.io/_uploads/rJ0HzCBCee.png)

Đúng như dự đoán, đó là **powerview.ps1**

Vào lúc `2024-05-21 03:16:29` attacker bắt đầu chạy lệnh `powershell -ep bypass` để bypass policy sau đó lúc **2024-05-21 03:16:32** script **powerview.ps1** bắt đầu chạy

![image](https://hackmd.io/_uploads/ryBlHRH0gx.png)

### Analyze Prefetch log
Parse log trước
```
>PECmd.exe -d "C:\Users\DELL\Desktop\New folder\Triage\Workstation\2024-05-21T033012_triage_asset\C\Windows\prefetch" --csv "C:\Users\DELL\Desktop\output.csv"
```

Output cho ra kết quả có thể nói là nhiều. Tuy nhiên ta có thể giảm bớt đi bằng cách:
- Như đã phân tichs ở [Filter RC4 Encrypted TGS](#Filter-RC4-Encrypted-TGS) chỉ xảy ra đúng **1** lần Kerberoasting -> chỉ chạy tool đúng **1** lần
- Filter trường `Last Run` vào thời gian `2024-05-21` vì event **Kerberoasting auth** vào cùng ngày
- Filter trường `Previous Run Times` is `null` vì nó chạy có 1 lần

Kết quả filter chỉ còn **24**

![image](https://hackmd.io/_uploads/HJbIMX8Aee.png)

Nổi bật nhất đó là tool **RUBEUS.EXE** nằm ở **C:\USERS\ALONZO.SPIRE\DOWNLOADS\RUBEUS.EXE**

> Một số công cụ có thể dùng để thực hiện Kerberoasting đó là impacket, Rubeus, PowerSploit (Invoke-Kerberoast), nhưng khi được cung cấp prefetch thì nghĩa là 90% là Rubeus vì impacket được viết bằng python và PowerSploit là script PowerShell

![image](https://hackmd.io/_uploads/SyXymmURxx.png)

Vào lúc **2024-05-21 03:18:08**, **RUBEUS.EXE** đã chạy để thực hiện Kerberoasting

![image](https://hackmd.io/_uploads/Bk1jX78Rgl.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/rJ9rHXLRxx.png)

