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
    zoom_start_time?: string; // Added for merged Zoom data
};

function AllMeeting() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<Participant[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedZoomLink, setCopiedZoomLink] = useState<string | null>(null);
    const [copiedHostLink, setCopiedHostLink] = useState<string | null>(null);
    // const [uploadingRow, setUploadingRow] = useState<number | null>(null);
    // const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
    // const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: string[] }>({});

    // const handleFileUpload = (files: FileList | null, rowIndex: number) => {
    //     if (!files) return;
    //     setUploadingRow(rowIndex);
    //     setUploadProgress(prev => ({ ...prev, [rowIndex]: 0 }));
    //     const fileNames = Array.from(files).map(file => file.name);
    //     let progress = 0;
    //     const interval = setInterval(() => {
    //         progress += 20;
    //         setUploadProgress(prev => ({ ...prev, [rowIndex]: progress }));

    //         if (progress >= 100) {
    //             clearInterval(interval);
    //             setUploadedFiles(prev => ({
    //                 ...prev,
    //                 [rowIndex]: [...(prev[rowIndex] || []), ...fileNames],
    //             }));
    //             setUploadingRow(null);
    //         }
    //     }, 300);
    // };
    // Function to handle copy and set state
    const handleCopy = (text: string, type: "zoom" | "host") => {
        navigator.clipboard.writeText(text);
        if (type === "zoom") {
            setCopiedZoomLink(text);
            setTimeout(() => setCopiedZoomLink(null), 2000);
        } else {
            setCopiedHostLink(text);
            setTimeout(() => setCopiedHostLink(null), 2000);
        }
    };
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

                // Now fetch Zoom meeting details for timings
                const meetingIds = fetchedMeetings.map(m => m.zoomlink?.split('/').pop()).filter(Boolean);
                if (meetingIds.length > 0) {
                    const zoomResponse = await axios.post(`${API_URL}/api/fetch-zoommeeting-by-meetingid`, {
                        meeting_ids: meetingIds,
                    });

                    const zoomMap = new Map();
                    zoomResponse.data.meetings.forEach((z: any) => {
                        if (z.success) zoomMap.set(String(z.meeting_id), z.data);
                    });

                    // Merge Zoom start_time & timezone into meeting object
                    const merged = fetchedMeetings.map(meeting => {
                        const meetingId = meeting.zoomlink?.split('/').pop();
                        const zoomData = zoomMap.get(meetingId);
                        return zoomData
                            ? {
                                ...meeting,
                                zoom_start_time: zoomData.start_time,
                                zoom_timezone: zoomData.timezone,
                            }
                            : meeting;
                    });

                    setMeetings(merged);
                    setFilteredMeetings(merged);
                }

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
                <div className="overflow-auto border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                {[
                                    "Title",
                                    "Course",
                                    "Batch No.",
                                    "Date & Time",
                                    "Duration",
                                    "Zoom Link (Student)",
                                    "Host Link (Trainer)",
                                    "Participants",
                                    // "Upload Attachments",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-100 whitespace-nowrap"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                            {filteredMeetings.map((meeting, index) => (
                                <tr
                                    key={index}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">{meeting.meeting_title}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{meeting.course_name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{meeting.batch_number}</td>
                                    {/* <td className="px-4 py-3 whitespace-nowrap">
                                        {(formatReadableDate(meeting.date_time))}
                                    </td> */}<td className="px-4 py-3 whitespace-nowrap">
                                        {meeting.zoom_start_time
                                            ? formatReadableDate(meeting.zoom_start_time)
                                            : formatReadableDate(meeting.date_time)}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">{meeting.duration} min</td>

                                    <td className="px-4 py-3 whitespace-nowrap flex flex-col gap-1">
                                        <a
                                            href={meeting.zoomlink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline dark:text-blue-300"
                                        >
                                            Share with Students
                                        </a>
                                        <button
                                            onClick={() => handleCopy(meeting.zoomlink, "zoom")}
                                            className={`text-xs ${copiedZoomLink === meeting.zoomlink
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-gray-600 dark:text-gray-300"
                                                } hover:text-black dark:hover:text-white border border-gray-300 dark:border-gray-600 px-2 py-1 rounded`}
                                        >
                                            {copiedZoomLink === meeting.zoomlink ? "Copied" : "Copy"}
                                        </button>
                                    </td>


                                    <td className="px-4 py-3 align-middle whitespace-nowrap">                                        {meeting.host_link ? (
                                        <>
                                            <a
                                                href={meeting.host_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline dark:text-blue-300"
                                            >
                                                Start as Trainer
                                            </a>
                                            <button
                                                onClick={() => handleCopy(meeting.host_link, "host")}
                                                className={`text-xs ${copiedHostLink === meeting.host_link
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-gray-600 dark:text-gray-300"
                                                    } hover:text-black dark:hover:text-white border border-gray-300 dark:border-gray-600 px-2 py-1 rounded`}
                                            >
                                                {copiedHostLink === meeting.host_link ? "Copied" : "Copy"}
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400">No link</span>
                                    )}
                                    </td>


                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {Array.isArray(meeting.course_participants) &&
                                            meeting.course_participants.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span>{meeting.course_participants.length} participant(s)</span>
                                                <button
                                                    onClick={() =>
                                                        setSelectedParticipants(meeting.course_participants as Participant[])
                                                    }
                                                    className="text-blue-600 dark:text-emerald-300 hover:underline"
                                                    title="View participants"
                                                >
                                                    <AiOutlineInfoCircle />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-400">No participants</span>
                                        )}
                                    </td> 
                                    {/* <td className="px-4 py-3 whitespace-nowrap">
                                        {uploadingRow === index ? (
                                            <div className="flex items-center gap-2">
                                                <AiOutlineLoading3Quarters className="animate-spin text-blue-500" />
                                                <span>{uploadProgress[index] || 0}%</span>
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => handleFileUpload(e.target.files, index)}
                                                    className="block text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                {uploadedFiles[index] && uploadedFiles[index].length > 0 && (
                                                    <ul className="mt-2 text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
                                                        {uploadedFiles[index].map((file, i) => (
                                                            <li key={i}>{file}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </>
                                        )}
                                    </td> */}
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
