import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Principal } from "@dfinity/principal";
import { useAuthContext } from '../../contexts/useAuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from "lucide-react";

// assets
import TrueOriginLogo from '../../assets/true-origin.png'
import BrandOwnerIcon from '../../assets/party-1.png' 
import ResellerIcon from '../../assets/party-2.png'
import CustomerIcon from '../../assets/party-3.png'
import InternetIdentityLogo from '../../assets/InternetIdentityLogo.png'

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { OrganizationPublic } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';

// Schema for brand owner form
const brandOwnerSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
  description: z.string().min(1, "Description is required"),
});

// Schema for reseller form
const resellerSchema = z.object({
  name: z.string().min(1, "Shop name is required").max(100),
  shopIdTokopedia: z.string().optional(),
  shopIdShopee: z.string().optional(),
  orgId: z.string().min(1, "Organization is required"),
});

type BrandOwnerFormValues = z.infer<typeof brandOwnerSchema>;
type ResellerFormValues = z.infer<typeof resellerSchema>;

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
    const { login, isAuthenticated, profile, signinAsBrandOwner, signinAsReseller, isLoading: isAuthContextLoading, selectOrganization } = useAuthContext();
    const [selectedRole, setSelectedRole] = useState<'brandOwner' | 'reseller' | 'customer' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [organizations, setOrganizations] = useState<OrganizationPublic[]>([]);
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
    const [orgSearchValue, setOrgSearchValue] = useState("");
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [multipleOrgs, setMultipleOrgs] = useState<OrganizationPublic[]>([]);
    const [isOrgSelectionOpen, setIsOrgSelectionOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    
    // Combined loading state - either local auth loading or context loading
    const isLoading = isAuthLoading || isAuthContextLoading;
    
    // Log loading state changes
    useEffect(() => {
        console.log("[DEBUG] Loading state changed:", {
            isAuthLoading,
            isAuthContextLoading,
            combinedLoading: isLoading
        });
    }, [isAuthLoading, isAuthContextLoading, isLoading]);
    
    // Add a safety timeout to clear loading state after 10 seconds
    useEffect(() => {
        if (isLoading) {
            const safetyTimeout = setTimeout(() => {
                console.log("[DEBUG] Safety timeout triggered - clearing loading state");
                setIsAuthLoading(false);
            }, 10000); // 10 seconds timeout
            
            return () => clearTimeout(safetyTimeout);
        }
    }, [isLoading]);
    
    // Forms for both roles
    const brandOwnerForm = useForm<BrandOwnerFormValues>({
      resolver: zodResolver(brandOwnerSchema),
      defaultValues: {
        name: '',
        description: '',
      }
    });

    const resellerForm = useForm<ResellerFormValues>({
      resolver: zodResolver(resellerSchema),
      defaultValues: {
        name: '',
        shopIdTokopedia: '',
        shopIdShopee: '',
        orgId: '',
      }
    });

    const handleRoleSelect = (role: 'brandOwner' | 'reseller' | 'customer') => {
        setSelectedRole(role);
    };

    const handleAuthenticate = () => {
        if (!selectedRole) {
            // Show error or prompt user to select a role
            alert('Please select a role first');
            return;
        }
        
        console.log("[DEBUG] Starting authentication with role:", selectedRole);
        // Store the selected role to use after authentication
        localStorage.setItem('selectedRole', selectedRole);
        console.log("[DEBUG] Stored role in localStorage:", selectedRole);
        
        // Set loading state
        setIsAuthLoading(true);
        
        // Start Internet Identity authentication
        login();
        console.log("[DEBUG] Called login() function");
    };

    // Function to search for organizations
    const handleOrgSearch = async (search: string) => {
      setOrgSearchValue(search);
      if (search.length > 0) {
        setIsLoadingOrgs(true);
        try {
          const results = await TrustOrigin_backend.find_organizations_by_name(search);
          setOrganizations(results);
        } catch (error) {
          console.error('Error searching for organizations:', error);
          setOrganizations([]);
        } finally {
          setIsLoadingOrgs(false);
        }
      } else {
        setOrganizations([]);
      }
    };

    // Submit handler for brand owner form
    const onBrandOwnerSubmit = (data: BrandOwnerFormValues) => {
      console.log("[DEBUG] Submitting brand owner form:", data);
      signinAsBrandOwner({
        name: data.name,
        description: data.description,
        metadata: []
      });
      console.log("[DEBUG] Setting registrationComplete to true for brand owner");
      setRegistrationComplete(true);
      setIsModalOpen(false);
    };

    // Submit handler for reseller form
    const onResellerSubmit = (data: ResellerFormValues) => {
      console.log("[DEBUG] Submitting reseller form:", data);
      const ecommerceUrls = [];
      
      if (data.shopIdShopee) {
        ecommerceUrls.push({
          key: 'Shopee',
          value: data.shopIdShopee
        });
      }
      
      if (data.shopIdTokopedia) {
        ecommerceUrls.push({
          key: 'Tokopedia',
          value: data.shopIdTokopedia
        });
      }

      signinAsReseller({
        name: data.name,
        org_id: Principal.fromText(data.orgId),
        ecommerce_urls: ecommerceUrls,
        metadata: []
      });
      console.log("[DEBUG] Setting registrationComplete to true for reseller");
      setRegistrationComplete(true);
      setIsModalOpen(false);
    };

    // Function to handle organization selection
    const handleOrgSelect = (orgId: string) => {
        console.log("[DEBUG] Selected organization with ID:", orgId);
        setSelectedOrgId(orgId);
        setIsOrgSelectionOpen(false);
        
        // Update selected organization in auth context
        try {
            const principalOrgId = Principal.fromText(orgId);
            console.log("[DEBUG] Calling selectOrganization with Principal:", principalOrgId.toString());
            selectOrganization(principalOrgId);
            
            // Get user role to determine redirect path
            const role = profile?.user_role?.[0];
            if (role && 'BrandOwner' in role) {
                console.log("[DEBUG] Redirecting to brand-owners/products with selected org:", orgId);
                navigate('/brand-owners/products');
            } else if (role && 'Reseller' in role) {
                console.log("[DEBUG] Redirecting to reseller/dashboard with selected org:", orgId);
                navigate('/reseller/dashboard');
            }
        } catch (error) {
            console.error("[DEBUG] Error selecting organization:", error);
        }
    };

    // Modified useEffect to handle different org scenarios
    useEffect(() => {
        console.log("[DEBUG] Login page useEffect running with deps:", { 
            isAuthenticated, 
            hasProfile: !!profile,
            registrationComplete,
            modalOpen: isModalOpen,
            orgSelectionOpen: isOrgSelectionOpen,
            orgIds: profile?.org_ids?.length || 0,
            userRole: profile?.user_role?.[0] ? Object.keys(profile.user_role[0])[0] : null,
            loading: isLoading,
            authLoading: isAuthLoading,
            contextLoading: isAuthContextLoading
        });

        // Only proceed if authenticated and profile loaded and not in loading state
        if (isAuthenticated && profile && !isLoading) {
            // Get org IDs and user role
            const orgIds = profile.org_ids || [];
            const userRole = profile.user_role && profile.user_role.length > 0 ? profile.user_role[0] : null;
            const isBrandOwner = userRole && 'BrandOwner' in userRole;
            const isReseller = userRole && 'Reseller' in userRole;
            
            console.log("[DEBUG] Profile status:", { 
                orgCount: orgIds.length, 
                isBrandOwner, 
                isReseller 
            });
            
            // We have user data now, can turn off local loading
            if (isAuthLoading) {
                setIsAuthLoading(false);
            }
            
            // Handle the different scenarios based on org_ids length
            if (orgIds.length === 0) {
                // No organizations associated with user
                if (!registrationComplete) {
                    const storedRole = localStorage.getItem('selectedRole');
                    
                    if (storedRole === 'brandOwner' || storedRole === 'reseller') {
                        console.log("[DEBUG] No orgs found, showing registration modal for:", storedRole);
                        setSelectedRole(storedRole as 'brandOwner' | 'reseller');
                        setIsModalOpen(true);
                    } else if (storedRole === 'customer') {
                        console.log("[DEBUG] Customer role, redirecting to dashboard");
                        localStorage.removeItem('selectedRole');
                        navigate('/dashboard');
                    }
                }
            } else if (orgIds.length === 1) {
                // Exactly one organization - proceed to redirect
                if (!isModalOpen && !isOrgSelectionOpen) {
                    console.log("[DEBUG] Single org found, redirecting");
                    localStorage.removeItem('selectedRole');
                    
                    if (isBrandOwner) {
                        console.log("[DEBUG] Redirecting to brand-owners/products");
                        navigate('/brand-owners/products');
                    } else if (isReseller) {
                        console.log("[DEBUG] Redirecting to reseller/dashboard");
                        navigate('/reseller/dashboard');
                    } else {
                        console.log("[DEBUG] Redirecting to dashboard (default)");
                        navigate('/dashboard');
                    }
                }
            } else if (orgIds.length > 1 && !isOrgSelectionOpen && !isModalOpen) {
                // Multiple organizations - need to show selection dialog
                console.log("[DEBUG] Multiple orgs found, fetching org details");
                
                // Fetch organization details for the selection dialog
                const fetchOrgs = async () => {
                    try {
                        const orgPromises = orgIds.map(id => 
                            TrustOrigin_backend.get_organization_by_id_v2(id)
                                .then(res => res.data?.[0]?.organization || null)
                        );
                        
                        const orgs = (await Promise.all(orgPromises)).filter(org => org !== null) as OrganizationPublic[];
                        console.log("[DEBUG] Fetched organizations:", orgs);
                        
                        if (orgs.length > 0) {
                            setMultipleOrgs(orgs);
                            setIsOrgSelectionOpen(true);
                        } else {
                            console.log("[DEBUG] No valid organizations found, showing registration");
                            setIsModalOpen(true);
                        }
                    } catch (error) {
                        console.error("[DEBUG] Error fetching organizations:", error);
                    }
                };
                
                fetchOrgs();
            }
        }
        
        // Handle redirect after registration completed
        if (registrationComplete && profile && profile.user_role && profile.user_role.length > 0) {
            console.log("[DEBUG] Registration complete, redirecting with profile");
            
            // Clear the stored role
            localStorage.removeItem('selectedRole');
            
            const role = profile.user_role[0];
            if (role && 'BrandOwner' in role) {
                console.log("[DEBUG] Redirecting to brand-owners/products after registration");
                navigate('/brand-owners/products');
            } else if (role && 'Reseller' in role) {
                console.log("[DEBUG] Redirecting to reseller/dashboard after registration");
                navigate('/reseller/dashboard');
            } else {
                console.log("[DEBUG] Redirecting to dashboard (default) after registration");
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, profile, registrationComplete, navigate, isModalOpen, isOrgSelectionOpen, isAuthLoading, isAuthContextLoading]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col">
                    <Loader2 className="h-12 w-12 text-cyan-600 animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Authenticating...</h3>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we complete your authentication</p>
                    
                    {/* Add a button to manually dismiss the loading screen if needed */}
                    <button 
                        className="mt-8 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => {
                            console.log("[DEBUG] Loading screen manually dismissed");
                            setIsAuthLoading(false);
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

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

            {/* Profile Completion Modal */}
            <Dialog 
                open={isModalOpen} 
                onOpenChange={setIsModalOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRole === 'brandOwner' ? 'Complete Brand Owner Profile' : 'Complete Reseller Profile'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedRole === 'brandOwner' ? (
                        <form onSubmit={brandOwnerForm.handleSubmit(onBrandOwnerSubmit)}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="brand-name" className="text-sm font-medium">Organization Name</label>
                                    <Input 
                                        id="brand-name"
                                        placeholder="Enter your organization name" 
                                        {...brandOwnerForm.register('name')}
                                    />
                                    {brandOwnerForm.formState.errors.name && (
                                        <p className="text-sm text-red-500">{brandOwnerForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="brand-description" className="text-sm font-medium">Description</label>
                                    <Input 
                                        id="brand-description"
                                        placeholder="Enter a short description" 
                                        {...brandOwnerForm.register('description')}
                                    />
                                    {brandOwnerForm.formState.errors.description && (
                                        <p className="text-sm text-red-500">{brandOwnerForm.formState.errors.description.message}</p>
                                    )}
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button type="submit">Complete Profile</Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <form onSubmit={resellerForm.handleSubmit(onResellerSubmit)}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="reseller-name" className="text-sm font-medium">Shop Name</label>
                                    <Input 
                                        id="reseller-name"
                                        placeholder="Enter your shop name" 
                                        {...resellerForm.register('name')}
                                    />
                                    {resellerForm.formState.errors.name && (
                                        <p className="text-sm text-red-500">{resellerForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="shopee-id" className="text-sm font-medium">Shop ID at Shopee</label>
                                    <Input 
                                        id="shopee-id"
                                        placeholder="Enter your Shopee shop ID (optional)" 
                                        {...resellerForm.register('shopIdShopee')}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="tokopedia-id" className="text-sm font-medium">Shop ID at Tokopedia</label>
                                    <Input 
                                        id="tokopedia-id"
                                        placeholder="Enter your Tokopedia shop ID (optional)" 
                                        {...resellerForm.register('shopIdTokopedia')}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="org-dropdown" className="text-sm font-medium">Brand Organization</label>
                                    <div className="relative">
                                        <Input 
                                            id="org-search"
                                            placeholder="Search for an organization" 
                                            value={orgSearchValue}
                                            onChange={(e) => handleOrgSearch(e.target.value)}
                                        />
                                        
                                        {organizations.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                                {isLoadingOrgs ? (
                                                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                                                ) : (
                                                    organizations.map((org) => (
                                                        <div 
                                                            key={org.id.toString()} 
                                                            className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => {
                                                                resellerForm.setValue('orgId', org.id.toString());
                                                                setOrgSearchValue(org.name);
                                                                setOrganizations([]);
                                                            }}
                                                        >
                                                            {org.name}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <input type="hidden" {...resellerForm.register('orgId')} />
                                    {resellerForm.formState.errors.orgId && (
                                        <p className="text-sm text-red-500">{resellerForm.formState.errors.orgId.message}</p>
                                    )}
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button type="submit">Complete Profile</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Organization Selection Dialog */}
            <Dialog
                open={isOrgSelectionOpen}
                onOpenChange={setIsOrgSelectionOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Select Organization
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-500">
                            You have multiple organizations. Please select which one you'd like to access.
                        </p>
                        
                        <div className="space-y-2 max-h-60 overflow-auto">
                            {multipleOrgs.map((org) => (
                                <div 
                                    key={org.id.toString()}
                                    onClick={() => handleOrgSelect(org.id.toString())}
                                    className="flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mr-3">
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{org.name}</h3>
                                        <p className="text-xs text-gray-500">{org.id.toString().slice(0, 10)}...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOrgSelectionOpen(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LoginPage;