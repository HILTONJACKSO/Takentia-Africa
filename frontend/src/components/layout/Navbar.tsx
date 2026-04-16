"use client";
import { useSidebar } from "@/context/SidebarContext";
import NotificationDropdownComponent from "./NotificationDropdown";

export default function Navbar() {
    const { toggleSidebar } = useSidebar();

    return (
        <nav className="navbar navbar-expand-lg bg-white border-bottom px-3 px-md-4 py-2 py-md-3 shadow-sm sticky-top z-3">
            <div className="container-fluid p-0">
                <div className="d-flex align-items-center gap-3">
                    {/* Mobile Toggle */}
                    <button
                        className="btn btn-link link-dark p-0 d-lg-none"
                        onClick={toggleSidebar}
                        aria-label="Toggle Sidebar"
                    >
                        <i className="bi bi-list fs-3"></i>
                    </button>

                    <form className="d-none d-md-flex" role="search" style={{ width: '300px' }}>
                        <div className="input-group">
                            <span className="input-group-text border-0 ps-3 pe-2" id="search-addon" style={{ backgroundColor: '#F3F4F6', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input type="search" className="form-control border-0 shadow-none ps-2" placeholder="Search..." aria-label="Search" style={{ backgroundColor: '#F3F4F6', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }} />
                        </div>
                    </form>

                    <div className="d-md-none fw-bold text-primary">
                        Talentia
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3 gap-md-4 ms-auto">
                    <NotificationDropdownComponent />
                    <div className="dropdown d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} data-bs-toggle="dropdown">
                        <div className="text-white fw-bold rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#1d256d', fontSize: '0.8rem' }}>
                            AU
                        </div>
                        <div className="fw-medium text-dark small d-none d-sm-block">
                            Admin <i className="bi bi-chevron-down ms-1 text-muted" style={{ fontSize: '0.7rem' }}></i>
                        </div>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                            <li><a className="dropdown-item py-2 small fw-medium" href="#"><i className="bi bi-person me-2"></i>Profile</a></li>
                            <li><a className="dropdown-item py-2 small fw-medium" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item text-danger py-2 small fw-medium" onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/login';
                            }}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}
