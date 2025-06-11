import React from 'react';
import { Outlet } from 'react-router-dom';
import '../recruiter/RecruiterStyles.css';

const RecruiterLayout: React.FC = () => {
  return (
    <div className="page-container">
      {/* Recruiter Navigation */}
      {/* <nav className="recruiter-nav"> */}
        {/* <NavLink to="/recruiter/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          Dashboard
        </NavLink>
        <NavLink to="/recruiter/jobs" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          Manage Jobs
        </NavLink>
        <NavLink to="/recruiter/applications" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
          Applications
        </NavLink>
      </nav> */}
      
      {/* Render the child route component */}
      <Outlet />
    </div>
  );
};

export default RecruiterLayout;
