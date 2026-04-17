"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function NewPaymentRequestContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingEmployees, setFetchingEmployees] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        title: '',
        description: '',
        amount: '',
        request_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            const token = localStorage.getItem("token");
            try {
                const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
                const url = isCompanyIdValid ? `${API_BASE_URL}` : `${API_BASE_URL}`;
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployees(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, employee_id: res.data[0].id.toString() }));
                }
            } catch (err) {
                console.error("Failed to fetch employees for payment request form");
            } finally {
                setFetchingEmployees(false);
            }
        };

        fetchEmployees();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const targetCompanyId = isCompanyIdValid ? companyId : "1";
            
            await axios.post(`${API_BASE_URL}/operations/payment-requests`, {
                ...formData,
                employee_id: parseInt(formData.employee_id),
                amount: parseFloat(formData.amount),
                company_id: parseInt(targetCompanyId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push(`/dashboard/operations/payment-requests?company_id=${companyId}`);
        } catch (err: any) {
            let errorMessage = "Failed to submit payment request.";
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
                        <i className="bi bi-arrow-left"></i> Back to Requests
                    </button>

                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                        <div className="mb-5">
                            <h2 className="fw-bolder mb-1">Submit Payment Request</h2>
                            <p className="text-secondary small fw-medium">Request reimbursement or funds for company business</p>
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
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Requester (Employee)</label>
                                    {fetchingEmployees ? (
                                        <div className="bg-light p-3 rounded-3 text-center"><span className="spinner-border spinner-border-sm me-2"></span> Loading staff...</div>
                                    ) : (
                                        <select
                                            className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                            value={formData.employee_id}
                                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                            required
                                        >
                                            {employees.map(e => (
                                                <option key={e.id} value={e.id}>
                                                    {e.first_name} {e.last_name} ({e.job_title})
                                                </option>
                                            ))}
                                            {employees.length === 0 && <option value="">No employees found</option>}
                                        </select>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Request Title</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="e.g. Travel Reimbursement, Office Supplies"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Amount (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Request Date</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.request_date}
                                        onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Reason / Description</label>
                                    <textarea
                                        rows={4}
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="Detailed explanation for this fund request..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-5 border-top pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || employees.length === 0}
                                    className="btn btn-primary px-5 py-3 rounded-3 fw-bold shadow-sm w-100"
                                >
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send-check me-2"></i>}
                                    Submit Request for Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewPaymentRequestPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <NewPaymentRequestContent />
        </Suspense>
    );
}
