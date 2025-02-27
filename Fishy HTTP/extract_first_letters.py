def extract_first_letters(file_path):
result = ""
try:
# Open the file for reading
with open(file_path, 'r') as file:
content = file.read() # Read the entire content
# Split the content by spaces to get each word
words = content.split()
for word in words:
# If the word starts with an alphabetic letter, take its first character
if word[0].isalpha():
result += word[0]
else:
# Otherwise, keep the symbol or number as-is
result += word[0]
print("Extracted String:", result)
except FileNotFoundError:
print(f"Error: File '{file_path}' not found.")
except Exception as e:
print(f"An error occurred: {e}")

# Example usage
file_path = "yo.txt" # Change to the path of your text file
extract_first_letters(file_path)
