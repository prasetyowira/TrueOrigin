import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Principal } from "@dfinity/principal";
import { useAuthContext } from '../../contexts/useAuthContext';

// assets
import TrueOriginLogo from '../../assets/true-origin.png'
import BrandOwnerIcon from '../../assets/party-1.png' 
import ResellerIcon from '../../assets/party-2.png'
import CustomerIcon from '../../assets/party-3.png'
import InternetIdentityLogo from '../../assets/InternetIdentityLogo.png'

/**
 * Role selection card component
 */
const RoleCard = ({ 
  title, 
  description, 
  icon, 
  isSelected, 
  onSelect 
}: { 
  title: string; 
  description: string; 
  icon: string;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  return (
    <div 
      className={`relative bg-white rounded-xl shadow-md p-5 mx-2 cursor-pointer transition-all duration-300 ${isSelected ? 'border-2 border-cyan-500 scale-105' : 'border border-gray-200 hover:shadow-lg'}`}
      onClick={onSelect}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 mr-3 overflow-hidden rounded-full bg-gray-100">
            <img src={icon} alt={title} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        {isSelected && (
          <div className="mt-auto pt-3">
            <div className="w-full text-center py-2 px-4 bg-cyan-500 text-white rounded-lg">
              Selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, profile, signinAsBrandOwner, signinAsReseller } = useAuthContext();
    const [selectedRole, setSelectedRole] = useState<'brandOwner' | 'reseller' | 'customer' | null>(null);

    const handleRoleSelect = (role: 'brandOwner' | 'reseller' | 'customer') => {
        setSelectedRole(role);
    };

    const handleAuthenticate = () => {
        if (!selectedRole) {
            // Show error or prompt user to select a role
            alert('Please select a role first');
            return;
        }
        
        // Store the selected role to use after authentication
        localStorage.setItem('selectedRole', selectedRole);
        
        // Start Internet Identity authentication
        login();
    };

    useEffect(() => {
        // If authenticated but no profile, assign the role
        if (isAuthenticated && !profile) {
            const storedRole = localStorage.getItem('selectedRole');
            
            if (storedRole === 'brandOwner') {
                signinAsBrandOwner({
                    name: 'My Brand',
                    description: 'Brand Owner Account',
                    metadata: []
                });
            } else if (storedRole === 'reseller') {
                signinAsReseller({
                    name: 'My Reseller Shop',
                    org_id: Principal.anonymous(),
                    ecommerce_urls: [],
                    metadata: []
                });
            }
            // Customer role doesn't need special registration
            
            // Clear the stored role
            localStorage.removeItem('selectedRole');
        }
        
        // If authenticated with profile, redirect to dashboard
        if (isAuthenticated && profile && profile.user_role && profile.user_role.length > 0) {
            const role = profile.user_role[0];
            if (role && 'BrandOwner' in role) {
                navigate('/dashboard');
            } else if (role && 'Reseller' in role) {
                navigate('/reseller');
            } else {
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, profile, navigate, signinAsBrandOwner, signinAsReseller]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-6 py-8 sm:p-10">
                        <div className="text-center mb-8">
                            <img src={TrueOriginLogo} alt="TrueOrigin Logo" className="h-16 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-gray-900">Login</h1>
                        </div>
                        
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Select Your Role</h2>
                            <div className="flex flex-col md:flex-row gap-4 mb-8">
                                <RoleCard
                                    title="Brand Owner"
                                    description="Safeguard Genuine Products by creating a digital identity using ECDSA key generation."
                                    icon={BrandOwnerIcon}
                                    isSelected={selectedRole === 'brandOwner'}
                                    onSelect={() => handleRoleSelect('brandOwner')}
                                />
                                <RoleCard
                                    title="Reseller"
                                    description="Get Authorized and Safely resell products from Brand Owners."
                                    icon={ResellerIcon}
                                    isSelected={selectedRole === 'reseller'}
                                    onSelect={() => handleRoleSelect('reseller')}
                                />
                                <RoleCard
                                    title="Customer"
                                    description="Validate QR Code and Get the Incentives"
                                    icon={CustomerIcon}
                                    isSelected={selectedRole === 'customer'}
                                    onSelect={() => handleRoleSelect('customer')}
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <button
                                onClick={handleAuthenticate}
                                disabled={!selectedRole}
                                className={`flex items-center justify-center px-8 py-3 rounded-xl shadow-md w-full max-w-md transition-all duration-300 ${
                                    selectedRole 
                                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <span className="mr-3">Authenticate with Internet Identity</span>
                                <img src={InternetIdentityLogo} alt="Internet Identity" className="h-6" />
                            </button>
                            
                            <div className="mt-4 text-sm text-gray-600">
                                <Link to="/privacy" className="hover:text-cyan-600">Privacy Policy and Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;