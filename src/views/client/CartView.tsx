import { useOutletContext, useNavigate }  from 'react-router-dom'
import { ShoppingCartIcon, TrashIcon,
         PlusIcon, MinusIcon }            from '@heroicons/react/24/outline'
import type { ShopOutletContextType }     from '../../types'
import PlaceOrderModalClient from '../../components/client/PlaceOrderModalClient'


export default function CartView() {
  const navigate = useNavigate()
  const {
    cart, clearCart,
    increaseQuantity, decreaseQuantity, removeFromCart,
    cartTotal,
  } = useOutletContext<ShopOutletContextType>()

  if (cart.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <ShoppingCartIcon className="w-8 h-8 text-[#185fa5]/40" />
      </div>
      <p className="font-bold text-[#1a3a5c] text-lg">Your cart is empty</p>
      <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
      <button onClick={() => navigate('/')}
        className="mt-6 px-6 py-3 bg-[#185fa5] hover:bg-[#0c447c] text-white
                   text-sm font-semibold rounded-xl transition-colors">
        Browse Products
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1a3a5c]">Your Cart</h2>
        <button onClick={clearCart}
          className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-white
                     border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
          Clear Cart
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {cart.map(item => (
          <div key={item._id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {item.image ? (
                <img src={item.image} alt={item.productName}
                  className="w-14 h-14 object-cover rounded-xl border border-gray-100 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center
                                justify-center shrink-0">
                  <ShoppingCartIcon className="w-6 h-6 text-[#185fa5]/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ${item.displayPrice.toFixed(2)} per piece
                </p>
              </div>
              <button onClick={() => removeFromCart(item._id)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50
                           rounded-lg transition-colors shrink-0">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <button onClick={() => decreaseQuantity(item._id)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200
                             flex items-center justify-center transition-colors">
                  <MinusIcon className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className="font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                <button onClick={() => increaseQuantity(item._id)}
                  className="w-8 h-8 rounded-xl bg-[#185fa5] hover:bg-[#0c447c]
                             flex items-center justify-center transition-colors">
                  <PlusIcon className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="font-bold text-[#185fa5]">
                ${(item.displayPrice * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3.5
                      bg-blue-50 rounded-xl border border-blue-100">
        <p className="font-semibold text-[#1a3a5c]">Total</p>
        <p className="font-black text-[#185fa5] text-2xl">${cartTotal.toFixed(2)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(location.pathname + '?confirmOrder=true')}
          className="flex-1 py-3.5 text-sm font-semibold text-white bg-emerald-600
                     hover:bg-emerald-700 rounded-xl transition-colors"
        >
          Confirm Order
        </button>
        <button onClick={() => navigate('/')}
          className="flex-1 py-3.5 text-sm font-semibold text-white bg-[#185fa5]
                     hover:bg-[#0c447c] rounded-xl transition-colors">
          Continue Shopping
        </button>
      </div>

      <PlaceOrderModalClient />
    </div>
  )
}