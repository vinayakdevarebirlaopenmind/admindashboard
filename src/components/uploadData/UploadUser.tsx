import axios from 'axios';
import React, { useState } from 'react';
import { API_URL } from '../../utils/api_url';

function UploadUser() {
    const [userFile, setUserFile] = useState<File | null>(null);
    const [orderFile, setOrderFile] = useState<File | null>(null);

    const handleUserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setUserFile(file);
        } else {
            alert('Please upload a valid CSV for user data.');
            setUserFile(null);
        }
    };

    const handleOrderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setOrderFile(file);
        } else {
            alert('Please upload a valid CSV for order data.');
            setOrderFile(null);
        }
    };

    const handleUpload = async (e: React.FormEvent, type: 'user' | 'order') => {
        e.preventDefault();
        const fileToUpload = type === 'user' ? userFile : orderFile;

        if (!fileToUpload) return;

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', type); // Optional if backend uses same route

        try {
            const response = await axios.post(`${API_URL}/api/upload-users-orders`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                alert(`${type === 'user' ? 'User' : 'Order'} file uploaded successfully!`);
                if (type === 'user') setUserFile(null);
                else setOrderFile(null);
            } else {
                alert(`Upload failed: ${response.data.error}`);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('An error occurred during upload.');
        }
    };


    return (
        <div className="max-w-2xl p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-8">

            {/* User Upload Section */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">1. Users Data Upload</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Required Columns: <span className="font-medium text-gray-800 dark:text-white">email, name, mobile_no, phone, city, state</span>
                </p>

                <form onSubmit={(e) => handleUpload(e, 'user')} className="space-y-3">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleUserFileChange}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {userFile && <p className="text-green-600 dark:text-green-400 text-sm">Selected: {userFile.name}</p>}
                    <button
                        type="submit"
                        disabled={!userFile}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Upload User CSV
                    </button>
                </form>
            </div>

            {/* Order Upload Section */}
            <div className="space-y-3 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">2. Orders Data Upload</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Required Columns:{' '}
                    <span className="font-medium text-gray-800 dark:text-white">
                        email, program_id, amount_received, total_amount, purchased_date (format: <code>YYYY-MM-DD HH:mm:ss</code>)
                    </span>
                </p>

                <form onSubmit={(e) => handleUpload(e, 'order')} className="space-y-3">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleOrderFileChange}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {orderFile && <p className="text-green-600 dark:text-green-400 text-sm">Selected: {orderFile.name}</p>}
                    <button
                        type="submit"
                        disabled={!orderFile}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Upload Order CSV
                    </button>
                </form>
            </div>
        </div>
    );
}

export default UploadUser;
