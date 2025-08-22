import base64
from Crypto.Cipher import AES

def hex_to_bytes(hex_str):
    return bytes.fromhex(hex_str)

def decrypt_aes_cbc(ciphertext_bytes, key_bytes, iv_bytes):
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes)
    decrypted = cipher.decrypt(ciphertext_bytes)
    return decrypted

def main(input_file, output_file):
    key_hex = "4d65bdbad183f00203b1e80cf96fba549663dabeab12fab153a921b346975cdd"
    iv_utf8 = "infinity_edgehtb"

    key = hex_to_bytes(key_hex)
    iv = iv_utf8.encode("utf-8")

    with open(input_file, "r") as f_in, open(output_file, "wb") as f_out:
        for line_number, line in enumerate(f_in, start=1):
            line = line.strip()
            if not line:
                continue
            ciphertext = base64.b64decode(line)
            plaintext = decrypt_aes_cbc(ciphertext, key, iv)

            f_out.write(plaintext)
            separator = f"\n-------------({line_number})-------------\n".encode('utf-8')
            f_out.write(separator)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python decrypt.py <input_file.txt> <output_file.raw>")
    else:
        main(sys.argv[1], sys.argv[2])
