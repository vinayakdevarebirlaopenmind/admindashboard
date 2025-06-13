import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import React, { useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../utils/api_url";

// Define the TypeScript interface for the table rows
interface Order {
  id: string | number;
  email: string;
  program_id: string;
  amount_received?: string;
  total_amount: string;
  payment_type: string;
  status: 'success' | 'pending' | 'failed';
}


export default function RecentOrders() {

  const [orders, setOrders] = React.useState<Order[]>([]);
  useEffect(() => {
    axios
      .get(`${API_URL}/api/orders`)
      .then((response) => {
        setOrders(response.data);
      })
      .catch((error) => console.error("Error fetching leads:", error));
  }, []);
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders ({orders.length})
          </h3>
        </div>


      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                User Email Id
              </TableCell>
              {/* <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Course Id
              </TableCell> */}
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Amount Received
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total Amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Payment Type
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((orders) => (
              <TableRow key={orders.id} className="">
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {orders.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                {/* <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {orders.program_id}
                </TableCell> */}
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {orders.amount_received || '0'}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {orders.total_amount}
                </TableCell>  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {orders.payment_type}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      orders.status === "success"
                        ? "success"
                        : orders.status === "pending"
                          ? "warning"
                          : "error"
                    }
                  >
                    {orders.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
