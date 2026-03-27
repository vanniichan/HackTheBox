![image](https://hackmd.io/_uploads/SJMF2UXj-l.png)

Là một startup đang phát triển nhanh, Forela đã sử dụng một nền tảng quản lý doanh nghiệp. Tuy nhiên, tài liệu của còn hạn chế và các quản trị viên cũng chưa thực sự chú trọng đến bảo mật. Với vai trò là nhà cung cấp dịch vụ bảo mật, chúng tôi muốn bạn xem một số dữ liệu PCAP và log để xác nhận liệu hệ thống có (hoặc chưa) bị xâm nhập hay không

# Meerkat
## Sherlock info
Name |Meerkat
|-|-|
Difficulty| Easy
Category | DFIR|
## Note from Scenario
Attacker đã Brute-force thành công một tài khoản sau đó khai thác lỗ hổng bypass Authorize với `CVE-2022-25237` trên ứng dụng `Bonitasoft`. Sau khi chiếm quyền truy cập thành công, attacker đã upload file độc để RCE server và tiến hành tải file độc từ trang `pastes.io`, thực thi qua bash để duy trì quyền truy cập vào hệ thống với nội dung file độc này là cách ghi đè SSH key
## Tools use
- WireShark

>### Comment
> CDSA Preparation path

# Question 
1. We believe our Business Management Platform server has been compromised. Please can you confirm the name of the application running?
2. We believe the attacker may have used a subset of the brute forcing attack category - what is the name of the attack carried out?
3. Does the vulnerability exploited have a CVE assigned - and if so, which one?
4. Which string was appended to the API URL path to bypass the authorization filter by the attacker's exploit?
5. How many combinations of usernames and passwords were used in the credential stuffing attack?
6. Which username and password combination was successful?
7. If any, which text sharing site did the attacker utilise?
8. Please provide the filename of the public key used by the attacker to gain persistence on our host.
9. Can you confirm the file modified by the attacker to gain persistence?
10. Can you confirm the MITRE technique ID of this type of persistence mechanism?
# Analysis
## Exploit and Get access
### Brute-force
Kiểm tra `Conversation` trên `WireShark` ta sẽ thấy tần suất các IP đã giao tiếp với nhau
![image](https://hackmd.io/_uploads/H1WVTLXjZx.png)
IP `156.146.62.213` đã gửi gói tin với tần suất và dữ liệu đến và đi lớn nhất nên ta sẽ kiểm tra IP này đầu tiên 

Dựa vào file `meerkat-alerts.json` ta sẽ xem được liệu IP `156.146.62.213` có liên quan đến tấn công nào không

Nhìn qua file này, ta thấy `Bonitasoft` là một phần mềm quản lý được giám sát, và file `meerkat-alerts.json` đưa ra cảnh báo liên quan đến nó
![image](https://hackmd.io/_uploads/SklBTUmoWg.png)
Mình đã viết [code](https://github.com/vanniichan/HackTheBox/blob/main/Meerkat/filter.py) để lọc các event liên quan đến IP `156.146.62.213`
> Code được filter dựa trên trường `src_ip` 

Tại đây có thể thấy có `183` cảnh báo liên quan đến IP này
![image](https://hackmd.io/_uploads/S11L68mo-x.png)
Trong đó có tận `56` cảnh báo liên quan đến brute-force, tức là có 56 username và password được sử dụng 
![image](https://hackmd.io/_uploads/rJaLp87s-e.png)
### CVE-2022-25237 to Bypass Authorize
Cảnh báo cũng có đề cập đến liên quan đến [CVE-2022-25237](https://nvd.nist.gov/vuln/detail/CVE-2022-25237)
![image](https://hackmd.io/_uploads/SJNOTIXs-l.png)
> Đây là CVE khai thác Bonita Web 2021.2 của Bonitasoft, bản chất của lỗ hổng là Authentication/Authorization Bypass, attacker chỉ cần thêm `/../i18ntranslation/` hoặc `;i18ntranslation` vào cuối URL, user không có quyền gì vẫn có thể truy cập được vào các API yêu cầu quyền cao

Như mô tả của MIRE về sub-techniques của kỹ thuật Brute-force, attacker đang sử dụng `Credential Stuffing` để dành quyền truy cập vào tài khoản
![image](https://hackmd.io/_uploads/ryF3pLXjZl.png)
Như phân tích từ nãy đến giờ thì đây là web attack, giao thức được sử dụng sẽ là `HTTP`, ta cần biết điều này để filter trong WireShark để xem những gói tin cần thiết
![image](https://hackmd.io/_uploads/HyQRpImjbe.png)
Filter trong WireShark
```
http && ip.addr == 156.146.62.213
```
![image](https://hackmd.io/_uploads/HkhRT8msWx.png)
WireShark cho thấy IP `156.146.62.213` đang tấn công và nguy hiểm hơn khi đã có response 200 được trả về cho thấy attacker đã brute-force thành công với credential `seb.broom@forela.co.uk:g0vernm3nt`
![image](https://hackmd.io/_uploads/S13yC8Qobl.png)
### File Upload to RCE
Sau khi xâm phạm được account này, attacker bắt đầu tìm đến nơi có thể ném file độc lên server, ở đây là API `API/pageUpload`
![image](https://hackmd.io/_uploads/rJBgA8Xi-g.png)
Kiểm tra nội dung gói tin, file `rce_api_extension.zip` đã được upload lên thành công
![image](https://hackmd.io/_uploads/SyeZ08QjZx.png)
Ngay sau đó là request đến API cùng command rất là "hacker" `API/extension/rce?p=0&c=1&cmd=whoami`. Server cũng đã chạy lệnh
![image](https://hackmd.io/_uploads/r13bCLQsZe.png)
## Create Persistence
Sau hành vi chạy api rce trên thì không còn lệnh nào nữa, filter theo api rce cho chắc ăn thì thấy attacker đã đổi sang IP `138.199.59.221` để tấn công tiếp
```
http contains "rce"
```
![image](https://hackmd.io/_uploads/SJvM0UXsWe.png)
Trong số request đó, có 1 request đang thực hiện tải file độc khac về máy qua `pastes.io`, đây là web điển hình attacker thường lưu nội dung mã độc cũng như thông điệp đe dọa đến nạn nhân
![image](https://hackmd.io/_uploads/B1-XR8moZe.png)
Ngay khi tải xong, attacker dùng lệnh `bash` để chạy file độc
![image](https://hackmd.io/_uploads/S1rNCL7oZl.png)
Vì link chưa bị chết, ta vẫn xem được nội dung của file mà attacker đã tải về. Nội dung trên web cho thấy hành vi tiếp tục curl file độc khác về sau đó ghi đè vào file `authorized_keys`
![image](https://hackmd.io/_uploads/H1qXAU7sZx.png)
Đây là kỹ thuật duy trì truy cập mà attacker sử dụng bằng cách thêm SSH key để có thể đăng nhập lại hệ thống về sau. Theo MITRE, kỹ thuật này được phân loại là Account Manipulation: SSH Authorized Keys với ID `T1098.004`
![image](https://hackmd.io/_uploads/Sk0N0IQo-x.png)
––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/SyF4yw7j-g.png)
