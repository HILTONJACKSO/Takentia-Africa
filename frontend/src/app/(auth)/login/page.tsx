"use client";
import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
    const [email, setEmail] = useState("admin@gmail.com");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await axios.post("http://localhost:8001/api/v1/auth/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            localStorage.setItem("token", res.data.access_token);
            window.location.href = "/";
        } catch (err) {
            setError("Invalid credentials. Please check your email and password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex min-vh-100 font-sans">
            {/* Left Side: Branding / Graphic */}
            <div className="d-none d-lg-flex col-lg-5 p-5 flex-column justify-content-between position-relative overflow-hidden" style={{ backgroundColor: '#1d256d' }}>
                <div className="position-absolute" style={{ top: '-10%', left: '-10%', width: '400px', height: '400px', backgroundColor: '#D0DD28', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15 }}></div>
                <div className="position-absolute" style={{ bottom: '-5%', right: '-15%', width: '500px', height: '500px', backgroundColor: '#D0DD28', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.1 }}></div>

                <div className="z-1">
                    <div className="d-flex align-items-center gap-3 mb-5">
                        <div className="text-dark fw-bold rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px', fontSize: '1.4rem', backgroundColor: '#D0DD28' }}>
                            T
                        </div>
                        <div>
                            <h4 className="text-white fw-bold mb-0">Talentia</h4>
                            <small className="fw-medium text-white-50" style={{ letterSpacing: '1px' }}>ENTERPRISE</small>
                        </div>
                    </div>
                </div>

                <div className="z-1 mb-5 pb-5">
                    <h1 className="display-4 fw-bolder text-white mb-4 lh-sm">
                        Streamline your<br />
                        <span style={{ color: '#D0DD28' }}>HR & Operations</span>
                    </h1>
                    <p className="lead fw-normal text-white-50 pe-xl-5" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                        The complete platform designed to manage payroll, attendance, expenses, and enterprise resources seamlessly from a single unified dashboard.
                    </p>
                </div>

                <div className="z-1">
                    <p className="text-white-50 small mb-0 fw-medium">
                        &copy; 2026 Talentia Africa. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center bg-light">
                <div className="w-100 px-4 px-md-5" style={{ maxWidth: '540px' }}>
                    <div className="card shadow-lg border-0 p-4 p-md-5 bg-white" style={{ borderRadius: '24px' }}>
                        <div className="text-center mb-5">
                            <div className="d-lg-none mb-4 d-inline-flex align-items-center justify-content-center rounded" style={{ width: '56px', height: '56px', backgroundColor: '#1d256d', color: '#D0DD28' }}>
                                <span className="fw-bold fs-3">T</span>
                            </div>
                            <h2 className="fw-bolder mb-2 text-dark" style={{ letterSpacing: '-0.5px' }}>Welcome back</h2>
                            <p className="text-secondary fw-medium">Please enter your credentials to access your dashboard</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger py-3 small fw-medium d-flex align-items-center gap-2 rounded-3 border-0 bg-danger bg-opacity-10 text-danger mb-4">
                                <i className="bi bi-exclamation-circle-fill fs-5"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="form-label text-dark fw-bold small">Email Address</label>
                                <div className="input-group input-group-lg shadow-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted px-4" style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <i className="bi bi-envelope"></i>
                                    </span>
                                    <input
                                        type="email"
                                        className="form-control border-start-0 ps-0 text-dark fs-6"
                                        style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@talentia.africa"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label text-dark fw-bold small mb-0">Password</label>
                                    <a href="#" className="small fw-bold text-decoration-none" style={{ color: '#1d256d' }}>Forgot Password?</a>
                                </div>
                                <div className="input-group input-group-lg shadow-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted px-4" style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <i className="bi bi-lock"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="form-control border-start-0 ps-0 text-dark fs-6"
                                        style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-5 form-check ms-1">
                                <input type="checkbox" className="form-check-input cursor-pointer shadow-none" id="rememberMe" style={{ borderColor: '#adb5bd' }} />
                                <label className="form-check-label small text-secondary fw-medium cursor-pointer ms-1" htmlFor="rememberMe">Remember me for 30 days</label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-lg w-100 fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2 shadow hover-scale"
                                style={{ backgroundColor: '#1d256d', borderRadius: '12px', padding: '16px 0' }}
                            >
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Authenticating...</>
                                ) : (
                                    <>Sign In to Dashboard <i className="bi bi-arrow-right fs-5"></i></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
