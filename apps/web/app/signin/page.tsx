import { FormSignin } from "@/components/SigninForm";

export default function Signin() {
  return (
    <div className="overflow-hidden">
      <div
        className="
        min-h-screen w-screen bg-white dark:bg-black bg-[radial-gradient(#D3D3D3_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)] bg-size-[10px_10px]
      "
      >
        <FormSignin/>
      </div>
    </div>
  );
}
