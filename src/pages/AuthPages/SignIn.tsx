import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Birla LearnLeap | Admin "
        description="Birla LearnLeap | Admin "
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
