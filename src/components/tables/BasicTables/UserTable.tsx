import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import { API_URL } from "../../../utils/api_url";
// import { formatReadableDate } from "../../../utils/formatDate";

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
    // const [leads, setLeads] = useState<Lead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    // const [loadingId, setLoadingId] = useState<number | null>(null);

    // const [filters, setFilters] = useState({
    //     program: "",
    //     city: "",
    //     state: "",
    //     status: "",
    //     fromDate: "",
    //     toDate: "",
    // });

    const leadsPerPage = 10;

    useEffect(() => {
        axios
            .get(`${API_URL}/api/getAllUsers`)
            .then((response) => {
                // setLeads(response.data);
                setFilteredLeads(response.data);
            })
            .catch((error) => console.error("Error fetching leads:", error));
    }, []);

    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="p-4 space-y-4">

            <p className="dark:text-white "> Total Users: {filteredLeads.length}</p>

            <div className="overflow-auto dark:bg-grey-900 dark:text-white  rounded shadow border">
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
                                <TableCell className="px-5 py-4 text-start border">{lead.name || '-'} </TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.email || '-'}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.phone || lead.mobile || '-'}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.state || '-'}</TableCell>
                                <TableCell className="px-5 py-4 text-start border">{lead.city || '-'}</TableCell>
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

export default UserData;
