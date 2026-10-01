
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  ChevronDown,
} from 'lucide-react';

export default function PaymentInfo() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans text-gray-900 flex flex-col">
      
      

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          
          {/* Left Column: Course Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            
            {/* Back Button */}
            <a href="#" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to course details
            </a>

            {/* Level Badge */}
            <div className="mb-4">
              <span className="bg-[#f3e8ff] text-[#6b21a8] text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-widest">
                Advanced Level
              </span>
            </div>

            {/* Title & Price */}
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-6 tracking-tight text-gray-900">
              Advanced Korean Business Etiquette & Professional Communication
            </h1>
            
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-4xl font-bold text-gray-900">LKR 14,500</span>
              <span className="text-sm font-medium text-gray-500">one-time payment</span>
            </div>

            {/* What's Included Box */}
            <div className="bg-[#f8fafc] rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">
                What's Included
              </h3>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Lifetime access</h4>
                    <p className="text-sm text-gray-500">Learn at your own pace with unlimited replays.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Official Certificate</h4>
                    <p className="text-sm text-gray-500">Accredited SRI-KO digital credential upon completion.</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Resource Library</h4>
                    <p className="text-sm text-gray-500">Downloadable PDF guides and business templates.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 mt-8 text-gray-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold">Secured by SRI-KO Financial Systems</span>
            </div>

          </div>

          {/* Right Column: Payment Form Card */}
          <div className="w-full lg:w-[480px]">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Payment Details</h2>

              <form className="space-y-6">
                
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email address
                  </label>
                  <input 
                    type="email" 
                    placeholder="student@example.com" 
                    className="w-full bg-[#f1f3f5] text-gray-900 rounded-xl p-3.5 text-sm font-medium outline-none border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Card Information Group */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Card information
                  </label>
                  <div className="bg-[#f1f3f5] rounded-xl p-2 space-y-2">
                    <div className="flex items-center bg-white p-2.5 rounded-lg shadow-sm border border-transparent focus-within:border-blue-500 transition-colors">
                      <input 
                        type="text" 
                        placeholder="1234 5678 9101 1121" 
                        className="w-full outline-none text-sm font-medium placeholder:text-gray-400"
                      />
                      <CreditCard className="w-5 h-5 text-gray-400 shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="MM / YY" 
                        className="w-1/2 bg-white p-2.5 rounded-lg text-sm font-medium outline-none shadow-sm border border-transparent focus:border-blue-500 transition-colors placeholder:text-gray-400"
                      />
                      <input 
                        type="text" 
                        placeholder="CVC" 
                        className="w-1/2 bg-white p-2.5 rounded-lg text-sm font-medium outline-none shadow-sm border border-transparent focus:border-blue-500 transition-colors placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cardholder name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Full name on card" 
                    className="w-full bg-[#f1f3f5] text-gray-900 rounded-xl p-3.5 text-sm font-medium outline-none border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Country/Region Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Country or region
                  </label>
                  <div className="relative">
                    <select className="w-full bg-[#f1f3f5] text-gray-900 rounded-xl p-3.5 text-sm font-medium outline-none appearance-none border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option>Sri Lanka</option>
                      <option>South Korea</option>
                      <option>United States</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="button"
                  className="w-full bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] hover:from-[#1d4ed8] hover:to-[#7c3aed] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 mt-8"
                >
                  <Lock className="w-5 h-5" /> Pay LKR 14,500
                </button>

              </form>

              {/* Disclaimer */}
              <p className="text-center text-[11px] text-gray-500 mt-6 leading-relaxed px-4">
                By confirming your payment, you allow SRI-KO to charge your card for this course in accordance with our terms of service and privacy policy.
              </p>
            </div>

            {/* Payment Method Icons (Bottom aligned to card) */}
            <div className="flex justify-center gap-3 mt-6 opacity-60">
              <div className="w-8 h-5 bg-gray-300 rounded text-[8px] flex items-center justify-center text-white font-bold italic shadow-inner">VISA</div>
              <div className="w-8 h-5 bg-gray-300 rounded text-[8px] flex items-center justify-center text-white font-bold shadow-inner">MC</div>
              <div className="w-8 h-5 bg-gray-300 rounded text-[8px] flex items-center justify-center text-white font-bold shadow-inner">AMEX</div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}