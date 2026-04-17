import os

def fix_use_client_directive():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Check if "use client" is in the file but not at the very top
                lines = content.split('\n')
                use_client_idx = -1
                for i, line in enumerate(lines):
                    if line.strip() == '"use client";' or line.strip() == "'use client';":
                        use_client_idx = i
                        break
                
                if use_client_idx > 0:
                    # Move it to the very top
                    line_val = lines.pop(use_client_idx)
                    lines.insert(0, line_val)
                    
                    new_content = '\n'.join(lines)
                    print(f"Fixing 'use client' in {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    fix_use_client_directive()
