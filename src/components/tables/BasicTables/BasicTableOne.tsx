import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import { API_URL } from "../../../utils/api_url";
import { formatReadableDate } from "../../../utils/formatDate";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  program: string;
  query: string;
  submitted_at: string;
  status: string;
  sales_person_comment: string;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    program: "",
    city: "",
    state: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  const leadsPerPage = 10;

  useEffect(() => {
    axios
      .get(`${API_URL}/api/getAllEnquiry`)
      .then((response) => {
        setLeads(response.data);
        setFilteredLeads(response.data);
      })
      .catch((error) => console.error("Error fetching leads:", error));
  }, []);

  const applyFilters = () => {
    let filtered = leads;

    Object.entries(filters).forEach(([key, value]) => {
      if (key !== "fromDate" && key !== "toDate" && value) {
        filtered = filtered.filter((lead) => (lead as any)[key] === value);
      }
    });

    // Date range filtering
    if (filters.fromDate) {
      filtered = filtered.filter((lead) => new Date(lead.submitted_at) >= new Date(filters.fromDate));
    }
    if (filters.toDate) {
      filtered = filtered.filter((lead) => new Date(lead.submitted_at) <= new Date(filters.toDate));
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      program: "",
      city: "",
      state: "",
      status: "",
      fromDate: "",
      toDate: "",
    });
    setFilteredLeads(leads);
  };

  const updateLeadStatus = async (id: number, status: string, comment: string) => {
    setLoadingId(id);
    try {
      await axios.post(`${API_URL}/api/updateEnquiry`, {
        id,
        status,
        sales_person_comment: comment,
      });
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status!");
    } finally {
      setLoadingId(null);
    }
  };

  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const uniqueValues = (key: keyof Lead) =>
    [...new Set(leads.map((lead) => lead[key]).filter(Boolean))];

  return (
    <div className="p-4 space-y-4 dark:bg-grey-900">
      {/* Filter UI */}
      <p className="dark:text-white"> Total Leads: {filteredLeads.length}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 dark:bg-grey-900  p-4 rounded shadow-2xl dark:text-white">
        <select
          value={filters.program}
          onChange={(e) => handleFilterChange("program", e.target.value)}
          className="border p-2 rounded dark:bg-grey-900 "
        >
          <option value="">All Programs</option>
          {uniqueValues("program").map((val) => (
            <option className="dark:text-black" key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <select
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Cities</option>
          {uniqueValues("city").map((val) => (
            <option className="dark:text-black" key={val} value={val}>
              {val}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => handleFilterChange("toDate", e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={applyFilters}
          className="bg-blue-500 text-white rounded px-4 py-2 col-span-2 md:col-span-1"
        >
          Submit Filters
        </button>

        <button
          onClick={resetFilters}
          className="bg-red-500 text-white rounded px-4 py-2 col-span-2 md:col-span-1"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto  dark:bg-grey-900 dark:text-white rounded shadow border">
        <Table>
          <TableHeader className="border-b">
            <TableRow>
              {[
                "S.No",
                "Name",
                "Email",
                "Phone",
                "State",
                "City",
                "Program",
                "Query",
                "Submitted At",
                "Comment",
                "Action",
              ].map((header) => (
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
                <TableCell className="px-5 py-4 text-start border">{lead.name}</TableCell>
                <TableCell className="px-5 py-4 text-start border">{lead.email}</TableCell>
                <TableCell className="px-5 py-4 text-start border">{lead.phone}</TableCell>
                <TableCell className="px-5 py-4 text-start border">{lead.state}</TableCell>
                <TableCell className="px-5 py-4 text-start border">{lead.city}</TableCell>
                <TableCell className="px-5 py-4 text-start border">{lead.program}</TableCell>
                <TableCell className={`px-5 py-4 text-start border ${lead.query === "From Ask me button" ? "text-red-500" : ""}`}>{lead.query}</TableCell>
                <TableCell className="px-5 py-4 text-start border">{formatReadableDate(lead.submitted_at)}</TableCell>
                <TableCell className="px-5 py-4 text-start border">
                  <input
                    type="text"
                    className="p-1 border rounded"
                    placeholder="Enter comment"
                    value={lead.sales_person_comment || ""}
                    onChange={(e) => {
                      const newComment = e.target.value;
                      setLeads((prevLeads) =>
                        prevLeads.map((l) =>
                          l.id === lead.id ? { ...l, sales_person_comment: newComment } : l
                        )
                      );
                      setFilteredLeads((prevFiltered) =>
                        prevFiltered.map((l) =>
                          l.id === lead.id ? { ...l, sales_person_comment: newComment } : l
                        )
                      );

                    }}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start border">
                  <button
                    className="btn p-2 text-white rounded btn-sm bg-blue-500"
                    onClick={() => updateLeadStatus(lead.id, lead.status, lead.sales_person_comment)}
                    disabled={loadingId === lead.id}
                  >
                    {loadingId === lead.id ? "Updating..." : "Update"}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 flex-wrap gap-2">
        {Array.from({ length: Math.ceil(filteredLeads.length / leadsPerPage) }, (_, i) => (
          <button
            key={i + 1}
            className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Leads;
