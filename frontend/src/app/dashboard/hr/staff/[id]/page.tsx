"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function StaffProfilePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");
    const employeeId = params.id;
    
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    
    const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
    const [currentCv, setCurrentCv] = useState<string | null>(null);
    const [uploadPhoto, setUploadPhoto] = useState<File | null>(null);
    const [uploadCv, setUploadCv] = useState<File | null>(null);
    
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        qualification: "",
        department_id: "",
        company_id: companyId || "1",
        position: "",
        contract_type: "Full-time",
        status: "ACTIVE",
        hire_date: "",
        base_salary: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchData = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/hr/employees/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                setDepartments(deptRes.data);
                
                const emp = empRes.data;
                setFormData({
                    first_name: emp.first_name || "",
                    last_name: emp.last_name || "",
                    email: emp.email || "",
                    phone: emp.phone || "",
                    date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : "",
                    qualification: emp.qualification || "",
                    department_id: emp.department_id ? String(emp.department_id) : "",
                    company_id: emp.company_id ? String(emp.company_id) : (companyId || "1"),
                    position: emp.position || "",
                    contract_type: emp.contract_type || "Full-time",
                    status: emp.status || "ACTIVE",
                    hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : "",
                    base_salary: emp.base_salary ? String(emp.base_salary) : "0",
                });
                
                setCurrentPhoto(emp.photo_path || null);
                setCurrentCv(emp.cv_path || null);
            } catch (err: any) {
                console.error("Failed to load profile", err);
                setError("Failed to load employee profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [employeeId, companyId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const data = new FormData();
            
            Object.entries(formData).forEach(([key, value]) => {
                if (value) data.append(key, value);
            });
            
            if (uploadPhoto) data.append("photo", uploadPhoto);
            if (uploadCv) data.append("cv", uploadCv);

            const res = await axios.put(`${API_BASE_URL}/hr/employees/${employeeId}`, data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update photo/cv URLs to freshly returned ones
            if (res.data.photo_path) setCurrentPhoto(res.data.photo_path);
            if (res.data.cv_path) setCurrentCv(res.data.cv_path);

            setSuccess("Employee profile updated successfully!");
            setIsEditing(false); // Switch back to view mode after save
            
        } catch (err: any) {
            let errorMessage = "Failed to update employee.";
            if (err.response?.data?.detail) {
                errorMessage = typeof err.response.data.detail === 'string' 
                    ? err.response.data.detail 
                    : err.response.data.detail[0]?.msg || JSON.stringify(err.response.data.detail);
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.first_name) {
         return (
             <div className="container-fluid py-5 d-flex justify-content-center">
                 <div className="spinner-border text-primary" role="status"></div>
             </div>
         );
    }

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            <div className="mb-4">
                <Link href={companyId ? `/dashboard/hr/staff?company_id=${companyId}` : "/dashboard/hr/staff"} className="text-decoration-none text-muted fw-bold d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-arrow-left"></i> Back to Staff Directory
                </Link>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bolder mb-1">Staff Profile</h2>
                        <p className="text-secondary mb-0">View and manage employee details</p>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`btn ${isEditing ? 'btn-outline-secondary' : 'btn-primary'} px-4 shadow-sm fw-bold`} 
                        style={!isEditing ? { backgroundColor: '#1d256d', borderColor: '#1d256d' } : {}}
                    >
                        <i className={`bi ${isEditing ? 'bi-x-circle' : 'bi-pencil-square'} me-2`}></i>
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger border-0 shadow-sm mb-4 d-flex align-items-center gap-3 rounded-4">
                    <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                    <div><div className="fw-bold">Error</div><small className="opacity-75">{error}</small></div>
                </div>
            )}
            
            {success && (
                <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center gap-3 rounded-4">
                    <i className="bi bi-check-circle-fill fs-4"></i>
                    <div><div className="fw-bold">Success</div><small className="opacity-75">{success}</small></div>
                </div>
            )}

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    {/* Simplified Profile Card */}
                    <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '24px' }}>
                        <div className="text-center mb-4">
                            {currentPhoto ? (
                                <img src={`http://localhost:8001/${currentPhoto.replace(/\\/g, '/')}`} alt="Profile" className="mx-auto rounded-circle shadow-sm" style={{ width: 100, height: 100, objectFit: 'cover', border: '4px solid #fff' }} />
                            ) : (
                                <div className="bg-primary bg-opacity-10 text-primary mx-auto d-flex align-items-center justify-content-center rounded-circle fw-bolder" 
                                     style={{ width: 100, height: 100, fontSize: '2.5rem', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    {formData.first_name?.[0]}{formData.last_name?.[0]}
                                </div>
                            )}
                            <h4 className="fw-bold mt-3 mb-1 text-dark">{formData.first_name} {formData.last_name}</h4>
                            <p className="text-muted mb-0">{formData.position || 'No Position Set'}</p>
                            
                            <span className={`badge mt-3 px-3 py-2 rounded-pill font-monospace small ${
                                formData.status === 'ACTIVE' ? 'bg-success bg-opacity-10 text-success' :
                                formData.status === 'ON_LEAVE' ? 'bg-warning bg-opacity-10 text-warning' :
                                formData.status === 'PROSPECTIVE' ? 'bg-info bg-opacity-10 text-info' : 'bg-danger bg-opacity-10 text-danger'
                            }`}>
                                ● {formData.status}
                            </span>
                        </div>
                        
                        <hr className="border-light opacity-50" />
                        
                        <div className="d-flex flex-column gap-3 mt-3 text-secondary small">
                            <div className="d-flex gap-3"><i className="bi bi-envelope"></i> <span>{formData.email}</span></div>
                            <div className="d-flex gap-3"><i className="bi bi-telephone"></i> <span>{formData.phone || 'N/A'}</span></div>
                            <div className="d-flex gap-3"><i className="bi bi-building"></i> <span>{departments.find(d => d.id === Number(formData.department_id))?.name || 'Unknown Dept'}</span></div>
                        </div>

                        <div className="mt-4 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                            <span className="small text-muted fw-bold text-uppercase">Base Salary</span>
                            <span className="fw-bolder text-success">${Number(formData.base_salary || 0).toLocaleString()}</span>
                        </div>

                        {currentCv && (
                            <div className="mt-4 pt-3 border-top border-light">
                                <a href={`http://localhost:8001/${currentCv.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm w-100 fw-bold rounded-pill">
                                    <i className="bi bi-file-earmark-person me-2"></i> View CV Document
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: '24px' }}>
                        <h5 className="fw-bold mb-4">{isEditing ? 'Edit Information' : 'Personal & Work Information'}</h5>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">First Name</label>
                                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Last Name</label>
                                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                </div>
                                
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Email Address</label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Phone Number</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Department</label>
                                    {isEditing ? (
                                        <select name="department_id" required value={formData.department_id} onChange={handleChange} className="form-select bg-light shadow-none py-2">
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" disabled value={departments.find(d => d.id === Number(formData.department_id))?.name || 'Unknown'} className="form-control bg-transparent border-0 px-0 fw-bold shadow-none py-2" />
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Position</label>
                                    <input type="text" name="position" required value={formData.position} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                </div>
                                
                                <div className="col-md-4">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Contract Type</label>
                                    {isEditing ? (
                                        <select name="contract_type" required value={formData.contract_type} onChange={handleChange} className="form-select bg-light shadow-none py-2">
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    ) : (
                                        <input type="text" disabled value={formData.contract_type} className="form-control bg-transparent border-0 px-0 fw-bold shadow-none py-2" />
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Status</label>
                                    {isEditing ? (
                                        <select name="status" required value={formData.status} onChange={handleChange} className="form-select bg-light shadow-none py-2">
                                            <option value="ACTIVE">Active</option>
                                            <option value="ON_LEAVE">On Leave</option>
                                            <option value="PROSPECTIVE">Prospective</option>
                                            <option value="TERMINATED">Terminated</option>
                                            <option value="RESIGNED">Resigned</option>
                                        </select>
                                    ) : (
                                        <input type="text" disabled value={formData.status} className="form-control bg-transparent border-0 px-0 fw-bold shadow-none py-2" />
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Hire Date</label>
                                    <input type="date" name="hire_date" required value={formData.hire_date} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-secondary small fw-bold text-uppercase">Base Salary (USD)</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-light text-muted fw-bold">$</span>
                                        <input type="number" step="0.01" min="0" name="base_salary" required value={formData.base_salary} onChange={handleChange} disabled={!isEditing} className={`form-control ${isEditing ? 'bg-light' : 'bg-transparent border-0 px-0 fw-bold'} shadow-none py-2`} />
                                    </div>
                                </div>

                                {isEditing && (
                                    <>
                                        <div className="col-12 mt-2"><hr className="border-light opacity-50 my-1"/></div>
                                        <div className="col-md-6">
                                            <label className="form-label text-secondary small fw-bold text-uppercase">Update Photo</label>
                                            <input type="file" accept="image/*" onChange={e => setUploadPhoto(e.target.files?.[0] || null)} className="form-control bg-light shadow-none py-2" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-secondary small fw-bold text-uppercase">Update CV Document</label>
                                            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setUploadCv(e.target.files?.[0] || null)} className="form-control bg-light shadow-none py-2" />
                                        </div>
                                    </>
                                )}

                                {isEditing && (
                                    <div className="col-12 mt-4 text-end">
                                        <button type="submit" disabled={loading} className="btn btn-primary px-5 py-2 fw-bold" style={{ backgroundColor: '#1d256d', borderRadius: '12px' }}>
                                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
