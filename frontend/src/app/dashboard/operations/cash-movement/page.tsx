"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function CashMovementContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [movements, setMovements] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
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

            const [movRes, accRes] = await Promise.all([
                axios.get(`http://localhost:8001/api/v1/operations/cash-movements?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }),
                axios.get(`http://localhost:8001/api/v1/operations/petty-cash/accounts?${companyQuery}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                })
            ]);

            setMovements(movRes.data);
            setAccounts(accRes.data);

        } catch (err: any) {
            console.error("Error fetching cash movement data:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load cash movements.";
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

    const getAccountName = (accId: number | null) => {
        if (!accId) return "External Source / Bank";
        const acc = accounts.find(a => a.id === accId);
        return acc ? acc.name : `Account #${accId}`;
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
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Cash Movement</h2>
                    <p className="text-secondary mb-0 small fw-medium">Track internal fund transfers and account replenishments</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push(`/dashboard/operations/cash-movement/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`)}
                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i> Record New Movement
                    </button>
                </div>
            </div>

            {/* Movements Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="p-4 bg-white border-bottom border-light">
                    <h5 className="fw-bold mb-0">Movement Ledger</h5>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Date</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Description</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">From</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">To</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Amount</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : movements.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-5">No cash movements recorded yet.</td></tr>
                            ) : movements.map((mov) => (
                                <tr key={mov.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-medium text-dark">{new Date(mov.date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className="fw-bold text-dark">{mov.description}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`badge px-2 py-1 rounded-pill fw-medium ${!mov.from_account_id ? 'bg-info bg-opacity-10 text-info' : 'bg-light text-dark border'}`}>
                                            {getAccountName(mov.from_account_id)}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`badge px-2 py-1 rounded-pill fw-medium ${!mov.to_account_id ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success'}`}>
                                            {getAccountName(mov.to_account_id)}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="fw-bolder text-primary">${mov.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="px-4 py-3 text-end font-monospace small text-secondary">
                                        {mov.reference || 'N/A'}
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

export default function CashMovementPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <CashMovementContent />
        </Suspense>
    );
}
