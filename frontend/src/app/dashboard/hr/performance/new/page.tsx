"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function NewEvaluationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id');

    const [employees, setEmployees] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        employee_id: '',
        rating: 5,
        strengths: '',
        improvements: '',
        goals: '',
        comments: '',
        review_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            const token = localStorage.getItem("token");
            try {
                const isCompanyIdValid = companyId && companyId !== "null" && companyId !== "undefined";
                const url = isCompanyIdValid
                    ? `${API_BASE_URL}`
                    : `${API_BASE_URL}`;
                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployees(res.data);
            } catch (err: any) {
                console.error("Error fetching employees:", err);
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                    return;
                }
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem("token");
        try {
            await axios.post(`${API_BASE_URL}/hr/performance-reviews`, {
                ...formData,
                employee_id: parseInt(formData.employee_id),
                company_id: parseInt(companyId && companyId !== "null" ? companyId : "1"),
                reviewer_id: 1 // Assuming admin for now
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push(`/dashboard/hr/performance?company_id=${companyId}`);
        } catch (err: any) {
            let errorMessage = "Failed to submit evaluation";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map((d: any) => d.msg || d.type).join(", ");
                }
            } else {
                errorMessage = err.message || errorMessage;
            }
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-8">
                    {/* Header */}
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <Link
                            href={`/dashboard/hr/performance?company_id=${companyId}`}
                            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: 40, height: 40 }}
                        >
                            <i className="bi bi-arrow-left fs-5"></i>
                        </Link>
                        <div>
                            <h2 className="fw-bolder mb-0" style={{ letterSpacing: '-0.5px' }}>New Evaluation</h2>
                            <p className="text-secondary small fw-medium mb-0">Record performance insights for your team</p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="card border-0 shadow-sm p-4 p-md-5" style={{ borderRadius: '32px' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold text-secondary text-uppercase">Select Employee</label>
                                    <select
                                        required
                                        className="form-select border-0 bg-light p-3"
                                        style={{ borderRadius: '16px' }}
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                    >
                                        <option value="">Choose an employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.position}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold text-secondary text-uppercase">Evaluation Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="form-control border-0 bg-light p-3"
                                        style={{ borderRadius: '16px' }}
                                        value={formData.review_date}
                                        onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                                    />
                                </div>

                                <div className="col-12 mt-5">
                                    <label className="form-label small fw-bold text-secondary text-uppercase d-block mb-3 text-center">Overall Performance Rating</label>
                                    <div className="d-flex justify-content-between gap-2 gap-md-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                className={`btn border-0 rounded-4 py-4 flex-fill transition-all d-flex flex-column align-items-center gap-2 ${formData.rating === star ? 'bg-primary text-white shadow-lg' : 'bg-light text-secondary hover-bg-light-darker'}`}
                                            >
                                                <i className={`bi bi-star${formData.rating >= star ? '-fill' : ''} fs-3`}></i>
                                                <span className="fw-bold">{star}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-md-12 mt-5">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">What are their core strengths?</label>
                                            <textarea
                                                className="form-control border-0 bg-light p-3"
                                                rows={4}
                                                style={{ borderRadius: '16px' }}
                                                placeholder="e.g. Leadership, punctuality, technical expertise..."
                                                value={formData.strengths}
                                                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Areas for Improvement</label>
                                            <textarea
                                                className="form-control border-0 bg-light p-3"
                                                rows={4}
                                                style={{ borderRadius: '16px' }}
                                                placeholder="e.g. Communication, time management..."
                                                value={formData.improvements}
                                                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold text-secondary text-uppercase">Development Goals & General Comments</label>
                                            <textarea
                                                className="form-control border-0 bg-light p-3"
                                                rows={4}
                                                style={{ borderRadius: '16px' }}
                                                placeholder="Outline future goals and any additional feedback here..."
                                                value={formData.comments}
                                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 mt-5 text-center">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-lg d-inline-flex align-items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <><span className="spinner-border spinner-border-sm"></span> Submitting Evaluation...</>
                                        ) : (
                                            <>Save Performance Review <i className="bi bi-check2-circle fs-5"></i></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewEvaluationPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <NewEvaluationForm />
        </Suspense>
    );
}
