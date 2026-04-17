import os
import re

def final_syntax_polish():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                
                # 1. Fix axios calls with extra parenthesis
                # Matches axios.get(`${API_BASE_URL}`), {
                new_content = re.sub(r'axios\.(get|post|put|patch|delete)\((`\$\{API_BASE_URL\}[^`]*`)\),\s*\{', r'axios.\1(\2, {', new_content)
                
                # 2. Fix missing closing brace in style={{ ... }}
                new_content = re.sub(r'style=\{\{([^}]*)\}([^\}])', r'style={{\1}}\2', new_content)
                
                # 3. Fix missing closing brace in onClick={() => { ... }}
                # This is trickier because it can span multiple lines.
                # We look for onClick={() => { followed by anything that doesn't have }} before >
                # Actually, simpler: if line has { and then } followed by > or />, and it's missing a }
                
                # Fix one-liners: onClick={() => { ... } } >
                new_content = re.sub(r'onClick=\{\(\)\s*=>\s*\{([^}]*)\}(\s*[/>])', r'onClick={() => {\1}}\2', new_content)
                
                # Fix multi-liners by looking for the specific pattern in Navbar/Sidebar
                new_content = new_content.replace('window.location.href = \'/login\';\n                            }', 'window.location.href = \'/login\';\n                            }}')
                new_content = new_content.replace('window.location.href = \'/login\';\n                        }', 'window.location.href = \'/login\';\n                        }}')

                if new_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    final_syntax_polish()
