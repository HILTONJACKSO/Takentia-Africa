"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function NewCashMovementContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingAccounts, setFetchingAccounts] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        from_account_id: '',
        to_account_id: '',
        reference: ''
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            const token = localStorage.getItem("token");
            try {
                const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
                const url = isCompanyIdValid ? `http://localhost:8001/api/v1/operations/petty-cash/accounts?company_id=${companyId}` : `http://localhost:8001/api/v1/operations/petty-cash/accounts`;
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAccounts(res.data);
            } catch (err) {
                console.error("Failed to fetch accounts for cash movement form");
            } finally {
                setFetchingAccounts(false);
            }
        };

        fetchAccounts();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.from_account_id === formData.to_account_id && formData.from_account_id !== '') {
            setError("Source and destination accounts cannot be the same.");
            return;
        }

        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const targetCompanyId = isCompanyIdValid ? companyId : "1";

            await axios.post(`http://localhost:8001/api/v1/operations/cash-movements?company_id=${targetCompanyId}`, {
                ...formData,
                from_account_id: formData.from_account_id ? parseInt(formData.from_account_id) : null,
                to_account_id: formData.to_account_id ? parseInt(formData.to_account_id) : null,
                amount: parseFloat(formData.amount),
                company_id: parseInt(targetCompanyId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push(`/dashboard/operations/cash-movement?company_id=${targetCompanyId}`);
        } catch (err: any) {
            let errorMessage = "Failed to record cash movement.";
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
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-8">
                    <button
                        onClick={() => router.back()}
                        className="btn btn-link text-decoration-none text-secondary mb-4 p-0 d-flex align-items-center gap-2 fw-bold"
                    >
                        <i className="bi bi-arrow-left"></i> Back to Ledger
                    </button>

                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                        <div className="mb-5">
                            <h2 className="fw-bolder mb-1">Record Cash Movement</h2>
                            <p className="text-secondary small fw-medium">Transfer funds between petty cash accounts or replenish from bank</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger rounded-4 border-0 mb-4 d-flex align-items-center gap-3">
                                <i className="bi bi-exclamation-octagon-fill fs-4"></i>
                                <div className="fw-medium">{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Description</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="e.g. Replenish Office Fund, Transfer to Project Petty Cash"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Amount (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium text-primary fw-bolder"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Movement Date</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">From (Source)</label>
                                    <select
                                        className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.from_account_id}
                                        onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
                                    >
                                        <option value="">External / Bank Account</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>)}
                                    </select>
                                    <small className="text-muted">Leave empty if replenishing from Bank</small>
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">To (Destination)</label>
                                    <select
                                        className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.to_account_id}
                                        onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
                                    >
                                        <option value="">External / Bank Account</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>)}
                                    </select>
                                    <small className="text-muted">Leave empty if withdrawing to Bank</small>
                                </div>

                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Reference / Cheque #</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="e.g. CHQ-2024-55"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 border-top pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary px-5 py-3 rounded-3 fw-bold shadow-sm w-100"
                                >
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-arrow-left-right me-2"></i>}
                                    Record Movement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewCashMovementPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <NewCashMovementContent />
        </Suspense>
    );
}
