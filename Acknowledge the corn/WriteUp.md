# Acknowledge the corn
## CHALLENGE DESCRIPTION
One of our clients currently active in the banking sector, was recently targeted by a known APT group. Our endpoint protection raised some alerts about an offensive open source tool which was found in one of our client's workstation. Our incident response team managed to retrieve a dump of the malicious process and a capture of the network during the attack. Can you analyse the given samples and determine whether the malicious actors penetrated in to the network or not?

## Tools use
- WireShark
- Cyberchef 
- DnSpy
- HxD
- DiE
- RSAKeyConverter
 
# Analysis
Giải nén file ta được file sau:
```
.
├── Acknowledge the corn
│   ├── capture.pcap
│   ├── powershell.dmp
```
## WireShark
### capture.pcap
![image](https://hackmd.io/_uploads/H1u8VWY0kg.png)

Về conversation, có thể thấy IP gửi đi mà không thấy IP kết nối ngược lại. Vậy cuộc tấn công thất bại hay đã có đường để giao tiếp khác

![image](https://hackmd.io/_uploads/HkK3VZF0Je.png)

### HTTP protocol
![image](https://hackmd.io/_uploads/ByVDBWK0Jx.png)

Từ ảnh trên ta thấy được máy nạn nhân có dấu hiệu tải file thực thi tải mã độc về đó là file `byp.ps1` và `dwn.ps1`

![image](https://hackmd.io/_uploads/SkMTB-FRkg.png)

#### byp.ps1
Đoạn code mặc dù đã bị obfuscate nhưng ở dòng cuối của file ps này ta cũng có thể đoán được nó đang thực hiện tải file `dwn.ps1` với IP `192.168.1.11`. Từ đây ta đã thấy có dấu hiệu của việc đang cố gắng kết nối đến **C2 server**

![image](https://hackmd.io/_uploads/HJTlUZKCyx.png)

#### dwn.ps1
Ở file này đoạn code cũng bị obfuscate, việc deofucate bằng tay rất khó khăn cho nên ta sẽ lợi dụng ngay chính việc script khời tạo biến và sau đó chắc chắn phải có hàm chạy. Như vậy chỉ việc tìm đến hàm đó để gọi nó ra và ẩn hàm thực thi đi

![image](https://hackmd.io/_uploads/rJPrPbFAJg.png)

![image](https://hackmd.io/_uploads/HykwPWFRye.png)

--> run with powershell, ta được file có nội dung `This program cannot be run in DOS mode.` là dấu hiệu của **file PE**

![image](https://hackmd.io/_uploads/B19tv-KAJe.png)

nÉM file này lên virustotal, đây chính là file mal hoạt động trên máy nạn nhân

![image](https://hackmd.io/_uploads/BJjx_-F0kx.png)

Sau khi nạn nhân đã tải file về, lần lượt các traffic sau đó đã bắt đầu giao tiếp được với bên ngoài. Ta cũng đoán được nó đã có kết nối đến C2 và ta sẽ cố gắng decrypt được luồng giao tiếp này

![image](https://hackmd.io/_uploads/Bk73UJiC1l.png)

## DiE
![image](https://hackmd.io/_uploads/BkptObKCyl.png)

Cho thấy file này là **.NET**, ta sẽ dùng **dnSpy** reverse về
 
## DnSpy
![image](https://hackmd.io/_uploads/Sy5HY-tCkg.png)

> GruntStager này là một phần của Covenant C2 server. Chức năng chính của nó là thiết lập giao tiếp được mã hóa giữa client và server. Quá trình mã hóa sử dụng RSA và AES và cặp khóa RSA được tạo ở phía client. Public key của nó được mã hóa bằng AES và IV gửi đến máy chủ cùng với AES, key là giá trị cố định được chia sẻ bởi cả hai bên.

Như định nghĩa, cặp khóa public + private key sẽ được tạo ở phiá client nên ta có thể tìm thấy nó

Tuy nhiên ta sẽ tiếp tục đọc code ở DnSpy để xem nó thực hiện decrypt kiểu gì rồi sau đó phân tích tiếp việc lấy cặp khóa key sau:

```
Key: Một chuỗi byte được định nghĩa trong code: `e+MPqFZXA52Kx1xuTPTK6M/HtJkjq/0dfBJUsSJfzQw=`
IV: Được cung cấp trong JSON
EncryptedMessage: Dữ liệu cần giải mã, cũng nằm trong JSON
HMAC: Được dùng để kiểm tra tính toàn vẹn
```

## Cyberchef
### Public key
Quay lại phân tích cặp key, để tạo kết nối đến C2 bắt buộc phía client phải tạo public key và gửi đi cho server để bắt đầu giao tiếp. Do đó file `POST` đầu tiên thấy được từ [WireShark](#WireShark) có thể sẽ là nội dung của public key

![image](https://hackmd.io/_uploads/ByFVpZFR1l.png)

Sử dụng Cyberchef dcode đoạn `data` 

![image](https://hackmd.io/_uploads/rJSDa-FAkx.png)

Có thể thấy nó được tạo theo đúng cấu trúc json mà ta reverse được từ [DnSpy](#DnSpy)
```
{
"GUID":"69ebf9edc54f128f1882",
"Type":0,
"Meta":"",
"IV":"eXQdHkomR+Buxj5YFc9wYA==",
"EncryptedMessage":"Ua6S7vjaf7akFocB9lofjhQ/7RJYufUi+npjUqrbVPJEaU72vNTJgCqsQas0K8mgSCeaUchJIN51OzRwS0Z01Ds7vZwaHbCch+XDA1P7LsoU2G6WIsEsk4jeyPwxMaNH9whoytlBC1a4KGcEReudNpClPebehzaA+8feR4OJuEqBbztwFmruO0ZNw96Xunk1iBqPfMs1XQaVT5t5pLTW4Jol7JjaFBD2ttIvzjatZUKe3jmkXV6t/6XB1X66uTG5OIL9BofoJZYOgsLFVaJa/5sxeAQ+oP+L3eEi/AF3NiFEDFYmKFg9pN4nUWOQDDOm4O9OnJIZwb2o0QY+RAnSBLT4Z0ir5ydtTxz3TbAnieL7xtEzOzYDaPGaWGNb/1EOqg3E9YFIu9yno0kOxirxT1U3dpME883Tjz0DteefsySZmSGxkZ259e3AklnEgcXztCrQ8++5TMoRkaU5SW6wHMKRCA/7iv+Hh21koNLLHBia16jDkq67jEq7gU0p2Q+1iQHqxcBU8BeZXzHzeUPa12my3USrzXd0M2dq072tMys=",
"HMAC":"bltnqzAjFSeLylTzhj0IHYpo4jWNyUFXEplqGr45vl8="
}
```

Viết python để decrypt `EncryptedMessage`
:::spoiler Đoạn code
```python
import base64
import json
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import hashlib
import hmac

def decrypt_message(json_data, key):
    """
    Giải mã message từ dữ liệu JSON sử dụng AES-CBC với PKCS7 padding.
    
    Args:
        json_data (str): Chuỗi JSON chứa IV, EncryptedMessage và HMAC.
        key (bytes): Khóa AES dưới dạng byte.
    
    Returns:
        bytes: Message đã giải mã.
    
    Raises:
        ValueError: Nếu HMAC không khớp.
    """
    # Parse dữ liệu JSON
    data = json.loads(json_data)
    iv = base64.b64decode(data['IV'])
    encrypted_message = base64.b64decode(data['EncryptedMessage'])
    received_hmac = base64.b64decode(data['HMAC'])
    
    # Kiểm tra HMAC
    calculated_hmac = hmac.new(key, encrypted_message, hashlib.sha256).digest()
    if not hmac.compare_digest(calculated_hmac, received_hmac):
        raise ValueError("HMAC verification failed - dữ liệu có thể đã bị thay đổi")
    
    # Giải mã message
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_padded_message = cipher.decrypt(encrypted_message)
    decrypted_message = unpad(decrypted_padded_message, AES.block_size)
    
    return decrypted_message

# Dữ liệu đầu vào
json_data = '''
{"GUID":"69ebf9edc54f128f1882","Type":0,"Meta":"","IV":"eXQdHkomR+Buxj5YFc9wYA==","EncryptedMessage":"Ua6S7vjaf7akFocB9lofjhQ/7RJYufUi+npjUqrbVPJEaU72vNTJgCqsQas0K8mgSCeaUchJIN51OzRwS0Z01Ds7vZwaHbCch+XDA1P7LsoU2G6WIsEsk4jeyPwxMaNH9whoytlBC1a4KGcEReudNpClPebehzaA+8feR4OJuEqBbztwFmruO0ZNw96Xunk1iBqPfMs1XQaVT5t5pLTW4Jol7JjaFBD2ttIvzjatZUKe3jmkXV6t/6XB1X66uTG5OIL9BofoJZYOgsLFVaJa/5sxeAQ+oP+L3eEi/AF3NiFEDFYmKFg9pN4nUWOQDDOm4O9OnJIZwb2o0QY+RAnSBLT4Z0ir5ydtTxz3TbAnieL7xtEzOzYDaPGaWGNb/1EOqg3E9YFIu9yno0kOxirxT1U3dpME883Tjz0DteefsySZmSGxkZ259e3AklnEgcXztCrQ8++5TMoRkaU5SW6wHMKRCA/7iv+Hh21koNLLHBia16jDkq67jEq7gU0p2Q+1iQHqxcBU8BeZXzHzeUPa12my3USrzXd0M2dq072tMys=","HMAC":"bltnqzAjFSeLylTzhj0IHYpo4jWNyUFXEplqGr45vl8="}
'''
key = base64.b64decode("e+MPqFZXA52Kx1xuTPTK6M/HtJkjq/0dfBJUsSJfzQw=")

# Thực hiện giải mã
try:
    decrypted_message = decrypt_message(json_data, key)
    print("Message đã giải mã:", decrypted_message.decode('utf-8'))
except Exception as e:
    print("Lỗi:", str(e))
```
:::

![image](https://hackmd.io/_uploads/HkHWR-FCkl.png)

Kết quả giải mã là một XML biểu diễn thông tin public key

## RSAKeyConverter
Ta có thể sử dụng [tool online](https://raskeyconverter.azurewebsites.net/XmlToPem?handler=ConvertPEM) để chuyển nó về dạng file `.pem`

![image](https://hackmd.io/_uploads/r1TURZYC1e.png)

Khi có public key, ta sẽ có giá trị `n` và `e`. Viết đoạn code đơn giản để lấy 2 giá trị này như sau:
:::spoiler
```python
from cryptography.hazmat.primitives import serialization

def get_rsa_pubkey_params(pem_file_path):
    # Đọc file public.pem
    with open(pem_file_path, "rb") as key_file:
        public_key = serialization.load_pem_public_key(key_file.read())
    
    # Lấy thông số n và e từ public key
    numbers = public_key.public_numbers()
    n = numbers.n  # modulus
    e = numbers.e  # public exponent
    
    # Chuyển n sang dạng hex, giữ e nguyên dạng số nguyên
    n_hex = hex(n)[2:]  # Bỏ prefix '0x'
    
    return n_hex, e

# Sử dụng hàm
pem_file = "public.pem"
n_hex, e = get_rsa_pubkey_params(pem_file)
print(f"n (hex): {n_hex}")
print(f"e: {e}")
```
:::

Sau khi có được public key và các giá trị của nó, ta vẫn phải tiếp tục tìm private key hoặc các giá trị để tính ra nó

## HxD (powershell.dmp)
> File `powershell.dmp` thường là một memory dump của quá trình PowerShell đang hoặc đã chạy. Khi PowerShell chạy command (ví dụ `IEX (New-Object Net.WebClient).DownloadString(...))`, command đó sẽ tồn tại dưới dạng chuỗi trong bộ nhớ, ít nhất là trong một khoảng thời gian. 

Do đó ta có thể dùng file này mở với HxD để xem giá trị của key đươc khởi tạo trong powershell

Có hai cách tìm giá trị này: 1 là dựa vào giá trị từ `n` tìm được bằng việc tính từ public key, 2 là dựa vào giá trị hex khi dùng HxD. Mình sẽ làm cách 2 vì cách 1 đã hiện rõ

Dựa vào header để lấy xác định các byte hoặc ngược lại
```
RSA2 ... 52 53 41 32 
```

![image](https://hackmd.io/_uploads/BJfRMfK01l.png)

`n` 256 byte đầu ở ảnh trên bắt đầu từ `C2 14 C8` 128 byte sau là `p` từ đó tính được private key

![image](https://hackmd.io/_uploads/HysRdfYCkx.png)

![image](https://hackmd.io/_uploads/HJtMFzF0yg.png)


Có thể thấy cách 2 này khi lấy `n` trùng với giá trị tính được từ public key : )

## Decrypt conversation
Sử dụng RSAKeyConverter để chuyển đổi file `.pem` sang định dạng XML

:::spoiler Code tính private key
```python
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

def mod_inverse(e, phi):
    """Tính nghịch đảo modulo của e mod phi"""
    def egcd(a, b):
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = egcd(b % a, a)
        x = y1 - (b // a) * x1
        y = x1
        return gcd, x, y
    
    gcd, x, _ = egcd(e, phi)
    if gcd != 1:
        raise ValueError("e và phi không nguyên tố cùng nhau!")
    return x % phi

def generate_private_key(n_hex, p_hex, e=65537):
    # Chuyển n và p từ hex sang số nguyên
    n = int(n_hex, 16)
    p = int(p_hex, 16)
    
    # Tính q từ n và p
    if n % p != 0:
        raise ValueError("p không phải là thừa số nguyên tố của n!")
    q = n // p
    
    # Kiểm tra p và q có tạo thành n
    if p * q != n:
        raise ValueError("p và q không tạo thành n!")
    
    # Tính phi(n) = (p-1)(q-1)
    phi = (p - 1) * (q - 1)
    
    # Tính d (private exponent) = nghịch đảo của e mod phi
    d = mod_inverse(e, phi)
    
    # Tạo private key
    public_numbers = rsa.RSAPublicNumbers(e, n)
    private_numbers = rsa.RSAPrivateNumbers(
        p=p,
        q=q,
        d=d,
        dmp1=d % (p - 1),
        dmq1=d % (q - 1),
        iqmp=mod_inverse(q, p),
        public_numbers=public_numbers
    )
    private_key = private_numbers.private_key(default_backend())
    
    return private_key

def save_private_key_to_pem(private_key, output_file):
    # Lưu private key vào file PEM
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    with open(output_file, "wb") as f:
        f.write(pem)

def main():
    # Nhập n và p từ người dùng (đều dạng hex)
    n_hex = input("Nhập n (dạng hex): ")
    p_hex = input("Nhập p (dạng hex): ")
    
    try:
        # Tạo private key
        private_key = generate_private_key(n_hex, p_hex)
        
        # Lưu vào file PEM
        output_file = "private.pem"
        save_private_key_to_pem(private_key, output_file)
        print(f"Private key đã được lưu vào {output_file}")
        
    except ValueError as ex:
        print(f"Lỗi: {ex}")

if __name__ == "__main__":
    main()
```
:::

Bây giờ tính ngược từ `.pem` sang xml bằng [tool](https://raskeyconverter.azurewebsites.net/PemToXml?handler=ConvertXML) thôi =))

![image](https://hackmd.io/_uploads/r1fhKGFRJl.png)

Bây giờ tiếp tục tạo code để lấy được aes key để có thể decrypt toàn bộ traffic

:::spoiler Code lấy aes key
```python 
import base64
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Util.Padding import unpad
import xml.etree.ElementTree as ET

# 1. Giải mã khóa AES từ chuỗi base64
key = base64.b64decode("e+MPqFZXA52Kx1xuTPTK6M/HtJkjq/0dfBJUsSJfzQw=")

# 2. Giải mã dữ liệu mã hóa từ chuỗi base64
s3 = "8AVdSUo020zmBvJqdpXDEA9sRyotMGyUVqXOrRFk95GxGDEYotveTpqJhHUKUQ3Oduh3c7gSyyM3qVVN674P+ghJNQcdJdRS1YlUJckbg/bOEkfuxJ25JWMPh21EPS0/ptf6ytfkhnXjVJ4v3miEtdZ/+vtP4L49V8Ucl7kej8DrPfux1wi4oGjIf4TdRb2OYLQExVbcMGLb8b73mjmGwWTywqDc5+mr/m80cyv2xVQHLpQIiw1xdjFCgIH3J2FZDQMm14gr4caODgmGT+JGoOCGl8pMEPJ6q58Cv5LHTNLl/k3vtufVv8vIzn8FXHoAy+2ZHJ1vZXIqUl+OubCv2VhhSmCXz6Fg/G4AqFWb+cA="
numArray2 = base64.b64decode(s3)

# 3. Phân tích khóa riêng RSA từ chuỗi XML
privateKeyXml = """<RSAKeyValue><Modulus>whTIf58LseBXkJ10h+oHQ0uSAG9N1oOgQwttHx9ZV/Vu4dhF5hkK0OdF8vX2/Qu6dNBtWRR4y5xJe9GpdswudB+lSClET9nFFAc50o8l57v8or71D/qvY2y+SFiyfDKUWqcL86QJW0w4cio2XfvKyT7X+RSIZ25YT7KFvv150K65uAR9JOZPGy2SQy/LJU7TgbgipyjOQmQ1m6NOHSrlRUst9mc3KDJ9BFXENxee35lPTvr0+EJmA/BXZNqlXO3ZX0Jrt8/WuP0zSxtyJk8Kq8Mukw8PfKApWmYK9t3sOTuADxE+2ixjlKvBQUlYYFgW5mPB9WgqkxKGDZ+4yVO0GQ==</Modulus><Exponent>AQAB</Exponent><P>0QK1VWaVrWw3cAcRub4lMF8v07gNi3fBX3hTxc5JU2+gDzCsPrX4W+u72paI4pLcsVmefxGW11NFEjY2dQdIgunWvwCXo40T2rq0J6oQkY6c381gZSGKf2YTKuDW5Uu8884rq4AxProDZ+Z8bvKN+lOPA8XeLk/xsI4Rm+2Anvc=</P><Q>7bbV+R02c5mZ+t0bFXCkoc4jUDprQhe4KsnFXpHdePSoX7pbhIljrW3gaNEp28RHOYpGsPxmgxQwdofBtmdwzgAK7zxpiaazN5khp/U4aR0hnlC7qHpyiFJx5y16dE+P740HOGDhCXKMAuZhWxKANvYYijXQGoq3Gk3+eu0KsW8=</Q><DP>TYuesYe1ArnCu7qzteE5NQAr43ZG+Da/NOeU1S/a/qzMirY5Qa8L7TbB5LCzKrToUph4eJaTC2KmnsIkZDkGiyOs/AKBQDnoYt+gVZMAQLDTvSkamYrfMrMxa1guArad7SrSAvg1zRsAhnz6L8OoL3bu+axg6XfZqPKcz+hHLzM=</DP><DQ>xf1HwKIFLUldB6XLHhNg++eOYA8YMMdCvFiry/WfylO0PW8hNIWeAOAITiUQQRv82r8B2/2NgFV7e+3ceQk02k8MzG+700uF76PadWL4Jgx+aLcDZfL+m+5XMl4dpOxzjOkgf2Opa039sZiis9D3+08D53Gkr8ajdQRLFaWDB38=</DQ><InverseQ>rOlXf6sSFb48UJQ9MHjn1dZIrEUtN9vVvsLI9jLLudGRpC11GbuwlmYkWodaqCaaKD3UBpjqVvEK4mXHknpnXXAMw2cervIykpXpzfRRNQcJTFx3/1kJU0sv7fgRApzbNcsWFxxR38ausiUe+cog/CrGtEYk/E4zDAUTfP/CtCg=</InverseQ><D>PlWgg+TYQ7wzQ55exBx1Urbd4Mfe7yv9eCseVCWkc2y/vUfSQ3H9mFT/kWZQeruemlArHrZFidfbfio7zI0NynwzgLbIWwEtnB4qAye42/Hz1W2Rlh1E4aEWiHP8d4ljPq5yV0FzQ+B6LKjEJ3FskzBc+4INwXKeaJKFBG+zBUPZpYvUXyfibzfW6VwzAt17LNj3OZ9hyhU3DZ4jg7LiLrrME2IH/1uJcOb9qR7UQt+5be9i/H9KmGqVHuKUmN5EibaVhPEFX2SgN+skpUtcLjVTW2yFSNn8PlrcdwxXNuRhbh/XhjRNYyXe2quE4GselTWZV/bMuYcz+VoRf3jbFQ==</D></RSAKeyValue>"""
root = ET.fromstring(privateKeyXml)

# Trích xuất các tham số RSA và chuyển thành số nguyên
n = int.from_bytes(base64.b64decode(root.find('Modulus').text), 'big')
e = int.from_bytes(base64.b64decode(root.find('Exponent').text), 'big')
d = int.from_bytes(base64.b64decode(root.find('D').text), 'big')
p = int.from_bytes(base64.b64decode(root.find('P').text), 'big')
q = int.from_bytes(base64.b64decode(root.find('Q').text), 'big')

# Xây dựng khóa RSA
rsa_key = RSA.construct((n, e, d, p, q))

# 4. Giải mã IV từ chuỗi base64
iv = base64.b64decode("7/1U1Qfc69DJkFQMuC7YLg==")

# 5. Tạo đối tượng AES với chế độ CBC
aes = AES.new(key, AES.MODE_CBC, iv)

# 6. Giải mã dữ liệu bằng AES và loại bỏ padding PKCS7
decrypted_aes = aes.decrypt(numArray2)
rgb = unpad(decrypted_aes, AES.block_size)

# 7. Tạo đối tượng RSA với padding OAEP
cipher_rsa = PKCS1_OAEP.new(rsa_key)

# 8. Giải mã dữ liệu bằng RSA
numArray3 = cipher_rsa.decrypt(rgb)

# 9. In kết quả mã hóa base64
print(base64.b64encode(numArray3).decode())
```
:::

Sau khi có được aes thì việc còn lại là lấy từng traffic đem đi decrypt 

## Malware related to Keylogger 
Như đã phân tích trên [WireShark](#WireShark), bây ta đã có thể xem luồng giao tiếp của nó để biết hành vi đang làm gì.

Luồng đầu tiên có thể thấy được T.A đã có thể biết được hệ thống có những file gì hoạt động

![image](https://hackmd.io/_uploads/B1mdv1jAJe.png)

Sau đó là việc T.A đã chạy keylogger và gửi nội dung ra bên ngoài thành công

![image](https://hackmd.io/_uploads/rJEtwksA1g.png)

Nó theo dõi cả hành vi như mở file Edge

![image](https://hackmd.io/_uploads/HJ1Bu1s01e.png)

Từ đây ta cũng lấy được các part của flag

![image](https://hackmd.io/_uploads/HykRD1i0Je.png)

# Acknowledgements
I would like to express my sincere gratitude to Sir [Abdelrhman Mohamed](https://www.linkedin.com/in/abdelrhman322/) for his invaluable support in explaining how the communication stream is decrypted.







