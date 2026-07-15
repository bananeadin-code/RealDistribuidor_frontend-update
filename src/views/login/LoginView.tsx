import { useForm } from "react-hook-form";
import ErrorMessage from "../../components/ErrorMessage";
import { useMutation } from '@tanstack/react-query'
import type { AdminLoginForm } from "../../types";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/AuthAPI";
import { toast } from "react-toastify";

export default function LoginView() {

  const initialValues: AdminLoginForm = {
    email: '',
    password: '',
  }
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initialValues })

  const navigate = useNavigate()

  const { mutate } = useMutation({
    mutationFn: login,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () =>{
      navigate('/admin-view-privated')
    }
  })

  const handleLogin = (formData: AdminLoginForm) => mutate(formData)

  return (
    <>
  <h1 className="text-4xl font-black text-[#1a3a5c]">Admin Login</h1>
  <p className="text-lg font-light text-[#1a3a5c] mt-3">
    If you're admin for this grocery{' '}
    <span className="text-[#185fa5] font-bold">enter your credentials in this form</span>
  </p>

  <form
    onSubmit={handleSubmit(handleLogin)}
    className="space-y-6 p-8 mt-8 bg-white/70 backdrop-blur-sm border border-[#185fa5]/20 rounded-2xl"
    noValidate
  >
    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm text-[#1a3a5c]">Email</label>
      <input
        id="email"
        type="email"
        placeholder="Registered Email"
        className="w-full p-3 border border-[#185fa5]/25 rounded-xl bg-white/85 text-[#1a3a5c] placeholder:text-[#aac0d8] focus:outline-none focus:border-[#185fa5] transition-colors"
        {...register("email", {
          required: "Email is Required",
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "Invalid Email",
          },
        })}
      />
      {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
    </div>

    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm text-[#1a3a5c]">Password</label>
      <input
        type="password"
        placeholder="Registered Password"
        className="w-full p-3 border border-[#185fa5]/25 rounded-xl bg-white/85 text-[#1a3a5c] placeholder:text-[#aac0d8] focus:outline-none focus:border-[#185fa5] transition-colors"
        {...register("password", {
          required: "Password is Required",
        })}
      />
      {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
    </div>

    <input
      type="submit"
      value="Login"
      className="bg-[#185fa5] hover:bg-[#0c447c] w-full p-3 rounded-xl text-white font-bold text-base cursor-pointer transition-colors"
    />
  </form>
</>
  )
}