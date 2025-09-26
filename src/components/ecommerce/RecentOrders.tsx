import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import axios from "axios";
import { API_URL } from "../../utils/api_url";

interface Order {
  id: string | number;
  name?: string;
  email: string;
  mobile_number?: string;
  title?: string;
  program_id: string;
  amount_received?: string;
  total_amount: string;
  payment_type: "full" | "emi3" | "emi2";
  status: "success" | "pending" | "failed";
  created_at: string;
}

const PAGE_SIZE = 10;
const VISIBLE_PAGES = 5;

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentType, setPaymentType] = useState<"all" | "full" | "emi2" | "emi3">("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/orders`)
      .then((response) => {
        setOrders(response.data);
        setFilteredOrders(response.data);
        setTotalPages(Math.ceil(response.data.length / PAGE_SIZE));
      })
      .catch((error) => console.error("Error fetching orders:", error));
  }, []);

  // Get unique courses from orders
  const uniqueCourses = Array.from(new Set(orders.map(order => order.title).filter(Boolean))) as string[];

  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((order) =>
      (order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mobile_number?.includes(searchTerm))
      );
    }

    // Date filter
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= from
      );
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (order) => new Date(order.created_at) <= to
      );
    }

    // Payment type filter
    if (paymentType !== "all") {
      filtered = filtered.filter(
        (order) => order.payment_type === paymentType
      );
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.title === courseFilter
      );
    }

    setFilteredOrders(filtered);
    const newTotalPages = Math.ceil(filtered.length / PAGE_SIZE);
    setTotalPages(newTotalPages);

    // Keep current page valid instead of always resetting to 1
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0) {
      setCurrentPage(1);
    }
  }, [searchTerm, fromDate, toDate, paymentType, courseFilter, orders, currentPage]);

  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Download functionality - Excel only
  const downloadExcel = (data: Order[], filename: string) => {
    setIsDownloading(true);

    // Import xlsx library dynamically to avoid bundle bloat
    import('xlsx').then((XLSX) => {
      try {
        // Prepare data for Excel
        const excelData = data.map(order => ({
          'Course Purchased': order.title || 'N/A',
          'User Name': order.name || 'N/A',
          'User Email': order.email,
          'Mobile Number': order.mobile_number || 'N/A',
          'Amount Received': order.amount_received || '0',
          'Total Amount': order.total_amount,
          'Payment Type': order.payment_type.toUpperCase(),
          'Status': order.status,
          'Created Date': new Date(order.created_at).toLocaleDateString(),
          'Created Time': new Date(order.created_at).toLocaleTimeString(),
          'Transaction Fee': (parseFloat(order.amount_received || '0') - parseFloat(order.total_amount || '0')).toFixed(2)
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

        // Generate Excel file
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } catch (error) {
        console.error('Error generating Excel:', error);
        alert('Error generating Excel file');
      } finally {
        setIsDownloading(false);
      }
    });
  };

  const handleDownload = (scope: 'filtered' | 'all') => {
    const data = scope === 'filtered' ? filteredOrders : orders;
    const scopeText = scope === 'filtered' ? 'Filtered' : 'All';
    const dateSuffix = fromDate || toDate ? `_${fromDate || 'start'}-to-${toDate || 'end'}` : '';
    const paymentSuffix = paymentType !== 'all' ? `_${paymentType}` : '';
    const courseSuffix = courseFilter !== 'all' ? `_${courseFilter.substring(0, 15)}` : '';
    const searchSuffix = searchTerm ? `_search-${searchTerm.substring(0, 10)}` : '';

    const filename = `orders_${scopeText.toLowerCase()}${dateSuffix}${paymentSuffix}${courseSuffix}${searchSuffix}_${new Date().toISOString().split('T')[0]}`;

    downloadExcel(data, filename);
  };

  // Calculate visible page numbers with ellipsis
  const getVisiblePages = () => {
    if (totalPages <= VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + VISIBLE_PAGES - 1);

    if (end - start + 1 < VISIBLE_PAGES) {
      start = Math.max(1, end - VISIBLE_PAGES + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Count orders by payment type for statistics
  const paymentTypeCounts = {
    all: orders.length,
    full: orders.filter(order => order.payment_type === "full").length,
    emi3: orders.filter(order => order.payment_type === "emi3").length,
    emi2: orders.filter(order => order.payment_type === "emi2").length,
  };

  // Count orders by course for statistics
  const courseCounts = {
    all: orders.length,
    ...Object.fromEntries(
      uniqueCourses.map(course => [
        course,
        orders.filter(order => order.title === course).length
      ])
    )
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-4 mb-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders ({filteredOrders.length})
          </h3>

          {/* Download Button */}
          <div className="relative group">
            <button
              disabled={isDownloading}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </>
              )}
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="p-2">
                <button
                  onClick={() => handleDownload('filtered')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  📊 Current Filters ({filteredOrders.length} records)
                </button>
                <button
                  onClick={() => handleDownload('all')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  📊 All Data ({orders.length} records)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section - Organized in Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border px-3 py-2 rounded text-sm dark:text-black"
            />
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course
            </label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full border px-3 py-2 rounded text-sm dark:text-black"
            >
              <option value="all">All Courses ({courseCounts.all})</option>
              {uniqueCourses.map((course) => (
                <option key={course} value={course}>
                  {course} ({courseCounts[course] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as "all" | "full" | "emi3" | "emi2")}
              className="w-full border px-3 py-2 rounded text-sm dark:text-black"
            >
              <option value="all">All Payments ({paymentTypeCounts.all})</option>
              <option value="full">Full Payment ({paymentTypeCounts.full})</option>
              <option value="emi2">EMI 2 ({paymentTypeCounts.emi2})</option>
              <option value="emi3">EMI 3 ({paymentTypeCounts.emi3})</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="flex-1 border px-3 py-2 rounded text-sm dark:text-black"
                placeholder="From"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="flex-1 border px-3 py-2 rounded text-sm dark:text-black"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPaymentType("all")}
              className={`px-3 py-1 rounded text-sm border ${paymentType === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setPaymentType("full")}
              className={`px-3 py-1 rounded text-sm border ${paymentType === "full"
                ? "bg-green-600 text-white border-green-600"
                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                }`}
            >
              Full Payment
            </button>
            <button
              onClick={() => setPaymentType("emi2")}
              className={`px-3 py-1 rounded text-sm border ${paymentType === "emi2"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                }`}
            >
              EMI 2
            </button>
            <button
              onClick={() => setPaymentType("emi3")}
              className={`px-3 py-1 rounded text-sm border ${paymentType === "emi3"
                ? "bg-yellow-600 text-white border-yellow-600"
                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                }`}
            >
              EMI 3
            </button>
          </div>

          {/* Clear Filters Button */}
          {(fromDate || toDate || searchTerm || paymentType !== "all" || courseFilter !== "all") && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setSearchTerm("");
                setPaymentType("all");
                setCourseFilter("all");
              }}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Information Note */}
      <div className="mt-2 text-sm text-black dark:text-white mb-4 p-3 bg-blue-50 border border-blue-600 dark:bg-blue-900/20 rounded-lg">
        <strong>Note:</strong> If the Amount Received is greater than the Total Amount, the difference represents the transaction fee, which is borne by the customer at the time of payment.
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto dark:text-white/90">
        <Table className="w-full border border-gray-300 dark:border-gray-700">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >Course Purchased</TableCell>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >User Email</TableCell>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >Amount Received</TableCell>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >Total Amount</TableCell>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >Payment Type</TableCell>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >Status</TableCell>
              <TableCell isHeader className="py-3 p-2 font-medium text-gray-500 text-start border border-gray-300 dark:border-gray-700"
              >Created At</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">{order.title}</TableCell>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">{order.email}</TableCell>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">{order.amount_received || "0"}</TableCell>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">{order.total_amount}</TableCell>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">
                    <Badge
                      size="sm"
                      color={
                        order.payment_type === "full"
                          ? "success"
                          : order.payment_type === "emi3"
                            ? "warning"
                            : "info"
                      }
                    >
                      {order.payment_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">
                    <Badge
                      size="sm"
                      color={
                        order.status === "success"
                          ? "success"
                          : order.status === "pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 p-2 border border-gray-300 dark:border-gray-700">
                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center border border-gray-300 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400">
                    No orders found matching your filters
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <>
          <div className="mt-4 flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 dark:text-white/90 border rounded disabled:opacity-50 text-sm"
            >
              Previous
            </button>

            {visiblePages[0] > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className={`px-3 py-1 border rounded dark:text-white/90 text-sm ${1 === currentPage ? "bg-blue-600 text-white" : ""}`}
                >
                  1
                </button>
                {visiblePages[0] > 2 && <span className="px-2 dark:text-white/90">...</span>}
              </>
            )}

            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded dark:text-white/90 text-sm ${page === currentPage ? "bg-blue-600 text-white" : ""}`}
              >
                {page}
              </button>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="px-2 dark:text-white/90">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`px-3 py-1 border rounded dark:text-white/90 text-sm ${totalPages === currentPage ? "bg-blue-600 text-white" : ""}`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded dark:text-white/90 disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>

          <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} • Showing {currentOrders.length} of {filteredOrders.length} orders
          </div>
        </>
      )}
    </div>
  );
}