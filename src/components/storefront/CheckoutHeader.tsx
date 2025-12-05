import Link from 'next/link'
import { HiArrowRight } from 'react-icons/hi'

interface CheckoutHeaderProps {
  shopName: string
  shopLogo?: string | null
  shopSlug: string
}

export function CheckoutHeader({ shopName, shopLogo, shopSlug }: CheckoutHeaderProps) {
  return (
    <div className="bg-white w-full py-4">
      <div className="flex items-center justify-between">
        {/* חזרה לחנות - ימין */}
        <div className="flex justify-start">
          <Link 
            href={`/shops/${shopSlug}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <HiArrowRight className="h-4 w-4" />
            <span>חזרה לחנות</span>
          </Link>
        </div>
        
        {/* לוגו - אמצע */}
        <div className="flex justify-center">
          {shopLogo && (
            <img
              src={shopLogo}
              alt={shopName}
              className="h-10 w-10 object-contain"
            />
          )}
        </div>
        
        {/* שם החנות - שמאל */}
        <div className="flex justify-end">
          <h1 className="text-xl font-bold uppercase">{shopName}</h1>
        </div>
      </div>
    </div>
  )
}

