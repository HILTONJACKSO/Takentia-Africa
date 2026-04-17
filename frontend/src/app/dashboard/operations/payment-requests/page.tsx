"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function PaymentRequestsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [requests, setRequests] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

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

            const [reqRes, empRes, accRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/operations/payment-requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }),
                axios.get(`${API_BASE_URL}/operations/payment-requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }),
                axios.get(`${API_BASE_URL}/operations/payment-requests`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                })
            ]);

            setRequests(reqRes.data);
            setEmployees(empRes.data);
            setAccounts(accRes.data);
            if (accRes.data.length > 0) setSelectedAccountId(accRes.data[0].id.toString());

        } catch (err: any) {
            console.error("Error fetching data:", err);
            if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
                setError("Request timed out. The server might be busy.");
            } else if (err.response?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            let errorMessage = "Failed to load dashboard data.";
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

    const handleUpdateStatus = async (requestId: number, newStatus: string, accountId?: string) => {
        setUpdating(requestId);
        const token = localStorage.getItem("token");
        try {
            const payload: any = { status: newStatus };
            if (accountId) payload.account_id = parseInt(accountId);

            await axios.patch(`${API_BASE_URL}/operations/payment-requests/${requestId}/status`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh local state
            setRequests(requests.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
            if (newStatus === 'PAID') {
                setShowPaymentModal(false);
                fetchData(); // Refresh accounts to show new balance
            }
        } catch (err: any) {
            alert("Failed to update status: " + (err.response?.data?.detail || err.message));
        } finally {
            setUpdating(null);
        }
    };

    const getEmployeeName = (empId: number) => {
        const emp = employees.find(e => e.id === empId);
        return emp ? `${emp.first_name} ${emp.last_name}` : `Staff #${empId}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-warning text-dark';
            case 'APPROVED': return 'bg-info text-white';
            case 'PAID': return 'bg-success text-white';
            case 'REJECTED': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
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
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px' }}>Payment Requests</h2>
                    <p className="text-secondary mb-0 small fw-medium">Manage and approve employee reimbursement and cash requests</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push(`/dashboard/operations/payment-requests/new${companyId && companyId !== "null" ? `?company_id=${companyId}` : ""}`)}
                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                    >
                        <i className="bi bi-plus-lg"></i> New Request
                    </button>
                </div>
            </div>

            {/* Requests Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="p-4 bg-white border-bottom border-light">
                    <h5 className="fw-bold mb-0">Request Log</h5>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase">Date</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Requester</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Title</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Amount</th>
                                <th className="py-3 border-0 text-secondary small fw-bold text-uppercase">Status</th>
                                <th className="px-4 py-3 border-0 text-secondary small fw-bold text-uppercase text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-5">No payment requests found.</td></tr>
                            ) : requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-4 py-3">
                                        <div className="small text-secondary">{new Date(req.request_date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="py-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                                {getEmployeeName(req.employee_id).charAt(0)}
                                            </div>
                                            <div className="fw-bold text-dark">{getEmployeeName(req.employee_id)}</div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="fw-medium text-dark">{req.title}</div>
                                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>{req.description}</small>
                                    </td>
                                    <td className="py-3">
                                        <div className="fw-bolder text-primary">${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`badge px-3 py-2 rounded-pill fw-bold ${getStatusBadge(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="btn-group btn-group-sm gap-2">
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                                        disabled={updating === req.id}
                                                        className="btn btn-outline-success border-0 rounded-3 p-2 shadow-none" title="Approve">
                                                        <i className="bi bi-check-lg fs-6"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                                        disabled={updating === req.id}
                                                        className="btn btn-outline-danger border-0 rounded-3 p-2 shadow-none" title="Reject">
                                                        <i className="bi bi-x-lg fs-6"></i>
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequestId(req.id);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    disabled={updating === req.id}
                                                    className="btn btn-success border-0 rounded-3 px-3 shadow-none fw-bold" title="Process Payment">
                                                    Process Payment
                                                </button>
                                            )}
                                            <button className="btn btn-light border-0 rounded-3 p-2 shadow-none text-secondary">
                                                <i className="bi bi-eye fs-6"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Confirmation Modal */}
            {showPaymentModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="modal-title fw-bold text-dark">
                                    <i className="bi bi-cash-stack text-success me-2"></i> Process Payment
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowPaymentModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-secondary mb-4">Please select the <strong>Petty Cash Account</strong> to use for this disbursement.</p>
                                
                                <div className="mb-4">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Source Account</label>
                                    <select 
                                        className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-bold text-primary"
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                    >
                                        <option value="">-- Select Account --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} (Bal: ${acc.balance.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                    {accounts.length === 0 && (
                                        <div className="alert alert-warning mt-2 small py-2 rounded-3">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            No petty cash accounts found. Please create one in the Petty Cash dashboard.
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-3 bg-light rounded-4 border-start border-success border-4">
                                    <div className="small text-secondary mb-1 uppercase fw-bold">Amount to Pay</div>
                                    <h3 className="fw-bolder mb-0 text-dark">
                                        ${requests.find(r => r.id === selectedRequestId)?.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h3>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-bold text-secondary me-2" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button 
                                    type="button" 
                                    disabled={updating === selectedRequestId || !selectedAccountId || accounts.length === 0} 
                                    className="btn btn-success px-4 py-2 rounded-3 fw-bold shadow-sm"
                                    onClick={() => selectedRequestId && handleUpdateStatus(selectedRequestId, 'PAID', selectedAccountId)}
                                >
                                    {updating === selectedRequestId ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                                    Confirm & Pay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PaymentRequestsPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <PaymentRequestsContent />
        </Suspense>
    );
}
