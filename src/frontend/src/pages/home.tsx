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


const landingCardData = [
    {
        title: "Brand Owners",
        description: "Use our Encrypted Cloud Backup for increased wallet security.",
        image: party1
    },
    {
        title: "Resellers",
        description: "We don't track any personal information, including your IP address or balances.",
        image: party2
    },
    {
        title: "Customers",
        description: "Stay safe with alerts for risky address and dApp connections.",
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
                <header className="w-full bg-white shadow sticky top-0">
                    <nav className="container mx-auto px-6 py-6 md:py-12 flex justify-between items-center">
                        <img src={logo} width={150} />
                        <div className="hidden md:flex gap-4 md:gap-8">
                            <a href="#" className="text-gray-600">Homepage</a>
                            <a href="#" className="text-gray-600">Brand Owners Dashboard</a>
                            <a href="#" className="text-gray-600">Resellers Dashboard</a>
                            <a onClick={() => navigate('/verify')} className="text-purple-600">Verify Product</a>
                            <a onClick={() => navigate('/auth/login')} className="text-purple-600">Login</a>
                        </div>
                        <button
                            className="md:hidden flex items-center text-gray-600"
                            onClick={toggleMenu}
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
                        <div className="md:hidden flex flex-col items-center bg-white shadow-lg">
                            <a href="#" className="py-2 text-gray-600" onClick={toggleMenu}>
                                Homepage
                            </a>
                            <a href="#" className="py-2 text-gray-600" onClick={toggleMenu}>
                                Brand Owners Dashboard
                            </a>
                            <a href="#" className="py-2 text-gray-600" onClick={toggleMenu}>
                                Resellers Dashboard
                            </a>
                            <a className="py-2 text-purple-600" onClick={() => {toggleMenu(); navigate('/verify');}}>
                                Verify Product
                            </a>
                            <a className="py-2 text-purple-600" onClick={() => {toggleMenu(); navigate('/auth/login');}}>
                                Login
                            </a>
                        </div>
                    )}
                </header>

                <section className="bg-white font-lexend">
                    <div className="flex flex-col-reverse lg:flex-row pl-6 lg:pl-44 md:pl-20 py-10 lg:py-20 md:justify-between">
                        <div className="flex flex-col justify-center gap-4 md:gap-8">
                            <h1 className="text-4xl md:text-6xl">Incentivizing <br /> Genuine Product Transactions</h1>
                            <p className="text-base md:text-lg text-gray-600">Safely sell your products and increase customer's trust</p>
                            <div className="flex flex-col gap-2">
                                <p className="text-gray-600">Powered by</p>
                                <div className="flex gap-3 md:gap-5">
                                    <img src={icLogo} className="h-6 md:h-8" />
                                    <img src={cfLogo} className="h-6 md:h-8" />
                                </div>
                            </div>
                            <div className="flex gap-3 md:gap-5">
                                <a 
                                    onClick={() => navigate('/verify')}
                                    className="flex gap-2 items-center justify-center rounded-full bg-[#0B0AFF] w-fit py-2 md:py-3 px-4 md:px-5 text-white hover:bg-blue-800 hover:cursor-pointer"
                                >
                                    <p>Verify Product</p>
                                    <img src={rightArrow} className="h-4 md:h-5" />
                                </a>
                                <a className="flex gap-2 items-center justify-center rounded-full border border-[#0B0AFF] w-fit py-2 md:py-3 px-4 md:px-5 text-[#0B0AFF] hover:bg-blue-50 hover:cursor-pointer">
                                    <p>Book demo</p>
                                </a>
                            </div>
                        </div>
                        <div className="mb-10 md:mb-0 flex justify-end">
                            <img className="w-4/5 h-auto md:h-full" src={herobg} />
                        </div>
                    </div>
                </section>

                <section className="bg-gradient-to-b from-[#0B0AFF] to-[#6299FF]">
                    <div className="flex flex-col text-center p-10 md:p-20 gap-3 md:gap-5">
                        <p className="text-white text-4xl md:text-6xl">Simple. Seamless.</p>
                        <p className="text-white text-base md:text-lg">Enjoy a smooth mobile app and desktop experience with easy-to-use, powerful tools to support your entire Web3 journey.</p>
                    </div>
                    <div className="px-6 lg:px-44 md:px-20 mb-10 md:mb-20">
                        <div className="bg-white rounded-[30px] flex flex-col md:flex-row justify-between">
                            <div className="flex flex-col gap-4 md:gap-8 px-6 md:px-20 py-6 md:py-10">
                                <p className="text-2xl md:text-4xl font-lexend">Validate QR to <br /> get ICP / ETH now!</p>
                                <ol className="list-decimal pl-4 text-sm md:text-base">
                                    <li>Scan QR Code to validate</li>
                                    <li>Open Telegram wallet and get coin address</li>
                                    <li>Paste the address on the QR Code landing page</li>
                                    <li>Get bitcoin instantly to your telegram wallet</li>
                                </ol>
                                <a className="rounded-full w-fit text-[#0B0AFF] border border-[#0B0AFF] py-2 md:py-3 px-4 md:px-5 bg-white hover:bg-[#0B0AFF] hover:text-white hover:cursor-pointer">Get started with deposits</a>
                            </div>
                            <div className="hidden md:flex md:items-end">
                                <img className="rounded-br-[30px] w-full md:w-auto max-h-[200px] md:max-h-[300px]" src={featureBg} />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex flex-col text-center p-10 md:p-20 gap-3 md:gap-5">
                        <p className="text-4xl md:text-6xl font-lexend">Securing the chains between parties</p>
                        <p className="text-gray-800 text-base md:text-lg">We believe that solutions will be applied to ecosystem stakeholders to strengthen the supply chain</p>
                    </div>
                    <div className="px-6 lg:px-44 md:px-20 mb-10 md:mb-20">
                        <div className="bg-[#FFB73B] rounded-[30px] flex flex-col md:flex-row justify-between">
                            <div className="px-6 md:px-20 py-6 md:py-10 w-full md:w-2/3">
                                <div className="flex flex-col gap-2">
                                    <p className="text-2xl md:text-4xl font-semibold font-lexend">Safeguarding on <span className="text-[#2C42C0]">TrueOrigin</span></p>
                                    <p className="text-sm md:text-base">We know that working together as a community is better for everyone. Our platform enables blockchain developers to build their Apps and wallets natively and connect with millions of users, without having to worry about the low-level implementation details.</p>
                                </div>
                                <div className="mt-6 md:mt-10">
                                    <a className="rounded-full bg-white py-2 md:py-3 px-6 md:px-10 hover:bg-black hover:text-white hover:cursor-pointer">Check out our Developer Docs</a>
                                </div>
                            </div>
                            <div className="hidden md:flex">
                                <img src={customerBg} className="w-full h-auto rounded-tr-[30px] max-h-[200px] md:max-h-[350px]" />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 text-white mt-10 md:mt-20">
                            {landingCardData.map((data) => <LandingCard key={data.title} {...data} />)}
                        </div>
                        <div className="flex justify-center mt-10">
                            <a className="rounded-full bg-white border border-black py-2 md:py-3 px-6 md:px-10 hover:cursor-pointer hover:bg-[#FFB73B]">Learn more about privacy & security</a>
                        </div>
                    </div>
                </section>
                <hr></hr>
                <section className="flex flex-col lg:flex-row justify-between gap-8 lg:px-44 px-5 py-20">
                    <div className="flex flex-col bg-[#1A1A1A] basis-1/2 rounded-[30px] justify-between items-end">
                        <div className="flex flex-col gap-4 lg:p-20 p-10">
                            <p className="text-4xl text-white font-lexend">ICP</p>
                            <p className="text-white">Fully built on the ICP platform, ECDSA enhances security for digital certification beyond existing solutions. Additionally, low latency and low storage costs are highly suitable for big data processing, leading to significant cost savings.</p>
                            <div className="mt-4">
                                <a className="bg-gradient-to-r from-[#3B00B9] to-[#29ABE2] px-5 py-3 rounded-[10px] text-white font-lexend hover:cursor-pointer">ICP INFRASTRUCTURE</a>
                            </div>
                        </div>
                        <div className="max-w-[500px]">
                            <img src={icInfra} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-[#1A1A1A] basis-1/2 rounded-[30px] justify-between items-end">
                        <div className="flex flex-col gap-4 lg:p-20 p-10">
                            <p className="text-4xl text-white font-lexend">Ethereum</p>
                            <p className="text-white">Support Ethereum through HTTPS Outcalls to enable wallet transaction for user's incentivization. Widely adopted coin makes ETH becomes everyone's favorite.</p>
                            <div className="mt-4">
                                <a className="bg-gradient-to-r from-[#FC8941] to-[#5D29E2] px-5 py-3 rounded-[10px] text-white font-lexend hover:cursor-pointer">ETHEREUM COINS</a>
                            </div>
                        </div>
                        <div className="max-w-[500px]">
                            <img src={eCoin} />
                        </div>
                    </div>
                </section>
                <section className="flex p-20 justify-center">
                    <img className="w-3/4 max-w-[1200px]" src={cFusion} />
                </section>
                {/* <!-- Footer --> */}
                <footer className="bg-gray-900 text-white py-6 mt-auto">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-3 md:mb-0">&copy; 2024 TrueOrigin, Inc. | Privacy | Terms | Sitemap</div>
                        <div className="flex space-x-3">
                            <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                            <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                            <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
                            <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}

export default Homepage;
