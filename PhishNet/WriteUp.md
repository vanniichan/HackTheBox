![image](https://hackmd.io/_uploads/S1v6aoqjeg.png)

An accounting team receives an urgent payment request from a known vendor. The email appears legitimate but contains a suspicious link and a .zip attachment hiding malware. Your task is to analyze the email headers, and uncover the attacker's scheme.

# PhishNet 
## Sherlock info
Name |PhishNet 
|-|-|
Difficulty| Very Easy
Category | SOC|

## Note from Scenario
- Thực hiện tấn công Spearphishing 
- Hoạt động liên quan đến cố gắng mã hóa (Ransomwere)

## Tools use
- ThunderBird
- VirusToTal
- ChatGPT

>### Comment
> Nhờ chatgpt gen báo cáo :))))))))))))))))))))))

# Question 
1. What is the originating IP address of the sender?
2. Which mail server relayed this email before reaching the victim?
3. What is the sender's email address?
4. What is the 'Reply-To' email address specified in the email?
5. What is the SPF (Sender Policy Framework) result for this email?
6. What is the domain used in the phishing URL inside the email?
7. What is the fake company name used in the email?
8. What is the name of the attachment included in the email?
9. What is the SHA-256 hash of the attachment?
10. What is the filename of the malicious file contained within the ZIP attachment?
11. Which MITRE ATT&CK techniques are associated with this attack?

# Analysis
Báo phân tích này tổng hợp và lý giải chi tiết các phát hiện rút ra từ file email có chủ đề “**Urgent: Invoice Payment Required – Overdue Notice**”. Mục tiêu là chứng minh từng nhận định bằng dấu vết trong header và nội dung

Ngay khi mở tệp, phần tiêu đề người gửi hiển thị là **Finance Dept** với địa chỉ From khớp domain business-finance.com. Từ trường From có thể xác định cụ thể địa chỉ email người gửi là **finance@business-finance.com**

