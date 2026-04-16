"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function MaintenanceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [records, setRecords] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
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

            const [maintRes, assetsRes] = await Promise.all([
                axios.get(`http://localhost:8001/api/v1/operations/maintenance?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }),
                axios.get(`http://localhost:8001/api/v1/operations/assets?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                })
            ]);

            setRecords(maintRes.data);
            setAssets(assetsRes.data);

        } catch (err: any) {
            console.error("Error fetching maintenance data:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load maintenance records.";
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

    const stats = {
        totalCost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
        pending: records.filter(r => r.status === 'PENDING').length,
        inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
        completed: records.filter(r => r.status === 'COMPLETED').length
    };

    const getAsset = (id: number) => assets.find(a => a.id === id);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-success';
            case 'IN_PROGRESS': return 'bg-warning text-dark';
            case 'PENDING': return 'bg-secondary';
            default: return 'bg-light text-dark border';
        }
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
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Maintenance & Repairs</h2>
                    <p className="text-secondary mb-0 small fw-medium">Track asset service history and scheduled maintenance</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push(`/dashboard/operations/maintenance/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`)}
                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i> Schedule Maintenance
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Maintenance Cost', val: stats.totalCost, icon: 'bi-cash-coin', color: '#1d256d', isCurrency: true },
                    { label: 'Pending Requests', val: stats.pending, icon: 'bi-clock-history', color: '#6c757d' },
                    { label: 'Under Repair', val: stats.inProgress, icon: 'bi-gear-wide-connected', color: '#fd7e14' },
                    { label: 'Completed Repairs', val: stats.completed, icon: 'bi-check-circle-fill', color: '#19c37d' }
                ].map((s, i) => (
                    <div className="col-12 col-sm-6 col-xl-3" key={i}>
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="p-3 rounded-4" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                                    <i className={`bi ${s.icon} fs-4`}></i>
                                </div>
                            </div>
                            <h6 className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>{s.label}</h6>
                            <h3 className="fw-bolder mb-0">
                                {s.isCurrency ? `$${s.val.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : s.val}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Maintenance Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="p-4 bg-white border-bottom border-light">
                    <h5 className="fw-bold mb-0">Maintenance Log</h5>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Asset</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Title</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Status</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Cost</th>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Timeline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-5">No maintenance records found for this company.</td></tr>
                            ) : records.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-bold text-dark">{getAsset(r.asset_id)?.name || 'Unknown Asset'}</div>
                                        <small className="text-muted">{getAsset(r.asset_id)?.category || 'N/A'}</small>
                                    </td>
                                    <td className="py-3">
                                        <div className="text-dark fw-medium">{r.title}</div>
                                        <small className="text-secondary d-block text-truncate" style={{ maxWidth: '200px' }}>{r.description}</small>
                                    </td>
                                    <td className="py-3">
                                        <span className={`badge px-3 py-2 rounded-pill fw-bold text-white shadow-sm ${getStatusBadge(r.status)}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="py-3 font-monospace fw-bold">
                                        {r.cost > 0 ? `$${r.cost.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="small fw-medium">Start: {new Date(r.start_date).toLocaleDateString()}</div>
                                        {r.completion_date && (
                                            <div className="small text-muted">End: {new Date(r.completion_date).toLocaleDateString()}</div>
                                        )}
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

export default function MaintenancePage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <MaintenanceContent />
        </Suspense>
    );
}
