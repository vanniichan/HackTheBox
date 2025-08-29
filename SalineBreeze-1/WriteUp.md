![image](https://hackmd.io/_uploads/SJrZFDkqge.png)

Your manager has just informed you that, due to recent budget cuts, you'll need to take on additional responsibilities in threat analysis. As a junior threat intelligence analyst at a cybersecurity firm, you're now tasked with investigating a cyber espionage campaign linked to a group known as Salt Typhoon. Apparently, defending against sophisticated Nation-State cyber threats is now a "do more with less" kind of game. Your Task: Conduct comprehensive research on Salt Typhoon, focusing on their tactics, techniques, and procedures. Utilize the MITRE ATT&CK framework to map out their activities and provide actionable insights. Your findings could play a pivotal role in fortifying our defenses against this adversary. Dive deep into the data and show that even with a shoestring budget, you can outsmart the cyber baddies.

# SalineBreeze-1 
## Sherlock info
Name |SalineBreeze-1
|-|-|
Difficulty| Very Easy
Category | Threat Intelligent|

## Note from Scenario
- Thực hiện tấn công và kết nối đến C2 
- Hoạt động liên quan đến timestomps 

## Tools use
- Event Viewer
- ChatGPT

>### Comment
> Đây là Sherlock đầu tiên làm về Threat Intelligent nên cách làm có thể rất truyền thống. Lý do chọn bài này là vì gần đây cuộc tấn công cuả nhóm này mới xuất hiện trở lại nên ngồi tìm hiểu luôn

# Tasks
1. Starting with the MITRE ATT&CK page, which country is thought be behind Salt Typhoon?
2. According to that page, Salt Typhoon has been active since at least when? (Year)
3. What kind of infrastructure does Salt Typhoon target?
4. Salt Typhoon has been associated with multiple custom built malware, what is the name of the malware associated with the ID S1206?
5. What operating system does this malware target?
6. What programming language is the malware written in?
7. On which vendor's devices does the malware act as a network sniffer?
8. The malware can perform 'Indicator Removal' by erasing logs. What is the MITRE ATT&CK ID for this?
9. On December 20th, 2024, Picus Security released a blog on Salt Typhoon detailing some of the CVEs associated with the threat actor. What was the CVE for the vulnerability related to the Sophos Firewall?
10. The blog demonstrates how the group modifies the registry to obtain persistence with a backdoor known as Crowdoor. Which registry key do they target?
11. What is the MITRE ATT&CK ID of the previous technique?
12. On November 25th, 2024, TrendMicro published a blog post detailing the threat actor. What name does this blog primarily use to refer to the group?
13. The blog post identifies additional malware attributed to the threat actor. Which malware do they describe as a 'multi-modular backdoor...using a custom protocol protected by Transport Layer Security'
14. Most of the domains the malware communicates with have a .com top-level domain. One uses a .dev TLD. What is the full domain name for the .dev TLD?
15. What is the filename for the first GET request to the C&C server used by the malware?
16. On September 30th, 2021, a blog post was released on Securelist by Kaspersky. What was the threat actor's name at that time?
17. What is the name of the malware that this article focuses on?
18. What type of malware is the above malware?
19. The first stage consists of a malicious PowerShell dropper. What type of encryption is used to obfuscate the code?
20. The malware uses Input/Output Control codes to perform various tasks related to hiding malicious artifacts. What is the IOCTL code used by the malware to hide its service from the list within the services.exe process address space?

# Analysis
Tại Task 1, truy cập page chính của [MITRE ATT&CK](https://attack.mitre.org/groups/G1045/) ta thấy được nhóm **Salt Typhoon** xuất phát từ **People's Republic of China (Cộng hòa nhân dân Trung Quốc)** hay tiếng anh là **China**

![image](https://hackmd.io/_uploads/B1wGcwJ5lx.png)

Nhóm này bắt đầu xuất hiện từ năm 2019 (Task 2)

![image](https://hackmd.io/_uploads/Bym9qvJ5lg.png)

Mục tiêu của nhóm này nhóm vào hạ tầng mạng (**network infrastructure**), đây là câu trả lời cho Task 3

![image](https://hackmd.io/_uploads/HygJsvk5lg.png)

Nhóm này cũng có custom nhiều loại mã độc khác nhau và dựa theo Task 4, ta sẽ tìm hiểu về **JumbledPath** với ID **S1206**

![image](https://hackmd.io/_uploads/HyVLjDk5ex.png)

Mục tiêu của **JumbledPath** nhắm đến hdh Linux (Task 5), được viết bằng Go (Task 6) dưới dạng elf x86-64

![image](https://hackmd.io/_uploads/HyHciPk9ex.png)

Từ nguồn mà mình đọc được cũng như là từ Mitre, loại mã độc này thường nhắm vào các router như **Cisco** (Task 7), Ivanti, Pal Alto,...

![image](https://hackmd.io/_uploads/HJif3Pk9xe.png)

![image](https://hackmd.io/_uploads/SJJKhDJ5lx.png)

Một trong các kỹ thuật mà **JumbledPath** thực hiện đó là hành vi xóa log tại ID **T1070.002** (Task 8)

:::info
MITRE định nghĩa nhiều sub-techniques với hậu tố `.001`, `.002`, `.003`, ... để phân loại chi tiết hơn

Cụ thể **T1070.002** là **Indicator Removal: Clear Linux or Mac System Logs**
:::

Vào ngày 20 tháng 12 năm 2024, Picus Security đã ra mắt một blog về **CVE-2022-3236** (Task 9) xảy ra với Sophos Firewall có liên quan đến hoạt động của nhóm này. Cụ thể blog [ở đây](https://www.picussecurity.com/resource/blog/salt-typhoon-removing-chinese-telecom-equipment), có rất nhiều CVE khác

![image](https://hackmd.io/_uploads/rJxsAD1cxx.png)

Ở blog có đề cập 1 backdoor có tên là **Crowdoor**. Khi không có đối số hoặc đối số = `0` được thông qua trong quá trình thực thi, **Crowdoor** sẽ thêm một entry vào registry Windows ở mục Run, cụ thể là `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` (Task 10) để tạo persistent

```
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v malicious-registry-name /t REG_SZ /d "C:\path\to\malicious-crowdoor.exe" /f
```
![image](https://hackmd.io/_uploads/HJy8eOkcxx.png)

Đối chiếu với Mitre, nó là chiến thuật **T1112**: Modify Registry (Task 11)

![image](https://hackmd.io/_uploads/HJsLbdJqgl.png)

Một [blog khác](https://www.trendmicro.com/en_vn/research/24/k/earth-estries.html) của TrendMicro, một tên gọi khác của Salt Typhoon là **Earth Estries** (Task 12) đã được đề cập và công bố vào ngày 25 tháng 11 năm 2024

![image](https://hackmd.io/_uploads/r1Xjfu1qlx.png)

Blog này cũng đề cập đề nhiều loại mã độc khác. Một trong số đó chính là **GHOSTSPIDER** (Task 13), nó được xem như là một backdoor đa mô hình tinh vi được thiết kế với nhiều lớp để load các mô-đun khác nhau dựa trên các mục đích cụ thể. Backdoor này giao tiếp với C2 của mình bằng giao thức tùy chỉnh được bảo vệ bởi bảo mật lớp vận chuyển (TLS), đảm bảo giao tiếp an toàn

Dưới đây là list domain mà GHOSTSPIDER kết nối về C2, có thể nói đa phần đều gửi về `.com`, đặc biệt tròn đó có 1 doamin đuôi `.dev` (Task 14)

![image](https://hackmd.io/_uploads/SJMzSuJcxe.png)

File đầu tiên mà con mã độc này kết nối đến server là `index,php` (Task 15)

![image](https://hackmd.io/_uploads/r1xBEdk5gg.png)

Vào ngày 30 tháng 9 năm 2021, một bài công bố mình phải dùng ChatGPT thì mới tìm được nhóm này đó là **GhostEmperor** dựa trên [bài viết này](https://securelist.com/ghostemperor-from-proxylogon-to-kernel-mode/104407/) (Task 16)

![image](https://hackmd.io/_uploads/HyLbFuk9xe.png)

Bài viết đề cập đến một loại mã độc tên là **Demodex** mà nhóm **GhostEmperor** sử dụng (Task 17), nó là **rootkit** (Task 18) nhằm cung cấp điều khiển từ xa đối với các máy chủ bị tấn công

![image](https://hackmd.io/_uploads/r1N6tdJcge.png)

Dựa theo bài viết, bước đầu tiên là cài thêm payload độc hại (droper) bằng PS được obfuscate bằng **AES** (Task 19)

![image](https://hackmd.io/_uploads/rJ-equkcxx.png)

Ở task cuối, ta cần xác định con malware này dùng IOCTL code là gì để ra lệnh cho driver của nó nhằm ẩn dịch vụ độc hại khỏi danh sách dịch vụ trong bộ nhớ của tiến trình `services.exe`

> IOCTL code = mã lệnh điều khiển đặc biệt để giao tiếp với driver thiết bị.

>Nó giúp ứng dụng user-mode có thể ra lệnh hoặc lấy thông tin từ thiết bị thông qua driver.

![image](https://hackmd.io/_uploads/HJRTjOy5xe.png)

Giải thích về IOCTL code `0x220300` (Task 20) được malware dùng để ẩn dịch vụ của nó trong bộ nhớ của `services.exe`. Nó làm điều này bằng cách: nhận tên service → tìm entry trong linked list của hệ thống → unlink entry đó. Kết quả là dịch vụ không xuất hiện trong danh sách, giúp malware che giấu sự tồn tại

# Behind 
Nói tóm lại các Task trên đều nói về các hoạt động của nhóm **Salt Typhoon** aka **Earth Estries** hoặc **GhostEmperor**. Khá bổ x

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/Byw3jdy9ee.png)
