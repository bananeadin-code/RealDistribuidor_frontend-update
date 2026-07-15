import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import LoginLayout from './layouts/LoginLayout'
import AdminView from './views/admin/AdminView'
import AdminProductsView from './views/admin/AdminProductsView'
import LoginView from './views/login/LoginView'
import AddAdminView from './views/admin/AddAdminView'
import ClientLayout from './layouts/ClientLayout'
import DashboardView from './views/client/DashboardView'
import CartView from './views/client/CartView'
import AdminManageRegionsView from './views/admin/AdminManageRegionsView'
import CreateEditProductView from './views/admin/CreateEditProductView'
import SuppliersView from './views/admin/SuppliersView'
import NewSaleView from './views/admin/NewSaleView'
import CreateEditSupplierView from './views/admin/CreateEditSupplierView'
import PurchaseOrdersView from './views/admin/PurchaseOrdersView'
import CustomersView from './views/admin/CustomerView'
import SalesHistoryView from './views/admin/SalesHistoryView'
import CreateEditRegionView from './views/admin/CreateEditRegionView'
import PendingOrdersView from './views/admin/PendingOrdersView'
import PickersView from './views/admin/PickersView'
import PickerLayout from './layouts/PickerLayout'
export default function Router(){

    return (
        <BrowserRouter>
             <Routes>
                <Route element={<AdminLayout />}> {/* Admin Layout */}
                    <Route path="/admin-view-privated" element={<AdminView /> } />
                    <Route path="/admin-view-privated/products" element={<AdminProductsView /> } />
                    <Route path="/admin-view-privated/products/new" element={<CreateEditProductView /> } />
                    <Route path="/admin-view-privated/products/:productId/edit" element={<CreateEditProductView /> } />
                    <Route path="/admin-view-privated/suppliers" element={<SuppliersView /> } />
                    <Route path="/admin-view-privated/suppliers/new" element={<CreateEditSupplierView /> } />
                    <Route path="/admin-view-privated/suppliers/:supplierId/edit" element={<CreateEditSupplierView /> } />
                    <Route path="/admin-view-privated/customers" element={<CustomersView /> } />
                    <Route path="/admin-view-privated/new-sale" element={<NewSaleView /> } />
                    <Route path="/admin-view-privated/orders" element={<SalesHistoryView /> } />
                    <Route path="/admin-view-privated/pending-orders" element={<PendingOrdersView /> } />
                    <Route path="/admin-view-privated/pickers" element={<PickersView /> } />
                    <Route path="/admin-view-privated/purchase-orders" element={<PurchaseOrdersView /> } />
                    <Route path="/admin-view-privated/create-admin" element={<AddAdminView /> } />
                    <Route path="/admin-view-privated/manage-regions" element={<AdminManageRegionsView /> } />
                    <Route path="/admin-view-privated/manage-regions/create" element={<CreateEditRegionView /> } />
                     <Route path="/admin-view-privated/manage-regions/:regionId/edit" element={<CreateEditRegionView /> } />
                </Route>
                <Route element={<LoginLayout />}> {/* Login Layout */}
                    <Route path="/admin-view-privated/login" element={<LoginView /> } />
                </Route>
                <Route element={<ClientLayout />}> {/* Client Layout */}
                    <Route path="/" element={<DashboardView /> } />
                    <Route path="/cart" element={<CartView /> } />
                </Route>
                <Route path='/picker' element={<PickerLayout />}></Route>
             </Routes>
        </BrowserRouter>
    )
}