"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function SettingsContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id');

    const [activeTab, setActiveTab] = useState('account');
    const [user, setUser] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [companyData, setCompanyData] = useState({ name: '', description: '' });

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) { window.location.href = "/login"; return; }

        try {
            const [userRes, companiesRes] = await Promise.all([
                axios.get('http://localhost:8001/api/v1/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8001/api/v1/companies/', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setUser(userRes.data);
            setEmail(userRes.data.email);
            setCompanies(companiesRes.data);

            if (companyId) {
                const currentCo = companiesRes.data.find((c: any) => c.id === parseInt(companyId));
                if (currentCo) {
                    setCompany(currentCo);
                    setCompanyData({ name: currentCo.name, description: currentCo.description || '' });
                }
            }
        } catch (err: any) {
            setError("Failed to load settings data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const token = localStorage.getItem("token");

        try {
            await axios.put('http://localhost:8001/api/v1/auth/me', { email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess("Email updated successfully.");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update profile.");
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (passwords.new !== passwords.confirm) { setError("New passwords do not match."); return; }

        const token = localStorage.getItem("token");
        try {
            await axios.put('http://localhost:8001/api/v1/auth/me/password', {
                current_password: passwords.current,
                new_password: passwords.new
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess("Password updated successfully.");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update password.");
        }
    };

    const handleUpdateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const token = localStorage.getItem("token");

        try {
            await axios.put(`http://localhost:8001/api/v1/companies/${companyId}`, companyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess("Company information updated successfully.");
            // Optional: trigger sidebar refresh or global state update if needed
        } catch (err: any) {
            setError(err.response?.data?.detail || "Only admins can update company settings.");
        }
    };

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            <div className="mb-5">
                <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>System Settings</h2>
                <p className="text-secondary small fw-medium">Manage your account and company configurations</p>
            </div>

            <div className="row g-4">
                {/* Navigation Tabs */}
                <div className="col-12 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="list-group list-group-flush p-2">
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center gap-3 py-3 ${activeTab === 'account' ? 'bg-primary text-white shadow-sm' : 'text-secondary font-medium'}`}
                            >
                                <i className="bi bi-person-circle fs-5"></i>
                                <span className="fw-bold">My Account</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('company')}
                                className={`list-group-item list-group-item-action border-0 rounded-3 d-flex align-items-center gap-3 py-3 ${activeTab === 'company' ? 'bg-primary text-white shadow-sm' : 'text-secondary font-medium'}`}
                            >
                                <i className="bi bi-building fs-5"></i>
                                <span className="fw-bold">Company Profile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-12 col-lg-9">
                    {error && (
                        <div className="alert alert-danger rounded-4 border-0 shadow-sm mb-4 d-flex align-items-center gap-3">
                            <i className="bi bi-exclamation-octagon-fill fs-4"></i>
                            <div className="fw-medium">{error}</div>
                        </div>
                    )}
                    {success && (
                        <div className="alert alert-success rounded-4 border-0 shadow-sm mb-4 d-flex align-items-center gap-3">
                            <i className="bi bi-check-circle-fill fs-4"></i>
                            <div className="fw-medium">{success}</div>
                        </div>
                    )}

                    {activeTab === 'account' ? (
                        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                            <h4 className="fw-bolder mb-4">Account Information</h4>

                            <form onSubmit={handleUpdateProfile} className="mb-5">
                                <div className="mb-4">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary px-5 py-3 rounded-3 fw-bold shadow-sm">
                                    Update Email
                                </button>
                            </form>

                            <hr className="my-5 opacity-10" />

                            <h4 className="fw-bolder mb-4">Change Password</h4>
                            <form onSubmit={handleUpdatePassword}>
                                <div className="row g-4 mb-4">
                                    <div className="col-12">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Current Password</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">New Password</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-dark px-5 py-3 rounded-3 fw-bold shadow-sm">
                                    Update Password
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bolder mb-0">Company Profile</h4>
                                {company && (
                                    <span className="badge bg-primary px-3 py-2 rounded-pill font-monospace small">ID: {company.id}</span>
                                )}
                            </div>

                            {!companyId ? (
                                <div className="py-5">
                                    <div className="text-center mb-5">
                                        <i className="bi bi-building-exclamation fs-1 text-secondary mb-3 d-block"></i>
                                        <h5 className="fw-bold">No Company Selected</h5>
                                        <p className="text-secondary fw-medium">Select a company below to manage its profile and branding.</p>
                                    </div>

                                    <div className="row g-3">
                                        {companies.map((co: any) => (
                                            <div className="col-12 col-md-4" key={co.id}>
                                                <button
                                                    onClick={() => window.location.href = `/dashboard/settings?company_id=${co.id}`}
                                                    className="btn btn-outline-primary w-100 p-4 rounded-4 border-2 hover-shadow transition-all d-flex flex-column align-items-center gap-2"
                                                >
                                                    <i className="bi bi-building fs-3"></i>
                                                    <span className="fw-bold">{co.name}</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdateCompany}>
                                    <div className="mb-4">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Company Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                            value={companyData.name}
                                            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Company Description</label>
                                        <textarea
                                            rows={4}
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                            value={companyData.description}
                                            onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="alert alert-info border-0 rounded-4 shadow-sm mb-4 d-flex align-items-start gap-3">
                                        <i className="bi bi-info-circle-fill fs-4 mt-1"></i>
                                        <div className="small fw-medium">
                                            Updating the company name or description will reflect across all modules, reports, and dashboards for this company.
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary px-5 py-3 rounded-3 fw-bold shadow-sm">
                                        Save Company Settings
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <SettingsContent />
        </Suspense>
    );
}