![image](https://hackmd.io/_uploads/rk4eWq9ixe.png)

Sự hiện diện của trường Reply‑To cho thấy khi người nhận bấm trả lời, phản hồi sẽ không quay lại địa chỉ From mà tới một hộp thư khác là support@business-finance.com. Việc Reply‑To khác From là một thủ pháp xã hội thường gặp để điều hướng trao đổi ra khỏi kênh chính thức; giá trị **support@business-finance.com** vì thế được ghi nhận là đáp án cho (Task 4).

![image](https://hackmd.io/_uploads/BJ2Kb99ixl.png)

Về nguồn gốc kỹ thuật của thư, trường `X‑Originating‑IP` phản ánh IP của máy khách hoặc dịch vụ biên ban đầu tạo ra thông điệp. Trong mẫu này, `X‑Originating‑IP` mang giá trị **45.67.89.10**. Đây chính là địa chỉ IP khởi phát của người gửi. Cần lưu ý rằng một số hạ tầng có thể ẩn hoặc thay thế trường này, nhưng khi xuất hiện và nhất quán với các kiểm chứng khác, nó là chỉ dấu mạnh mẽ về xuất xứ.

![image](https://hackmd.io/_uploads/SJf_AY9oxx.png)

Để xác định đường đi của thư qua các máy chủ, cần đọc chuỗi `Received` theo thứ tự từ trên xuống để biết hop gần máy chủ người nhận nhất. Dòng `Received` đầu tiên trong mẫu cho biết `mail.target.com` đã nhận thư `from mail.business-finance.com ([203.0.113.25])`. Điều này chứng minh máy chủ ngay trước khi thư tới nạn nhân là **mail.business-finance.com** tại địa chỉ **203.0.113.25**.  Các dòng `Received` tiếp theo cho thấy lộ trình sâu hơn bên trong hạ tầng gửi, nhưng đối với yêu cầu “ngay trước khi tới nạn nhân”, hop nói trên là bằng chứng trực tiếp và đủ mạnh.

![image](https://hackmd.io/_uploads/r1qSZc5ogx.png)

Khối xác thực thư thể hiện các kết quả `SPF`, `DKIM` và `DMARC` đều ở trạng thái **pass**. Cụ thể, trường `Received‑SPF` và` Authentication‑Results` xác nhận `spf=pass`, nghĩa là IP gửi đã được domain `business-finance.com` ủy quyền trong bản ghi `SPF`. Ý nghĩa thực tiễn của việc pass ở đây là bức thư “đi đúng đường” theo chính sách phát thư của domain, nhưng điều đó không hề đảm bảo nội dung an toàn; nhiều chiến dịch lừa đảo cố tình tận dụng cấu hình hợp lệ để tăng độ tin cậy bề ngoài.

![image](https://hackmd.io/_uploads/rJkyM9cjeg.png)

Trong nội dung, email dẫn dụ người nhận bằng một liên kết trỏ tới tên subdomain có vẻ đáng tin cậy. Khi quan sát phần body, domain được sử dụng trong URL là **secure.business-finance.com**. Đây chính là domain bị lồng trong đường dẫn nghi phishing. Sự lựa chọn tiền tố “secure” thường nhằm tạo cảm giác an toàn giả và khiến người dùng bớt cảnh giác khi truy cập.

![image](https://hackmd.io/_uploads/SJtfGqqsel.png)
![image](https://hackmd.io/_uploads/BkNBG59sle.png)

Thư còn mạo danh một thực thể doanh nghiệp bằng nhãn tổ chức thể hiện trong header. Trường `X‑Organization` ghi **Business Finance Ltd.**, từ đó có thể xác định tên công ty giả mà tác giả thư dùng để tạo vỏ bọc. Việc mượn tên doanh nghiệp theo ngữ cảnh kế toán – hóa đơn phù hợp với mục tiêu hướng đến phòng kế toán để kích hoạt thanh toán vội vàng.

![image](https://hackmd.io/_uploads/SJE_Mqcogx.png)
![image](https://hackmd.io/_uploads/HJGFMcqjlg.png)

Một trong các chỉ dấu rủi ro quan trọng nằm ở phần tệp đính kèm. Email cung cấp một tệp nén có tên **Invoice_2025_Payment.zip**. Đây là tên tệp người dùng sẽ thấy tại client mail. 

![image](https://hackmd.io/_uploads/SyUTf95iel.png)
![image](https://hackmd.io/_uploads/r1knf59sxg.png)

Với file zip, bước phân tích tiếp theo là trích xuất để kiểm tra cấu trúc bên trong và tính toán hash phục vụ đối chiếu chỉ số tấn công. Hash SHA‑256 được cung cấp cho gói đính kèm là **8379C41239E9AF845B2AB6C27A7509AE8804D7D73E455C800A551B22BA25BB4A**

![image](https://hackmd.io/_uploads/r1A7Xccixl.png)

Sau khi giải nén, file độc hại lộ diện với thủ pháp ngụy trang đuôi kép: **invoice_document.pdf.bat**. Việc đặt tên như một tài liệu PDF nhưng thực chất có đuôi `.bat` khiến người dùng dễ bị đánh lừa chỉ bằng cái nhìn lướt qua. Chiêu thức ngụy trang này thuộc nhóm kỹ thuật **Masquerading** trong phân loại của cộng đồng phòng thủ, thường bị các hệ thống phát hiện và quy tắc cổng thư kiểm tra bằng biểu thức phát hiện đuôi kép kiểu `*.pdf.exe` hoặc `*.pdf.bat`.

![image](https://hackmd.io/_uploads/H1mmrccjee.png)

Tuy nhiên khi unzip lại không được, ta phải chuyển sang Linux để biết được bên trong là file gì

![image](https://hackmd.io/_uploads/rkfES99jgl.png)
![image](https://hackmd.io/_uploads/rJgqr9cogx.png)

Khi ánh xạ hành vi tấn công vào khung MITRE ATT&CK, bức thư này tương ứng với kỹ thuật **Spearphishing Attachment** dưới mã định danh **T1566.001**. Kỹ thuật này mô tả hình thức gửi email có tệp đính kèm nhằm đạt được thực thi ban đầu trên máy nạn nhân khi họ mở tệp. Sự hiện diện đồng thời của file zip, file thực thi ngụy trang và chủ đề thúc ép thanh toán làm cho bức tranh kỹ thuật càng khớp với mô tả của mã kỹ thuật này.

![image](https://hackmd.io/_uploads/rJAdL9ciee.png)
![image](https://hackmd.io/_uploads/B1CY899oex.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/HJDP8q9igx.png)


