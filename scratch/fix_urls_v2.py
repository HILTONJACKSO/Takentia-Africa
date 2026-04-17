import os
import re

def fix_urls_robustly():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    
    # First, let's clean up any previous mess (anything containing process.env.NEXT_PUBLIC_API_URL)
    # Revert to a clean hardcoded URL so we can re-apply correctly.
    clean_url = "http://localhost:8001/api/v1"
    
    # This pattern matches any attempt at dynamic URL from my previous script
    mess_pattern = re.compile(r"\${process\.env\.NEXT_PUBLIC_API_URL.*?}/v1")
    mess_pattern2 = re.compile(r"\${process\.env\.NEXT_PUBLIC_API_URL.*?}")
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Fix the double-interpolation mess
                # Find the outer ${...} and replace it back to hardcoded URL
                temp_content = content
                if "NEXT_PUBLIC_API_URL" in temp_content:
                     # This is a bit risky but we know what we did.
                     # Any line like: `${process.env.NEXT_PUBLIC_API_URL ...}`
                     # or "${process.env.NEXT_PUBLIC_API_URL ...}"
                     # Let's just catch the whole mess and replace with clean_url
                     temp_content = re.sub(r'["`]\$\{process\.env\.NEXT_PUBLIC_API_URL.*?\}["`]', f'"{clean_url}"', temp_content)
                     # Also for cases where it was already in a backtick string
                     temp_content = re.sub(r'\$\{process\.env\.NEXT_PUBLIC_API_URL.*?\}', f'{clean_url}', temp_content)

                # Now apply the correct fix
                # We want: 
                # if inside "" -> change "" to `` and use ${...}
                # if inside `` -> just use ${...}
                
                # Actually, the simplest is to replace any occurrence of "http://localhost:8001/api/v1" (with quotes)
                # with (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1")
                # and any occurrence of http://localhost:8001/api/v1 (without quotes, inside backticks)
                # with ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}
                
                # Let's do it file by file with specific strings
                final_content = temp_content
                
                # Case 1: "http://localhost:8001/api/v1" -> (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1")
                # (Note: this handles the baseUrl or direct axios calls in quotes)
                final_content = final_content.replace(f'"{clean_url}"', f'(process.env.NEXT_PUBLIC_API_URL || "{clean_url}")')
                
                # Case 2: inside backticks
                # This is trickier as we don't want to double interpolate.
                # We'll replace occurrences that are NOT already starting with ${
                def sub_inside_backticks(match):
                    # match.group(0) is the whole match
                    return f'${{process.env.NEXT_PUBLIC_API_URL || "{clean_url}"}}'
                
                # Look for clean_url and ensure it's not preceded by ${
                # Using a negative lookbehind is hard in Python re if not fixed width, 
                # but we can check if it's already fixed.
                if clean_url in final_content:
                    # Replace clean_url with the dynamic version, 
                    # but only if it's NOT already preceded by ${
                    # Since we reverted, this should be safe.
                    final_content = final_content.replace(clean_url, f'${{process.env.NEXT_PUBLIC_API_URL || "{clean_url}"}}')
                    
                # Clean up if I accidentally introduced double brackets like ${$...}
                final_content = final_content.replace(f'${{(process.env.NEXT_PUBLIC_API_URL', f'(process.env.NEXT_PUBLIC_API_URL')
                
                if final_content != content:
                    print(f"Updating {file_path}")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(final_content)

if __name__ == "__main__":
    fix_urls_robustly()
