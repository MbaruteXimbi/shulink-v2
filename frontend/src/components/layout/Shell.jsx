import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  FileText, Eye, Award, AlertTriangle, Shield, Download,
  LogOut, Bell, Building2, ListTree, ClipboardList,
} from 'lucide-react';

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink to={to} end={exact} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <Icon size={15} strokeWidth={1.8}/>
      {label}
    </NavLink>
  );
}

export default function Shell() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-name">Shulink</div>
          <div className="logo-sub">TVET School Management</div>
        </div>

        {user && (
          <div className="sidebar-school">
            <strong>School</strong>
            {user.school_name}
          </div>
        )}

        <nav className="sidebar-nav">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" exact/>

          <div className="nav-section-label">Curriculum</div>
          <NavItem to="/qualifications"    icon={Award}         label="Qualifications"/>
          <NavItem to="/modules"           icon={ListTree}      label="Modules"/>
          <NavItem to="/chronogram"        icon={Calendar}      label="Chronogram"/>
          <NavItem to="/import"            icon={Download}      label="Excel Import"/>

          <div className="nav-section-label">Pedagogy</div>
          <NavItem to="/schemes"           icon={FileText}      label="Schemes of Work"/>
          <NavItem to="/session-plans"     icon={BookOpen}      label="Session Plans"/>
          <NavItem to="/observations"      icon={Eye}           label="Observations"/>

          <div className="nav-section-label">Trainees</div>
          <NavItem to="/portfolio"         icon={Award}         label="CBC Portfolios"/>
          <NavItem to="/students"          icon={GraduationCap} label="Trainees"/>
          <NavItem to="/classes"           icon={Building2}     label="Classes"/>

          {can('school_admin','headmaster','dos','dod') && (
            <>
              <div className="nav-section-label">Staff</div>
              <NavItem to="/users"         icon={Users}         label="Staff Members"/>
              <NavItem to="/departments"   icon={Building2}     label="Departments"/>
            </>
          )}

          <div className="nav-section-label">Discipline</div>
          <NavItem to="/incidents"         icon={AlertTriangle} label="Incidents"/>
          {can('dod','headmaster','school_admin') &&
            <NavItem to="/sanctions"       icon={Shield}        label="Sanctions"/>}
          <NavItem to="/patron-reports"    icon={ClipboardList} label="Patron Reports"/>

          <div className="nav-section-label">System</div>
          <NavItem to="/notifications"     icon={Bell}          label="Notifications"/>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name}</div>
              <div className="user-role">{user?.role?.replace(/_/g,' ')}</div>
            </div>
            <button className="btn-icon" onClick={() => { logout(); navigate('/login'); }} title="Sign out">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-content">
          <Outlet/>
        </div>
      </main>
    </div>
  );
}
