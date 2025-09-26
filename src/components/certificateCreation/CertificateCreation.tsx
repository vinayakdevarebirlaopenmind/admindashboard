import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/api_url';
import { FiCheck, FiUser } from 'react-icons/fi';

interface Student {
    user_uid: string;
    score: string;
    name: string;
    email: string;
    course_title: string;
    certificate_url?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const YEAR_OPTIONS = ["2024 - 2025", "2025 - 2026", "2026 - 2027", "2027 - 2028"];
const DURATION_OPTIONS = ["Two Months", "Three Months", "Four Months", "Five Months", "Six Months",];

const CertificateCreation: React.FC = () => {
    const [users, setUsers] = useState<Student[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });
    const [yearSelections, setYearSelections] = useState<{ [key: string]: string }>({});
    const [durationSelections, setDurationSelections] = useState<{ [key: string]: string }>({});
    const [studentIds, setStudentIds] = useState<{ [key: string]: string }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [generating, setGenerating] = useState<{ [key: string]: boolean }>({});
    const [sending, setSending] = useState<{ [key: string]: boolean }>({});
    const [scoreSelections, setScoreSelections] = useState<{ [key: string]: string }>({});

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
                    course_title: item.course_title || '-',
                    certificate_url: item.certificate_url || '',
                }));

                setUsers(mappedUsers);

                const initialYears: { [key: string]: string } = {};
                const initialDurations: { [key: string]: string } = {};
                const initialStudentIds: { [key: string]: string } = {}; const initialScores: { [key: string]: string } = {};
                mappedUsers.forEach(user => {
                    initialScores[user.user_uid] = user.score?.toString() || '';
                });
                setScoreSelections(initialScores);
                mappedUsers.forEach(user => {
                    initialYears[user.user_uid] = YEAR_OPTIONS[0];
                    initialDurations[user.user_uid] = DURATION_OPTIONS[0];
                    initialStudentIds[user.user_uid] = '';
                });
                setYearSelections(initialYears);
                setDurationSelections(initialDurations);
                setStudentIds(initialStudentIds);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleGenerateCertificate = async (uName: string, uid: string) => {
        const studentId = studentIds[uid];
        const selectedScore = scoreSelections[uid];

        if (!studentId || studentId.trim() === "") {
            showToast("Student ID is required before generating the certificate.", "error");
            return;
        }
        // if (!selectedScore || selectedScore.trim() === "") {
        //     showToast("Score is required before generating the certificate.", "error");
        //     return;
        // }
        // console.log(users.find(u => u.user_uid === uid)?.course_title);
        // return;
        setGenerating(prev => ({ ...prev, [uid]: true }));

        const selectedYear = yearSelections[uid];
        const selectedDuration = durationSelections[uid];
        const userEmail = users.find(u => u.user_uid === uid)?.email || '';

        try {
            const res = await axios.post(`${API_URL}/api/generateCertificate`, {
                name: uName,
                courseTitle: users.find(u => u.user_uid === uid)?.course_title || '',
                academicYear: selectedYear,
                duration: selectedDuration,
                studentId,
                userUid: uid,
                email: userEmail,
                score: selectedScore, // ✅ added
            });

            if (res.data.message === "Certificate already generated.") {
                showToast(res.data.message, 'error');
            }

            const updatedUsers = users.map(u =>
                u.user_uid === uid ? { ...u, certificate_url: res.data.url } : u
            );

            setUsers(updatedUsers);
            showToast(`Certificate generated for ${uName}`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to generate certificate', 'error');
        } finally {
            setGenerating(prev => ({ ...prev, [uid]: false }));
        }
    };


    const handleSendCertificateMail = async (uName: string, uid: string) => {
        setSending(prev => ({ ...prev, [uid]: true }));
        try {
            const response = await axios.post(`${API_URL}/api/send-certificate`, {
                user_uid: uid,
            });

            if (response.data && response.data.success) {
                showToast(`Certificate sent to ${uName}`, 'success');
            } else {
                console.error('Unexpected response:', response.data);
                showToast(response.data.message || 'Failed to send certificate', 'error');
            }
        } catch (err: any) {
            if (err.response) {
                console.error('API Error:', err.response.data);
                showToast(err.response.data?.error || 'Server error while sending certificate', 'error');
            } else if (err.request) {
                console.error('No response received:', err.request);
                showToast('No response from server. Please try again.', 'error');
            } else {
                console.error('Request setup error:', err.message);
                showToast('Error setting up the request', 'error');
            }
        } finally {
            setSending(prev => ({ ...prev, [uid]: false }));
        }
    };




    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <div className="p-6 max-w-8xl dark:text-white bg-white dark:bg-gray-800 rounded shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">User Certificate Generator</h2>

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
                    <table className="w-full border border-gray-300 text-sm text-left overflow-auto">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                            <tr>
                                <th className="p-2 border">Student UID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Email</th>
                                <th className="p-2 border">Course Purchased</th>
                                <th className="p-2 border">Student ID</th>
                                <th className="p-2 border" style={{ width: "150px" }}>Score</th>
                                <th className="p-2 border">PDF Preview</th>
                                <th className="p-2 border">Academic Year</th>
                                <th className="p-2 border">Duration</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedUsers.map((user, index) => (
                                <tr key={`${user.user_uid}-${index}`}>
                                    <td className="p-2 border">{user.user_uid}</td>
                                    <td className="p-2 border">{user.name}</td>
                                    <td className="p-2 border">{user.email}</td>
                                    <td className="p-2 border">{user.course_title || '-'}</td>
                                    <td className="p-2 border">
                                        <input
                                            type="text"
                                            value={studentIds[user.user_uid] || ''}
                                            onChange={(e) =>
                                                setStudentIds(prev => ({
                                                    ...prev,
                                                    [user.user_uid]: e.target.value,
                                                }))
                                            }
                                            className={`border px-2 py-1 rounded w-32 ${!studentIds[user.user_uid] ? 'border-red-500' : ''
                                                }`}
                                            placeholder="Enter ID"
                                            required
                                        />

                                    </td> <td className="p-2 border" style={{ width: "150px" }}>
                                        <input
                                            type="text"
                                            value={scoreSelections[user.user_uid] || ''}
                                            onChange={(e) =>
                                                setScoreSelections(prev => ({
                                                    ...prev,
                                                    [user.user_uid]: e.target.value,
                                                }))
                                            }
                                            className={`border w-32 px-2 py-1 rounded ${!scoreSelections[user.user_uid] ? 'border-red-500' : ''}`}
                                            placeholder="Enter Score"
                                            // required
                                        />
                                    </td>
                                    <td className="p-2 border">
                                        {user.certificate_url ? (
                                            <a
                                                href={`${API_URL}/certificates/generated/${user.certificate_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                View PDF
                                            </a>

                                        ) : 'Not Generated'}
                                    </td>
                                    <td className="p-2 border">
                                        <select
                                            value={yearSelections[user.user_uid]}
                                            onChange={(e) =>
                                                setYearSelections((prev) => ({
                                                    ...prev,
                                                    [user.user_uid]: e.target.value,
                                                }))
                                            }
                                            className="border rounded px-2 py-1"
                                        >
                                            {YEAR_OPTIONS.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border">
                                        <select
                                            value={durationSelections[user.user_uid]}
                                            onChange={(e) =>
                                                setDurationSelections((prev) => ({
                                                    ...prev,
                                                    [user.user_uid]: e.target.value,
                                                }))
                                            }
                                            className="border rounded px-2 py-1"
                                        >
                                            {DURATION_OPTIONS.map((duration) => (
                                                <option key={duration} value={duration}>{duration}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 border">
                                        <button
                                            onClick={() => handleGenerateCertificate(user.name, user.user_uid)}
                                            disabled={generating[user.user_uid]}
                                            className={`px-3 py-1 rounded m-2 text-white ${generating[user.user_uid]
                                                ? 'bg-indigo-400 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-900'}`}
                                        >
                                            {generating[user.user_uid] ? 'Generating...' : 'Generate Certificate'}
                                        </button>
                                        <button
                                            onClick={() => handleSendCertificateMail(user.name, user.user_uid)}
                                            disabled={sending[user.user_uid]}
                                            className={`px-3 py-1 rounded text-white ${sending[user.user_uid]
                                                ? 'bg-green-400 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-900'}`}
                                        >
                                            {sending[user.user_uid] ? 'Sending...' : 'Send Mail'}
                                        </button>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

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

export default CertificateCreation;
