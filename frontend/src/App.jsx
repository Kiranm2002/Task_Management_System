import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/components/Login';
import Register from './features/auth/components/Register';
import PersistLogin from './features/auth/PersistLogin';
import PrivateRoute from './routes/PrivateRoute';
import MainLayout from './components/layout/MainLayout';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import KanbanPage from './pages/KanbanPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Teams from "./features/teams/components/Teams";
import Projects from './features/projects/components/Projects';
import Tasks from "./features/tasks/components/Tasks"
import Users from "./features/users/components/Users"
import AdminAnalytics from './pages/AdminAnalytics';
import UserKanban from './pages/UserKanban';
import MyProjects from './features/users/components/MyProjects';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<div>You do not have permission to view this page.</div>} />

        <Route element={<PersistLogin />}>
          <Route element={<MainLayout />}>
            
            <Route element={<PrivateRoute allowedRoles={['admin', 'user']} />}>
              <Route path="/user-dashboard" element={<UserDashboard/>} >
                <Route path="kanban" element={<UserKanban/>} />
                <Route path="my-projects" element={<MyProjects/>} />
              </Route>
              
            </Route>

            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />}>
                <Route path="kanban" element={<KanbanPage/>} />
                <Route path='tasks' element={<Tasks/>}/>
                <Route path="projects" element={<Projects/>} />
                <Route path="teams" element={<Teams/>} />
                <Route path='users' element={<Users/>}/>
                <Route path="analytics" element={<AdminAnalytics/>} />
              </Route>
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;