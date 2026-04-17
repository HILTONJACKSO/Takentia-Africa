import os
import re

def fix_syntax_errors():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                
                # Fix axios.get`${API_BASE_URL}` -> axios.get(`${API_BASE_URL}`)
                # Note: we need to handle the opening parenthesis
                new_content = re.sub(r'axios\.(get|post|put|patch|delete)`(\$\{API_BASE_URL\}[^`]*)`', r'axios.\1(`\2`)', new_content)
                
                # Fix axios.get('`${API_BASE_URL}`' -> axios.get(`${API_BASE_URL}`)
                new_content = re.sub(r'axios\.(get|post|put|patch|delete)\(\'`(\$\{API_BASE_URL\}[^`]*)`\'', r'axios.\1(`\2`)', new_content)
                
                # Fix some leftover trash from previous scripts
                new_content = new_content.replace('`${API_BASE_URL}`}"}")', '`${API_BASE_URL}`')
                new_content = new_content.replace('`"${API_BASE_URL}"`', '`${API_BASE_URL}`')
                
                # Fix the companyId ternary mess if any
                new_content = re.sub(r'\$\{API_BASE_URL\}`}"\}"\)', '`${API_BASE_URL}`', new_content)
                
                # Ensure API_BASE_URL is used as a template literal where appropriate
                # but NOT as a tag
                
                if new_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    fix_syntax_errors()
