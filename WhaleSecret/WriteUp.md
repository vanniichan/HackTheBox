![image](https://hackmd.io/_uploads/HksD2T4ozl.png)
Nhóm của chúng ta đã được gọi đến để điều tra sự cố bảo mật của một ứng dụng web nội bộ. Điều duy nhất chúng ta biết là ứng dụng web đang chạy trên docker. Nhóm đã thu được dữ liệu phân loại cũng như một thư mục quan trọng từ docker đang chạy dịch vụ bị khai thác
# WhaleSecret
## Sherlock info
Name |ReliableThreat
|-|-|
Difficulty| Medium
Category | DFIR|
## Note from Scenario
Thiết bị ảnh hưởng là một web app chạy bằng Docker bị khai thác bởi một CVE. Sau khi khai thác thành công bởi CVE này, attacker thực hiện các hành vi enum hệ thống và tạo revershell để dễ dàng thao tác từ bên ngoài
## Artifacts
- Folder cache sqllab/sqllab_copy/ của Superset
![image](https://hackmd.io/_uploads/rk685TNjMx.png)
- Folder triage từ tool UAC
![image](https://hackmd.io/_uploads/rJSOqa4izl.png)
## Tools use
- Notepad++
- ChatGPT

>### Comment
> Lại thêm 1 bài phân tích artifact linux từ tool [UAC](https://github.com/tclahr/uac). Bài này đánh giá ở mức easy chứ không đến mức medium

# Question
1. What was the IP and port of the vulnerable server?
2. What was the name of the vulnerable software hosted on the system?
3. What was the IP of the malicious threat actor ?
4. What CVE did the malicious actor exploit?
5. What User-Agent did the malicious actor use while exploiting the vulnerability?
6. At what time did the malicious actor first use the exploit?
7. At what time was the first system command executed through the exploit?
8. What was the frst system command executed through the exploit?
9. Which port did the reverse shell connect to?
# Analysis
## 1. Xác định máy nạn nhân
File `ip_addr_show.txt` cho thấy interface `ens33` có địa chỉ:
```
192.168.194.128/24
```
## 2. Xác định dịch vụ bị tấn công
Từ mô tả của Sherlock, thiết bị bị ảnh hưởng là web app chạy bằng Docker. Dựa vào `ss_-tanp.txt`, ta thấy chỉ có **một container duy nhất publish cổng ra host là `8088`**
![image](https://hackmd.io/_uploads/S1ATf9Xofx.png)
Ngoài ra, IP `192.168.194.128` đang mở nhiều port và có kết nối đến một IP lạ là `34.107.243.93` (tiến trình `firefox`). Kết quả từ VirusTotal cho thấy IP này khá khả nghi, ban đầu có thể nghi là C2
![image](https://hackmd.io/_uploads/H1j_zcQszx.png)
> Đây mới chỉ là một manh mối, cần đối chiếu thêm. Kết nối này đến từ `firefox` (hành vi duyệt web thông thường), và như phần sau cho thấy, nguồn tấn công thực sự lại là một IP nội bộ khác

Server có khả năng bị tấn công là:
```
192.168.194.128:8088
```
Tiếp theo, `docker_container_ls_--all_--size.txt` liệt kê các container đang chạy:
![image](https://hackmd.io/_uploads/rJI2usmoMx.png)
Trong số đó có `superset_app` (image `apache/superset:2.0.0`). Đây là container duy nhất mở ra ngoài (`0.0.0.0:8088->8088/tcp` và `[::]:8088->8088/tcp`), trong khi các container còn lại (Postgres, Redis, Celery) chỉ nằm trong mạng Docker
![image](https://hackmd.io/_uploads/SJHd5iXiMe.png)
Vậy **Apache Superset** là dịch vụ có khả năng bị tấn công cao nhất
## 3. Điều tra qua log của Docker
Vì đây là dạng khai thác đi vào từ container nên trên host sẽ không có log tương ứng. Ta điều tra theo **log của Docker**. Docker hỗ trợ cả access log, nằm tại `docker_container_logs_dee3f31ac261.txt`

Dấu hiệu điển hình nhất là user-agent `nmap`, từ đó xác định IP bên ngoài tấn công vào là:
```
192.168.194.129
```
![image](https://hackmd.io/_uploads/SJWGCs7ifg.png)
Tiếp đó xuất hiện user-agent `python-requests/2.26.0`, đặc trưng của script tự động hoặc PoC exploit. Điều này gợi ý attacker đang khai thác theo một CVE cụ thể
![image](https://hackmd.io/_uploads/r1ooe27jfl.png)
Khoanh vùng vào các URI, ta thấy attacker tập trung quét vào các API như `/api/v1/chart`, `/api/v1/database`, ...
## 4. Xác định CVE
Search Google với các keyword thu được từ log:
![image](https://hackmd.io/_uploads/H1X0bnXjfg.png)
Trang kết quả hiển thị PoC của **CVE-2023-27524**:
![image](https://hackmd.io/_uploads/SkzWG2XiGg.png)
> CVE-2023-27524 là lỗ hổng Authentication Bypass / Session Validation trong Apache Superset. Attacker từ xa có thể giả mạo session cookie, đăng nhập với quyền người dùng khác, thậm chí chiếm quyền admin, từ đó truy cập các resource trái phép

Việc khai thác bắt đầu vào lúc:
```
2025-11-01 19:26:14
```
![image](https://hackmd.io/_uploads/BkcTQnXoMe.png)
## 5. Hành vi sau khai thác

Folder `sqllab/sqllab_copy/` chứa cache kết quả truy vấn của SQL Lab. Các file có dạng `pickle(timeout)` rồi `pickle(zlib(pyarrow))`, nên ta giải mã bằng Python
![image](https://hackmd.io/_uploads/Byb2D5Ejze.png)
Lúc **19:27:41**, attacker chạy:
```sql
DROP TABLE IF EXISTS cmd_exec;
CREATE TABLE cmd_exec(...);
COPY cmd_exec FROM PROGRAM 'ls /etc/passwd';
SELECT * FROM cmd_exec;
```
Đây là kỹ thuật `COPY ... FROM PROGRAM` của PostgreSQL để thực thi lệnh hệ thống, và lệnh đầu tiên được chạy là `ls /etc/passwd`

Để tìm bước tiếp theo, ta nhờ AI hỗ trợ phân tích các kết quả còn lại:

![image](https://hackmd.io/_uploads/SkcuEaVoze.png)
Sau khi decode, ta thấy lệnh mà attacker đang cố dùng để tạo một **reverse shell**:
![image](https://hackmd.io/_uploads/Hy3aETEoMx.png)
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/B1zUH6Nifx.png)

