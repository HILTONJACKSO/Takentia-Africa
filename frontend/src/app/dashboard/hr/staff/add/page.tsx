"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import axios from "axios";

import { useSearchParams } from "next/navigation";

function AddStaffContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form states
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
        hire_date: new Date().toISOString().split('T')[0],
        base_salary: "",
    });

    const [photo, setPhoto] = useState<File | null>(null);
    const [cv, setCv] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (companyId) {
            setFormData(prev => ({ ...prev, company_id: companyId }));
        }
    }, [companyId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }

        axios.get(`${API_BASE_URL}/companies/`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setDepartments(res.data))
            .catch(err => console.error("Error fetching departments:", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cv') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'photo') {
                setPhoto(file);
                setPhotoPreview(URL.createObjectURL(file));
            } else {
                setCv(file);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const data = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        if (photo) data.append("photo", photo);
        if (cv) data.append("cv", cv);

        try {
            await axios.post(`${API_BASE_URL}/hr/employees`, data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                }
            });
            setSuccess(true);
            setTimeout(() => {
                window.location.href = (companyId && companyId !== "null") ? `/dashboard/hr/staff?company_id=${companyId}` : "/dashboard/hr/staff";
            }, 2000);
        } catch (err: any) {
            let errorMessage = "An error occurred while adding staff.";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                }
            } else {
                errorMessage = err.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="d-flex align-items-center gap-3 mb-5">
                    <Link href={companyId ? `/dashboard/hr/staff?company_id=${companyId}` : "/dashboard/hr/staff"} className="btn btn-white border-0 shadow-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-arrow-left fs-5"></i>
                    </Link>
                    <div>
                        <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Add New Staff</h2>
                        <p className="text-secondary mb-0 small fw-medium">Create a new enterprise resource profile</p>
                    </div>
                </div>

                {success && (
                    <div className="alert alert-success border-0 shadow-sm py-3 mb-4 d-flex align-items-center gap-3 animate__animated animate__fadeIn">
                        <i className="bi bi-check-circle-fill fs-4"></i>
                        <div>
                            <div className="fw-bold">Success!</div>
                            <div className="small">Staff member has been added successfully. Redirecting...</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger border-0 shadow-sm py-3 mb-4 d-flex align-items-center gap-3 animate__animated animate__shakeX">
                        <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                        <div>
                            <div className="fw-bold">Error</div>
                            <div className="small">{error}</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                        {/* Left Column: Form Fields */}
                        <div className="col-12 col-lg-8">
                            {/* Personal Information */}
                            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                                <div className="card-body p-4">
                                    <h6 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
                                        <i className="bi bi-person-circle text-primary"></i> Personal Information
                                    </h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">First Name</label>
                                            <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="e.g. John" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Last Name</label>
                                            <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="e.g. Doe" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Email Address</label>
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="john.doe@talentia.africa" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Phone Number</label>
                                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="+231-xxx-xxxxxx" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Date of Birth</label>
                                            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Highest Qualification</label>
                                            <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="e.g. BSc Computer Science" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                                <div className="card-body p-4">
                                    <h6 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
                                        <i className="bi bi-briefcase text-primary"></i> Employment Details
                                    </h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Department</label>
                                            <select name="department_id" required value={formData.department_id} onChange={handleChange} className="form-select border-light shadow-none bg-light bg-opacity-50 py-2">
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Position / Role</label>
                                            <input type="text" name="position" required value={formData.position} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="e.g. Senior Developer" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Contract Type</label>
                                            <select name="contract_type" required value={formData.contract_type} onChange={handleChange} className="form-select border-light shadow-none bg-light bg-opacity-50 py-2">
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary">Employment Status</label>
                                            <select name="status" required value={formData.status} onChange={handleChange} className="form-select border-light shadow-none bg-light bg-opacity-50 py-2">
                                                <option value="ACTIVE">Active</option>
                                                <option value="PROSPECTIVE">Prospective</option>
                                                <option value="ON_LEAVE">On Leave</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-secondary small fw-bold text-uppercase">Hire Date</label>
                                            <input type="date" name="hire_date" required value={formData.hire_date} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" />
                                        </div>
                                        <div className="col-12 mt-4">
                                            <hr className="border-light opacity-50" />
                                            <h6 className="fw-bold mb-3">Compensation</h6>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-secondary small fw-bold text-uppercase">Base Salary (USD)</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-light text-muted">$</span>
                                                <input type="number" step="0.01" min="0" name="base_salary" required value={formData.base_salary} onChange={handleChange} className="form-control border-light shadow-none bg-light bg-opacity-50 py-2" placeholder="e.g. 50000" />
                                            </div>
                                        </div>
                                        <div className="col-12 mt-4">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Files & Actions */}
                        <div className="col-12 col-lg-4">
                            {/* Photo Upload */}
                            <div className="card border-0 shadow-sm mb-4 text-center overflow-hidden" style={{ borderRadius: '16px' }}>
                                <div className="card-body p-4">
                                    <h6 className="fw-bold mb-4 text-dark text-start">Profile Image</h6>
                                    <div className="mb-3 d-flex justify-content-center">
                                        {photoPreview ? (
                                            <div className="position-relative">
                                                <img src={photoPreview} alt="Preview" className="rounded-circle border border-4 border-light shadow-sm" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="btn btn-danger btn-sm position-absolute bottom-0 end-0 rounded-circle p-1">
                                                    <i className="bi bi-x fs-6"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border-2 border-dashed border-secondary border-opacity-25" style={{ width: '120px', height: '120px' }}>
                                                <i className="bi bi-camera fs-1 text-secondary opacity-50"></i>
                                            </div>
                                        )}
                                    </div>
                                    <label className="btn btn-outline-primary btn-sm px-4 fw-bold">
                                        Choose Photo
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} />
                                    </label>
                                    <p className="small text-muted mt-2 mb-0">JPEG or PNG, Max 2MB</p>
                                </div>
                            </div>

                            {/* CV Upload */}
                            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                                <div className="card-body p-4">
                                    <h6 className="fw-bold mb-4 text-dark">Documents</h6>
                                    <div className="bg-light p-3 rounded-3 text-center border-2 border-dashed border-secondary border-opacity-25">
                                        <i className="bi bi-file-earmark-pdf fs-2 text-secondary mb-2 d-block"></i>
                                        <span className="small fw-medium d-block mb-3">
                                            {cv ? cv.name : "Upload Curriculum Vitae (CV)"}
                                        </span>
                                        <label className="btn btn-primary btn-sm px-4 fw-bold w-100" style={{ backgroundColor: '#1d256d' }}>
                                            {cv ? "Change File" : "Select PDF"}
                                            <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'cv')} />
                                        </label>
                                    </div>
                                    <p className="small text-muted mt-2 mb-0 text-center">PDF, DOCX accepted</p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-lg w-100 fw-bold border-0 text-white shadow-lg transition-all hover-scale"
                                style={{ backgroundColor: '#1d256d', borderRadius: '12px', padding: '16px 0' }}
                            >
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm" role="status"></span> Creating...</>
                                ) : (
                                    <>Create Employee Record</>
                                )}
                            </button>
                            <Link href={companyId ? `/dashboard/hr/staff?company_id=${companyId}` : "/dashboard/hr/staff"} className="btn btn-outline-secondary w-100 mt-3 border-0 fw-bold py-2">
                                Cancel
                            </Link>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .hover-scale:hover {
                    transform: scale(1.02);
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
            `}</style>
        </div>
    );
}

export default function AddStaffPage() {
    return (
        <Suspense fallback={<div className="container-fluid py-4 min-vh-100 bg-light">Loading...</div>}>
            <AddStaffContent />
        </Suspense>
    );
}
