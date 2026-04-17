import os
import re

fixes = {
    # 1. Missing brace in style objects
    r"frontend\src\app\dashboard\hr\performance\page.tsx": [
        ("color: stat.color }>", "color: stat.color }}>")
    ],
    r"frontend\src\app\dashboard\hr\staff\page.tsx": [
        ("color: stat.color }>", "color: stat.color }}>")
    ],
    r"frontend\src\app\dashboard\operations\assets\page.tsx": [
        ("color: s.color }>", "color: s.color }}>")
    ],
    r"frontend\src\app\dashboard\operations\expenses\page.tsx": [
        ("color: s.color }>", "color: s.color }}>")
    ],
    r"frontend\src\app\dashboard\operations\maintenance\page.tsx": [
        ("color: s.color }>", "color: s.color }}>")
    ],
    r"frontend\src\app\dashboard\operations\petty-cash\page.tsx": [
        ("color: s.color }>", "color: s.color }}>")
    ],
    r"frontend\src\app\dashboard\operations\revenues\page.tsx": [
        ("color: s.color }>", "color: s.color }}>")
    ],
    r"frontend\src\app\dashboard\operations\payment-requests\page.tsx": [
        ("color: s.color }>", "color: s.color }}>")
    ],
    
    # 2. Extra paren in axios calls
    r"frontend\src\app\dashboard\finance\payroll\page.tsx": [
        ("await axios.post(`${API_BASE_URL}`),\n                payload,\n                { headers: { Authorization: `Bearer ${token}` } }", 
         "await axios.post(`${API_BASE_URL}/payroll/runs`, payload, { headers: { Authorization: `Bearer ${token}` } }")
    ],
    r"frontend\src\app\dashboard\hr\attendance\page.tsx": [
        ("await axios.post(`${API_BASE_URL}/hr/attendance`), payload, {", "await axios.post(`${API_BASE_URL}/hr/attendance`, payload, {")
    ],
    r"frontend\src\app\dashboard\hr\staff\[id]\page.tsx": [
        ("await axios.put(`${API_BASE_URL}/hr/employees/${id}`), data, {", "await axios.put(`${API_BASE_URL}/hr/employees/${id}`, data, {")
    ],
    r"frontend\src\app\dashboard\hr\staff\add\page.tsx": [
        ("await axios.post(`${API_BASE_URL}/hr/employees`), payload, {", "await axios.post(`${API_BASE_URL}/hr/employees`, payload, {")
    ],
    r"frontend\src\app\dashboard\operations\payment-requests\page.tsx": [
        ("await axios.patch(`${API_BASE_URL}/operations/payment-requests/${id}/status`),\n                payload,\n                { headers: { Authorization: `Bearer ${token}` } }\n            );",
         "await axios.patch(`${API_BASE_URL}/operations/payment-requests/${id}/status`, payload, { headers: { Authorization: `Bearer ${token}` } });")
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
            # We use strict replace since we got exact matches
            new_content = new_content.replace(old, new)
            
        # specifically if payroll/page.tsx failed literal match, use re
        if "finance\\payroll" in rel_path:
            new_content = re.sub(r'await axios\.post\(`\$\{API_BASE_URL\}`\),\s*payload,\s*\{\s*headers:\s*\{\s*Authorization:', 
                                 r'await axios.post(`${API_BASE_URL}/payroll/runs`, payload, { headers: { Authorization:', new_content)
        
        if "payment-requests\\page.tsx" in rel_path:
            new_content = re.sub(r'await axios\.patch\(`\$\{API_BASE_URL\}/operations/payment-requests/\$\{id\}/status`\),\s*payload,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\s*\);',
                                 r'await axios.patch(`${API_BASE_URL}/operations/payment-requests/${id}/status`, payload, { headers: { Authorization: `Bearer ${token}` } });', new_content)

        if new_content != content:
            print(f"Fixed {abs_path}")
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(new_content)

if __name__ == "__main__":
    apply_fixes()
