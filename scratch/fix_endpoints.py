import os

# Known mappings based on previous grep and file checks
# File -> List of (Old broken line part, New correct part)
fixes = {
    "frontend/src/app/dashboard/hr/staff/page.tsx": [
        ("? `${API_BASE_URL}`", "? `${API_BASE_URL}/hr/employees?company_id=${companyId}`"),
        (": `${API_BASE_URL}`", ": `${API_BASE_URL}/hr/employees`"),
        ("axios.delete(`${API_BASE_URL}`", "axios.delete(`${API_BASE_URL}/hr/employees/${id}`")
    ],
    "frontend/src/app/dashboard/finance/payroll/page.tsx": [
        ("? `${API_BASE_URL}/payroll/runs?company_id=${companyId}`", "? `${API_BASE_URL}/payroll/runs?company_id=${companyId}`"), # already fixed manually
        (": `${API_BASE_URL}/payroll/runs`", ": `${API_BASE_URL}/payroll/runs`"),
        ('axios.post(`${API_BASE_URL}/runs/generate`', 'axios.post(`${API_BASE_URL}/payroll/runs/generate`'),
        ('axios.get(`${API_BASE_URL}/runs/${run.id}/payslips`', 'axios.get(`${API_BASE_URL}/payroll/runs/${run.id}/payslips`'),
        ('axios.patch(`${API_BASE_URL}/runs/${runId}/status', 'axios.patch(`${API_BASE_URL}/payroll/runs/${runId}/status')
    ],
    "frontend/src/app/dashboard/hr/attendance/page.tsx": [
        ("`${API_BASE_URL}`", "`${API_BASE_URL}/hr/attendance`"),
        ("axios.post(`${API_BASE_URL}`", "axios.post(`${API_BASE_URL}/hr/attendance`"),
         ("axios.patch(`${API_BASE_URL}/${recordId}`", "axios.patch(`${API_BASE_URL}/hr/attendance/${recordId}`")
    ],
    "frontend/src/app/dashboard/hr/performance/page.tsx": [
         ("`${API_BASE_URL}`", "`${API_BASE_URL}/hr/performance-reviews`")
    ],
}

def apply_specific_fixes():
    root_dir = r"c:\Users\User\Pictures\Talantia-HR-Project"
    for rel_path, items in fixes.items():
        abs_path = os.path.join(root_dir, rel_path.replace("/", "\\"))
        if not os.path.exists(abs_path):
            print(f"Skipping {abs_path}")
            continue
            
        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content
        for old, new in items:
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            print(f"Updating {abs_path}")
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(new_content)

if __name__ == "__main__":
    apply_specific_fixes()
