import base64
import gzip
import io

def main():
    print("[*] Nhập vào chuỗi shellcode base64:")
    shellcode_base64 = input(">>> ").strip()

    try:
        # Base64 decode
        compressed = base64.b64decode(shellcode_base64)
    except Exception as e:
        print(f"[!] Lỗi giải mã base64: {e}")
        return

    try:
        # Gzip decompress
        decompressed = gzip.decompress(compressed)
    except Exception as e:
        print(f"[!] Lỗi giải nén gzip: {e}")
        return

    # Save to file
    output_file = "shellcode.sc"
    with open(output_file, "wb") as f:
        f.write(decompressed)

    print(f"[+] Giải nén xong! Dữ liệu dài {len(decompressed)} bytes.")
    print(f"[+] Đã lưu vào file: {output_file}")

if __name__ == "__main__":
    main()
