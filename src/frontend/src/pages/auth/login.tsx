import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

import { useAuthContext } from '../../contexts/useAuthContext';

// assets
import WelcomePageImage from '../../assets/Asset-WelcomePage.webp'
import RoboLoginPageImage from '../../assets/Robo-LoginPage.webp'
import TrueOriginLogo from '../../assets/true-origin.png'
import InternetIdentityLogo from '../../assets/InternetIdentityLogo.png'

const LoginPage = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated, profile } = useAuthContext()

    const handleSubmitLogin = () => {
        login();
    }

    useEffect(() => {
        if (isAuthenticated && profile) {
            navigate('/dashboard')
        }
        if (isAuthenticated && !profile) {
            navigate('/auth/choose-role')
        }
    }, [isAuthenticated, profile, navigate])

    return (
        <div className="flex flex-row bg-white">
            <div className="flex justify-around gap-5 max-md:flex-col max-md:gap-0">
                <div className="flex flex-col w-[50%] max-md:ml-0 max-md:w-full">
                    <div className="flex flex-col grow items-center px-5 mt-20 max-md:mt-10 max-md:max-w-full">
                        <div className="flex gap-0 max-md:pr-5">
                            <img
                                loading="lazy"
                                src={TrueOriginLogo}
                                className="shrink-0 max-w-full aspect-[1.09] w-[100px]"
                            />
                        </div>
                        <div className="mt-7 text-5xl text-[2vw] font-semibold text-center text-cyan-600 max-md:max-w-full">
                            Create an Account
                        </div>
                        <img
                            loading="lazy"
                            src={WelcomePageImage}
                            className="self-stretch mt-10 w-full aspect-[1.43] max-md:mt-10 max-md:max-w-full"
                        />
                    </div>
                </div>
                <div className="flex">
                    <div className="flex flex-col self-stretch my-auto text-base font-light text-center text-cyan-600 max-md:mt-10 max-md:max-w-full">
                        <img
                            loading="lazy"
                            src={RoboLoginPageImage}
                            className="w-full md:w-10/12 lg:max-w-full max-w-full md:max-w-sm xl:max-w-lg object-cover"
                        />
                        <div className="w-[110%] lg:top-[70%] md:top-[90%] right-0 -translate-y-[300%]">
                            <button onClick={handleSubmitLogin} className="text-white border-[none] flex gap-3.5 py-4 pr-3.5 pl-7 font-bold text-center text-white bg-cyan-500 rounded-xl border border-solid border-zinc-800 border-opacity-0 transition-opacity duration-500 hover:opacity-80 md-4">
                                <div className="flex-auto border border-solid border-zinc-800 border-opacity-0">
                                    Sign In Here with Internet Identity
                                </div>
                                <img
                                    loading="lazy"
                                    src={InternetIdentityLogo}
                                    className="shrink-0 max-w-full aspect-[3.7] w-[113px] justify-around self-center border border-solid border-zinc-800 border-opacity-0"
                                />
                            </button>
                            <div className="flex gap-3.5 py-4 pr-3.5 pl-72">
                                <Link to="/privacy">
                                    <div className="grow my-auto">Privacy and T&C</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;