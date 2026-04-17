import os
import re

def final_fix_urls():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                if "lib/api.ts" in file_path.replace("\\", "/"):
                     continue # Don't touch api.ts as it's the source of truth
                     
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Step 1: Catch the mess and replace with a placeholder "BASE_URL_PLACEHOLDER"
                # This pattern is greedy enough to catch the outer symbols I added
                new_content = re.sub(r'(\()?(`|")?\$\{?process\.env\.NEXT_PUBLIC_API_URL.*?http://localhost:8001/api/v1.*?\}?("`|")?(\)?.*?\)?.*?\)?.*?)', '"BASE_URL_PLACEHOLDER"', content)
                
                # Catch any remaining ones
                new_content = re.sub(r'process\.env\.NEXT_PUBLIC_API_URL.*?http://localhost:8001/api/v1.*?', 'BASE_URL_PLACEHOLDER', new_content)
                
                # Step 2: Ensure we have the import
                if "BASE_URL_PLACEHOLDER" in new_content:
                    if "import { API_BASE_URL }" not in new_content:
                        # Add import after first 'import' or at top
                        new_content = "import { API_BASE_URL } from \"@/lib/api\";\n" + new_content
                    
                    # Step 3: Replace placeholder with template literal
                    # Be careful if it's already inside a string or template
                    new_content = new_content.replace('"BASE_URL_PLACEHOLDER"', "`${API_BASE_URL}`")
                    new_content = new_content.replace('BASE_URL_PLACEHOLDER', "${API_BASE_URL}")

                # Step 4: Fix any regular hardcoded URLs I missed
                # Replace "http://localhost:8001/api/v1" with `${API_BASE_URL}`
                new_content = new_content.replace('"http://localhost:8001/api/v1"', "`${API_BASE_URL}`")
                new_content = new_content.replace("'http://localhost:8001/api/v1'", "`${API_BASE_URL}`")
                
                # Cleanup potential triple-interpolations or syntax errors
                new_content = new_content.replace("`${API_BASE_URL}`/v1", "`${API_BASE_URL}`") # Adjust if v1 was already part of it
                new_content = new_content.replace("${${API_BASE_URL}}", "${API_BASE_URL}")
                new_content = new_content.replace("${API_BASE_URL}}", "${API_BASE_URL}")
                new_content = new_content.replace("{${API_BASE_URL}", "${API_BASE_URL}")

                if new_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

if __name__ == "__main__":
    final_fix_urls()
