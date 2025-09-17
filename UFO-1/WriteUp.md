Being in the ICS Industry, your security team always needs to be up to date and should be aware of the threats targeting organizations in your industry. You just started as a Threat intelligence intern, with a bit of SOC experience. Your manager has given you a task to test your skills in research and how well can you utilize Mitre Att&ck to your advantage. Do your research on Sandworm Team, also known as BlackEnergy Group and APT44. Utilize Mitre ATT&CK to understand how to map adversary behavior and tactics in actionable form. Smash the assessment and impress your manager as Threat intelligence is your passion.

![image](https://hackmd.io/_uploads/S1XPHz_oge.png)

# UFO-1
## Sherlock info
Name |UFO-1
|-|-|
Difficulty| Very Easy
Category | Threat Intelligent|

## Note from Scenario
Sandworm Team khác với nhiều nhóm APT chỉ tập trung vào thu thập thông tin, Sandworm lại theo đuổi chiến lược “chiến tranh mạng” điển hình như NotPetya hay Industroyer. Một fun fact thú vị là tên gọi “Sandworm” không phải do họ tự đặt mà xuất phát từ các nhà nghiên cứu phương Tây, lấy cảm hứng từ loài sinh vật khổng lồ trong tiểu thuyết Dune – sống ẩn mình dưới cát rồi bất ngờ tấn công dữ dội. 

## Tools use
- Google
- ChatGPT

>### Comment
> Thêm một bài TI vì sếp đang cần mấy bài này :))

# Tasks
1. According to the sources cited by Mitre, in what year did the Sandworm Team begin operations?
2. Mitre notes two credential access techniques used by the BlackEnergy group to access several hosts in the compromised network during a 2016 campaign against the Ukrainian electric power grid. One is LSASS Memory access (T1003.001). What is the Attack ID for the other? 
3.  During the 2016 campaign, the adversary was observed using a VBS script during their operations. What is the name of the VBS file? 
4. The APT conducted a major campaign in 2022. The server application was abused to maintain persistence. What is the Mitre Att&ck ID for the persistence technique was used by the group to allow them remote access? 
5. What is the name of the malware / tool used in question 4? 
6. Which SCADA application binary was abused by the group to achieve code execution on SCADA Systems in the same campaign in 2022?
7. Identify the full command line associated with the execution of the tool from question 5 to perform actions against substations in the SCADA environment. 
8.  What malware/tool was used to carry out data destruction in a compromised environment during the same campaign? 
9. The malware/tool identified in question 8 also had additional capabilities. What is the Mitre Att&ck ID of the specific technique it could perform in Execution tactic?
10.  The Sandworm Team is known to use different tools in their campaigns. They are associated with an auto-spreading malware that acted as a ransomware while having worm-like features .What is the name of this malware?
11. What was the Microsoft security bulletin ID for the vulnerability that the malware from question 10 used to spread around the world? 
12. What is the name of the malware/tool used by the group to target modems? 
13. Threat Actors also use non-standard ports across their infrastructure for Operational-Security purposes. On which port did the Sandworm team reportedly establish their SSH server for listening?
14. The Sandworm Team has been assisted by another APT group on various operations. Which specific group is known to have collaborated with them?

# Analysis
## Tổng quan
Sandworm Team là nhóm APT có liên hệ rộng rãi với các chiến dịch phá hoại nhắm vào hạ tầng trọng yếu (điện lực, viễn thông, chính phủ). Theo Mitre, nhóm bắt đầu hoạt động từ năm **2009** (task 1) và nổi bật qua các chiến dịch: xâm nhập – điều khiển hệ thống SCADA (2016, 2022), phá hoại dữ liệu (CaddyWiper), và chiến dịch ransomware‑worm **NotPetya** (task 10) khai thác **MS17‑010** (task 11). Báo cáo này tổng hợp dòng thời gian, kỹ thuật ATT&CK, công cụ/malware, chuỗi tấn công, và khuyến nghị phòng thủ theo chiều sâu, có dẫn tham khảo ở cuối.

## Threat Profile
Sandworm Team (còn được biết với các bí danh liên quan). Hoạt động từ **2009** (task 1) đến nay. Mụ tiếu tấn công của nhóm này là các hạ tầng trọng yếu (điện lực/SCADA), cơ quan chính phủ, viễn thông, tổ chức khu vực Đông Âu và mục tiêu toàn cầu. Kết hợp xâm nhập chiến lược, leo thang đặc quyền, phá hoại dữ liệu, và gây gián đoạn dịch vụ. Linh hoạt dùng công cụ tự phát triển và công cụ mã nguồn mở.

