import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  FileText, Eye, Award, AlertTriangle, Shield, Download,
  LogOut, Bell, Building2, ListTree, ClipboardList, UserSquare,
  ChevronDown, ChevronRight,
} from 'lucide-react';

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <Icon size={15} strokeWidth={1.8}/>
      {label}
    </NavLink>
  );
}

function NavSection({ label, children, defaultOpen = true, routes = [] }) {
  const location = useLocation();
  const isAnyActive = routes.some(r => location.pathname.startsWith(r));
  const [open, setOpen] = useState(defaultOpen || isAnyActive);

  useEffect(() => {
    if (isAnyActive) setOpen(true);
  }, [location.pathname]);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '10px 10px 4px',
        }}
      >
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '.08em',
        }}>
          {label}
        </span>
        {open
          ? <ChevronDown size={11} color="var(--text-3)" strokeWidth={2.5}/>
          : <ChevronRight size={11} color="var(--text-3)" strokeWidth={2.5}/>
        }
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '500px' : '0px',
        transition: 'max-height 0.2s ease',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {children}
      </div>
    </div>
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

          <NavSection label="Curriculum" defaultOpen routes={['/qualifications','/modules','/chronogram','/import']}>
            <NavItem to="/qualifications" icon={Award}    label="Qualifications"/>
            <NavItem to="/modules"        icon={ListTree} label="Modules"/>
            <NavItem to="/chronogram"     icon={Calendar} label="Chronogram"/>
            {can('school_admin','headmaster','dos') &&
              <NavItem to="/import"       icon={Download} label="Excel Import"/>}
          </NavSection>

          <NavSection label="Pedagogy" defaultOpen routes={['/schemes','/session-plans','/observations','/trainer-portfolio']}>
            <NavItem to="/schemes"           icon={FileText}   label="Schemes of Work"/>
            <NavItem to="/session-plans"     icon={BookOpen}   label="Session Plans"/>
            <NavItem to="/observations"      icon={Eye}        label="Observations"/>
            <NavItem to="/trainer-portfolio" icon={UserSquare} label="My Portfolio"/>
          </NavSection>

          <NavSection label="Trainees" defaultOpen routes={['/portfolio','/students','/classes']}>
            <NavItem to="/portfolio" icon={Award}         label="CBC Portfolios"/>
            <NavItem to="/students"  icon={GraduationCap} label="Trainees"/>
            <NavItem to="/classes"   icon={Building2}     label="Classes"/>
          </NavSection>

          {can('school_admin','headmaster','dos','dod') && (
            <NavSection label="Staff" defaultOpen={false} routes={['/users','/departments']}>
              <NavItem to="/users"       icon={Users}     label="Staff Members"/>
              <NavItem to="/departments" icon={Building2} label="Departments"/>
            </NavSection>
          )}

          <NavSection label="Discipline" defaultOpen={false} routes={['/incidents','/sanctions','/patron-reports']}>
            <NavItem to="/incidents"      icon={AlertTriangle} label="Incidents"/>
            {can('dod','headmaster','school_admin') &&
              <NavItem to="/sanctions"    icon={Shield}        label="Sanctions"/>}
            <NavItem to="/patron-reports" icon={ClipboardList} label="Patron Reports"/>
          </NavSection>

          <NavSection label="System" defaultOpen={false} routes={['/notifications']}>
            <NavItem to="/notifications" icon={Bell} label="Notifications"/>
          </NavSection>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.full_name}
              </div>
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
