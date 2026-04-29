import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Shell from './components/layout/Shell';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QualificationsPage from './pages/curriculum/QualificationsPage';
import ModulesPage from './pages/curriculum/ModulesPage';
import LearningOutcomesPage from './pages/curriculum/LearningOutcomesPage';
import ChronogramPage from './pages/chronogram/ChronogramPage';
import ImportPage from './pages/ImportPage';
import SessionPlansPage from './pages/pedagogy/SessionPlansPage';
import ModuleProgressPage from './pages/curriculum/ModuleProgressPage';
import ObservationsPage from './pages/pedagogy/ObservationsPage';
import TrainerPortfolioPage from './pages/pedagogy/TrainerPortfolioPage';
import DepartmentsPage from './pages/DepartmentsPage';
import { StudentsPage, ClassesPage, UsersPage, SchemesPage } from './pages/StudentsPage';
import { IncidentsPage, SanctionsPage, PatronReportsPage, PortfolioPage, TraineePortfolioPage, NotificationsPage } from './pages/OtherPages';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace/>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace/> : <LoginPage/>}/>
      <Route path="/" element={<Protected><Shell/></Protected>}>
        <Route index element={<DashboardPage/>}/>

        {/* Curriculum */}
        <Route path="qualifications"    element={<QualificationsPage/>}/>
        <Route path="modules"           element={<ModulesPage/>}/>
        <Route path="learning-outcomes" element={<LearningOutcomesPage/>}/>
        <Route path="chronogram"        element={<ChronogramPage/>}/>
        <Route path="module-progress"    element={<ModuleProgressPage/>}/>
        <Route path="import"            element={<ImportPage/>}/>

        {/* Pedagogy */}
        <Route path="schemes"                      element={<SchemesPage/>}/>
        <Route path="session-plans"                element={<SessionPlansPage/>}/>
        <Route path="observations"                 element={<ObservationsPage/>}/>
        <Route path="trainer-portfolio"            element={<TrainerPortfolioPage/>}/>
        <Route path="trainer-portfolio/:id"        element={<TrainerPortfolioPage/>}/>

        {/* Trainees */}
        <Route path="students"          element={<StudentsPage/>}/>
        <Route path="classes"           element={<ClassesPage/>}/>
        <Route path="portfolio"         element={<PortfolioPage/>}/>
        <Route path="portfolio/:id"     element={<TraineePortfolioPage/>}/>

        {/* Staff */}
        <Route path="users"             element={<UsersPage/>}/>
        <Route path="departments"       element={<DepartmentsPage/>}/>

        {/* Discipline */}
        <Route path="incidents"         element={<IncidentsPage/>}/>
        <Route path="sanctions"         element={<SanctionsPage/>}/>
        <Route path="patron-reports"    element={<PatronReportsPage/>}/>

        {/* System */}
        <Route path="notifications"     element={<NotificationsPage/>}/>

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Route>
    </Routes>
  );
}
