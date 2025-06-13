import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/api_url';
import { formatReadableDate } from '../../utils/formatDate';
import { AiOutlineInfoCircle } from "react-icons/ai";

type Participant = {
    id?: number;
    name: string;
    email?: string;
};

type Meeting = {
    meeting_title: string;
    course_name: string;
    batch_number: string | number;
    date_time: string;
    duration: number;
    zoomlink: string;
    host_link: string;
    course_participants: Participant[] | string;
};

function AllMeeting() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<Participant[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        title: '',
        course: '',
        batch: '',
        date: ''
    });

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/all-meetings`);
                const fetchedMeetings: Meeting[] = response.data.data.map((meeting: any) => ({
                    ...meeting,
                    course_participants: typeof meeting.course_participants === 'string'
                        ? JSON.parse(meeting.course_participants)
                        : meeting.course_participants,
                }));

                setMeetings(fetchedMeetings);
                setFilteredMeetings(fetchedMeetings);
            } catch (err) {
                console.error('Error fetching meetings:', err);
                setError('Failed to load meeting data.');
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, []);

    useEffect(() => {
        const { title, course, batch, date } = filters;
        const filtered = meetings.filter(meeting =>
            meeting.meeting_title.toLowerCase().includes(title.toLowerCase()) &&
            meeting.course_name.toLowerCase().includes(course.toLowerCase()) &&
            String(meeting.batch_number).toLowerCase().includes(batch.toLowerCase()) &&
            formatReadableDate(meeting.date_time).toLowerCase().includes(date.toLowerCase())
        );
        setFilteredMeetings(filtered);
    }, [filters, meetings]);

    if (loading) return <div>Loading meetings...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-4">
            <div className="mb-8 p-4 bg-blue-50  dark:bg-gray-800  rounded-lg border-l-4 border-blue-500 shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-2 dark:text-white">Page Summary: How to Use the All Meetings Panel</h2>
                <p className="text-gray-700 mb-4 dark:text-white">
                    This page provides a complete overview of all Zoom meetings scheduled across various courses and batches. Use it to quickly view, filter, and manage meeting data.
                </p>
                <h3 className="text-lg font-semibold text-gray-800 mb-1 dark:text-white">How to Use:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 dark:text-white">
                    <li>
                        <span className="font-medium">Search & Filter:</span> Use the input fields to filter meetings by Title, Course, Batch, or Date.
                    </li>
                    <li>
                        <span className="font-medium">View Meeting Info:</span> Check the table below to see details like title, course, date/time, and duration.
                    </li>
                    <li>
                        <span className="font-medium">Zoom Links:</span>
                        <ul className="list-disc list-inside ml-4">
                            <li><span className="font-medium">Share Meeting:</span> Use the student Zoom link (join URL) to invite participants.</li>
                            <li><span className="font-medium">Join Meeting:</span> Use the trainer Zoom link (start URL) to begin the meeting as host.</li>
                        </ul>
                    </li>
                    <li>
                        <span className="font-medium">See Participants:</span> Click the info icon beside the participant count to view the list of enrolled participants.
                    </li>
                </ul>

            </div>

            <h2 className="text-xl font-semibold mb-4 dark:text-white">All Meetings</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 dark:text-white">
                <input
                    type="text"
                    placeholder="Filter by title"
                    value={filters.title}
                    onChange={e => setFilters({ ...filters, title: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Filter by course"
                    value={filters.course}
                    onChange={e => setFilters({ ...filters, course: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Filter by batch"
                    value={filters.batch}
                    onChange={e => setFilters({ ...filters, batch: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Filter by date"
                    value={filters.date}
                    onChange={e => setFilters({ ...filters, date: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                />
            </div>

            {filteredMeetings.length === 0 ? (
                <div className='dark:text-white'>No meetings match the filters.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Title</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Course</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Batch No.</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Duration</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Zoom Link (student)</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Host Link (Trainer)</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Participants</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:text-white">
                            {filteredMeetings.map((meeting, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2">{meeting.meeting_title}</td>
                                    <td className="px-4 py-2">{meeting.course_name}</td>
                                    <td className="px-4 py-2">{meeting.batch_number}</td>
                                    <td className="px-4 py-2">{formatReadableDate(meeting.date_time)}</td>
                                    <td className="px-4 py-2">{meeting.duration} min</td>
                                    <td className="px-4 py-2 flex items-center space-x-2">
                                        <a
                                            href={meeting.zoomlink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline dark:text-amber-600"
                                        >
                                            Share Meeting
                                        </a>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(meeting.zoomlink)}
                                            className="text-sm text-gray-600 hover:text-black dark:hover:text-white border border-gray-300 px-2 py-1 rounded"
                                        >
                                            Copy
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 flex items-center space-x-2">
                                        {meeting.host_link ? (
                                            <>
                                                <a
                                                    href={meeting.host_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline dark:text-amber-600"
                                                >
                                                    Join Meeting
                                                </a>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(meeting.host_link)}
                                                    className="text-sm text-gray-600 hover:text-black dark:hover:text-white border border-gray-300 px-2 py-1 rounded"
                                                >
                                                    Copy
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-gray-500">No link</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 relative">
                                        {Array.isArray(meeting.course_participants) && meeting.course_participants.length > 0 ? (
                                            <div className="flex items-center space-x-2">
                                                <span>{meeting.course_participants.length} participant(s)</span>
                                                <button
                                                    onClick={() => setSelectedParticipants(meeting.course_participants as Participant[])}
                                                    className="text-blue-600 dark:text-emerald-200"
                                                >
                                                    <AiOutlineInfoCircle />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">No participants</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {selectedParticipants && (
                <div className="fixed inset-0 flex justify-center items-center">
                    <div className="rounded-lg shadow-lg bg-[#ecfccb] max-w-md w-full p-4 relative">
                        <h3 className="text-lg font-semibold mb-2">Participants</h3>
                        <ul className="list-disc list-inside max-h-60 overflow-y-auto text-sm">
                            {selectedParticipants.map((p, i) => (
                                <li key={i}>
                                    {p.name}
                                    {p.email ? ` (${p.email})` : ''}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setSelectedParticipants(null)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AllMeeting;
