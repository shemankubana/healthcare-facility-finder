import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Check, X, LogOut, Menu, User, Settings, Shield } from 'lucide-react'
import Modal from '../Modal';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);


const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const showModal = (title, message, type = 'success') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'success'
    });
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in');
        setLoading(false);
        return;
      }

      if (user.user_metadata?.is_admin === true) {
        setIsAdmin(true);
        fetchRequests();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setError('Unauthorized: Admin access required');
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      fetchRequests();
    } catch (err) {
      setError('Error checking admin status');
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('signup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out: ' + error.message);
    }
  };

  const handleApprove = async (request) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      // Call the backend API endpoint instead of edge function
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/users/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: request.id,
          adminToken: session.access_token
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve user');
      }

      showModal(
        'User Approved!',
        'User approved successfully! An email has been sent to reset their password.',
        'success'
      );

      setTimeout(() => {
        setRequests(prev => prev.map(r =>
          r.id === request.id ? { ...r, status: 'approved' } : r
        ));
      }, 1000);
      fetchRequests();
    } catch (error) {
      console.error('Error approving user:', error);
      showModal('Error', `Error approving user: ${error.message}`, 'error');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      // Call the backend API endpoint for consistency
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/users/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: requestId,
          adminToken: session.access_token
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject user');
      }

      showModal(
        'Request Declined',
        'User request has been declined.',
        'error'
      );

      setTimeout(() => {
        setRequests(prev => prev.map(r =>
          r.id === requestId ? { ...r, status: 'rejected' } : r
        ));
      }, 1000);
    } catch (error) {
      console.error('Error rejecting user:', error);
      showModal('Error', `Error rejecting user: ${error.message}`, 'error');
    }
  };

  const filteredRequests = requests.filter(request => 
    `${request.first_name} ${request.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecorded = requests.length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const responseRate = totalRecorded > 0 ? Math.round((approvedCount / totalRecorded) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  
  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          {error || 'Unauthorized access'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-[#004c99]">
              HealthAccess
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 mb-1 bg-blue-50 text-[#004c99] border-r-4 border-[#004c99]"
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="font-medium">User Management</span>
            )}
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">
              User Management
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Administrator
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Recorded Data */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Overall Recorded Data</div>
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-6">{totalRecorded}</div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-900">Response Rate</span>
                    <span className="font-semibold text-gray-900">{responseRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${responseRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Approved Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Approved Requests</div>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-5xl font-bold text-gray-900">{approvedCount}</div>
              </div>

              {/* Declined Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Declined Requests</div>
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <X className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-5xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'rejected').length}
                </div>
              </div>
            </div>

            {/* Registered Users Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm text-gray-600 uppercase tracking-wide">Registered Users</h2>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search account user"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-cyan-400 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email ID</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No signup requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {request.first_name} {request.last_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-700' 
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(request.created_at).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(request)}
                                disabled={request.status !== 'pending'}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  request.status === 'pending'
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-600 cursor-pointer'
                                    : 'bg-cyan-500 text-white opacity-40 cursor-not-allowed'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={request.status !== 'pending'}
                                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                  request.status === 'pending'
                                    ? 'border-red-400 text-red-600 hover:bg-red-50 cursor-pointer'
                                    : 'border-red-400 text-red-600 opacity-40 cursor-not-allowed'
                                }`}
                              >
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


export default AdminDashboard;