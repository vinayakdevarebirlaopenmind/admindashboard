import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Birla LearnLeap | Admin "
        description="Birla LearnLeap | Admin "
      />
      <PageBreadcrumb pageTitle="Enquiry Form Leads" />
      <div className="space-y-6">
        <ComponentCard title="Leads">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
