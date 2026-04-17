"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function PettyCashContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id');

    const [accounts, setAccounts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [txForm, setTxForm] = useState({
        account_id: "",
        type: "OUT",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    const [accountForm, setAccountForm] = useState({
        name: "",
        balance: "0",
        company_id: ""
    });

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

            // Fetch both in parallel
            const [accRes, txRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/operations/petty-cash`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }),
                axios.get(`${API_BASE_URL}/operations/petty-cash`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                })
            ]);

            setAccounts(accRes.data);
            setTransactions(txRes.data);

        } catch (err: any) {
            console.error("Error fetching petty cash data:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load petty cash data.";
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

    // Automatically set default account_id when accounts load
    useEffect(() => {
        if (accounts.length > 0 && !txForm.account_id) {
            setTxForm(prev => ({ ...prev, account_id: accounts[0].id.toString() }));
        }
    }, [accounts]);

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const targetCompanyId = isCompanyIdValid ? companyId : "1";

            const amountFloat = parseFloat(txForm.amount);
            if (isNaN(amountFloat) || amountFloat <= 0) {
                setError("Please enter a valid amount greater than zero.");
                setSubmitting(false);
                return;
            }

            const accountIdInt = parseInt(txForm.account_id);
            if (isNaN(accountIdInt)) {
                setError("Please select a valid cash account.");
                setSubmitting(false);
                return;
            }

            const finalCompanyId = parseInt(targetCompanyId);
            if (isNaN(finalCompanyId)) {
                setError("Invalid company selection. Please select a company from the sidebar.");
                setSubmitting(false);
                return;
            }

            const payload = {
                account_id: accountIdInt,
                type: txForm.type,
                amount: amountFloat,
                description: txForm.description,
                date: txForm.date,
                company_id: finalCompanyId
            };

            console.log("Submitting transaction to localhost:8001...", payload);

            try {
                const response = await axios.post(`${API_BASE_URL}/operations/petty-cash`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                });
                console.log("Transaction successfully submitted:", response.data);
                setShowModal(false);
                setTxForm({
                    account_id: accounts[0]?.id?.toString() || "",
                    type: "OUT",
                    amount: "",
                    description: "",
                    date: new Date().toISOString().split('T')[0]
                });
                fetchData();
            } catch (postErr: any) {
                console.error("Internal axios.post fail:", postErr);
                throw postErr; // re-throw to be caught by main catch
            }
        } catch (err: any) {
            console.error("Transaction submission error details (verbose):", {
                errName: err.name,
                errMessage: err.message,
                errCode: err.code,
                errStatus: err.response?.status,
                errData: err.response?.data,
                errConfig: {
                    url: err.config?.url,
                    method: err.config?.method,
                    data: err.config?.data
                }
            });
            let errorMessage = "Failed to submit transaction. Please check your inputs.";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                }
            } else if (err.message === "Network Error") {
                errorMessage = "Network Error: Could not reach the backend server at localhost:8001. Please ensure the backend is running.";
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const targetCompanyId = isCompanyIdValid ? companyId : "1";

            await axios.post(`${API_BASE_URL}/operations/petty-cash`, {
                ...accountForm,
                balance: parseFloat(accountForm.balance || "0"),
                company_id: parseInt(targetCompanyId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setShowAccountModal(false);
            setAccountForm({ name: "", balance: "0", company_id: "" });
            fetchData();
        } catch (err: any) {
            console.error("Account creation error:", err);
            let errorMessage = "Failed to create account.";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
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
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Petty Cash Management</h2>
                    <p className="text-secondary mb-0 small fw-medium">Monitor cash flow and office expenditures</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2">
                        <i className="bi bi-download"></i> Export Report
                    </button>
                    <button 
                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2 transition-all hover-scale"
                        style={{ backgroundColor: '#1d256d', border: 'none' }}
                        onClick={() => setShowModal(true)}
                    >
                        <i className="bi bi-plus-lg"></i> New Transaction
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100 p-4" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #1d256d 0%, #2A368E 100%)' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="p-3 rounded-4 bg-white bg-opacity-10 text-white">
                                <i className="bi bi-wallet2 fs-4"></i>
                            </div>
                            <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2 fw-bold">Active Account</span>
                        </div>
                        <h6 className="text-white text-opacity-75 fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Total Available Balance</h6>
                        <h2 className="text-white fw-bolder mb-0">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100 p-4 ripple-card" style={{ borderRadius: '24px' }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-3 rounded-4" style={{ backgroundColor: '#19c37d15', color: '#19c37d' }}>
                                <i className="bi bi-arrow-down-left-circle fs-4"></i>
                            </div>
                            <div>
                                <small className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Cash Inflow</small>
                                <h4 className="fw-bolder mb-0 text-dark">
                                    ${transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h4>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100 p-4 ripple-card" style={{ borderRadius: '24px' }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-3 rounded-4" style={{ backgroundColor: '#ff4d4d15', color: '#ff4d4d' }}>
                                <i className="bi bi-arrow-up-right-circle fs-4"></i>
                            </div>
                            <div>
                                <small className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Cash Outflow</small>
                                <h4 className="fw-bolder mb-0 text-dark">
                                    ${transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h4>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                <div className="progress-bar bg-danger" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Transactions & Accounts */}
            <div className="row g-4">
                {/* Transaction History */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '24px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0">Recent Transactions</h5>
                            <button className="btn btn-light btn-sm rounded-3 fw-bold text-primary">View All</button>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle border-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-0 px-4 py-3 text-secondary small fw-bold text-uppercase">Description</th>
                                        <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Date</th>
                                        <th className="border-0 py-3 text-secondary small fw-bold text-uppercase">Type</th>
                                        <th className="border-0 py-3 text-secondary small fw-bold text-uppercase text-end px-4">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center text-muted py-5">No transactions recorded for this period.</td></tr>
                                    ) : transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className={`rounded-3 d-flex align-items-center justify-content-center shadow-sm`} style={{ width: 40, height: 40, backgroundColor: tx.type === 'IN' ? '#19c37d15' : '#ff4d4d15', color: tx.type === 'IN' ? '#19c37d' : '#ff4d4d' }}>
                                                        <i className={`bi ${tx.type === 'IN' ? 'bi-plus-lg' : 'bi-dash-lg'}`}></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{tx.description}</div>
                                                        <small className="text-muted">Approved by {tx.approved_by?.email?.split('@')[0] || 'Admin'}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-secondary fw-medium">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="py-3">
                                                <span className={`badge px-3 py-2 rounded-pill small fw-bold ${tx.type === 'IN' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`py-3 text-end px-4 fw-bold ${tx.type === 'IN' ? 'text-success' : 'text-danger'}`}>
                                                {tx.type === 'IN' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '24px' }}>
                        <h5 className="fw-bold mb-4">Cash Accounts</h5>
                        <div className="d-flex flex-column gap-3">
                            {accounts.map(acc => (
                                <div key={acc.id} className="p-3 bg-light rounded-4 border-start border-primary border-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-bold text-dark">{acc.name}</span>
                                        <i className="bi bi-three-dots-vertical text-muted"></i>
                                    </div>
                                    <h4 className="fw-bolder mb-1">${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                                    <small className="text-secondary fw-medium">Last reconciled: Today</small>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-4 text-center">
                            <button 
                                className="btn btn-primary w-100 rounded-3 py-2 fw-bold mb-2 shadow-sm"
                                style={{ backgroundColor: '#1d256d', border: 'none' }}
                                onClick={() => setShowAccountModal(true)}
                            >
                                <i className="bi bi-plus-lg me-2"></i> Add New Account
                            </button>
                            <button className="btn btn-light w-100 rounded-3 py-2 fw-bold text-secondary">Fund Transfers</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Transaction Modal */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-light p-4 pb-3">
                                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-wallet2 text-primary me-2"></i> Log Petty Cash</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleTransactionSubmit}>
                                <div className="modal-body p-4 pt-2">
                                    {error && (
                                        <div className="alert alert-danger rounded-3 border-0 small mb-3">
                                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                                            {typeof error === 'string' ? error : JSON.stringify(error)}
                                        </div>
                                    )}
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary">Account</label>
                                            <select 
                                                className="form-select border-light bg-light py-2 shadow-none" 
                                                required 
                                                value={txForm.account_id}
                                                onChange={e => setTxForm({...txForm, account_id: e.target.value})}
                                            >
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name} (Bal: ${acc.balance.toLocaleString()})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary">Transaction Type</label>
                                            <div className="d-flex gap-3">
                                                <label className={`btn flex-fill fw-bold border ${txForm.type === 'OUT' ? 'btn-danger text-white border-danger' : 'btn-light text-secondary'}`}>
                                                    <input type="radio" className="d-none" name="type" value="OUT" checked={txForm.type === 'OUT'} onChange={e => setTxForm({...txForm, type: e.target.value})} />
                                                    <i className="bi bi-arrow-up-right me-2"></i>Cash Outflow
                                                </label>
                                                <label className={`btn flex-fill fw-bold border ${txForm.type === 'IN' ? 'btn-success text-white border-success' : 'btn-light text-secondary'}`}>
                                                    <input type="radio" className="d-none" name="type" value="IN" checked={txForm.type === 'IN'} onChange={e => setTxForm({...txForm, type: e.target.value})} />
                                                    <i className="bi bi-arrow-down-left me-2"></i>Cash Inflow
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-secondary">Amount ($)</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0.01"
                                                className="form-control border-light bg-light shadow-none py-2" 
                                                required 
                                                value={txForm.amount}
                                                onChange={e => setTxForm({...txForm, amount: e.target.value})}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-secondary">Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control border-light bg-light shadow-none py-2" 
                                                required 
                                                value={txForm.date}
                                                onChange={e => setTxForm({...txForm, date: e.target.value})}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-secondary">Description</label>
                                            <input 
                                                type="text" 
                                                className="form-control border-light bg-light shadow-none py-2" 
                                                placeholder="Lunch, supplies, etc."
                                                value={txForm.description}
                                                onChange={e => setTxForm({...txForm, description: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-light p-4 pt-0">
                                    <button type="button" className="btn btn-light fw-bold px-4 hover-scale" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" disabled={submitting || accounts.length === 0} className="btn btn-primary fw-bold px-4 text-white hover-scale" style={{ backgroundColor: '#1d256d', border: 'none' }}>
                                        {submitting ? <span className="spinner-border spinner-border-sm"></span> : "Save Transaction"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Account Modal */}
            {showAccountModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-bank2 text-primary me-2"></i> Create New Cash Account</h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowAccountModal(false)}></button>
                            </div>
                            <form onSubmit={handleAccountSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-4">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Account Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium" 
                                            placeholder="e.g. Office Petty Cash, Project Fund"
                                            required
                                            value={accountForm.name}
                                            onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <label className="form-label text-secondary fw-bold small text-uppercase">Initial Balance (USD)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-bolder text-primary" 
                                            placeholder="0.00"
                                            required
                                            value={accountForm.balance}
                                            onChange={e => setAccountForm({...accountForm, balance: e.target.value})}
                                        />
                                        <small className="text-muted mt-2 d-block">Starting capital for this ledger account</small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-bold text-secondary me-2" onClick={() => setShowAccountModal(false)}>Cancel</button>
                                    <button type="submit" disabled={submitting} className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm" style={{ backgroundColor: '#1d256d', border: 'none' }}>
                                        {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>}
                                        Initialize Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .transition-all { transition: all 0.2s ease; }
                .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
}

export default function PettyCashPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <PettyCashContent />
        </Suspense>
    );
}
