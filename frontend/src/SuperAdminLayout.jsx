import React, { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  ArrowLeft,
  Crown,
  Menu,
  X,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";
import "./superadmin.css";

export default function SuperAdminLayout({
  activeView,
  onNavigate,
  superAdminUser,
  onLogout,
  onBackToStore,
  children
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: "dashboard",
      path: "/superadmin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      id: "create-admin",
      path: "/superadmin/create-admin",
      label: "Create Admin",
      icon: UserPlus
    },
    {
      id: "manage-admins",
      path: "/superadmin/manage-admins",
      label: "Manage Admins",
      icon: Users
    },
    {
      id: "permissions",
      path: "/superadmin/permissions",
      label: "Admin Permissions",
      icon: ShieldCheck
    },
    {
      id: "activity-logs",
      path: "/superadmin/activity-logs",
      label: "Activity Logs",
      icon: History
    },
    {
      id: "settings",
      path: "/superadmin/settings",
      label: "Settings",
      icon: Settings
    }
  ];

  const handleSelectNav = (path) => {
    setMobileOpen(false);
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  const getPageTitle = () => {
    switch (activeView) {
      case "create-admin":
        return { title: "Create Administrator", subtitle: "Provision a new administrator account with tailored permissions" };
      case "manage-admins":
        return { title: "Manage Admins", subtitle: "Inspect, update roles, toggle status, and govern admin accounts" };
      case "permissions":
        return { title: "Permissions Matrix", subtitle: "Role-Based Access Control (RBAC) governance and capability overview" };
      case "activity-logs":
        return { title: "Audit Activity Logs", subtitle: "Comprehensive immutable record of all administrative operations" };
      case "settings":
        return { title: "Super Admin Settings", subtitle: "Configure root security credentials and platform policies" };
      default:
        return { title: "Super Admin Overview", subtitle: "System health, administrator metrics, and operational control" };
    }
  };

  const currentTitle = getPageTitle();

  return (
    <div className="sa-app-wrapper">
      {/* Sidebar */}
      <aside className={`sa-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Sidebar Header */}
        <div className="sa-sidebar-header">
          <div className="sa-brand-icon">
            <Crown size={24} />
          </div>
          <div className="sa-brand-info">
            <h2>Tech<span>Zone</span></h2>
            <p>Super Admin</p>
          </div>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="sa-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sa-nav-${item.id}`}
                className={`sa-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleSelectNav(item.path)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sa-sidebar-footer">
          <button
            className="sa-nav-item"
            onClick={onBackToStore}
            style={{ color: "#94a3b8" }}
            title="Return to customer store"
          >
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </button>

          <button
            className="sa-nav-item"
            onClick={onLogout}
            id="sa-logout-btn"
            style={{ color: "#f87171" }}
            title="Sign out of Super Admin"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <div className="sa-user-pill">
            <div className="sa-avatar">
              {(superAdminUser?.name || "SA").slice(0, 2).toUpperCase()}
            </div>
            <div className="sa-user-meta">
              <span className="sa-user-name">{superAdminUser?.name || "Root Admin"}</span>
              <span className="sa-user-badge">Super Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="sa-main-area">
        {/* Topbar */}
        <header className="sa-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="sa-icon-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: "none" }}
              id="sa-mobile-menu-btn"
            >
              <Menu size={18} />
            </button>
            <div className="sa-topbar-title">
              <h1>{currentTitle.title}</h1>
              <p>{currentTitle.subtitle}</p>
            </div>
          </div>

          <div className="sa-topbar-actions">
            <div className="sa-topbar-badge">
              <span className="sa-live-pulse" />
              <span>RBAC Engine Live</span>
            </div>
            {activeView !== "create-admin" && (
              <button
                className="sa-btn-primary"
                onClick={() => handleSelectNav("/superadmin/create-admin")}
                id="sa-topbar-create-btn"
              >
                <UserPlus size={16} />
                <span>+ Create Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main className="sa-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
