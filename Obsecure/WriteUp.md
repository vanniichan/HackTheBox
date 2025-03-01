# Obscure 
## CHALLENGE DESCRIPTION
An attacker has found a vulnerability in our web server that allows arbitrary PHP file upload in our Apache server. Suchlike, the hacker has uploaded a what seems to be like an obfuscated shell (support.php). We monitor our network 24/7 and generate logs from tcpdump (we provided the log file for the period of two minutes before we terminated the HTTP service for investigation), however, we need your help in analyzing and identifying commands the attacker wrote to understand what was compromised.

## Tools use
- WireShark
- hashcat
- johntheripper
- vscode

# Analysis
Theo mô tả của challenge thì T.A upload file `support.php` đồng thời ta cũng có file này. 

## WireShark
Filter `http` sẽ thấy được T.A upload file thành công và đều nhận được respond từ server 

![image](https://hackmd.io/_uploads/rylapbZsyg.png)

Nội dung của nó đã bị mã hóa

![image](https://hackmd.io/_uploads/S1MfAZWsyx.png)

## VScode
Xem code của `support.php`, đã bị obfuscate tuy nhiên thì việc deobfuscate lại cũng dễ. Chỉ cần sử dụng `str_replace` để thay thế các ký tự bị xáo là xong

![image](https://hackmd.io/_uploads/H17Ysb-jJe.png)

Đây là đoạn code (đã có chỉnh sửa method POST thành GET mục đích là để cho cái đoạn đầu ra/vào sau khi T.A request)
```
<?php
function x($t, $k) {
    $c = strlen($k);
    $l = strlen($t);
    $o = "";
    for ($i = 0; $i < $l;) {
        for ($j = 0; ($j < $c && $i < $l); $j++, $i++) {
            $o .= $t[$i] ^ $k[$j];
        }
    }
    return $o;
}

$k = "80e32263";
$kh = "6f8af44abea0";
$kf = "351039f4a7b5";

// Kiểm tra nếu có dữ liệu đầu vào từ URL (GET)
if (isset($_GET['input'])) {
    $input = trim($_GET['input']);

    if (preg_match("/$kh(.+)$kf/", $input, $m)) {
        $decoded = @x(@base64_decode($m[1]), $k);
        $uncompressed = @gzuncompress($decoded);

        echo "Nội dung đã giải mã: <pre>" . htmlspecialchars($uncompressed ? $uncompressed : $decoded) . "</pre>";
    } else {
        echo "Chuỗi nhập vào không hợp lệ hoặc không khớp mẫu.";
    }
} else {
    echo "Vui lòng nhập chuỗi cần giải mã qua tham số '?input=chuoi_ma_hoa'";
}
?>
```

Đây chính là nội dung của các request của T.A sau khi được decode

![image](https://hackmd.io/_uploads/r14R4--skl.png)

![image](https://hackmd.io/_uploads/BywDN--iJg.png)

![image](https://hackmd.io/_uploads/ByHU8bZjyg.png)

![image](https://hackmd.io/_uploads/rkFELW-sJl.png)

![image](https://hackmd.io/_uploads/r1g2HWbokx.png)

![image](https://hackmd.io/_uploads/S1yitWboye.png)

Chú ý ở ảnh cuối thấy T.A đang cố lấy nội dung file` pwdb.kdbx`, đây là một file lưu trữ mật khẩu, bằng cách encode nội dung file bằng b64 ra màn hình

```
chdir('/home/developer');@error_reporting(0);@system('base64 -w 0 pwdb.kdbx 2>&1');
```

Đây sẽ là nội dung của file 

![image](https://hackmd.io/_uploads/SJ45hWZskl.png)

(Ảnh trên mạng), ta vẫn cần mật khẩu để có thể xem được nội dung của file này

![image](https://hackmd.io/_uploads/rySCn-Zsye.png)

## johntheripper and hashcat

Để làm được việc trên, johntheripper và hashcat sẽ hỗ trợ ta crack pass

![image](https://hackmd.io/_uploads/BkdVpZ-skg.png)

![image](https://hackmd.io/_uploads/rJVS6W-oJg.png)

Pass: `chainssssaw`

![image](https://hackmd.io/_uploads/B11Da-ZjJl.png)

![image](https://hackmd.io/_uploads/ByYuTZZi1x.png)

Copy password ra và lấy được flag.
