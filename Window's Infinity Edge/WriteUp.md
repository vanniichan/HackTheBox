# Window's Infinity Edge
## CHALLENGE DESCRIPTION
:::info
A motivated APT group has breached our company and utilized custom tooling. We've identified the implants on compromised systems and remediated the infection using advanced AntiVirus X. However, one server seems clean but has been exhibiting suspicious traffic. Can you spot something we could have missed while cleaning this system?
:::

## Tools use
- scdbg
- CyberChef
- ChatGPT
- speakeasy
 
# Analysis
![image](https://hackmd.io/_uploads/ryZ0qjrKgx.png)

![image](https://hackmd.io/_uploads/HkJbsoSYge.png)

Sửa lại file để nó gen ra file dll [Tại đây](https://github.com/vanniichan/HackTheBox/blob/main/Window's%20Infinity%20Edge/shell.aspx)

![image](https://hackmd.io/_uploads/BJOqnsSFge.png)

Trong file này ta sẽ lấy được `IV`, đồng thời file viết lại ở trên cũng chứa `key` phục vụ cho việc decrypt các traffic được phân tích ở dưới

Từ code còn tìm được repo mà T.A sử dụng [tại đây](https://github.com/antonioCoco/SharPyShell/blob/master/agent/runtime_compiler/runtime_compiler_aes.cs)

Dump file và viết script decrypt các traffic [như sau](https://github.com/vanniichan/HackTheBox/blob/main/Window's%20Infinity%20Edge/dcrypt.py)

```
tshark -tud -n -r 2019-11-12_21:00:30-EXT07.pcap -E separator=/t -T 
```

Sau khi decrypt ta có thông tin về [request](https://github.com/vanniichan/HackTheBox/blob/main/Window's%20Infinity%20Edge/request.raw) và [response](https://github.com/vanniichan/HackTheBox/blob/main/Window's%20Infinity%20Edge/response.raw) ở traffic. Đáng chú ý ở request line 18 và 22. Nó tạo shellcode

> line 18

![image](https://hackmd.io/_uploads/Bksp46BKxg.png)

> line 22

![image](https://hackmd.io/_uploads/HkKxS6SFlg.png)

Lỗi shellcode ở line 22 trả ra lí do là vì byte `x00` làm nó end luôn chương trình

![image](https://hackmd.io/_uploads/SybUHartel.png)

Do đó ta sẽ lấy từ byte này đổ đi

```python=
xor_key = b'xGk89_Ew'
enc = shellcode_22[380:]
unxored = []
for i in range(0, len(enc)):
unxored.append(enc[i] ^ xor_key[i % len(xor_key)])
print(bytes(unxored))
```

Sử dụng **speakeasy** (có sẵn trên Remux) để chạy shellcode và lấy được flag

```
speakeasy -t shellcode_22.sc -a x64 -r -m
```
