import { useState } from "react"
import { useNavigate } from "react-router-dom";
import logo from "../assets/true-origin.png"
import herobg from "../assets/true-origin-hero.png"
import icLogo from "../assets/internet-computer-logo.png"
import cfLogo from "../assets/chain-fusion-logo.png"
import rightArrow from "../assets/right-arrow.svg"
import featureBg from "../assets/feature.png"
import customerBg from "../assets/customer-bg.png"
import party1 from "../assets/party-1.png"
import party2 from "../assets/party-2.png"
import party3 from "../assets/party-3.png"
import icInfra from "../assets/ic-infra.png"
import eCoin from "../assets/e-coin.png"
import cFusion from "../assets/chain-fusion@2x.png"
import LandingCard from "../components/LandingCard"
import { Button } from "@/components/ui/button"

const landingCardData = [
    {
        title: "Brand Owners",
        description: "Safeguard Genuine Products by creating a digital identity using ECDSA key generation. Get insights into your product's verification details.",
        image: party1
    },
    {
        title: "Resellers",
        description: "Get Authorized and Safely resell products from Brand Owners. Receive certification and build trust with your customers.",
        image: party2
    },
    {
        title: "Customers",
        description: "Scan the QR Code and Get Paid with ICP/ETH tokens. Validate product authenticity and earn rewards for your engagement.",
        image: party3
    }
]

