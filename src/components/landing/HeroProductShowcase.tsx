"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Heart, Star, ShoppingBag, Check, Users, Eye } from "lucide-react"

const products = [
  {
    id: 1,
    color: 'bg-gray-50',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Red Nike
    title: 'Nike Air Max 270',
    subtitle: "Men's Running Shoe",
    price: '₪549.00',
    prevPrice: '₪650',
    notification: { text: 'רכישה בוצעה כעת', value: '+ ₪549.00', icon: Check, color: 'green' },
    secondaryNotification: { text: 'צופים במוצר זה', value: '24 אנשים', icon: Users, color: 'blue' }
  },
  {
    id: 2,
    color: 'bg-yellow-50',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop', // Yellow Jacket
    title: 'Urban Jacket',
    subtitle: "Winter Category",
    price: '₪299.00',
    prevPrice: '₪399',
    notification: { text: 'רכישה בוצעה', value: '+ ₪299', icon: Check, color: 'green' },
    secondaryNotification: { text: 'נמכר מהר', value: 'נשארו 3', icon: Eye, color: 'orange' }
  },
  {
    id: 3,
    color: 'bg-yellow-50',
    image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1000&q=80', // Yellow Cap
    title: 'Street Cap',
    subtitle: "Limited Edition",
    price: '₪129.00',
    prevPrice: '₪199',
    notification: { text: 'נוסף לסל', value: 'לפני דקה', icon: ShoppingBag, color: 'blue' },
    secondaryNotification: { text: 'צופים במוצר זה', value: '15 אנשים', icon: Users, color: 'blue' }
  }
]

export function HeroProductShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length)
        setIsTransitioning(false)
      }, 600) // Slightly longer than the fade-out duration to ensure completion
    }, 4000) // Change every 4 seconds for better pacing

    return () => clearInterval(interval)
  }, [])

  const product = products[currentIndex]

  return (
    <div className="relative lg:h-[700px] w-full flex items-center justify-center perspective-1000">
      
      {/* Decorative Background Elements - Changing colors based on product */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse transition-colors duration-1000 ${
        currentIndex === 0 ? 'bg-emerald-200/30' : currentIndex === 1 ? 'bg-yellow-200/30' : 'bg-purple-200/30'
      }`} />
      <div className={`absolute top-1/2 left-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-1000 translate-x-12 transition-colors duration-1000 ${
        currentIndex === 0 ? 'bg-blue-200/30' : currentIndex === 1 ? 'bg-orange-200/30' : 'bg-pink-200/30'
      }`} />

      {/* iPhone Frame */}
      <div 
        className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] rounded-[3rem] h-[600px] w-[300px] shadow-2xl rotate-[-6deg] hover:rotate-0 transition-all duration-700 z-10 group cursor-pointer"
        style={{ transitionTimingFunction: 'cubic-bezier(0.25,0.1,0.25,1)' }}
      >
        
        {/* Side Buttons */}
        <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[15px] top-[72px] rounded-l-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[15px] top-[124px] rounded-l-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[15px] top-[178px] rounded-l-lg"></div>
        <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[15px] top-[142px] rounded-r-lg"></div>
        
        {/* Screen Content */}
        <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-white relative flex flex-col">
          
          {/* Notch Area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-2xl z-30"></div>

          {/* Status Bar */}
          <div className="h-12 w-full absolute top-0 z-20 flex justify-between items-center px-6 pt-3 text-black/80">
             <div className="text-[12px] font-bold">9:41</div>
             <div className="flex gap-1.5">
               <div className="w-4 h-4 rounded-full border border-black/20 flex items-center justify-center"><div className="w-3 h-3 bg-black rounded-full"></div></div>
             </div>
          </div>

          {/* Product Image Area */}
          <div className={`h-[65%] ${product.color} relative transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'}`}>
             <img 
               src={product.image} 
               alt={product.title} 
               className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
             />
             {/* App Header Overlay */}
             <div className="absolute top-14 left-0 right-0 px-5 flex justify-between items-center z-20">
                <div className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-white">
                    <ArrowRight className="w-5 h-5 text-gray-800" />
                </div>
                <div className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-white">
                    <Heart className="w-4 h-4 text-gray-800" />
                </div>
             </div>
          </div>

          {/* Product Details Panel */}
          <div className="flex-1 bg-white p-6 rounded-t-[2.5rem] rounded-b-[2.2rem] -mt-8 relative z-10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <div className={`flex justify-between items-start mb-3 transition-all duration-500 delay-100 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
               <div>
                  <h3 className="font-bold text-xl text-gray-900 tracking-tight">{product.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{product.subtitle}</p>
               </div>
               <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">4.9</span>
               </div>
            </div>

            {/* Size Selector Mock */}
            <div className="flex gap-2 mb-6 p-1">
                {['S', 'M', 'L', 'XL'].map((size, i) => (
                    <div key={size} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${i === 1 ? 'bg-black text-white shadow-lg shadow-black/20' : 'border border-gray-200 text-gray-400'}`}>
                        {size}
                    </div>
                ))}
            </div>

            <div className={`mt-auto transition-all duration-500 delay-200 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
               <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                     <span className="text-xs text-gray-400 line-through">{product.prevPrice}</span>
                     <span className="text-2xl font-black text-gray-900">{product.price}</span>
                  </div>
               </div>
               
               <button className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn">
                  <span>הוספה לסל</span>
                  <ShoppingBag className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification Widgets - Top Right */}
      <div key={`notif1-${currentIndex}`} style={{ animationFillMode: 'both' }} className="absolute top-[25%] -right-16 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 z-20 hidden lg:block border border-white/20">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${product.notification.color === 'green' ? 'bg-green-100' : 'bg-blue-50'}`}>
               <product.notification.icon className={`w-5 h-5 ${product.notification.color === 'green' ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div className="text-right">
               <div className="text-xs text-gray-500 font-medium">{product.notification.text}</div>
               <div className="font-bold text-sm text-gray-900">{product.notification.value}</div>
            </div>
         </div>
      </div>
      
      {/* Floating Notification Widgets - Bottom Left */}
      <div key={`notif2-${currentIndex}`} style={{ animationFillMode: 'both' }} className="absolute bottom-[20%] -left-12 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 z-20 hidden lg:block border border-white/20">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${product.secondaryNotification.color === 'green' ? 'bg-green-100' : product.secondaryNotification.color === 'orange' ? 'bg-orange-50' : 'bg-blue-50'}`}>
               <product.secondaryNotification.icon className={`w-5 h-5 ${product.secondaryNotification.color === 'green' ? 'text-green-600' : product.secondaryNotification.color === 'orange' ? 'text-orange-600' : 'text-blue-600'}`} />
            </div>
            <div className="text-right">
               <div className="text-xs text-gray-500 font-medium">{product.secondaryNotification.text}</div>
               <div className="font-bold text-sm text-gray-900">{product.secondaryNotification.value}</div>
            </div>
         </div>
      </div>

    </div>
  )
}
