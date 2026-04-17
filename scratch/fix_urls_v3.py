import os
import re

def clean_and_fix_urls():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Step 1: Revert any line containing the messed up patterns
                # This pattern catches both my v1 and v2 messes
                new_content = re.sub(r'(\()?process\.env\.NEXT_PUBLIC_API_URL.*?http://localhost:8001/api/v1.*?\)?', 'http://localhost:8001/api/v1', content)
                new_content = re.sub(r'\$\{process\.env\.NEXT_PUBLIC_API_URL.*?\}', 'http://localhost:8001/api/v1', new_content)
                new_content = re.sub(r'["\']http://localhost:8001/api/v1["\']', '`http://localhost:8001/api/v1`', new_content)
                
                # Step 2: Now that we have `http://localhost:8001/api/v1` (mostly)
                # Let's replace it with a clean variable
                # Replace `http://localhost:8001/api/v1` with `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}`
                # We use backticks to be safe as it's already inside backticks (from previous step 1.3)
                # Wait, if I do that, I might double backtick.
                
                # Let's do it much simpler:
                # Replace the string literal including quotes/backticks
                final_content = new_content.replace('`http://localhost:8001/api/v1`','`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}`')

                # Handle instances of /api/v1 that might be combined with other things
                final_content = final_content.replace('http://localhost:8001/api/v1', '${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}')
                
                # Cleanup double interpolation if it happened
                final_content = final_content.replace('${${', '${')
                final_content = final_content.replace('}}', '}')
                
                if final_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(final_content)

if __name__ == "__main__":
    clean_and_fix_urls()
