import { Link, Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Logo from '../components/Logo'


export default function AppLayout() {

return (
    <>
        <header
            className='py-5 bg-blue-100'
        >
       <div className='max-w-screen-2xl mx-auto flex flex-col items-center'>
            <div className='w-64'>
                <Link to={'/'}>
                     <Logo/>
                </Link>
                   
            </div>

            
            </div>
        </header>

         <section className='max-w-xl mx-auto mt-5 p-5'>
            <Outlet />
        </section>

        <footer className='py-5'>
            <p className='text-center'>
                All Rights Reserved {new Date().getFullYear()}.
            </p>
        </footer>

       
         <ToastContainer
            pauseOnHover={false}
            pauseOnFocusLoss={false}
         />    
    </>
    
  )
}
