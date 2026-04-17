"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function NewAssetContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const companyId = searchParams.get('company_id');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Electronics',
        serial_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        cost: '',
        description: '',
        status: 'ACTIVE'
    });

    const categories = ['Electronics', 'Furniture', 'Vehicle', 'Real Estate', 'Office Equipment', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
            const targetCompanyId = isCompanyIdValid ? companyId : "1";

            await axios.post(`${API_BASE_URL}/operations/assets`, {
                ...formData,
                cost: parseFloat(formData.cost),
                company_id: parseInt(targetCompanyId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push(`/dashboard/operations/assets?company_id=${targetCompanyId}`);
        } catch (err: any) {
            let errorMessage = "Failed to register asset.";
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
                        <i className="bi bi-arrow-left"></i> Back to Assets
                    </button>

                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                        <div className="mb-5">
                            <h2 className="fw-bolder mb-1">Register New Asset</h2>
                            <p className="text-secondary small fw-medium">Add a new item to company inventory</p>
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
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Asset Name</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="e.g. MacBook Pro, Toyota Hilux"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
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
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Serial Number</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="SN-XXXX-XXXX"
                                        value={formData.serial_number}
                                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Purchase Cost (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="0.00"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Purchase Date</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Initial Status</label>
                                    <select
                                        className="form-select form-select-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        required
                                    >
                                        <option value="ACTIVE">ACTIVE (Ready for use)</option>
                                        <option value="IN MAINTENANCE">IN MAINTENANCE</option>
                                        <option value="IDLE">IDLE (In Storage)</option>
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-secondary fw-bold small text-uppercase">Description / Specifications</label>
                                    <textarea
                                        rows={3}
                                        className="form-control form-control-lg bg-light border-0 rounded-3 shadow-none fw-medium"
                                        placeholder="Technical details, condition, etc..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 border-top pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-dark px-5 py-3 rounded-3 fw-bold shadow-sm w-100"
                                >
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-seam me-2"></i>}
                                    Register Asset Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewAssetPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <NewAssetContent />
        </Suspense>
    );
}
