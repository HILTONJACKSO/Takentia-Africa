import os

def search_address(root_dir):
    for root, dirs, files in os.walk(root_dir):
        if "venv" in dirs:
            dirs.remove("venv")
        if ".git" in dirs:
            dirs.remove(".git")
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if "Address" in content:
                        print(f"Found in: {file_path}")
            except Exception as e:
                pass

if __name__ == "__main__":
    search_address("c:\\Users\\User\\Pictures\\Talantia-HR-Project\\backend")
