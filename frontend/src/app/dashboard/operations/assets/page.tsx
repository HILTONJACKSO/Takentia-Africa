"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function AssetsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [assets, setAssets] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const companyQuery = isCompanyIdValid ? `company_id=${companyId}` : "";

            // Fetch assets and employees in parallel
            const [assetRes, empRes] = await Promise.all([
                axios.get(`http://localhost:8001/api/v1/operations/assets?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }),
                axios.get(`http://localhost:8001/api/v1/hr/employees?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                })
            ]);

            setAssets(assetRes.data);
            setEmployees(empRes.data);

        } catch (err: any) {
            console.error("Error fetching assets data:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load assets.";
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

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const getEmployeeName = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        return emp ? `${emp.first_name} ${emp.last_name}` : "Unassigned";
    };

    const stats = {
        total: assets.length,
        active: assets.filter(a => a.status === 'ACTIVE').length,
        maintenance: assets.filter(a => a.status === 'IN MAINTENANCE').length,
        assigned: assets.filter(a => a.assigned_to_id !== null).length
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            {error && (
                <div className="alert alert-danger alert-dismissible fade show rounded-4 border-0 shadow-sm mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
                <div>
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Asset Management</h2>
                    <p className="text-secondary mb-0 small fw-medium">Track and manage company physical equipment</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        onClick={() => router.push(`/dashboard/operations/assets/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`)}
                        className="btn btn-outline-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i> Register New Asset
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Assets', val: stats.total, icon: 'bi-box-seam', color: '#1d256d' },
                    { label: 'Active', val: stats.active, icon: 'bi-check-circle', color: '#19c37d' },
                    { label: 'In Maintenance', val: stats.maintenance, icon: 'bi-tools', color: '#ffc107' },
                    { label: 'Assigned', val: stats.assigned, icon: 'bi-person-badge', color: '#0dcaf0' }
                ].map((s, i) => (
                    <div className="col-12 col-sm-6 col-xl-3" key={i}>
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="p-3 rounded-4" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                                    <i className={`bi ${s.icon} fs-4`}></i>
                                </div>
                            </div>
                            <h6 className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>{s.label}</h6>
                            <h3 className="fw-bolder mb-0">{s.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Asset Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="p-4 bg-white border-bottom border-light d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h5 className="fw-bold mb-0">Equipment Inventory</h5>
                    <div className="d-flex gap-2">
                        <div className="input-group input-group-sm" style={{ maxWidth: '250px' }}>
                            <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                            <input type="text" className="form-control bg-light border-0" placeholder="Search serial or name..." />
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Asset Name</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Category</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Serial Number</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Assigned To</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Status</th>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : assets.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-5">No assets registered for this company.</td></tr>
                            ) : assets.map((asset) => (
                                <tr key={asset.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-bold text-dark">{asset.name}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className="badge bg-light text-dark fw-medium border px-2 py-1">{asset.category}</span>
                                    </td>
                                    <td className="py-3 font-monospace small text-primary">{asset.serial_number}</td>
                                    <td className="py-3">
                                        {asset.assigned_to_id ? (
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                                    {getEmployeeName(asset.assigned_to_id).charAt(0)}
                                                </div>
                                                <small className="fw-medium">{getEmployeeName(asset.assigned_to_id)}</small>
                                            </div>
                                        ) : (
                                            <span className="text-muted small">Available</span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <span className={`badge px-3 py-2 rounded-pill fw-bold ${asset.status === 'ACTIVE' ? 'bg-success bg-opacity-10 text-success' :
                                            asset.status === 'IN MAINTENANCE' ? 'bg-warning bg-opacity-10 text-warning' :
                                                'bg-danger bg-opacity-10 text-danger'
                                            }`}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="dropdown">
                                            <button className="btn btn-sm btn-light rounded-2 border-0" type="button" data-bs-toggle="dropdown">
                                                <i className="bi bi-three-dots"></i>
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                                                <li><a className="dropdown-item py-2 fw-medium small" href="#"><i className="bi bi-pencil me-2 text-primary"></i> Edit</a></li>
                                                <li><a className="dropdown-item py-2 fw-medium small" href="#"><i className="bi bi-arrow-left-right me-2 text-info"></i> Reassign</a></li>
                                                <li><a className="dropdown-item py-2 fw-medium small" href="#"><i className="bi bi-tools me-2 text-warning"></i> Send for Repair</a></li>
                                                <li><hr className="dropdown-divider opacity-50" /></li>
                                                <li><a className="dropdown-item py-2 fw-medium small text-danger" href="#"><i className="bi bi-trash me-2"></i> Retire</a></li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function AssetsPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <AssetsContent />
        </Suspense>
    );
}
