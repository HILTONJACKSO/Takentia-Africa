"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect, Suspense } from "react";
import axios from "axios";

import { useSearchParams } from "next/navigation";

function PayrollContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("company_id");
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");

    // Generate new run state
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [genMonth, setGenMonth] = useState(currentMonth);
    const [genYear, setGenYear] = useState(currentYear);

    // Selected run for payslips view
    const [selectedRun, setSelectedRun] = useState<any | null>(null);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [payslipsLoading, setPayslipsLoading] = useState(false);

    const fetchRuns = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const API_URL = `${API_BASE_URL}`;
            const url = companyId
                ? `${API_URL}/payroll/runs?company_id=${companyId}`
                : `${API_URL}/payroll/runs`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRuns(res.data);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
    }, [companyId]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError("");
        const token = localStorage.getItem("token");
        try {
            const payload: any = { month: genMonth, year: genYear };
            if (companyId) payload.company_id = parseInt(companyId);

            await axios.post(`${API_BASE_URL}/payroll/runs`, payload, { headers: { Authorization: `Bearer ${token}` } });

            await fetchRuns();
            setShowModal(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to generate payroll");
        } finally {
            setGenerating(false);
        }
    };

    const fetchPayslips = async (run: any) => {
        setSelectedRun(run);
        setPayslipsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get(`${API_BASE_URL}/payroll/runs/${run.id}/payslips`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayslips(res.data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setPayslipsLoading(false);
        }
    };

    const handleStatusUpdate = async (runId: number, status: string) => {
        const token = localStorage.getItem("token");
        try {
            await axios.patch(`${API_BASE_URL}/payroll/runs/${runId}`, { status },
                { headers: { Authorization: `Bearer ${token}` } });
            await fetchRuns();
            if (selectedRun && selectedRun.id === runId) {
                setSelectedRun({ ...selectedRun, status: status });
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getMonthName = (monthNumber: number) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('en-US', { month: 'long' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">Draft</span>;
            case 'APPROVED': return <span className="badge bg-info text-dark px-3 py-2 rounded-pill">Approved</span>;
            case 'PAID': return <span className="badge bg-success px-3 py-2 rounded-pill">Paid</span>;
            default: return <span className="badge bg-secondary px-3 py-2 rounded-pill">{status}</span>;
        }
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Payroll Management</h2>
                    <p className="text-secondary mb-0 small fw-medium">Manage salary disbursements and payslips</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-4 py-2 hover-scale shadow-sm text-white"
                    style={{ backgroundColor: '#1d256d', border: 'none', borderRadius: '10px' }}
                    onClick={() => setShowModal(true)}
                >
                    <i className="bi bi-magic fs-5"></i>
                    Generate Payroll
                </button>
            </div>

            {/* Main Content */}
            <div className="row g-4">
                {/* Left Column: Payroll Runs List */}
                <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-0">
                            <div className="p-4 border-bottom border-light">
                                <h6 className="fw-bold mb-0 text-dark">Recent Payroll Runs</h6>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                </div>
                            ) : runs.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-folder-x fs-1 opacity-50 mb-3 d-block"></i>
                                    No payroll runs found.
                                </div>
                            ) : (
                                <div className="list-group list-group-flush rounded-bottom" style={{ overflow: 'hidden' }}>
                                    {runs.map(run => (
                                        <button
                                            key={run.id}
                                            onClick={() => fetchPayslips(run)}
                                            className={`list-group-item list-group-item-action p-4 border-light transition-all ${selectedRun?.id === run.id ? 'bg-primary bg-opacity-10 opacity-100' : ''}`}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5 className="fw-bold mb-0 text-dark">
                                                    {getMonthName(run.month)} {run.year}
                                                </h5>
                                                {getStatusBadge(run.status)}
                                            </div>
                                            <div className="d-flex justify-content-between align-items-end mt-3">
                                                <div>
                                                    <p className="text-muted small mb-0">Total Amount</p>
                                                    <h4 className="fw-bolder mb-0" style={{ color: '#1d256d' }}>
                                                        ${run.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </h4>
                                                </div>
                                                <div className="text-muted small text-end">
                                                    <i className="bi bi-calendar-check me-1"></i>
                                                    {new Date(run.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Payslips Detail */}
                <div className="col-12 col-lg-7">
                    {selectedRun ? (
                        <div className="card border-0 shadow-sm h-100 animate__animated animate__fadeIn" style={{ borderRadius: '16px' }}>
                            <div className="card-header bg-white border-bottom border-light p-4 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                <div>
                                    <h5 className="fw-bold mb-1">
                                        Payslips for {getMonthName(selectedRun.month)} {selectedRun.year}
                                    </h5>
                                    <p className="text-muted small mb-0">
                                        Total process amount: <span className="fw-bold">${selectedRun.total_amount.toLocaleString()}</span>
                                    </p>
                                </div>
                                <div className="d-flex gap-2">
                                    {selectedRun.status === 'DRAFT' && (
                                        <button onClick={() => handleStatusUpdate(selectedRun.id, 'APPROVED')} className="btn btn-outline-info btn-sm fw-bold px-3 hover-scale">
                                            Approve
                                        </button>
                                    )}
                                    {selectedRun.status === 'APPROVED' && (
                                        <button onClick={() => handleStatusUpdate(selectedRun.id, 'PAID')} className="btn btn-success btn-sm fw-bold px-3 hover-scale text-white">
                                            <i className="bi bi-cash me-1"></i> Mark as Paid
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="card-body p-0 custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {payslipsLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light bg-opacity-50">
                                                <tr>
                                                    <th className="text-secondary small fw-bold py-3 ps-4 border-light">Employee</th>
                                                    <th className="text-secondary small fw-bold py-3 border-light text-end">Base Salary</th>
                                                    <th className="text-secondary small fw-bold py-3 border-light text-end">Allowances (0%)</th>
                                                    <th className="text-secondary small fw-bold py-3 border-light text-end">Deductions (10%)</th>
                                                    <th className="text-secondary small fw-bold py-3 pe-4 border-light text-end">Net Salary</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payslips.map(ps => (
                                                    <tr key={ps.id}>
                                                        <td className="ps-4 py-3">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold" style={{ width: '40px', height: '40px' }}>
                                                                    {ps.employee?.first_name?.[0]}{ps.employee?.last_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark">{ps.employee?.first_name} {ps.employee?.last_name}</div>
                                                                    <div className="small text-muted">{ps.employee?.position}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-end fw-medium py-3">${ps.base_salary.toLocaleString()}</td>
                                                        <td className="text-end text-success fw-medium py-3">+${ps.allowances.toLocaleString()}</td>
                                                        <td className="text-end text-danger fw-medium py-3">-${ps.deductions.toLocaleString()}</td>
                                                        <td className="text-end fw-bold py-3 pe-4" style={{ color: '#1d256d' }}>
                                                            ${ps.net_salary.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center" style={{ borderRadius: '16px', minHeight: '400px', backgroundColor: '#f8f9fa' }}>
                            <div className="text-center">
                                <i className="bi bi-file-earmark-spreadsheet fs-1 text-secondary opacity-25 mb-3 d-block"></i>
                                <h5 className="fw-bold text-secondary">Select a Payroll Run</h5>
                                <p className="text-muted small">Click on a run from the list to view individual payslips.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Payroll Modal */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-light p-4 pb-3">
                                <h5 className="modal-title fw-bold text-dark w-100">
                                    <i className="bi bi-magic text-primary me-2"></i> Generate Payroll
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                            </div>
                            <div className="modal-body p-4 pt-2">
                                <p className="text-muted small mb-4">
                                    This will automatically calculate base salaries, allowances, and deductions for all currently active employees and create a draft run.
                                </p>

                                {error && <div className="alert alert-danger small py-2">{error}</div>}

                                <div className="row g-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-secondary">Month</label>
                                        <select className="form-select border-light bg-light" value={genMonth} onChange={e => setGenMonth(parseInt(e.target.value))}>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{getMonthName(m)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-secondary">Year</label>
                                        <input type="number" className="form-control border-light bg-light" value={genYear} onChange={e => setGenYear(parseInt(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-light p-4 pt-0 justify-content-between">
                                <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setShowModal(false)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary fw-bold px-4 text-white d-flex align-items-center gap-2 transition-all hover-scale"
                                    style={{ backgroundColor: '#1d256d', border: 'none' }}
                                    onClick={handleGenerate}
                                    disabled={generating}
                                >
                                    {generating ? <span className="spinner-border spinner-border-sm"></span> : "Confirm & Generate"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .transition-all { transition: all 0.2s ease; }
            `}</style>
        </div>
    );
}

export default function PayrollPage() {
    return (
        <Suspense fallback={<div className="container-fluid py-4 min-vh-100 bg-light">Loading...</div>}>
            <PayrollContent />
        </Suspense>
    );
}

