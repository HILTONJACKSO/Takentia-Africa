"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function NewExpenseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        category: 'Office Supplies',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        reference_number: '',
        account_id: ''
    });

    const categories = ['Rent', 'Utilities', 'Office Supplies', 'Communication', 'Salaries', 'Travel', 'Repairs', 'Marketing', 'Other'];

    React.useEffect(() => {
        const fetchAccounts = async () => {
            const token = localStorage.getItem("token");
            try {
                const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
                const companyQuery = isCompanyIdValid ? `company_id=${companyId}` : "";
                const res = await axios.get(`${API_BASE_URL}/operations/petty-cash`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAccounts(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, account_id: res.data[0].id.toString() }));
                }
            } catch (err) {
                console.error("Failed to fetch accounts", err);
            }
        };
        fetchAccounts();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.payment_method === 'Cash' && !formData.account_id) {
            setError("Please select a Petty Cash account for cash payments.");
            return;
        }

        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const targetCompanyId = isCompanyIdValid ? companyId : "1";

            const payload: any = {
                ...formData,
                amount: parseFloat(formData.amount),
                company_id: parseInt(targetCompanyId)
            };
            if (formData.payment_method === 'Cash' && formData.account_id) {
                payload.account_id = parseInt(formData.account_id);
            }

            await axios.post(`${API_BASE_URL}/operations/expenses`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push(`/dashboard/operations/expenses?company_id=${targetCompanyId}`);
        } catch (err: any) {
            let errorMessage = "Failed to record expense.";
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
                        <i className="bi bi-arrow-left"></i> Back to Expenses
                    </button>

                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                        <div className="mb-5">
                            <h2 className="fw-bolder mb-1">Record New Expense</h2>
                            <p className="text-secondary small fw-medium">Log operational costs and expenditures</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger rounded-4 border-0 mb-4 d-flex align-items-center gap-3">
                                <i className="bi bi-exclamation-octagon-fill fs-4"></i>
                                <div className="fw-medium">{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Category</label>
                                    <select
                                        className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Amount (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium text-danger fw-bolder"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Transaction Date</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Payment Method</label>
                                    <select
                                        className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        required
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Mobile Money">Mobile Money</option>
                                    </select>
                                </div>
                                
                                {formData.payment_method === 'Cash' && accounts.length > 0 && (
                                    <div className="col-12 col-md-6">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Petty Cash Account</label>
                                        <select
                                            className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-bold text-primary"
                                            value={formData.account_id}
                                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                            required
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} (Bal: ${acc.balance.toLocaleString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Reference Number / Invoice #</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="e.g. INV-2024-001"
                                        value={formData.reference_number}
                                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Description</label>
                                    <textarea
                                        rows={3}
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="Details about this expense..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-5 border-top pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-danger px-5 py-3 rounded-3 fw-bold shadow-sm w-100"
                                >
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-dash-circle me-2"></i>}
                                    Record Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewExpensePage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <NewExpenseContent />
        </Suspense>
    );
}
