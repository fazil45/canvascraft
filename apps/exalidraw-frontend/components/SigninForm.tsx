"use client";
import { useForm } from "@tanstack/react-form";
import Input from "./InputComponent";
import ThemeToggle from "./ThemeToggleComponent";
import { useRouter } from "next/navigation";
import { Button } from "./ButtonComponent";
import { SigninSchema } from "@repo/common/types";
import axios from "axios";
import FieldInfo from "./ErrorMessage";
import { AuthStore } from "@/store/AuthStore";

export function FormSignin() {
  const route = useRouter();
  const { signin } = AuthStore();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: SigninSchema,
    },
    onSubmit: async ({ value }) => {
      signin(value.email, value.password, route);
    },
  });

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-cyan-500/10 via-transparent to-cyan-500/10">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <div className="xs:w-[86vw] xs:h-[110vw] shadow-blur-multi flex flex-col items-center justify-center rounded-lg border border-neutral-700/50 text-white shadow-lg shadow-neutral-400 backdrop-blur-xl md:h-[80vw] md:w-[60vw] xl:m-2 xl:h-[36vw] xl:w-[30vw] xl:gap-4 xl:p-4 dark:border-cyan-400/40 dark:bg-black dark:shadow-cyan-400/20">
        <div
          className="xs:-mt-12 cursor-pointer text-4xl font-bold text-cyan-400 xl:mt-4"
          onClick={() => route.push("/")}
        >
          CanvasCraft
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="email"
            children={(field) => (
              <div>
                <Input
                  title={"Email"}
                  type="email"
                  placeholder="Enter your email"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <FieldInfo
                  errors={field.state.meta.errors}
                  isTouched={field.state.meta.isTouched}
                />
              </div>
            )}
          />

          <form.Field
            name="password"
            children={(field) => (
              <div>
                <Input
                  title={"Password"}
                  type="password"
                  placeholder="Create your password"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <FieldInfo
                  errors={field.state.meta.errors}
                  isTouched={field.state.meta.isTouched}
                />
              </div>
            )}
          />
          <div className="m-4 flex items-center justify-center">
            <Button variant="secondary" size="lg" type="submit">
              Signin
            </Button>
          </div>
          <div className="flex items-center justify-center text-neutral-800 xl:mt-2 dark:text-neutral-500">
            Create new account
            <span onClick={() => route.push("/signup")}>
              <a className="cursor-pointer text-cyan-400">signup</a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
