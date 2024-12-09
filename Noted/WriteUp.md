![image](https://hackmd.io/_uploads/ByfXIJXNkx.png)

Simon, a developer working at Forela, notified the CERT team about a note that appeared on his desktop. The note claimed that his system had been compromised and that sensitive data from Simon's workstation had been collected. The perpetrators performed data extortion on his workstation and are now threatening to release the data on the dark web unless their demands are met. Simon's workstation contained multiple sensitive files, including planned software projects, internal development plans, and application codebases. The threat intelligence team believes that the threat actor made some mistakes, but they have not found any way to contact the threat actors. The company's stakeholders are insisting that this incident be resolved and all sensitive data be recovered. They demand that under no circumstances should the data be leaked. As our junior security analyst, you have been assigned a specific type of DFIR (Digital Forensics and Incident Response) investigation in this case. The CERT lead, after triaging the workstation, has provided you with only the Notepad++ artifacts, suspecting that the attacker created the extortion note and conducted other activities with hands-on keyboard access. Your duty is to determine how the attack occurred and find a way to contact the threat actors, as they accidentally locked out their own contact information.

# Noted
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Easy
Category | DFIR|

## Note from Scenario
- Các vật chứng ở Desktop
- Có thể tìm được contact của TA

## Tools use
- Notepad ++

>### Comment
> Bài này khá dễ, mình tranh thủ trên cty làm hơn 30p (bí ở task 4) cho nên Sherlocks này cũng chỉ rush 

# Question 
1. What is the full path of the script used by Simon for AWS operations?
attacker duplicated some program code and compiled it on the system, knowing that the victim was a software engineer and had all the necessary utilities. 2.They did this to blend into the environment and didn't bring any of their tools. This code gathered sensitive data and prepared it for exfiltration. What is the full path of the program's source file?
3. What's the name of the final archive file containing all the data to be exfiltrated?
4. What's the timestamp in UTC when attacker last modified the program source file?
5. The attacker wrote a data extortion note after exfiltrating data. What is the crypto wallet address to which attackers demanded payment?
6. What's the email address of the person to contact for support?

# Analysis
Unzip ra ta nhận được tree bao gồm các file như sau

![image](https://hackmd.io/_uploads/SkrZUMEN1x.png)

## config.xml
Đầu tiên ở file này ta sẽ lấy được "thứ" sau

![image](https://hackmd.io/_uploads/rkfblhNN1l.png)

Các file ở đây là các file hợp pháp do Simon.Stark tạo ra. Công việc liên quan đến hoạt động AWS là **Migration.pl**

## session.xml
Tại file này sẽ có 2 điểm cần để ý đó là cả hai file từ bản sao lưu đều có ở đây, cùng với nhiều dữ liệu hơn về chúng. Source code được sử dụng để thu thập và giải nén tệp nằm tại **C:\Users\Simon.stark\Desktop\LootAndPurge.java**

![image](https://hackmd.io/_uploads/HJc6xhNVkg.png)

Điều có thể thấy tiếp theo là thời gian file `YOU HAVE BEEN HACKED.txt` này bị modify 

![image](https://hackmd.io/_uploads/BJPmbh4N1g.png)

Sau khi tham khảo hint [tại đây](https://community.notepad-plus-plus.org/topic/22662/need-explanation-of-a-few-session-xml-parameters-values) và [write up của sir 0xdf](https://0xdf.gitlab.io/2024/06/13/htb-sherlock-noted.html) ta sẽ tính được thời gian là
```
>>> (31047188 * pow(2,32)) + (pow(2,32) - 1354503710)
133346660033227234
```
![image](https://hackmd.io/_uploads/H1dvWnNVyg.png)

Thời gian modify file `YOU HAVE BEEN HACKED.txt` là
```
>>> (31047190 * pow(2,32)) + (1536217129)
133346667218915369
```
![image](https://hackmd.io/_uploads/ryriZhVEye.png)

## LootAndPurge.java
File này là source code mà TA để lại, trong đó có data của user bi zip vào file zip có tên **Forela-Dev-Data.zip** với mật khẩu **sdklY57BLghvyh5FJ #fion_7**. Và trong file `YOU HAVE BEEN HACKED.txt` ta sẽ có đường dẫn dẫn đến nơi sau khi nhập mật khẩu sẽ chứa nội dung của TA để lại bao gồm:

- Code ví: **0xca8fa8f0b631ecdb18cda619c4fc9d197c8affca**
- Mail liên hệ: **CyberJunkie@mail2torjgmxgexntbrmhvgluavhj7ouul5yar6ylbvjkxwqf6ixkwyd.onion**

![image](https://hackmd.io/_uploads/Sk-tM3NE1g.png)

# Answer
1. C:\Users\Simon.stark\Documents\Dev_Ops\AWS_objects migration.pl
2. C:\Users\simon.stark\Desktop\LootAndPurge.java
3. Forela-Dev-Data.zip
4. 2023-07-24 09\:53:23
5. 0xca8fa8f0b631ecdb18cda619c4fc9d197c8affca
6. CyberJunkie@mail2torjgmxgexntbrmhvgluavhj7ouul5yar6ylbvjkxwqf6ixkwyd.onion

------------------------------------------ Kết thúc Sherlock! ------------------------------------------

![image](https://hackmd.io/_uploads/SykIzENEJg.png)
