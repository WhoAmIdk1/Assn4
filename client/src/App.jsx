import { Routes, Route } from 'react-router-dom';

// Component Imports
import Navbar from './components/Navbar';

// Page Imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePoll from './pages/CreatePoll';
import PollDetail from './pages/PollDetail';
import MyPolls from './pages/MyPolls';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content">
        <Routes>
          {/* Public / Shared Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/polls/:id" element={<PollDetail />} />
          
          {/* Protected Routes (Logic handled inside the components) */}
          <Route path="/polls/new" element={<CreatePoll />} />
          <Route path="/my-polls" element={<MyPolls />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;