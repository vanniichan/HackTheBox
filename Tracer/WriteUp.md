![image](https://hackmd.io/_uploads/SJ6LdG8Vyx.png)

A junior SOC analyst on duty has reported multiple alerts indicating the presence of PsExec on a workstation. They verified the alerts and escalated the alerts to tier II. As an Incident responder you triaged the endpoint for artefacts of interest. Now please answer the questions regarding this security event so you can report it to your incident manager.

# Tracer
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Easy
Category | DFIR|

## Note from Scenario
- Nothing

## Tools use
- EvtxECmd
- MFTECmd
- PECmd
- Timeline Explorer

>### Comment
> Bài này tác giả đã có một blog phân tích rất kỹ và hay cho cả người mới học và các chức năng của từng bằng chứng hiện có

# Question 
1. The SOC Team suspects that an adversary is lurking in their environment and are using PsExec to move laterally. A junior SOC Analyst specifically reported the usage of PsExec on a WorkStation. How many times was PsExec executed by the attacker on the system?
2. What is the name of the service binary dropped by PsExec tool allowing attacker to execute remote commands?
3. Now we have confirmed that PsExec ran multiple times, we are particularly interested in the 5th Last instance of the PsExec. What is the timestamp when the PsExec Service binary ran?
4. Can you confirm the hostname of the workstation from which attacker moved laterally?
5. What is full name of the Key File dropped by 5th last instance of the Psexec?
6. Can you confirm the timestamp when this key file was created on disk?
7. What is the full name of the Named Pipe ending with the "stderr" keyword for the 5th last instance of the PsExec?

# Analysis 
Để biết nó đã được thực thi bao nhiêu lần trên hệ thống, chúng ta có thể sử dụng các file prefetch nằm trong đường dẫn `C:\Windows\Prefetch`.

> Các file prefetch được Windows sử dụng để lưu trữ thông tin liên quan đến hoạt động của phần mềm, bao gồm số lần chạy một phần mềm nhất định. Windows tạo tệp file prefetch mỗi lần bạn chạy ứng dụng lần đầu tiên. Những file này giúp Windows khởi động nhanh hơn rất nhiều.

![image](https://hackmd.io/_uploads/ByV8z3bSJe.png)

Để phân tích tệp này, chúng ta sẽ sử dụng công cụ **PECmd** 

```
PECmd.exe -f "PSEXESVC.EXE-AD70946C.pf" --csv "<Đường dẫn đầu ra>"
```

Sau khi lấy được tệp `csv`, chúng ta có thể mở nó và chuyển đổi nó thành Excel để có thể xem nó dưới dạng bảng và truy cập nhanh chóng thông tin mà chúng ta quan tâm.

Trong trường hợp này, chúng ta có thể thấy rằng nó được thực thi tổng cộng **9** lần (**RunCount**):

![image](https://hackmd.io/_uploads/rJwnf2Zr1x.png)

Từ trên ta cũng có thể biết được tên file binary là **PsExecSVC.exe**

![image](https://hackmd.io/_uploads/HJiPm2WS1x.png)

Đầu tiên trong số đó là nơi chúng ta lấy thông tin ban đầu và bây giờ chúng ta sẽ sử dụng thông tin thứ hai, `PECmd_Output_Timeline.csv`, để tìm hiểu thời gian thực hiện.

Sau đó, chúng ta phát hiện ra rằng lần thứ năm PsExec được thực thi là vào lúc **09/07/2023 12\:06:54**

![image](https://hackmd.io/_uploads/Bklum2-HJx.png)

Tương tự ở trên thì ta cũng có thể biết được tên máy chủ mà TA thực hiện Lateral Movement, đó là **Forela-Wkstn001** 

![image](https://hackmd.io/_uploads/r1msmnWSkx.png)

Câu hỏi tiếp theo có liên quan đến câu hỏi trước, chúng ta phải tính đến việc chúng ta đã biết trước ở câu hỏi số 3 rằng lần thực thi PsExec thứ năm diễn ra vào ngày **07/09/2023 12\:06:54**. Rất có thể hành động thả tệp diễn ra ngay sau khi thực thi PsExec thứ năm này.

Để phân tích phần này, chúng ta sẽ sử dụng bằng chứng trong **\$Extend**, cụ thể là chúng ta sẽ kiểm tra **\$J** bằng **MFTECmd**

```
MFTECmd.exe -f '$J'  --csv bằng chứng.csv
```

Sau khi mở nó, chúng ta có thể lọc trực tiếp các sự kiện xảy ra lúc 12:06 ngày 7 tháng 9 như sau

![image](https://hackmd.io/_uploads/ry7EN3-rkl.png)

Về các kết quả thu được, chúng ta có thể thấy rằng nhiều kết quả trong số đó đề cập đến việc tạo file, điều mà chúng ta quan tâm

![image](https://hackmd.io/_uploads/HkwSVnWrJe.png)

Nếu chúng ta chỉ lọc theo các sự kiện tạo tệp này, chúng ta sẽ tìm thấy một số file và trong số đó sẽ có tệp chính **PSEXEC-FORELA-WKSTN001–95F03CFE.key** 

![image](https://hackmd.io/_uploads/B1Pw43ZrJg.png)

Chúng ta có thể tìm ra trong cột `UpdateSequenceNumber` khi nó được tạo: **07/09/2023 12\:06:55**.

![image](https://hackmd.io/_uploads/BJGY43br1e.png)

Để xem các cuộc tấn công liên quan đến **Named Pipe** thì trong sysmon có 2 event id đó là 17 và 18 tượng trưng cho các event tạo **Named Pipe** và **Named Pipe** thành công. Vì vậy, chúng ta sẽ xem ở **Windows Event Viewer**

![image](https://hackmd.io/_uploads/SJ5ANnbrJx.png)

Chúng ta biết trước từ câu hỏi ở câu hỏi 6 rằng thời gian tạo file là **12:06** nên khi tính đến việc điều chỉnh thời gian chúng ta tìm được 3 kết quả tương ứng với **stdin, stdout và stderr**

![image](https://hackmd.io/_uploads/SJVeHhWSJe.png)

Do đó, kết quả là **\PSEXESVC-FORELA-WKSTN001–3056-stderr**

# Answer
1. 9
2. psexesvc.exe
3. 07/09/2023 12\:06:54
4. Forela-Wkstn001
5. PSEXEC-FORELA-WKSTN001-95F03CFE.key
6. 07/09/2023 12\:06:55
7. \PSEXESVC-FORELA-WKSTN001-3056-stderr

------------------------------------------ Kết thúc Sherlock! ------------------------------------------
![image](https://hackmd.io/_uploads/SypQ6DWH1g.png)
