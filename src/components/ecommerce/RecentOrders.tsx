import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/api_url";

interface Order {
  id: string | number;
  name?: string;
  email: string;
  mobile_number?: string;
  program_id: string;
  amount_received?: string;
  total_amount: string;
  payment_type: string;
  status: "success" | "pending" | "failed";
  created_at: string; // ✅ important for date filtering
}

const PAGE_SIZE = 10;

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/orders`)
      .then((response) => {
        setOrders(response.data);
        setFilteredOrders(response.data); // initially no filter
        setTotalPages(Math.ceil(response.data.length / PAGE_SIZE));
      })
      .catch((error) => console.error("Error fetching orders:", error));
  }, []);

  // Apply filters whenever searchTerm, fromDate, toDate, or orders change
  useEffect(() => {
    let filtered = orders;

    // ✅ Search filter (by name, email, or mobile number)
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((order) =>
        (order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.mobile_number?.includes(searchTerm))
      );
    }

    // ✅ Date filter
    if (fromDate) {
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= new Date(fromDate)
      );
    }
    if (toDate) {
      filtered = filtered.filter(
        (order) => new Date(order.created_at) <= new Date(toDate)
      );
    }

    setFilteredOrders(filtered);
    setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));
    setCurrentPage(1); // reset to first page when filters change
  }, [searchTerm, fromDate, toDate, orders]);

  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Orders ({filteredOrders.length})
        </h3>

        {/* ✅ Search & Date Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
         
          <input
            type="text"
            placeholder="Search by email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-1 rounded text-sm dark:text-black"
          /> 
           <span className="text-sm">From : </span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-3 py-1 rounded text-sm dark:text-black"
          />
          <span className="text-sm">To : </span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-3 py-1 rounded text-sm dark:text-black"
          />
        </div>
      </div>

      {/* ✅ Table */}
      <div className="max-w-full overflow-x-auto dark:text-white/90">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">User Email</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Amount Received</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Total Amount</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Payment Type</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Status</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Created At</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="py-3">{order.email}</TableCell>
                <TableCell className="py-3 text-gray-500">{order.amount_received || "0"}</TableCell>
                <TableCell className="py-3 text-gray-500">{order.total_amount}</TableCell>
                <TableCell className="py-3 text-gray-500">{order.payment_type}</TableCell>
                <TableCell className="py-3 text-gray-500">
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
                <TableCell className="py-3 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Pagination Controls */}
      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 dark:text-white/90 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 border rounded dark:text-white/90 ${
              page === currentPage ? "bg-blue-600 text-white" : ""
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded dark:text-white/90 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
