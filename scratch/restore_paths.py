import os

# Comprehensive mapping to restore stripped paths
# Format: FileSuffix -> List of (OldPart, NewPart)
path_restorations = {
    "dashboard/hr/staff/page.tsx": [
        ("? `${API_BASE_URL}`", "? `${API_BASE_URL}/hr/employees?company_id=${companyId}`"),
        (": `${API_BASE_URL}`", ": `${API_BASE_URL}/hr/employees`"),
        ("axios.delete(`${API_BASE_URL}`", "axios.delete(`${API_BASE_URL}/hr/employees/${id}`")
    ],
    "dashboard/hr/staff/add/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/hr/employees`"),
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/companies/`"), # To fetch companies
    ],
    "dashboard/hr/staff/[id]/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/hr/employees/${id}`"),
        ("axios.put(`${API_BASE_URL}`", "axios.put(`${API_BASE_URL}/hr/employees/${id}`")
    ],
    "dashboard/hr/attendance/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/hr/attendance`"),
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/hr/attendance`"),
        ("axios.patch(`${API_BASE_URL}/${recordId}`", "axios.patch(`${API_BASE_URL}/hr/attendance/${recordId}`")
    ],
    "dashboard/hr/performance/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/hr/performance-reviews`"),
        ("axios.delete(`${API_BASE_URL}/${id}`", "axios.delete(`${API_BASE_URL}/hr/performance-reviews/${id}`")
    ],
    "dashboard/hr/performance/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/hr/performance-reviews`"),
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/hr/employees`"), # To select employee
    ],
    "dashboard/operations/petty-cash/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/petty-cash`"),
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/petty-cash`"),
    ],
    "dashboard/operations/cash-movement/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/cash-movement`"),
    ],
    "dashboard/operations/cash-movement/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/cash-movement`"),
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/petty-cash`"),
    ],
    "dashboard/operations/payment-requests/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/payment-requests`"),
        ("axios.patch(`${API_BASE_URL}/${id}/status`", "axios.patch(`${API_BASE_URL}/operations/payment-requests/${id}/status`"),
    ],
    "dashboard/operations/payment-requests/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/payment-requests`"),
    ],
    "dashboard/operations/revenues/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/revenues`"),
    ],
    "dashboard/operations/revenues/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/revenues`"),
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/petty-cash`"),
    ],
    "dashboard/operations/expenses/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/expenses`"),
    ],
    "dashboard/operations/expenses/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/expenses`"),
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/petty-cash`"),
    ],
    "dashboard/operations/assets/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/assets`"),
    ],
    "dashboard/operations/assets/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/assets`"),
    ],
    "dashboard/operations/maintenance/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/maintenance`"),
    ],
    "dashboard/operations/maintenance/new/page.tsx": [
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/operations/maintenance`"),
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/operations/assets`"),
    ],
    "dashboard/companies/[companyId]/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/companies/${companyId}`"),
    ],
    "components/layout/Sidebar.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/companies/`"),
    ],
    "app/dashboard/settings/page.tsx": [
        ("axios.get(`${API_BASE_URL}`", "axios.get(`${API_BASE_URL}/auth/me`"), # Setting first call
    ]
}

def restore_all_paths():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project\frontend\src"
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, root_dir).replace("\\", "/")
            
            # Find matching suffix in dict
            matches = [s for s in path_restorations if rel_path.endswith(s)]
            if not matches:
                continue
                
            suffix = matches[0]
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for old, new in path_restorations[suffix]:
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                print(f"Restoring paths in {file_path}")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)

if __name__ == "__main__":
    restore_all_paths()
