# pip install pycryptodome
from base64 import b64decode
from Crypto.Cipher import DES3

cipher_b64 = 'encrypt_pass'
key        = b'secret_key'      # 24-byte key trong config

raw       = b64decode(cipher_b64)
iv, data  = raw[:8], raw[8:]                  # 8-byte IV + ciphertext

cipher3des       = DES3.new(key, DES3.MODE_CBC, iv)
plaintext_padded = cipher3des.decrypt(data)

pad_len   = plaintext_padded[-1]              # PKCS#7 độ dài đệm
plaintext = plaintext_padded[:-pad_len].decode()

print(plaintext)  
