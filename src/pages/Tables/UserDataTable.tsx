import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UserData from "../../components/tables/BasicTables/UserTable";

export default function UserDataTable() {
    return (
        <>
            <PageMeta
                title="Birla LearnLeap | Admin "
                description="Birla LearnLeap | Admin "
            />
            <PageBreadcrumb pageTitle="Users Data" />
            <div className="space-y-6">
                <ComponentCard title="Users">
                    <UserData />
                </ComponentCard>
            </div>
        </>
    );
}
