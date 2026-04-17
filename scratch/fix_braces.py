import os
import re

def fix_braces():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Look for style={{ ... } and fix to style={{ ... }}
                # We look for {{ followed by non-}} until a single } and then a non-} (like > or newline or space)
                new_content = re.sub(r'style=\{\{([^}]*)\}([^\}])', r'style={{\1}}\2', content)
                
                # Repeat once in case there are multiple on one line or nested
                new_content = re.sub(r'style=\{\{([^}]*)\}([^\}])', r'style={{\1}}\2', new_content)
                
                if new_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    fix_braces()
