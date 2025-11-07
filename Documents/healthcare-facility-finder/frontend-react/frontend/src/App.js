import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import LandingPage from './components/landingPage/landingPage';
import SignUpPage from './components/SignupPage/signupPage';
import LoginPage from './components/loginPage/loginPage';
import DashboardOverview from './components/dashboards/dashboardOverview';
import InteractiveMap from './components/interactiveMap';
import Recommendations from './components/recommendations';
import Reports from './components/reports';
import AccessibilityAnalysis from './components/accessibilityAnalysis';
import AdminDashboard from './components/admin/adminDashboard';
import SetPasswordPage from './components/loginPage/setupPasswordPage';
import DashboardLayout from './components/dashboards/dashboardLayout';
import HealthFacilityPlanner from './pages/HealthFacilityPlanner';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
        <Route path='/signup' element={<SignUpPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/set-password' element={<SetPasswordPage />} />
        <Route path='/dashboard' element={<DashboardLayout />}>
          <Route index element={<Navigate to='/dashboard/overview' replace />} />
          <Route path='overview' element={<DashboardOverview />} />
          <Route path='analysis' element={<AccessibilityAnalysis />} />
          <Route path='map' element={<InteractiveMap />} />
          <Route path='reports' element={<Reports />} />
          <Route path='planner' element={<HealthFacilityPlanner />} />
        </Route>
        <Route path='/admin/dashboard' element={<AdminDashboard/>} />

      </Routes>
    </Router>
  );
}

export default App;
