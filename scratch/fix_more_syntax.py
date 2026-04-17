import os

fixes = {
    r"frontend\src\app\dashboard\finance\payroll\page.tsx": [
        ('const API_URL = \n${API_BASE_URL}";', 'const API_URL = `${API_BASE_URL}`;'),
        ('const API_URL = ${API_BASE_URL}";', 'const API_URL = `${API_BASE_URL}`;')
    ],
    r"frontend\src\app\dashboard\hr\attendance\page.tsx": [
        ("axios.get(url, { headers: { Authorization: `Bearer ${token}` });", "axios.get(url, { headers: { Authorization: `Bearer ${token}` } });"),
        ("axios.get(url, { headers: { Authorization: `Bearer \n${token}` });", "axios.get(url, { headers: { Authorization: `Bearer ${token}` } });")
    ],
    r"frontend\src\app\dashboard\hr\performance\page.tsx": [
        ("backgroundColor: \n`${stat.color}}15`", "backgroundColor: `${stat.color}15`"),
        ("backgroundColor: `${stat.color}}15`", "backgroundColor: `${stat.color}15`")
    ],
    r"frontend\src\app\dashboard\hr\staff\[id]\page.tsx": [
        ("axios.get(`${API_BASE_URL}/hr/employees/${id}`) } }),", "axios.get(`${API_BASE_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } }),") 
        # Wait, the error is: const [deptRes, empRes] = await Promise.all([ axios.get... } }), axios.get... ])
        # The first is supposed to be departments, the second employees. Let's replace the whole block in python.
    ],
    r"frontend\src\app\dashboard\hr\staff\add\page.tsx": [
        ("await \naxios.post(`${API_BASE_URL}/hr/employees`), payload, {", "await axios.post(`${API_BASE_URL}/hr/employees`, payload, {"),
        ("await axios.post(`${API_BASE_URL}/hr/employees`), payload, {", "await axios.post(`${API_BASE_URL}/hr/employees`, payload, {")
    ],
    r"frontend\src\app\dashboard\hr\staff\page.tsx": [
        ("backgroundColor: \n`${stat.color}}15`", "backgroundColor: `${stat.color}15`"),
        ("backgroundColor: `${stat.color}}15`", "backgroundColor: `${stat.color}15`")
    ],
    r"frontend\src\app\dashboard\operations\assets\page.tsx": [
        ("backgroundColor: `${s.color}}15`", "backgroundColor: `${s.color}15`")
    ],
    r"frontend\src\app\dashboard\operations\expenses\new\page.tsx": [
        ("await \naxios.post(`${API_BASE_URL}/operations/expenses`), payload, {", "await axios.post(`${API_BASE_URL}/operations/expenses`, payload, {"),
        ("await axios.post(`${API_BASE_URL}/operations/expenses`), payload, {", "await axios.post(`${API_BASE_URL}/operations/expenses`, payload, {")
    ],
    r"frontend\src\app\dashboard\operations\expenses\page.tsx": [
        ("backgroundColor: `${s.color}}15`", "backgroundColor: `${s.color}15`")
    ],
    r"frontend\src\app\dashboard\operations\maintenance\page.tsx": [
        ("backgroundColor: `${s.color}}15`", "backgroundColor: `${s.color}15`")
    ],
    r"frontend\src\app\dashboard\operations\payment-requests\new\page.tsx": [
        ("await axios.post(`${API_BASE_URL}/operations/payment-requests`), payload, {", "await axios.post(`${API_BASE_URL}/operations/payment-requests`, payload, {")
    ],
    r"frontend\src\app\dashboard\operations\payment-requests\page.tsx": [
        ("backgroundColor: `${s.color}}15`", "backgroundColor: `${s.color}15`")
    ],
    r"frontend\src\app\dashboard\operations\petty-cash\page.tsx": [
        ("backgroundColor: `${s.color}}15`", "backgroundColor: `${s.color}15`")
    ],
    r"frontend\src\app\dashboard\operations\revenues\new\page.tsx": [
        ("await axios.post(`${API_BASE_URL}/operations/revenues`), payload, {", "await axios.post(`${API_BASE_URL}/operations/revenues`, payload, {")
    ],
    r"frontend\src\app\dashboard\operations\revenues\page.tsx": [
        ("backgroundColor: `${s.color}}15`", "backgroundColor: `${s.color}15`")
    ]
}

def apply_fixes():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project"
    for rel_path, replacements in fixes.items():
        abs_path = os.path.join(root_dir, rel_path)
        if not os.path.exists(abs_path):
            print(f"File not found: {abs_path}")
            continue
            
        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        # specifically fix staff/[id]/page.tsx
        if "staff\\[id]\\page.tsx" in rel_path or "staff/[id]/page.tsx" in rel_path.replace("\\", "/"):
            new_content = new_content.replace(
                "axios.get(`${API_BASE_URL}/hr/employees/${id}`) } }),",
                "axios.get(`${API_BASE_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } }),"
            )
            # also might be missing opening bracket or so
            import re
            new_content = re.sub(
                r'axios\.get\(`\$\{API_BASE_URL\}/hr/employees/\$\{id\}`\)\s*\}\s*\}\),',
                r'axios.get(`${API_BASE_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } }),',
                new_content
            )
            
        if new_content != content:
            print(f"Fixed {abs_path}")
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(new_content)

if __name__ == "__main__":
    apply_fixes()
