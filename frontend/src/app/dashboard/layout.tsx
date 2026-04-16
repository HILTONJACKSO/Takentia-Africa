"use client";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutContent({ children }: { children: ReactNode }) {
    const { isOpen, closeSidebar } = useSidebar();

    return (
        <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 z-3 d-lg-none"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={`sidebar-container z-3 ${isOpen ? 'show' : ''}`}
                style={{
                    width: "260px",
                    transition: "transform 0.3s ease-in-out",
                    height: "100vh"
                }}
            >
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                {/* Navbar */}
                <Navbar />

                {/* Scrollable Page Content */}
                <main className="flex-grow-1 overflow-auto bg-light p-3 p-md-4">
                    <div className="container-fluid p-0">
                        {children}
                    </div>
                </main>
            </div>

            <style jsx global>{`
                @media (max-width: 991.98px) {
                    .sidebar-container {
                        position: fixed;
                        left: 0;
                        top: 0;
                        transform: translateX(-100%);
                    }
                    .sidebar-container.show {
                        transform: translateX(0);
                    }
                }
                @media (min-width: 992px) {
                    .sidebar-container {
                        position: relative;
                        transform: none;
                        flex-shrink: 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
    );
}