## Các mốc tiêu biểu
- 2009–2014: Hình thành, trinh sát và cắm chốt trong mạng mục tiêu (persistence đa lớp).
- 2015–2016: Chiến dịch tại Ukraine: lạm dụng công cụ quản trị, thu thập thông tin xác thực (LSASS T1003.001; Brute Force **T1110** (task 2)), dùng script **ufn.vbs** (task 3), quan sát điều khiển SCADA gây mất điện.
- 2017: Phát tán **NotPetya** (task 10) với khả năng lây lan kiểu worm, khai thác **MS17‑010** (task 11), sử dụng chứng thực nội bộ để di chuyển ngang.
- 2022: Chuỗi tấn công nhắm vào SCADA/ICS, duy trì hiện diện thông qua web‑shell (**T1505.003** (task 4)) bằng **Neo‑REGEORG** (task 5); thực thi tác vụ qua **scilc.exe** (task 6) với dòng lệnh: `C:\sc\prog\exec\scilc.exe -do pack\scil\s1.txt` (task 7); phá hoại bằng **CaddyWiper** (task 8) với khả năng Native API **T1106** (task 9). Ngoài ra còn tấn công vào modem bằng **AcidRain** (task 12); hạ tầng SSH lắng nghe cổng **6789** (task 13); có hợp tác với **APT28** (task 14) trong một số hoạt động.

## Ukraine Power Grid
### Mục tiêu & Tác động
Nhóm này nhắm vào doanh nghiệp điện lực và hệ thống SCADA/DMS/EMS phụ trợ vận hành lưới. Gây ra gián đoạn cấp điện cục bộ, thao túng vận hành từ xa; gây mất dịch vụ và ảnh hưởng xã hội.

### Kỹ thuật & Công cụ đã ghi nhận
Credential Access:
- LSASS Memory (T1003.001) – trích xuất hash/creds từ tiến trình LSASS để leo thang đặc quyền nội bộ.
- Brute Force (**T1110**) (task 2) – thử mật khẩu/khớp tài khoản trên nhiều host để mở rộng kiểm soát.
- Execution/Automation: Sử dụng script VBS **ufn.vbs** (task 3) trong chuỗi tự động hoá hành động (kiểm soát, duy trì, hoặc dàn lệnh).
- Lateral Movement: Khai thác thông tin xác thực thu được để di chuyển ngang qua mạng OT/IT; lạm dụng công cụ quản trị hợp lệ.

### Khái quát
Phishing/khai thác điểm yếu -> Cắm chốt + thu thập creds (T1003.001, T1110) -> Tự động hoá điều khiển (VBS ufn.vbs) -> Di chuyển vào tầng OT -> Thao túng SCADA -> Che giấu & rút lui.

## SCADA/ICS & phá hoại dữ liệu
### Mục tiêu & Tác động
Nhóm này xâm nhập mạng doanh nghiệp có kết nối/tiếp giáp ICS; đạt quyền điều khiển SCADA và duy trì bền vững để thực thi script vận hành từ xa. Về việc cắm Persistence cũng như C2, nhóm triển khai **Neo‑REGEORG** (task 5) để tạo tunnel qua ứng dụng web, duy trì điều khiển ngay cả khi các kênh C2 khác bị chặn.

Sau đó lợi dụng binary SCADA **scilc.exe** (task 6) để chạy script điều khiển:
```
C:\sc\prog\exec\scilc.exe -do pack\scil\s1.txt
```

Tác động:
- **CaddyWiper** (task 8): Wiper tập trung phá hoại phân vùng/metadata file system, làm hệ thống không thể khởi động/khôi phục nhanh.
- Capability bổ sung: Native API (**T1106**) (task 9) – gọi trực tiếp API mức thấp của hệ điều hành nhằm lẩn tránh/giảm dấu vết ở tầng Win32.

## NotPetya (2017)
### Mục tiêu & Tác động
Về bản chất **NotPetya** có hành vi ransomware nhưng thực chất phá hoại (wiper‑like) với khả năng tự lan truyền kiểu worm. Thông qua khai thác lỗ hổng SMBv1 **MS17‑010** (task 11), đồng thời lạm dụng chứng thực nội bộ (công cụ hợp lệ như PsExec/WMIC) để di chuyển ngang tốc độ cao.

Cuộc tấn công đã lan toàn cầu, gây gián đoạn chuỗi cung ứng, thiệt hại lớn về tài chính/vận hành.

## AcidRain (2022)
### Mục tiêu & Tác động
**AcidRain** (task 12) nhắm vào firmware/thành phần lưu trữ của modem/thiết bị mạng, gây mất kết nối diện rộng – đặc biệt nguy hiểm với hạ tầng vệ tinh/viễn thông khi bị đồng loạt tác động.

## Hạ tầng, OPSEC 
Ở Hạ tầng C2/Quản trị nó thiết lập SSH ở cổng **6789** (task 13) để tránh chú ý so với cổng chuẩn (22), kết hợp web‑shell và reverse proxy.

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––

![image](https://hackmd.io/_uploads/r1USBGuoel.png)
