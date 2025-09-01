import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/api_url';
import { FiCheck, FiUser } from 'react-icons/fi';

interface Student {
    user_uid: string;
    name: string;
    email: string;
    password: string;
    student_login_password?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const UserPassCreation: React.FC = () => {
    const [users, setUsers] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [sendingStatus, setSendingStatus] = useState<{ [key: string]: boolean }>({});
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type }), 3000);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/api/studentDataCoursePurchased`);
                const mappedUsers: Student[] = res.data.map((item: any) => ({
                    user_uid: item.user_uid,
                    name: item.name,
                    email: item.email,
                    password: '',
                    student_login_password: item.student_login_password,
                }));
                setUsers(mappedUsers);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#';
        return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const handleGenerate = (uid: string) => {
        const newPassword = generatePassword();
        setUsers(prev => prev.map(user => user.user_uid === uid ? { ...user, password: newPassword } : user));
    };

    const handlePasswordChange = (uid: string, value: string) => {
        setUsers(prev => prev.map(user => user.user_uid === uid ? { ...user, password: value } : user));
    };

    const handleSendMail = async (user: Student) => {
        const actualPassword = user.password || user.student_login_password;
        if (!actualPassword?.trim()) {
            showToast('Password is empty!', 'error');
            return;
        }
        setSendingStatus(prev => ({ ...prev, [user.user_uid]: true }));
        try {
            await axios.post(`${API_URL}/api/insertStudentPassword`, {
                email: user.email,
                student_login_password: actualPassword,
            });
            showToast(`Password sent to ${user.email}`, 'success');
        } catch (error) {
            console.error('Failed to send password:', error);
            showToast('Failed to send password. Please try again.', 'error');
        } finally {
            setSendingStatus(prev => ({ ...prev, [user.user_uid]: false }));
        }
    };

    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <div className="p-6 max-w-8xl dark:text-white bg-white dark:bg-gray-800 rounded shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">User Password Generation</h2>

                <div className="flex items-center justify-between mb-4 dark:bg-gray-800">
                    <p>Total Users: {users.length}</p>
                    <div>
                        <label className="mr-2">Items per page:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded px-2 py-1  dark:bg-gray-800"
                        >
                            {ITEMS_PER_PAGE_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? <p>Loading users...</p> : (
                    <table className="w-full border border-gray-300 text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                            <tr>
                                <th className="p-2 border">Student UID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Email</th>
                                <th className="p-2 border">Password</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map(user => (
                                <tr key={user.user_uid}>
                                    <td className="p-2 border">{user.user_uid}</td>
                                    <td className="p-2 border">{user.name}</td>
                                    <td className="p-2 border">{user.email}</td>
                                    <td className="p-2 border">
                                        <input
                                            type="text"
                                            value={user.password || user.student_login_password || ''}
                                            onChange={(e) => handlePasswordChange(user.user_uid, e.target.value)}
                                            className="w-full border rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="p-2 border space-x-2">
                                        <button onClick={() => handleGenerate(user.user_uid)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">Generate</button>
                                        <button
                                            onClick={() => handleSendMail(user)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-60"
                                            // disabled={sendingStatus[user.user_uid] || !!(user.password || user.student_login_password)}
                                        >
                                            {sendingStatus[user.user_uid] ? 'Sending...' : 'Send Mail'}
                                        </button>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                    <div>
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="space-x-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 border rounded disabled:opacity-50">First</button>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Previous</button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 border rounded disabled:opacity-50">Last</button>
                    </div>
                </div>
            </div>

            {toast.show && (
                <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg flex items-center transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white z-50`}>
                    {toast.type === 'success' ? <FiCheck className="h-5 w-5 mr-2" /> : <FiUser className="h-5 w-5 mr-2" />}
                    <span>{toast.message}</span>
                </div>
            )}
        </>
    );
};

export default UserPassCreation;