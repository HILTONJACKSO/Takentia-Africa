import os
import re

def replace_hardcoded_urls():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    # We want to replace "http://localhost:8001/api/v1" or "http://localhost:8001/api"
    # with a more flexible version. 
    # Since apiClient is already defined in lib/api.ts, the best is to use it.
    # But for a quick fix, let's replace it with process.env.NEXT_PUBLIC_API_URL
    
    target_pattern1 = re.compile(r"http://localhost:8001/api/v1")
    target_pattern2 = re.compile(r"http://localhost:8001/api")
    
    # Correction: Use the process.env directly if we don't want to refactor to apiClient right now
    replacement = "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'}"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = target_pattern1.sub(replacement, content)
                new_content = target_pattern2.sub(replacement, new_content)
                
                if new_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    replace_hardcoded_urls()
