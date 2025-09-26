import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import { API_URL } from "../../../utils/api_url";

interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    mobile: string;
    state: string;
    city: string;
    program: string;
    query: string;
    submitted_at: string;
    status: string;
    sales_person_comment: string;
}

const UserData = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const leadsPerPage = 10;

    useEffect(() => {
        axios
            .get(`${API_URL}/api/getAllUsers`)
            .then((response) => {
                setLeads(response.data);
                setFilteredLeads(response.data);
            })
            .catch((error) => console.error("Error fetching leads:", error));
    }, []);

    // ✅ Apply search filter
    useEffect(() => {
        let filtered = leads;

        if (searchTerm.trim() !== "") {
            filtered = leads.filter(
                (lead) =>
                    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lead.phone?.includes(searchTerm) ||
                    lead.mobile?.includes(searchTerm)
            );
        }

        setFilteredLeads(filtered);
        setCurrentPage(1); // reset to first page when searching
    }, [searchTerm, leads]);

    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="p-4 space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="dark:text-white "> Total Users: {filteredLeads.length}</p>

                {/* ✅ Search Input */}
                <input
                    type="text"
                    placeholder="Search by name, email or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border  border-black rounded w-full sm:w-64 text-sm dark:text-black"
                />
            </div>

            <div className="overflow-auto dark:bg-grey-900 border-black  dark:text-white rounded shadow border">
                <Table>
                    <TableHeader className="border-b">
                        <TableRow>
                            {["S.No", "Name", "Email", "Phone", "State", "City"].map((header) => (
                                <TableCell
                                    key={header}
                                    isHeader
                                    className="px-5 py-3 font-medium text-start border text-sm"
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentLeads.map((lead, idx) => (
                            <TableRow key={lead.id}>
                                <TableCell className="px-5 py-4 text-start border">{indexOfFirstLead + idx + 1}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.name || "-"}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.email || "-"}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.phone || lead.mobile || "-"}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.state || "-"}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.city || "-"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
          {/* Pagination */}
<div className="flex justify-center mt-4 flex-wrap gap-2">
  <button
    onClick={() => paginate(currentPage - 1)}
    disabled={currentPage === 1}
    className="px-3 py-1 rounded border disabled:opacity-50"
  >
    Prev
  </button>

  {Array.from({ length: Math.ceil(filteredLeads.length / leadsPerPage) }, (_, i) => i + 1)
    .filter((page) => {
      // Show first, last, current ±2
      return (
        page === 1 ||
        page === Math.ceil(filteredLeads.length / leadsPerPage) ||
        (page >= currentPage - 2 && page <= currentPage + 2)
      );
    })
    .map((page, idx, arr) => {
      const prevPage = arr[idx - 1];
      const showDots = prevPage && page - prevPage > 1;

      return (
        <div key={page} className="flex">
          {showDots && <span className="px-2">...</span>}
          <button
            onClick={() => paginate(page)}
            className={`px-3 py-1 rounded border ${
              currentPage === page ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            {page}
          </button>
        </div>
      );
    })}

  <button
    onClick={() => paginate(currentPage + 1)}
    disabled={currentPage === Math.ceil(filteredLeads.length / leadsPerPage)}
    className="px-3 py-1 rounded border disabled:opacity-50"
  >
    Next
  </button>
</div>

        </div>
    );
};

export default UserData;
