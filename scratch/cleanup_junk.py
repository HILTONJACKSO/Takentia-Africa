import os
import re

def clean_trash():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Cleanup the trailing trash
                new_content = content
                
                # These are the specific patterns I saw
                new_content = new_content.replace('`${API_BASE_URL}`}"}")', '`${API_BASE_URL}`')
                new_content = new_content.replace('`${API_BASE_URL}`}"}/v1\'}/', '`${API_BASE_URL}`/')
                new_content = new_content.replace('`${API_BASE_URL}`}"}', '`${API_BASE_URL}`')
                new_content = new_content.replace('`${API_BASE_URL}`"}}', '`${API_BASE_URL}`')
                new_content = new_content.replace('`${API_BASE_URL}`"}', '`${API_BASE_URL}`')
                
                # Fix the case in staff/page.tsx line 51-52
                new_content = re.sub(r'\$\{API_BASE_URL\}`}"\}"\)', '`${API_BASE_URL}`', new_content)
                new_content = re.sub(r'\$\{API_BASE_URL\}`}"\}/v1\'\}/', '`${API_BASE_URL}`/', new_content)
                
                # Final check for any `${API_BASE_URL}` followed by junk
                new_content = re.sub(r'(\$\{API_BASE_URL\}`)[^;,\s\?:\n)]+', r'\1', new_content)

                if new_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    clean_trash()