function Homepage() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <div className="flex flex-col min-h-screen font-sans">
                {/* Header/Navigation */}
                <header className="w-full bg-white shadow sticky top-0 z-10">
                    <nav className="container mx-auto px-4 sm:px-6 py-4 md:py-6 flex justify-between items-center">
                        <img src={logo} alt="TrueOrigin Logo" className="w-[120px] md:w-[150px]" />
                        <div className="hidden md:flex gap-4 md:gap-8 items-center">
                            <a href="#" className="text-gray-600 hover:text-[#0B0AFF] transition-colors">Homepage</a>
                            <Button 
                                onClick={() => navigate('/verify')} 
                                variant="ghost" 
                                className="text-[#0B0AFF]"
                            >
                                Verify Product
                            </Button>
                            <Button 
                                onClick={() => navigate('/auth/login')} 
                                variant="outline" 
                                className="text-[#0B0AFF] border-[#0B0AFF] hover:bg-[#0B0AFF]/10"
                            >
                                Login
                            </Button>
                        </div>
                        <button
                            className="md:hidden flex items-center text-gray-600"
                            onClick={toggleMenu}
                            aria-label="Toggle mobile menu"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d={
                                        isOpen
                                            ? "M6 18L18 6M6 6l12 12"
                                            : "M4 6h16M4 12h16m-7 6h7"
                                    }
                                />
                            </svg>
                        </button>
                    </nav>
                    {isOpen && (
                        <div className="md:hidden flex flex-col items-center bg-white shadow-lg py-4">
                            <a href="#" className="py-2 text-gray-600 hover:text-[#0B0AFF]" onClick={toggleMenu}>
                                Homepage
                            </a>
                            <a className="py-2 text-[#0B0AFF] font-medium" onClick={() => {toggleMenu(); navigate('/verify');}}>
                                Verify Product
                            </a>
                            <a className="py-2 text-[#0B0AFF] font-medium" onClick={() => {toggleMenu(); navigate('/auth/login');}}>
                                Login
                            </a>
                        </div>
                    )}
                </header>

                {/* Hero Section */}
                <section className="bg-white font-lexend py-8 md:py-16">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12 items-center">
                            <div className="flex flex-col justify-center gap-6 md:gap-8 max-w-xl">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                                    Incentivizing <br /> Genuine Product Transactions
                                </h1>
                                <p className="text-base md:text-lg text-gray-600">
                                    Safely sell your products and increase customer's trust with blockchain verification and reward systems.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <p className="text-gray-600">Powered by</p>
                                    <div className="flex gap-5 items-center">
                                        <img src={icLogo} alt="Internet Computer Logo" className="h-7 md:h-8" />
                                        <img src={cfLogo} alt="Chain Fusion Logo" className="h-7 md:h-8" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <Button 
                                        onClick={() => navigate('/verify')}
                                        className="flex gap-2 items-center rounded-full bg-[#0B0AFF] hover:bg-[#0B0AFF]/90 text-white px-6 py-2.5"
                                    >
                                        Verify Product
                                        <img src={rightArrow} alt="Arrow" className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        className="flex gap-2 items-center rounded-full border border-[#0B0AFF] text-[#0B0AFF] hover:bg-[#0B0AFF]/10 px-6 py-2.5"
                                    >
                                        Book demo
                                    </Button>
                                </div>
                            </div>
                            <div className="lg:flex-1 flex justify-center lg:justify-end">
                                <img 
                                    className="w-full max-w-lg lg:max-w-none" 
                                    src={herobg} 
                                    alt="TrueOrigin Hero" 
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Transition Section */}
                <section className="bg-gradient-to-b from-[#0B0AFF] to-[#6299FF] py-12 md:py-20">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="flex flex-col text-center gap-4 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16">
                            <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold">
                                Simple. Seamless.
                            </h2>
                            <p className="text-white text-base md:text-lg opacity-90">
                                Enjoy a smooth mobile app and desktop experience with easy-to-use, powerful tools to support your entire Web3 journey.
                            </p>
                        </div>
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-[30px] overflow-hidden flex flex-col md:flex-row shadow-xl">
                                <div className="flex flex-col gap-6 md:gap-8 p-6 md:p-10 lg:p-12">
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold font-lexend">
                                        Validate QR to <br /> get ICP / ETH now!
                                    </h3>
                                    <ol className="list-decimal pl-5 text-base space-y-2">
                                        <li>Scan QR Code to validate</li>
                                        <li>Open Telegram wallet and get coin address</li>
                                        <li>Paste the address on the QR Code landing page</li>
                                        <li>Get bitcoin instantly to your telegram wallet</li>
                                    </ol>
                                    <div className="mt-2">
                                        <Button 
                                            variant="outline"
                                            className="rounded-full text-[#0B0AFF] border-[#0B0AFF] hover:bg-[#0B0AFF] hover:text-white"
                                        >
                                            Get started with deposits
                                        </Button>
                                    </div>
                                </div>
                                <div className="hidden md:block md:flex-1">
                                    <img 
                                        className="w-full h-full object-cover object-left" 
                                        src={featureBg} 
                                        alt="Feature" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stakeholders Section */}
                <section className="py-12 md:py-20">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="flex flex-col text-center gap-4 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16">
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-lexend">
                                Securing the chains between parties
                            </h2>
                            <p className="text-gray-800 text-base md:text-lg">
                                We believe that solutions will be applied to ecosystem stakeholders to strengthen the supply chain
                            </p>
                        </div>
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-[#FFB73B] rounded-[30px] overflow-hidden flex flex-col md:flex-row shadow-lg mb-12 md:mb-16">
                                <div className="p-6 md:p-10 lg:p-12 w-full md:w-2/3">
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold font-lexend">
                                            Safeguarding on <span className="text-[#2C42C0]">TrueOrigin</span>
                                        </h3>
                                        <p className="text-base">
                                            We know that working together as a community is better for everyone. Our platform enables blockchain developers to build their Apps and wallets natively and connect with millions of users, without having to worry about the low-level implementation details.
                                        </p>
                                    </div>
                                    <div className="mt-6 md:mt-10">
                                        <Button className="rounded-full bg-white text-black hover:bg-black hover:text-white px-6 py-2.5">
                                            Check out our Developer Docs
                                        </Button>
                                    </div>
                                </div>
                                <div className="hidden md:block md:flex-1">
                                    <img 
                                        src={customerBg} 
                                        alt="Customer Background"
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                            
                            {/* Stakeholder Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-16">
                                {landingCardData.map((data) => (
                                    <LandingCard key={data.title} {...data} />
                                ))}
                            </div>
                            
                            <div className="flex justify-center">
                                <Button 
                                    variant="outline"
                                    className="rounded-full border-black hover:bg-[#FFB73B] hover:border-[#FFB73B] transition-colors duration-300"
                                >
                                    Learn more about privacy & security
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
                
                <hr className="max-w-6xl mx-auto" />
                
                {/* Technology Section */}
                <section className="py-12 md:py-20">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* ICP Card */}
                                <div className="flex flex-col bg-[#1A1A1A] rounded-[30px] overflow-hidden">
                                    <div className="flex flex-col gap-4 p-6 md:p-10 lg:p-12 flex-1">
                                        <h3 className="text-3xl md:text-4xl text-white font-lexend font-bold">ICP</h3>
                                        <p className="text-white/90">
                                            Fully built on the ICP platform, ECDSA enhances security for digital certification beyond existing solutions. Additionally, low latency and low storage costs are highly suitable for big data processing, leading to significant cost savings.
                                        </p>
                                        <div className="mt-4">
                                            <Button className="bg-gradient-to-r from-[#3B00B9] to-[#29ABE2] text-white hover:opacity-95 px-5 py-3 rounded-lg font-medium">
                                                ICP INFRASTRUCTURE
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <img 
                                            src={icInfra} 
                                            alt="ICP Infrastructure"
                                            className="w-full" 
                                        />
                                    </div>
                                </div>
                                
                                {/* Ethereum Card */}
                                <div className="flex flex-col bg-[#1A1A1A] rounded-[30px] overflow-hidden">
                                    <div className="flex flex-col gap-4 p-6 md:p-10 lg:p-12 flex-1">
                                        <h3 className="text-3xl md:text-4xl text-white font-lexend font-bold">Ethereum</h3>
                                        <p className="text-white/90">
                                            Support Ethereum through HTTPS Outcalls to enable wallet transaction for user's incentivization. Widely adopted coin makes ETH becomes everyone's favorite.
                                        </p>
                                        <div className="mt-4">
                                            <Button className="bg-gradient-to-r from-[#FC8941] to-[#5D29E2] text-white hover:opacity-95 px-5 py-3 rounded-lg font-medium">
                                                ETHEREUM COINS
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <img 
                                            src={eCoin} 
                                            alt="Ethereum Coins"
                                            className="w-full" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Chain Fusion Section */}
                <section className="py-10 md:py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 flex justify-center">
                        <img 
                            className="w-full max-w-4xl" 
                            src={cFusion} 
                            alt="Chain Fusion" 
                        />
                    </div>
                </section>
                
                {/* Footer */}
                <footer className="bg-gray-900 text-white py-8 mt-auto">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-center md:text-left">
                                &copy; 2024 TrueOrigin, Inc. All rights reserved.
                            </div>
                            <div className="flex flex-wrap justify-center gap-6">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
                            </div>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}

export default Homepage;
