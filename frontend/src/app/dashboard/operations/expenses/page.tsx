"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function ExpensesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [expenses, setExpenses] = useState<any[]>([]);
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

            const res = await axios.get(`${API_BASE_URL}/operations/expenses`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });

            setExpenses(res.data);

        } catch (err: any) {
            console.error("Error fetching expenses:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load expenses.";
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
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        count: expenses.length,
        thisMonth: expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0),
        avg: expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0
    };

    const getCategoryBadge = (category: string) => {
        const colors: { [key: string]: string } = {
            'Rent': 'bg-dark',
            'Utilities': 'bg-info text-white',
            'Office Supplies': 'bg-primary text-white',
            'Communication': 'bg-warning text-dark',
            'Salaries': 'bg-success text-white',
            'Travel': 'bg-secondary text-white'
        };
        return colors[category] || 'bg-light text-dark border';
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
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Expense Management</h2>
                    <p className="text-secondary mb-0 small fw-medium">Monitor company expenditures and operational costs</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push(`/dashboard/operations/expenses/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`)}
                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i> Record Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {[
                    { label: 'Total Expenses', val: stats.total, icon: 'bi-dash-circle', color: '#dc3545' },
                    { label: 'This Month', val: stats.thisMonth, icon: 'bi-calendar3-range', color: '#fd7e14' },
                    { label: 'Total Receipts', val: stats.count, icon: 'bi-receipt-cutoff', color: '#6610f2' },
                    { label: 'Avg. Spend', val: stats.avg, icon: 'bi-pie-chart', color: '#0d6efd' }
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
                                {typeof s.val === 'number' && s.label !== 'Total Receipts' ? `$${s.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : s.val}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Expense Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="p-4 bg-white border-bottom border-light">
                    <h5 className="fw-bold mb-0">Expenditure Ledger</h5>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Date</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Category</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Description</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Method</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-5">No expenses recorded for this company.</td></tr>
                            ) : expenses.map((exp) => (
                                <tr key={exp.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-medium text-dark">{new Date(exp.date).toLocaleDateString()}</div>
                                        <small className="text-muted font-monospace">{exp.reference_number}</small>
                                    </td>
                                    <td className="py-3">
                                        <span className={`badge px-3 py-2 rounded-pill fw-bold text-white shadow-sm ${getCategoryBadge(exp.category)}`}>
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="text-dark fw-medium">{exp.description}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className="text-secondary small fw-bold">{exp.payment_method}</span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="fw-bolder text-danger">- ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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

export default function ExpensesPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <ExpensesContent />
        </Suspense>
    );
}
