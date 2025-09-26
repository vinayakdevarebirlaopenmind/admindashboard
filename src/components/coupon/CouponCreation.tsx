import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../utils/api_url";

interface CouponData {
    code: string;
    discount_value: string;
    uses_per_coupon: string;
    is_active?: boolean;
}

const CouponGenerator = () => {
    const [couponCount, setCouponCount] = useState(1);
    const [coupons, setCoupons] = useState<CouponData[]>([]);
    const [savedDefaults, setSavedDefaults] = useState<{ discount_value: string; uses_per_coupon: string }>({
        discount_value: "",
        uses_per_coupon: "",
    });
    const [defaultAmount, setDefaultAmount] = useState("");
    const [defaultLimit, setDefaultLimit] = useState("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [existingCoupons, setExistingCoupons] = useState<CouponData[]>([]);

    // Fetch existing coupons from API
    const fetchExistingCoupons = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/coupons/getCoupons`);
            const couponsArray = Array.isArray(res.data) ? res.data : res.data.data || [];
            setExistingCoupons(couponsArray);
            console.log("Fetched coupons:", couponsArray);
        } catch (err) {
            console.error("Failed to fetch existing coupons:", err);
        }
    };




    // Generate new coupons
    const generateCoupons = () => {
        if (couponCount <= 0) return;

        setLoading(true);
        setProgress(0);
        setCoupons([]);

        const batchSize = 1000;
        let generated: CouponData[] = [];
        let processed = 0;

        const generateBatch = () => {
            const limit = Math.min(processed + batchSize, couponCount);
            for (let i = processed; i < limit; i++) {
                const randomNumber = Math.floor(1000 + Math.random() * 9000);
                generated.push({
                    code: `learnleap${randomNumber}`,
                    discount_value: savedDefaults.discount_value || "",
                    uses_per_coupon: savedDefaults.uses_per_coupon || "",
                });
            }
            processed = limit;
            setProgress(Math.round((processed / couponCount) * 100));

            if (processed < couponCount) {
                setTimeout(generateBatch, 0);
            } else {
                setCoupons(generated);
                setLoading(false);
            }
        };

        generateBatch();
    };

    // Save default values
    const saveDefaults = () => {
        if (!defaultAmount && !defaultLimit) {
            alert("Enter default amount or limit first!");
            return;
        }
        setSavedDefaults({ discount_value: defaultAmount, uses_per_coupon: defaultLimit });

        const updated = coupons.map((c) => ({
            ...c,
            discount_value: defaultAmount || c.discount_value,
            uses_per_coupon: defaultLimit || c.uses_per_coupon,
        }));
        setCoupons(updated);
        alert("Default values saved. They will apply to all new coupons too!");
    };

    // Handle coupon input change
    const handleChange = (index: number, field: keyof CouponData, value: string) => {
        const updated = [...coupons];
        (updated[index] as any)[field] = value;
        setCoupons(updated);
    };

    // Create single coupon
    const createSingleCoupon = async (coupon: CouponData) => {
        await axios.post(`${API_URL}/api/coupons/createCoupon`, {
            code: coupon.code,
            discount_value: coupon.discount_value,
            uses_per_coupon: coupon.uses_per_coupon,
            created_by: 1,
            is_active: true,
        });
    };

    // Bulk create coupons
    const createBulkCoupons = async (coupons: CouponData[]) => {
        await axios.post(`${API_URL}/api/coupons/bulkCreateCoupons`, {
            coupons: coupons.map((c) => ({
                code: c.code,
                discount_value: c.discount_value,
                uses_per_coupon: c.uses_per_coupon,
                created_by: 1,
                is_active: true,
            })),
        });
    };

    // Submit generated coupons
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (coupons.length === 0) {
            alert("Please generate coupons first!");
            return;
        }

        try {
            setLoading(true);
            if (coupons.length === 1) {
                await createSingleCoupon(coupons[0]);
            } else {
                await createBulkCoupons(coupons);
            }

            alert("Coupons created successfully!");

            // Reset fields and refresh existing coupons
            setCoupons([]);
            setCouponCount(1);
            setDefaultAmount("");
            setDefaultLimit("");
            fetchExistingCoupons();
        } catch (err) {
            console.error("Error creating coupons:", err);
            alert("Failed to create coupons.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExistingCoupons();
    }, []);
    return (
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Coupon Manager</h2>

            {/* Existing Coupons Table */}


            {/* Number of coupons and generation */}
            <div className="flex gap-4 mb-4 items-end">
                <div className="flex flex-col">
                    <label className="mb-1 font-medium">Number of Coupons</label>
                    <input
                        type="number"
                        min="1"
                        value={couponCount}
                        onChange={(e) => setCouponCount(Number(e.target.value))}
                        className="p-2 border rounded w-40"
                    />
                </div>
                <button
                    type="button"
                    onClick={generateCoupons}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-green-700"
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Generate Coupons"}
                </button>
            </div>

            {/* Loader */}
            {loading && (
                <div className="mb-4">
                    <p>Processing {couponCount} coupons...</p>
                    <div className="w-full bg-gray-200 rounded h-4 mt-2">
                        <div className="bg-blue-600 h-4 rounded" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm mt-1">{progress}%</p>
                </div>
            )}

            {/* Default Values */}
            <div className="flex gap-4 mb-4 items-end">
                <div className="flex flex-col">
                    <label className="mb-1 font-medium">Default Amount</label>
                    <input
                        type="number"
                        placeholder="Default Amount"
                        value={defaultAmount}
                        onChange={(e) => setDefaultAmount(e.target.value)}
                        className="p-2 border rounded w-40"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="mb-1 font-medium">Default Limit</label>
                    <input
                        type="number"
                        placeholder="Default Limit"
                        value={defaultLimit}
                        onChange={(e) => setDefaultLimit(e.target.value)}
                        className="p-2 border rounded w-40"
                    />
                </div>
                <button
                    type="button"
                    onClick={saveDefaults}
                    className="bg-red-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                >
                    Set Default Values
                </button>
            </div>

            {/* Coupons Table */}
            {coupons.length > 0 && !loading && (
                <form onSubmit={handleSubmit}>
                    <div className="overflow-x-auto max-h-96 border rounded">
                        <table className="min-w-full border border-gray-300 text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="border px-3 py-2">Sr. No.</th>
                                    <th className="border px-3 py-2">Coupon Code</th>
                                    <th className="border px-3 py-2">Amount</th>
                                    <th className="border px-3 py-2">Limit Per Coupon</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((c, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="border px-3 py-2 text-center">{i + 1}</td>
                                        <td className="border px-3 py-2">{c.code}</td>
                                        <td className="border px-3 py-2">
                                            <input
                                                type="number"
                                                value={c.discount_value}
                                                onChange={(e) => handleChange(i, "discount_value", e.target.value)}
                                                className="p-2 border rounded w-full"
                                                required
                                            />
                                        </td>
                                        <td className="border px-3 py-2">
                                            <input
                                                type="number"
                                                value={c.uses_per_coupon}
                                                onChange={(e) => handleChange(i, "uses_per_coupon", e.target.value)}
                                                className="p-2 border rounded w-full"
                                                required
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        type="submit"
                        className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Save All Coupons
                    </button>
                </form>
            )}
            {existingCoupons?.length > 0 && (
                <div className="mb-6 overflow-x-auto max-h-64 border rounded mt-10 p-4">
                    <h3 className="font-semibold mb-2">Existing Coupons ({existingCoupons?.length})</h3>
                    <table className="min-w-full border border-gray-300 text-sm">
                        <thead className="bg-gray-100 text-gray-700" >
                            <tr>
                                <th className="border px-3 py-2">Sr. No.</th>
                                <th className="border px-3 py-2">Coupon Code</th>
                                <th className="border px-3 py-2">Amount</th>
                                <th className="border px-3 py-2">Limit</th>
                                <th className="border px-3 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {existingCoupons
                                ?.map((c, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="border px-3 py-2 text-center">{i + 1}</td>
                                        <td className="border px-3 py-2">{c.code}</td>
                                        <td className="border px-3 py-2">{c.discount_value}</td>
                                        <td className="border px-3 py-2">{c.uses_per_coupon}</td>
                                        <td className="border px-3 py-2 bg-green-200">{c.is_active ? "Not Used" : "Used"}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CouponGenerator;
