![image](https://hackmd.io/_uploads/SkRvqnLsel.png)

You are a junior threat intelligence analyst at a Cybersecurity firm. You have been tasked with investigating a Cyber espionage campaign known as Operation Dream Job. The goal is to gather crucial information about this operation.

# Dream Job-1
## Sherlock info
Name |Dream Job-1
|-|-|
Difficulty| Very Easy
Category | Threat Intelligent|

## Note from Scenario
Operation Dream Job là một minh chứng rõ ràng cho sự nguy hiểm và tinh vi trong hoạt động của Lazarus Group. Thông qua kỹ thuật social engineer, việc khai thác các công cụ hợp pháp, cũng như áp dụng phương pháp chống phân tích, nhóm này đã duy trì thành công chiến dịch quy mô toàn cầu.

## Tools use
- Google
- ChatGPT

>### Comment
> No comment...

# Tasks
1. Who conducted Operation Dream Job?
2. When was this operation first observed?
3. There are 2 campaigns associated with Operation Dream Job. One is Operation North Star, what is the other?
4. During Operation Dream Job, there were the two system binaries used for proxy execution. One was Regsvr32, what was the other?
5. What lateral movement technique did the adversary use?
6. What is the technique ID for the previous answer?
7. What Remote Access Trojan did the Lazarus Group use in Operation Dream Job?
8. What technique did the malware use for execution?
9. What technique did the malware use to avoid detection in a sandbox?
10. To answer the remaining questions, utilize VirusTotal and refer to the IOCs.txt file. What is the name associated with the first hash provided in the IOC file?
11. When was the file associated with the second hash in the IOC first created?
12. What is the name of the parent execution file associated with the second hash in the IOC?
13. Examine the third hash provided. What is the file name likely used in the campaign that aligns with the adversary's known tactics?
14. Which URL was contacted on 2022-08-03 by the file associated with the third hash in the IOC file?

# Analysis
## Tổng quan
Operation Dream Job là một trong những chiến dịch tấn công mạng phức tạp nhất do **Lazarus Group** (Task 1) – nhóm APT khét tiếng có liên hệ với Triều Tiên – tiến hành. Chiến dịch này lợi dụng các cơ hội nghề nghiệp giả mạo từ những công ty công nghệ và quốc phòng lớn để dụ dỗ nạn nhân tải về các tài liệu hoặc phần mềm chứa mã độc. Lần đầu tiên chiến dịch này được phát hiện là vào tháng 9 năm 2019 (Task 2) theo dữ liệu từ MITRE ATT&CK.

![image](https://hackmd.io/_uploads/r1Wrsq8ige.png)

> Lazarus Group
Lazarus Group là một trong những nhóm tin tặc nguy hiểm và nổi tiếng nhất hiện nay. Nhóm này được cho là có liên hệ chặt chẽ với chính phủ Bắc Triều Tiên, hoạt động ít nhất từ năm 2009 đến nay. Lazarus thường xuyên tiến hành các cuộc tấn công mạng quy mô lớn nhằm vào nhiều mục tiêu khác nhau, bao gồm cả lĩnh vực chính trị, quân sự và tài chính.

>> Nguồn gốc và tổ chức
Theo các báo cáo tình báo và phân tích an ninh mạng, Lazarus Group được điều hành bởi **Reconnaissance General Bureau (RGB)** – cơ quan tình báo quân sự của Triều Tiên. Bên trong Lazarus tồn tại nhiều nhánh phụ chuyên trách:
>>- **BlueNorOff / APT38**: Tập trung vào các cuộc tấn công tài chính, nhắm vào hệ thống ngân hàng và tiền mã hóa.
>>- **AndAriel**: Thực hiện các chiến dịch gián điệp mạng và tấn công vào hạ tầng quan trọng, đặc biệt tại Hàn Quốc.
>>- **Hidden Cobra, Guardians of Peace, ZINC, v.v.,** được dùng để che giấu dấu vết và tạo sự nhầm lẫn cho cơ quan điều tra .

>> Các vụ tấn công nổi bật
Một số sự kiện tiêu biểu do Lazarus Group thực hiện:
>>- **2014 – Sony Pictures**: Tấn công, đánh cắp dữ liệu và làm rò rỉ thông tin mật, được cho là trả đũa bộ phim The Interview.
>>- **2016 – Ngân hàng Trung ương Bangladesh**: Lazarus đánh cắp 81 triệu USD qua hệ thống SWIFT.
>>- **2017 – WannaCry Ransomware**: Mã độc tống tiền toàn cầu, gây ảnh hưởng đến hơn 150 quốc gia.
>>- **2022 – Ronin Network / Axie Infinity**: Đánh cắp hơn 620 triệu USD tiền mã hóa.
>>- **2023 – Stake[.]com và Atomic Wallet**: Tổng cộng Lazarus đã lấy hơn 300 triệu USD từ các nền tảng crypto

Điểm đáng chú ý là Lazarus không chỉ triển khai Dream Job như một chiến dịch đơn lẻ. Nó còn liên kết với các hoạt động khác như Operation North Star và **Operation Interception** (Task 3), thể hiện chiến lược lâu dài nhằm vào cá nhân trong lĩnh vực kỹ thuật và an ninh quốc phòng.

## Phương thức tấn công
### Kỹ thuật lợi dụng hệ thống hợp pháp
Trong chiến dịch này, Lazarus đã khai thác các binary hợp pháp của Windows như Regsvr32 và **Rundll32** (Task 4) để thực hiện proxy execution. Đây là kỹ thuật "Living off the Land" (LOLBin) thường thấy, giúp kẻ tấn công ngụy trang hoạt động của mình dưới lớp vỏ hợp pháp, khó bị phát hiện bởi các hệ thống phòng thủ truyền thống.

![image](https://hackmd.io/_uploads/HypD1iLjee.png)

### Kỹ thuật di chuyển ngang
Sau khi xâm nhập ban đầu, Lazarus sử dụng kỹ thuật **Internal Spearphishing** (Task 5) để mở rộng phạm vi kiểm soát trong cùng một tổ chức. Kỹ thuật này được MITRE định danh là **T1534** (Task 6). Điều này cho phép kẻ tấn công mở rộng quyền truy cập mà không cần phải khai thác thêm nhiều lỗ hổng.

### Phần mềm độc hại
Một RAT (Remote Access Trojan) quan trọng trong chiến dịch này là **DRATzarus** (Task 7). Đây là công cụ giúp Lazarus duy trì truy cập từ xa, thực hiện các lệnh và đánh cắp dữ liệu. 

![image](https://hackmd.io/_uploads/HkOWGs8olg.png)

DRATzarus sử dụng **Native API** (Task 8) để thực thi trực tiếp trên hệ thống, đồng thời áp dụng kỹ thuật **Time Based Evasion** (Task 9) nhằm tránh bị sandbox phân tích trong môi trường ảo.

![image](https://hackmd.io/_uploads/SJmcGi8jel.png)
![image](https://hackmd.io/_uploads/HJXsMsLoxe.png)
![image](https://hackmd.io/_uploads/SktZ7oIsxx.png)
![image](https://hackmd.io/_uploads/S1f8XsLogl.png)

## IOC và minh chứng kỹ thuật
Các phân tích từ VirusTotal và nhiều báo cáo cho thấy Lazarus đã sử dụng nhiều file và hạ tầng độc hại cụ thể:

### IOC 1 
Hash đầu tiên được xác định có tên file **IEXPLORE.EXE** (Task 10), giả mạo Internet Explorer để đánh lừa nạn nhân và phần mềm phòng thủ 

### IOC 2
Hash thứ hai có timestamp tạo vào **2020-05-12 19:26:17** (Task 11). Parent file tương ứng là **BAE_HPC_SE.iso** (Task 12). Lazarus đã tận dụng image ISO – một phương tiện phổ biến trong các hoạt động lây nhiễm hiện đại – để phân phối malware (VirusTotal Report).

![image](https://hackmd.io/_uploads/SkGtNiIigg.png)

![image](https://hackmd.io/_uploads/SJtGO28sxe.png)

![image](https://hackmd.io/_uploads/ByDNd3Ijeg.png)

### IOC 3
Hash thứ ba tương ứng với file **Salary_Lockheed_Martin_job_opportunities_confidential.doc** (Task 13). Đây là minh chứng rõ rệt cho việc Lazarus sử dụng chiêu trò xã hội (social engineering), giả mạo tài liệu tuyển dụng của Lockheed Martin để dụ dỗ người dùng mở. 
![image](https://hackmd.io/_uploads/HyzxSi8jlg.png)

Tài liệu này cũng kết nối tới URL **https[:]//markettrendingcenter[.]com/lk_job_oppor.docx** (Task 14) vào ngày 03/08/2022, phục vụ cho việc tải xuống hoặc giao tiếp với máy chủ điều khiển C2 (Qualys Blog).

![image](https://hackmd.io/_uploads/HJRxIhIole.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/H1gLqhUsel.png)
