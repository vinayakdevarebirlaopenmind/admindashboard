import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  FiCopy,
  FiCheck,
  FiLink,
  FiMic,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import { API_URL } from "../../utils/api_url";
import { formatReadableDate } from "../../utils/formatDate";

interface Course {
  id: number;
  title: string;
}
interface ZoomMeetingResponse {
  zoom_link: string;
  meeting_id: string;
  password: string;
  start_url: string;
}
interface User {
  id: number;
  name: string;
  email: string;
  status: "success" | "pending";
  course_purchased_date?: string;
  amount_paid?: number;
  pending_emi?: number;
  isSelected?: boolean;
}

interface Meeting {
  course: string;
  title: string;
  dateTime: string;
  participants: number;
  status: "published" | "scheduled" | "completed";
  batch?: string;
  meetingId?: string;
  password?: string;
}
// interface MeetingDetails {
//   title: string;
//   dateTime: string;
//   duration: string;
//   timeZone: string;
//   instructorName: string; // Add this line
// }
const ZoomAdminPanel: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [batch, setBatch] = useState<string>("");
  const [isLoading, setIsLoading] = useState({
    courses: false,
    users: false,
    generating: false,
    publishing: false,
  });
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    dateTime: "",
    duration: "",
    timeZone: "India (GMT+5:30)",
    instructorName: "", // Add this line
  });
  const [meetingInfo, setMeetingInfo] = useState({
    zoom_link: "",
    meeting_id: "",
    password: "",
    start_url: "",
  });
  const [showZoomLink, setShowZoomLink] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading((prev) => ({ ...prev, courses: true }));
      try {
        // Replace mock API call with real API call
        const response = await axios.get(`${API_URL}/api/getAllCourses`);

        // Assuming your API returns an array of courses with { id, title } structure
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        showToast("Failed to load courses", "error");
      } finally {
        setIsLoading((prev) => ({ ...prev, courses: false }));
      }
    };

    loadCourses();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const formattedDate = tomorrow.toISOString().slice(0, 16);
    setMeetingDetails((prev) => ({ ...prev, dateTime: formattedDate }));
  }, []);
  useEffect(() => {
    if (selectedCourse) {
      const loadUsers = async () => {
        setIsLoading((prev) => ({ ...prev, users: true }));
        setSelectedUsers([]);
        try {
          const response = await axios.get(
            `${API_URL}/api/studentInfoBycourse/${selectedCourse}`
          );
          const students = response.data.map((student: any) => ({
            id: student.user_table_id,
            name: student.user_name,
            email: student.email,
            amount_paid: student.amount_received,
            course_purchased_date: formatReadableDate(student.updated_at),
            status: student.status === "success" ? "paid" : "pending",
            pending_emi: student.pending_amount,
          }));

          setUsers(students);
        } catch (error) {
          console.error("Error fetching students:", error);
          showToast("Failed to load student data", "error");
        } finally {
          setIsLoading((prev) => ({ ...prev, users: false }));
        }
      };

      loadUsers();
    }
  }, [selectedCourse]);

  const handleUserSelect = (userId: number, isChecked: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, isSelected: isChecked } : user
      )
    );
    setSelectedUsers((prev) =>
      isChecked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };
  const toggleAllUsers = (selectAll: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => ({ ...user, isSelected: selectAll }))
    );
    setSelectedUsers(selectAll ? users.map((user) => user.id) : []);
  };
  const generateZoomLink = async () => {
    if (!meetingDetails.title || !meetingDetails.dateTime) {
      showToast("Please fill in meeting title and date/time", "error");
      return;
    }

    if (!batch) {
      showToast("Please select a batch", "error");
      return;
    }

    if (selectedUsers.length === 0) {
      showToast("Please select at least one participant", "error");
      return;
    }

    const meetingDate = new Date(meetingDetails.dateTime);
    if (meetingDate < new Date()) {
      showToast("Meeting time must be in the future", "error");
      return;
    }

    setIsLoading((prev) => ({ ...prev, generating: true }));

    try {
      const courseName = courses.find(
        (course) => course.id === selectedCourse
      )?.title;
      const participants = selectedUsers.map((userId) => {
        const user = users.find((user) => user.id === userId);
        return { email: user?.email || "" };
      });

      const response = await axios.post<ZoomMeetingResponse>(
        `${API_URL}/api/generate-zoom-link`,
        {
          meeting_title: meetingDetails.title,
          date_time: meetingDetails.dateTime,
          duration: meetingDetails.duration,
          time_zone: meetingDetails.timeZone,
          course_name: courseName,
          batch_no: batch,
          instructor_name: meetingDetails.instructorName, // Add this line
          course_participants_email: participants.map((p) => p.email).join(","),
        }
      );

      setMeetingInfo({
        zoom_link: response.data.zoom_link,
        meeting_id: response.data.meeting_id,
        password: response.data.password,
        start_url: response.data.start_url,
      });

      setShowZoomLink(true);
      showToast("Zoom link generated successfully!");
    } catch (error: any) {
      console.error("Zoom link generation error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        "Failed to generate Zoom link";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading((prev) => ({ ...prev, generating: false }));
    }
  };
  const publishMeeting = async () => {
    if (!batch) {
      showToast("Please select a batch", "error");
      return;
    }

    if (!meetingInfo.zoom_link) {
      showToast("Please generate a Zoom link first", "error");
      return;
    }

    setIsLoading((prev) => ({ ...prev, publishing: true }));

    try {
      const courseTitle =
        courses.find((c) => c.id === selectedCourse)?.title || "Unknown Course";
      const participants = selectedUsers.map((userId) => {
        const user = users.find((user) => user.id === userId);
        return {
          name: user?.name || "",
          email: user?.email || "",
        };
      });

      const meetingData = {
        course_name: courseTitle,
        course_id: selectedCourse,
        batch_no: batch,
        course_participants: participants,
        meeting_title: meetingDetails.title,
        date_time: meetingDetails.dateTime,
        duration: meetingDetails.duration,
        time_zone: meetingDetails.timeZone,
        instructor_name: meetingDetails.instructorName, // Add this line
        zoom_meeting_details: {
          join_url: meetingInfo.zoom_link,
          meeting_id: meetingInfo.meeting_id,
          password: meetingInfo.password,
          start_url: meetingInfo.start_url,
        },
      };

      const response = await axios.post(
        `${API_URL}/api/publish-meeting`,
        meetingData
      );

      // Update local state
      const newMeeting: Meeting = {
        course: courseTitle,
        title: meetingDetails.title,
        dateTime: new Date(meetingDetails.dateTime).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        participants: selectedUsers.length,
        status: "published",
        batch: batch,
        meetingId: meetingInfo.meeting_id,
        password: meetingInfo.password,
      };
      console.log(response, newMeeting);

      showToast(
        "Meeting published successfully! Notifications sent to participants."
      );

      // Reset form
      setSelectedCourse(null);
      setBatch("");
      setUsers([]);
      setSelectedUsers([]);
      setMeetingDetails({
        title: "",
        dateTime: "",
        duration: "",
        timeZone: "India (GMT+5:30)",
        instructorName: "", // Add this line
      });
      setMeetingInfo({
        zoom_link: "",
        meeting_id: "",
        password: "",
        start_url: "",
      });
      setShowZoomLink(false);
    } catch (error: any) {
      console.error("Error publishing meeting:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to publish meeting";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading((prev) => ({ ...prev, publishing: false }));
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };
  return (
    <div className="min-h-screen  bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-xl font-bold text-gray-800 mb-2  dark:text-white">
            Zoom Meeting Setup Guide
          </h2>
          <ul className="list-decimal list-inside space-y-1 text-gray-700  dark:text-white">
            <li className="flex items-start ">
              <span className="mr-2 font-medium "> Select Course & Batch:</span>
              <span>Choose from dropdown menus below</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-medium">Configure Meeting:</span>
              <span>Set title, date/time, duration and timezone</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-medium">Generate & Publish:</span>
              <span>Create Zoom link and notify participants</span>
            </li>
            <div className="mt-4 text-yellow-800 bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded">
              ⚠️ <span className="font-semibold">Note:</span> You can create up
              to <span className="font-bold">50 meetings per day</span>. This
              limit resets every 24 hours at{" "}
              <span className="font-semibold">00:00 UTC</span>.
            </div>
          </ul>
        </div>
        <div className="bg-white dark:text-white bg-white/[ dark:bg-white/[0.03] rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 dark:text-white">
            Zoom Meeting Configuration
          </h2>
          <div className="mb-6">
            <label
              htmlFor="courseSelect"
              className="block text-lg font-medium dark:text-white text-gray-700 mb-2"
            >
              Select Course
            </label>
            <div className="relative">
              <select
                id="courseSelect"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={selectedCourse || ""}
                onChange={(e) => setSelectedCourse(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select a course
                </option>
                {courses.map((course) => (
                  <option
                    key={course.id}
                    className="dark:text-black"
                    value={course.id}
                  >
                    {course.title}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <FiChevronDown className="h-5 w-5" />
              </div>
            </div>
            {isLoading.courses && (
              <div className="mt-2 flex items-center text-sm text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                Loading courses...
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="batchSelect"
              className="block dark:text-white text-lg font-medium text-gray-700 mb-2"
            >
              Select Batch
            </label>
            <div className="relative">
              <select
                id="batchSelect"
                className="block w-full px-4 py-3 dark:text-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              >
                <option value="" className="dark:text-black">
                  Select a Batch
                </option>
                <option value="1" className="dark:text-black">
                  Batch 1
                </option>
                <option value="2" className="dark:text-black">
                  Batch 2
                </option>
                <option value="3" className="dark:text-black">
                  Batch 3
                </option>
                <option value="4" className="dark:text-black">
                  Batch 4
                </option>
                <option value="5" className="dark:text-black">
                  Batch 5
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <FiChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
          {selectedCourse && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 dark:text-white'">
                <h3 className="text-lg font-medium dark:text-white'">
                  Course Participants
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleAllUsers(true)}
                    className="text-sm dark:text-white border border-gray-400 p-2 rounded-md hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleAllUsers(false)}
                    className="text-sm dark:text-white border border-gray-400 p-2 rounded-md hover:text-indigo-800"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className=" rounded-lg border border-gray-200 p-4 max-h-64 overflow-auto ">
                {isLoading.users ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No users have purchased this course yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center font-semibold text-gray-700 border-b pb-2 dark:text-white text-sm">
                      <div className="w-6"></div> {/* Checkbox space */}
                      <div className="w-1/3">Name (Email)</div>
                      <div className="w-1/4">Purchased Date</div>
                     {/* <div className="w-1/4">Amount Paid</div> */}
                    </div>

                    {/* Data Rows */}
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-start text-sm text-gray-700 dark:text-white border-b pb-2"
                      >
                        {/* Checkbox */}
                        <div className="w-6">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) =>
                              handleUserSelect(user.id, e.target.checked)
                            }
                          />
                        </div>

                        {/* Name & Email */}
                        <label
                          htmlFor={`user-${user.id}`}
                          className="w-1/3 truncate cursor-pointer"
                        >
                          {user.name} ({user.email})
                        </label>

                        {/* Purchase Date */}
                        <span className="w-1/4 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium text-center">
                          {user.course_purchased_date}
                        </span>

                        {/* Amount Paid */}
                        {/* <span className="w-1/4 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold text-center">
                          ₹{user.amount_paid}
                        </span> */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedCourse && (
            <div className="mb-6 ">
              <h3 className="text-lg  dark:text-white font-medium text-gray-800 mb-3">
                Meeting Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="meetingTitle"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
                  >
                    Module Title
                  </label>
                  <input
                    type="text"
                    id="meetingTitle"
                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter Module title"
                    value={meetingDetails.title}
                    onChange={(e) =>
                      setMeetingDetails({
                        ...meetingDetails,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="meetingDateTime"
                    className="block  dark:text-white text-sm font-medium text-gray-700 mb-1"
                  >
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="meetingDateTime"
                    className="block dark:text-white w-full px-4 py-2 rounded-lg border  border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={meetingDetails.dateTime}
                    onChange={(e) =>
                      setMeetingDetails({
                        ...meetingDetails,
                        dateTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="meetingDuration"
                    className="block text-sm font-medium dark:text-white text-gray-700 mb-1"
                  >
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="meetingDuration"
                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={meetingDetails.duration}
                    min="15"
                    max="240"
                    onChange={(e) =>
                      setMeetingDetails({
                        ...meetingDetails,
                        duration: String(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="timeZone"
                    className="block text-sm dark:text-white font-medium text-gray-700 mb-1"
                  >
                    Time Zone
                  </label>
                  <select
                    id="timeZone"
                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={meetingDetails.timeZone}
                    onChange={(e) =>
                      setMeetingDetails({
                        ...meetingDetails,
                        timeZone: e.target.value,
                      })
                    }
                  >
                    <option value="India">India (GMT+5:30)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="instructorName"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
                  >
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    id="instructorName"
                    className="block w-full px-4 py-2 rounded-lg border border-gray-300 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter instructor name"
                    value={meetingDetails.instructorName}
                    onChange={(e) =>
                      setMeetingDetails({
                        ...meetingDetails,
                        instructorName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {showZoomLink && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FiMic className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-blue-800">
                    Meeting Details
                  </h4>

                  <div className="mt-3 space-y-2 text-blue-800">
                    <div className="flex items-center">
                      <span className="w-24 font-medium text-blue-800">
                        Link:
                      </span>
                      <div className="flex-1 flex items-center">
                        <input
                          type="text"
                          className="block w-full text-blue-800 px-3 py-2 text-sm bg-white border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          readOnly
                          value={meetingInfo.zoom_link}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              meetingInfo.zoom_link
                            );
                            showToast("Meeting link copied!");
                          }}
                          className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                          title="Copy link"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-medium">Meeting ID:</span>
                      <div className="flex-1 flex items-center">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          readOnly
                          value={meetingInfo.meeting_id}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              meetingInfo.meeting_id
                            );
                            showToast("Meeting ID copied!");
                          }}
                          className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                          title="Copy ID"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-medium">Passcode:</span>
                      <div className="flex-1 flex items-center">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          readOnly
                          value={meetingInfo.password}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(meetingInfo.password);
                            showToast("Passcode copied!");
                          }}
                          className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                          title="Copy passcode"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 font-medium">Host Link:</span>
                      <div className="flex-1 flex items-center">
                        <input
                          type="text"
                          className="block w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          readOnly
                          value={meetingInfo.start_url}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              meetingInfo.start_url
                            );
                            showToast("Host link copied!");
                          }}
                          className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                          title="Copy host link"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={generateZoomLink}
              disabled={isLoading.generating}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading.generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FiLink className="h-5 w-5 mr-2" />
                  Generate Zoom Link
                </>
              )}
            </button>
            <button
              onClick={publishMeeting}
              disabled={!showZoomLink || isLoading.publishing}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading.publishing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <FiMic className="h-5 w-5 mr-2" />
                  Publish Meeting
                </>
              )}
            </button>
          </div>
        </div>
      </main>
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg flex items-center transform transition-all duration-300 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {toast.type === "success" ? (
            <FiCheck className="h-5 w-5 mr-2" />
          ) : (
            <FiUser className="h-5 w-5 mr-2" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ZoomAdminPanel;
