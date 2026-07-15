import { useForm } from "react-hook-form";
import ErrorMessage from "../../components/ErrorMessage";
import { useMutation } from '@tanstack/react-query'
import { createAdmin } from "../../api/AuthAPI"; 
import { toast } from "react-toastify";
import type { AdminRegistrationForm } from "../../types";

export default function RegisterView() {
  
  const initialValues: AdminRegistrationForm = {
    name: '',
    email: '',
    password: ''
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminRegistrationForm>({ defaultValues: initialValues });

  const { mutate } = useMutation({
    mutationFn: createAdmin,
    onError: (error) => {
        toast.error(error.message)
    },
    onSuccess: (data) => {
        toast.success(data)
        reset()
    }
  })

  const handleRegister = (formData: AdminRegistrationForm) => {
    mutate(formData)
  }

  return (
    <>
        <h1 className="text-4xl font-black text-[#1a3a5c]">Create Admin</h1>
        <p className="text-lg font-light text-[#1a3a5c] mt-3">
          Fill out the form to{' '}
          <span className="text-[#185fa5] font-bold">create new admin</span>
        </p>

        <form
          onSubmit={handleSubmit(handleRegister)}
          className="space-y-6 p-8 mt-8 bg-white/70 backdrop-blur-sm border border-[#185fa5]/20 rounded-2xl"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm text-[#1a3a5c]">Name</label>
            <input
              type="text"
              placeholder="Admin Name"
              className="w-full p-3 border border-[#185fa5]/25 rounded-xl bg-white/85 text-[#1a3a5c] placeholder:text-[#aac0d8] focus:outline-none focus:border-[#185fa5] transition-colors"
              {...register("name", {
                required: "Admin Name is Required",
              })}
            />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-medium text-sm text-[#1a3a5c]">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Admin Email"
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
              placeholder="Admin Password"
              className="w-full p-3 border border-[#185fa5]/25 rounded-xl bg-white/85 text-[#1a3a5c] placeholder:text-[#aac0d8] focus:outline-none focus:border-[#185fa5] transition-colors"
              {...register("password", {
                required: "Password is Required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              })}
            />
            {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
          </div>
          
          <input
            type="submit"
            value="Register Admin"
            className="bg-[#185fa5] hover:bg-[#0c447c] w-full p-3 rounded-xl text-white font-bold text-base cursor-pointer transition-colors"
            />
        </form>
    </>
  )
}