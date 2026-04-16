"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function RevenuesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [revenues, setRevenues] = useState<any[]>([]);
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

            const res = await axios.get(`http://localhost:8001/api/v1/operations/revenues?${companyQuery}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });

            setRevenues(res.data);

        } catch (err: any) {
            console.error("Error fetching revenues:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load revenues.";
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
        total: revenues.reduce((sum, r) => sum + r.amount, 0),
        count: revenues.length,
        avg: revenues.length > 0 ? revenues.reduce((sum, r) => sum + r.amount, 0) / revenues.length : 0,
        thisMonth: revenues.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((sum, r) => sum + r.amount, 0)
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
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Revenue Tracking</h2>
                    <p className="text-secondary mb-0 small fw-medium">Monitor and manage company income streams</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push(`/dashboard/operations/revenues/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`)}
                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i> Record Income
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Revenue', val: stats.total, icon: 'bi-currency-dollar', color: '#1d256d' },
                    { label: 'This Month', val: stats.thisMonth, icon: 'bi-calendar-check', color: '#19c37d' },
                    { label: 'Total Transactions', val: stats.count, icon: 'bi-receipt', color: '#0dcaf0' },
                    { label: 'Avg. Ticket', val: stats.avg, icon: 'bi-graph-up-arrow', color: '#6f42c1' }
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
                                {typeof s.val === 'number' && s.label !== 'Total Transactions' ? `$${s.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : s.val}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="p-4 bg-white border-bottom border-light">
                    <h5 className="fw-bold mb-0">Revenue Ledger</h5>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Date</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Source</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Description</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Amount</th>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Ref Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : revenues.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-5">No revenue recorded for this company.</td></tr>
                            ) : revenues.map((rev) => (
                                <tr key={rev.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-medium text-dark">{new Date(rev.date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className="badge bg-primary px-3 py-2 rounded-pill fw-bold text-white shadow-sm">
                                            {rev.source}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="text-dark fw-medium">{rev.description}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className="fw-bolder text-success">+ ${rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="px-4 py-3 text-end font-monospace small text-secondary">
                                        {rev.reference_number || 'N/A'}
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

export default function RevenuesPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <RevenuesContent />
        </Suspense>
    );
}
