![image](https://hackmd.io/_uploads/HkSxNnVE1g.png)

Torrin is suspected to be an insider threat in Forela. He is believed to have leaked some data and removed certain applications from their workstation. They managed to bypass some controls and installed unauthorised software. Despite the forensic team's efforts, no evidence of data leakage was found. As a senior incident responder, you have been tasked with investigating the incident to determine the conversation between the two parties involved.

# Jingle Bell
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Easy
Category | DFIR|

## Note from Scenario
- 

## Tools use
- sqlite3
- dbbrowser
- chatgpt

>### Comment
> Bài này mình lười v, đáp án thế thôi, easy :(

# Question 
1. Which software/application did Torrin use to leak Forela's secrets? 
2. What's the name of the rival company to which Torrin leaked the data?
3. What is the username of the person from the competitor organization whom Torrin shared information with?
4. What's the channel name in which they conversed with each other?
5. What was the password for the archive server?
6. What was the URL provided to Torrin to upload stolen data to?
7. When was the above link shared with Torrin?
8. For how much money did Torrin leak Forela's secrets?

# Analysis
Unzip ra ta nhận được tree bao gồm các file như sau

![image](https://hackmd.io/_uploads/H1wqqxIEJl.png)

## wpndatabase.db
Được biết đây là file của Sqlite3

![image](https://hackmd.io/_uploads/SyoGslLN1e.png)

Nó có các table được hiển thị bên dưới

![image](https://hackmd.io/_uploads/Hyd7HWLNJx.png)

Các table liệt kê dường như thuộc về một db được sử dụng trong hệ thống **Windows Notification Platform (WNP)** ứng dụng của nó là:
- Ứng dụng Mail hiển thị thông báo email mới.
- Microsoft Teams thông báo tin nhắn hoặc cuộc họp.
- Các ứng dụng từ Microsoft Store sử dụng WNP để hiển thị thông báo cập nhật hoặc nhắc nhở.

Sau khi sử dụng sqlitebrowser thì có một vài table rỗng đó là `TransientTable`, `WNSPushChannel`, `NotificationData`, `HandlerAssets`
![image](https://hackmd.io/_uploads/SJWfbzLEkl.png)

![image](https://hackmd.io/_uploads/SySt4bIEyx.png)

### ádjsd
**Slack**

![image](https://hackmd.io/_uploads/B12BQGLNkl.png)

![image](https://hackmd.io/_uploads/BymvmfINyx.png)

![image](https://hackmd.io/_uploads/BJkEXGLVke.png)

**forela-secrets-leak**

![image](https://hackmd.io/_uploads/S1b1NfLVJg.png)

![image](https://hackmd.io/_uploads/SJlgVM84ke.png)

**PrimeTech Innovations**

![image](https://hackmd.io/_uploads/HyAjGzU4kl.png)

![image](https://hackmd.io/_uploads/SyKaGz8Nkx.png)

**Cyberjunkie-PrimeTechDev**

![image](https://hackmd.io/_uploads/SJ5Nzf8VJl.png)

**Tobdaf8Qip\$re@1**

![image](https://hackmd.io/_uploads/SJWfbzLEkl.png)

https://drive.google.com/drive/folders/1vW97VBmxDZUIEuEUG64g5DLZvFP-Pdll?usp=sharing

![image](https://hackmd.io/_uploads/rymk-GLEJx.png)

**2023-04-20 10\:34:49**

![image](https://hackmd.io/_uploads/HJZfwGU41g.png)

Chuyển đổi [ở đây](https://www.epochconverter.com/)

![image](https://hackmd.io/_uploads/r1pzDM84Jg.png)

£10000

![image](https://hackmd.io/_uploads/HywJMGLEye.png)

![image](https://hackmd.io/_uploads/HyMpUMUN1g.png)


