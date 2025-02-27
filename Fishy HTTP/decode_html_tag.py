import base64
import random
import re

# Tag to hex mapping (same as the original C# program)
tag_hex = {
"cite": "0", "h1": "1", "p": "2", "a": "3", "img": "4", "ul": "5", "ol": "6",
"button": "7", "div": "8", "span": "9", "label": "a", "textarea": "b", "nav": "c",
"b": "d", "i": "e", "blockquote": "f"
}

def decode_html(input_file):
# Read the HTML content from the file
with open(input_file, 'r') as f:
html_content = f.read()

# Function to decode the data from base64 string using tag_hex mapping
def decode_data(data):
# Find all the tags in the body content and replace them with the hex mapping
decoded_str = ""

# Match opening tags and replace them with their corresponding hex values
matches = re.findall(r'<(\w+)[\s>]', data)
for match in matches:
if match in tag_hex:
decoded_str += tag_hex[match]

# Print the hex string before converting to bytes
print("Hex String:", decoded_str)

# Try converting the hex string into bytes and decode it to ASCII
try:
decoded_bytes = bytes.fromhex(decoded_str)
decoded_ascii = decoded_bytes.decode('ascii')
return decoded_bytes, decoded_ascii
except ValueError as e:
# Handle the error gracefully if invalid hex is encountered
return f"Error decoding hex: {str(e)}", None

# Decode the HTML content using the decode_data function
decoded_bytes, decoded_html = decode_data(html_content)

return decoded_bytes, decoded_html

# Take the file path as input from the user
input_file = input("Please enter the path to the HTML file: ")
decoded_bytes, decoded_html = decode_html(input_file)

# Output the decoded bytes and ASCII
if decoded_html:
print("\nDecoded ASCII:")
print(decoded_html)
print("\nDecoded Bytes:")
print(decoded_bytes)
