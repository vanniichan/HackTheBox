![image](https://hackmd.io/_uploads/SJ3cPkcEye.png)

Khalid has just logged onto a host that he and his team use as a testing host for many different purposes. It’s off their corporate network but has access to lots of resources on the network. The host is used as a dumping ground for a lot of people at the company, but it’s very useful, so no one has raised any issues. Little does Khalid know; the machine has been compromised and company information that should not have been on there has now been stolen – it’s up to you to figure out what has happened and what data has been taken.

# Litter
## Sherlock info
Name |Brutus
|-|-|
Difficulty| Easy
Category | SOC|

## Note from Scenario
- Có luồng truy cập vào nội bộ
- Dữ liệu bị đưa ra ngoài

## Tools use
- WireShark
- CyberChef

>### Comment
> Đây là bài cho mình ôn tập lại về WireShark. Ngòai ra qua bài này biết được điều kiện tiên quyết để tạo DNS Tunnelin rất khó và vì mỗi gói bị giới hạn ở 253 byte nên sẽ có nhiều packet và do đó gây ra lưu lượng DNS tăng đột biến bất thường.

# Question 
1. At a glance, what protocol seems to be suspect in this attack?
2. There seems to be a lot of traffic between our host and another, what is the IP address of the suspect host?
3. What is the first command the attacker sends to the client?
4. What is the version of the DNS tunneling tool the attacker is using?
5. The attackers attempts to rename the tool they accidentally left on the clients host. What do they name it to?
6. The attacker attempts to enumerate the users cloud storage. How many files do they locate in their cloud storage directory?
7. What is the full location of the PII file that was stolen?
8. Exactly how many customer PII records were stolen?

# Analysis 
Unzip ra ta nhận được file `suspicious_traffic.pcap`

![image](https://hackmd.io/_uploads/S19I6Ss4ke.png)

Vì chỉ có mỗi file này nên đáp án sẽ có ở đây hết. 

## suspicious_traffic.pcap
Câu hỏi của bài này có hỏi về giao thức (protocol). Sử dụng tính năng `Protocol Hierarchy`, đây là tính năng cho ta xem lưu lượng mạng dựa trên các protocol được sử dụng trong các packet.

![image](https://hackmd.io/_uploads/H1hq5Uo4kl.png)

Ngoài QUIC hoặc TCP, số lượng của **DNS** hiện tại cao một cách đáng ngờ. Lý do **không phải là QUIC** bởi vì QUIC thường được mã hóa và liên quan đến các dịch vụ hợp pháp như Google, nên ít bị nghi ngờ.

### DNS tunneling 
Sau khi đúng DNS, ta sẽ sử dụng `Conversations` của Wireshark để tìm hiểu IP nào có nhiều hoạt động nhất ở port 53 (DNS).

![image](https://hackmd.io/_uploads/ry6I3Is4Jx.png)

Từ trên ta sẽ biết được đó chính là IP **192.168.157.145**

### Filtering 
Để xem nội dung mà các packet này chứa, bước đầu tiên ta sẽ lọc IP này để tiện
```
dns && ip.addr == 192.168.157.145
```

![image](https://hackmd.io/_uploads/HyeE6UjVyx.png)

Chọn packet có length cao nhất sau đó vào option `follow UDP Stream` để xem nội dung 

![image](https://hackmd.io/_uploads/SkzTa8jN1g.png)

Tuy nhiên thì nó đã bị mã hóa. Một trong những định dạng phổ biến nhất để nhúng dữ liệu vào DNS query hoặc response là **Base64** và **Hexadecimal**. Ở bài này nó là ở dạng Hex

### CyberChef
Cho nội dung vào CyberChef ta sẽ thấy rõ hơn được nội dung mà TA muốn làm gì. Đầu tiên là command **whoami** là command đầu tiên sử dụng. Một trong những command đầu tiên khi RCE thành công : )

![image](https://hackmd.io/_uploads/HJFXRIj4kl.png)

Sau khi kéo xuống dưới ta có thể thấy thêm được nhiều nội dung khác. Điển hình như version **0.07** mà TA sử dụng tool dnscat2 để thực hiện cuộc tấn công **DNS Tunneling**

![image](https://hackmd.io/_uploads/SJVtR8j4kl.png)

Tiếp theo là các trình tự evade như đổi tên để tạo persistent như việc đổi tên file `dnscat2` thành **win_installer.exe**. Qua 1 số lần đổi không thành công và thành công tại lệnh `ren` 

![image](https://hackmd.io/_uploads/BJfaAIsV1l.png)

Bài có yêu cầu về các file có trong cloud. Thông thường nó sẽ nằm ở thư mục `OneDrive` đối với Windows. Kết quả trả về là **0** file khi TA thực hiện command

![image](https://hackmd.io/_uploads/rk4LywoVJg.png)

Tiếp theo để ăn cắp thông tin, vì nạn nhân ở đây là người có file **Personal Identifiable Information (PII)** (1 loại file cung cấp thông tin chi tết của các cá nhân trong tổ chức). TA đã sử dụng `type` tại path **C:\users\test\documents\client data optimisation\user details.csv** để đọc nội dung file này

![image](https://hackmd.io/_uploads/BJknkwoVkx.png)

Nội dung của file có hiện thị thứ tự được tính từ 0 và dừng lại ở thứ tự 720. Tức là có **721** records được lưu trên file này. Chứng tỏ về việc 721 cá nhân bị lộ thông tin ra ngoài

![image](https://hackmd.io/_uploads/rJK7eDs4ke.png)

# Answer
1. DNS
2. 192.168.157.145
3. whoami
4. 0.07
5. win_installer.exe
6. 0
7. C:\users\test\documents\client data optimisation\user details.csv
8. 721

------------------------------------------ Kết thúc Sherlock! ------------------------------------------

![image](https://hackmd.io/_uploads/rk9_WvoEJe.png)
