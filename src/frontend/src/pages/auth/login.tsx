import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from "lucide-react";

// Hooks
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
    useInitializeUserSession, 
    useCreateOrganizationForOwner, 
    useSelectActiveOrganization, 
    useCompleteResellerProfile, 
    FECompleteResellerProfileRequest
} from '@/hooks/useMutations/authMutations';
import { useFindOrganizationsByName, FEUserRole } from '@/hooks/useQueries/authQueries';

// assets
import TrueOriginLogo from '../../assets/true-origin.png'
import BrandOwnerIcon from '../../assets/party-1.png' 
import ResellerIcon from '../../assets/party-2.png'
import CustomerIcon from '../../assets/party-3.png'
import InternetIdentityLogo from '../../assets/InternetIdentityLogo.png'

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Principal } from '@dfinity/principal';
import type { OrganizationPublic } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';

// Define types for modal form data if not already defined elsewhere
interface BrandOwnerFormData {
  name: string;
  description: string;
}

interface ResellerFormData {
  name: string;
  shopIdShopee?: string;
  shopIdTokopedia?: string;
  contactEmail?: string;
  contactPhone?: string;
  selectedOrgId?: Principal;
  selectedOrgName?: string; // For display purposes
}

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
    const { toast } = useToast();
    const {
        loginWithII,
        isAuthenticated,
        isLoading: isAuthLoading,
        authError,
        user,
        role: authenticatedRole,
        isRegistered,
        brandOwnerDetails,
        resellerDetails,
        currentSelectedRolePreAuth,
        setCurrentSelectedRolePreAuth,
        refetchAuthContext,
    } = useAuth();

    // --- Local State Variables ---
    const [selectedRole, setSelectedRole] = useState<FEUserRole | 'customer' | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isOrgSelectionOpen, setIsOrgSelectionOpen] = useState(false);
    const [modalFormData, setModalFormData] = useState<Partial<BrandOwnerFormData & ResellerFormData>>({});
    const [orgSearchInput, setOrgSearchInput] = useState('');
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    const [loadingText, setLoadingText] = useState('Processing...');

    // --- Mutation Hooks ---
    const initializeSessionMutation = useInitializeUserSession();
    const registerOrgMutation = useCreateOrganizationForOwner();
    const selectOrgMutation = useSelectActiveOrganization();
    const completeResellerProfileMutation = useCompleteResellerProfile();

    // --- Query Hooks ---
    const { 
        data: foundOrgs, 
        isLoading: isLoadingOrgs, 
        error: orgSearchError 
    } = useFindOrganizationsByName(orgSearchInput, orgSearchInput.length >= 3);

    // --- Event Handlers ---
    const handleRoleSelect = useCallback((roleValue: FEUserRole | 'customer') => {
        setSelectedRole(roleValue);
        if (roleValue === 'customer') {
            setCurrentSelectedRolePreAuth(null);
        } else {
            setCurrentSelectedRolePreAuth(roleValue as FEUserRole); 
        }
        logger.debug(`Role selected: ${roleValue}`);
    }, [setCurrentSelectedRolePreAuth]);

    const handleLoginClick = useCallback(async () => {
        if (selectedRole === 'customer') {
            toast({ title: "Customer Flow", description: "Redirecting to verification..." });
            navigate('/verify');
            return;
        }
        if (!currentSelectedRolePreAuth) {
            toast({ title: "Role not selected", description: "Please select a role before proceeding.", variant: "destructive" });
            return;
        }
        setShowLoadingOverlay(true);
        setLoadingText('Authenticating with Internet Identity...');
        try {
            await loginWithII();
        } catch (error) {
            toast({ title: "Login Failed", description: (error as Error).message || "An unknown error occurred during login.", variant: "destructive" });
            setShowLoadingOverlay(false);
        }
    }, [selectedRole, currentSelectedRolePreAuth, loginWithII, navigate, toast]);

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setModalFormData(prev => ({ ...prev, [name]: value }));
    };

    const onBrandOwnerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!modalFormData.name || !modalFormData.description) {
            toast({ title: "Missing fields", description: "Organization name and description are required.", variant: "destructive" });
            return;
        }
        setShowLoadingOverlay(true);
        setLoadingText('Creating your organization...');
        try {
            await registerOrgMutation.mutateAsync({
                name: modalFormData.name,
                description: modalFormData.description,
                metadata: [], 
            });
            toast({ title: "Organization Created", description: "Your organization has been successfully created." });
            setIsProfileModalOpen(false);
            setModalFormData({}); 
            await refetchAuthContext(); 
        } catch (error) {
            toast({ title: "Organization Creation Failed", description: (error as Error).message || "Could not create organization.", variant: "destructive" });
        } finally {
             if (!registerOrgMutation.isSuccess) { 
                setShowLoadingOverlay(false);
            }
        }
    };

    const onResellerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!modalFormData.name || !modalFormData.selectedOrgId) {
            toast({ 
                title: "Missing fields", 
                description: "Shop name and a selected brand organization are required.", 
                variant: "destructive" 
            });
            return;
        }

        setShowLoadingOverlay(true);
        setLoadingText('Completing your reseller profile...');

        const request: FECompleteResellerProfileRequest = {
            reseller_name: modalFormData.name,
            target_organization_id: modalFormData.selectedOrgId,
            contact_email: modalFormData.contactEmail,
            contact_phone: modalFormData.contactPhone,
            // Optional fields based on your FECompleteResellerProfileRequest type in authMutations.ts
            // For now, assuming these are optional or handled if empty by backend/mutations file.
            ecommerce_urls: modalFormData.shopIdShopee || modalFormData.shopIdTokopedia ? [
                ...(modalFormData.shopIdShopee ? [{ key: 'shopee_shop_id', value: modalFormData.shopIdShopee }] : []),
                ...(modalFormData.shopIdTokopedia ? [{ key: 'tokopedia_shop_id', value: modalFormData.shopIdTokopedia }] : []),
            ] : [],
            // contact_email: [], // Or from modalFormData if you add these fields
            // contact_phone: [],
            // additional_metadata: [],
        };

        try {
            await completeResellerProfileMutation.mutateAsync(request);
            toast({ title: "Profile Complete", description: "Your reseller profile has been successfully submitted." });
            setIsProfileModalOpen(false);
            setModalFormData({}); 
            setOrgSearchInput(''); // Clear search input as well
            await refetchAuthContext(); 
            // The main useEffect should now handle navigation based on updated resellerDetails
        } catch (error) {
            toast({ 
                title: "Profile Completion Failed", 
                description: (error as Error).message || "Could not complete your profile.", 
                variant: "destructive" 
            });
        } finally {
            if (!completeResellerProfileMutation.isSuccess) {
                setShowLoadingOverlay(false);
            }
        }
    };

    const handleOrgSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrgSearchInput(e.target.value);
    };

    const handleOrgSelectFromDropdown = (org: OrganizationPublic) => {
        setModalFormData(prev => ({ ...prev, selectedOrgId: org.id, selectedOrgName: org.name }));
        setOrgSearchInput(org.name); 
    };
    
    const handleOrgSelectSubmitWrapper = async (orgId: Principal) => {
        setShowLoadingOverlay(true);
        setLoadingText('Selecting your active organization...');
        try {
            await selectOrgMutation.mutateAsync(orgId);
            toast({ title: "Organization Selected", description: "Active organization has been set." });
            setIsOrgSelectionOpen(false);
            await refetchAuthContext();
            // Main useEffect will handle navigation
        } catch (error) {
            toast({ 
                title: "Failed to Select Organization", 
                description: (error as Error).message || "Could not set active organization.", 
                variant: "destructive" 
            });
        } finally {
             if (!selectOrgMutation.isSuccess) {
                setShowLoadingOverlay(false);
            }
        }
    };

    const getLoadingText = (): string => loadingText;

    // --- useEffect for Post-Authentication Flow --- 
    useEffect(() => {
        if (isAuthLoading || !refetchAuthContext) { // Added !refetchAuthContext to prevent early run if hook not ready
            return; 
        }

        // Consolidate loading states for the overlay
        const anyMutationLoading = initializeSessionMutation.isPending || 
                                 registerOrgMutation.isPending || 
                                 selectOrgMutation.isPending || 
                                 completeResellerProfileMutation.isPending;

        if (anyMutationLoading) {
            setShowLoadingOverlay(true);
            if(initializeSessionMutation.isPending) setLoadingText('Initializing session...');
            else if(registerOrgMutation.isPending) setLoadingText('Registering organization...');
            else if(selectOrgMutation.isPending) setLoadingText('Selecting organization...');
            else if(completeResellerProfileMutation.isPending) setLoadingText('Completing reseller profile...');
            return; // If a mutation is loading, it controls the overlay, skip further logic in this effect cycle
        }
        // If no mutations are loading, and we are not II Authenticating initially, hide overlay. 
        // Specific actions below might show it again.
        // setShowLoadingOverlay(false); // This line might cause flickers if not handled carefully.

        if (isAuthenticated && isRegistered) {
            setShowLoadingOverlay(true); // Show loading while deciding next step
            logger.info("LoginPage: User is authenticated and registered.", { authenticatedRole, brandOwnerDetails, resellerDetails });

            let navigatedOrModalOpened = false;
            if (authenticatedRole === FEUserRole.BrandOwner) {
                if (!brandOwnerDetails?.has_organizations) {
                    setLoadingText('Please complete your Brand Owner profile.');
                    setIsProfileModalOpen(true);
                    navigatedOrModalOpened = true;
                } else if (brandOwnerDetails.organizations && brandOwnerDetails.organizations.length > 1 && !brandOwnerDetails.active_organization) {
                    setLoadingText('Please select your active organization.');
                    setIsOrgSelectionOpen(true);
                    navigatedOrModalOpened = true;
                } else {
                    setLoadingText('Redirecting to Brand Owner dashboard...');
                    navigate('/brand-owners/dashboard');
                    navigatedOrModalOpened = true;
                }
            } else if (authenticatedRole === FEUserRole.Reseller) {
                if (!resellerDetails?.is_profile_complete_and_verified) {
                    setLoadingText('Please complete your Reseller profile.');
                    setIsProfileModalOpen(true);
                    navigatedOrModalOpened = true;
                } else {
                    setLoadingText('Redirecting to Reseller certification...');
                    navigate('/reseller/certification');
                    navigatedOrModalOpened = true;
                }
            } else if (authenticatedRole === FEUserRole.Admin) {
                setLoadingText('Redirecting to Admin dashboard...');
                navigate('/admin/dashboard'); 
                navigatedOrModalOpened = true;
            } else {
                logger.warn("LoginPage: Authenticated but role is unclear or not handled post-login.");
                setLoadingText('Redirecting to homepage...');
                navigate('/');
                navigatedOrModalOpened = true;
            }
            
            // If no navigation or modal action taken from the above, ensure overlay is hidden.
            // This is important if an already registered user lands here, and conditions don't match.
            if (!navigatedOrModalOpened) {
                setShowLoadingOverlay(false);
            }

        } else if (isAuthenticated && !isRegistered && currentSelectedRolePreAuth) {
            logger.info("LoginPage: User is II Authenticated but not registered in backend or role session not initialized.");
            if (currentSelectedRolePreAuth && (currentSelectedRolePreAuth === FEUserRole.BrandOwner || currentSelectedRolePreAuth === FEUserRole.Reseller)){
                setLoadingText(`Finalizing ${currentSelectedRolePreAuth} setup...`);
                setIsProfileModalOpen(true); 
                // setShowLoadingOverlay(false); // Modal covers screen
            } else {
                toast({ title: "Almost there!", description: "Please select your role to complete setup." });
                setShowLoadingOverlay(false); // No action taken, hide overlay
            }
        } else if (!isAuthLoading && !isAuthenticated && !anyMutationLoading) {
            // Not loading from auth, not authenticated, and no mutation running.
            setShowLoadingOverlay(false);
        }
        
    }, [
        isAuthenticated, 
        isRegistered, 
        authenticatedRole, 
        brandOwnerDetails, 
        resellerDetails, 
        navigate, 
        isAuthLoading, 
        currentSelectedRolePreAuth, 
        toast,
        refetchAuthContext, // Added dependency
        initializeSessionMutation.isPending, 
        registerOrgMutation.isPending, 
        selectOrgMutation.isPending, 
        completeResellerProfileMutation.isPending
        // Removed isProfileModalOpen, isOrgSelectionOpen as they can cause loops if also set inside this effect.
        // Let other effects or user actions handle their closing if needed outside this primary flow-control effect.
    ]);

    // --- JSX ---    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {showLoadingOverlay && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col">
                    <Loader2 className="h-12 w-12 text-cyan-600 animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">{getLoadingText()}</h3>
                    <p className="text-sm text-gray-500 mt-2">Please wait...</p>
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
                                    description="Manage products, track authenticity, and oversee resellers."
                                    icon={BrandOwnerIcon}
                                    isSelected={selectedRole === FEUserRole.BrandOwner}
                                    onSelect={() => handleRoleSelect(FEUserRole.BrandOwner)}
                                />
                                <RoleCard
                                    title="Reseller"
                                    description="Register, get certified, and manage product inventory."
                                    icon={ResellerIcon}
                                    isSelected={selectedRole === FEUserRole.Reseller}
                                    onSelect={() => handleRoleSelect(FEUserRole.Reseller)}
                                />
                                <RoleCard
                                    title="Customer"
                                    description="Verify product authenticity and access details."
                                    icon={CustomerIcon}
                                    isSelected={selectedRole === 'customer'}
                                    onSelect={() => handleRoleSelect('customer')}
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <Button
                                onClick={handleLoginClick}
                                disabled={!selectedRole || isAuthLoading || showLoadingOverlay}
                                className={`w-full max-w-md ${!selectedRole ? 'cursor-not-allowed' : ''}`}
                                size="lg"
                            >
                                {isAuthLoading || showLoadingOverlay ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <img src={InternetIdentityLogo} alt="" className="h-6 mr-3" />
                                )}
                                Authenticate with Internet Identity
                            </Button>
                            
                            <div className="mt-4 text-sm text-gray-600">
                                <Link to="/privacy" className="hover:text-cyan-600">Privacy Policy and Terms of Service</Link>
                            </div>
                            {authError && <p className="mt-4 text-sm text-red-600">Error: {authError.message}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog 
                open={isProfileModalOpen} 
                onOpenChange={setIsProfileModalOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRole === FEUserRole.BrandOwner ? 'Complete Brand Owner Profile' : 'Complete Reseller Profile'}
                        </DialogTitle>
                        <DialogDescription>
                            Please fill in the required details to complete your profile setup.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedRole === FEUserRole.BrandOwner ? (
                        <form onSubmit={onBrandOwnerSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                                    <Input 
                                        id="name"
                                        placeholder="Enter your organization name" 
                                        name="name"
                                        value={modalFormData.name || ''}
                                        onChange={handleModalInputChange}
                                        required
                                        disabled={registerOrgMutation.isPending}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                                    <Input 
                                        id="description"
                                        placeholder="Enter a short description" 
                                        name="description"
                                        value={modalFormData.description || ''}
                                        onChange={handleModalInputChange}
                                        required
                                        disabled={registerOrgMutation.isPending}
                                    />
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button type="submit" disabled={registerOrgMutation.isPending}>
                                    {registerOrgMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Complete Profile
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : selectedRole === FEUserRole.Reseller ? (
                        <form onSubmit={onResellerSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Shop Name</label>
                                    <Input 
                                        id="name"
                                        placeholder="Enter your shop name" 
                                        name="name"
                                        value={modalFormData.name || ''}
                                        onChange={handleModalInputChange}
                                        required
                                        disabled={completeResellerProfileMutation.isPending}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="shopIdShopee" className="text-sm font-medium">Shop ID at Shopee</label>
                                    <Input 
                                        id="shopIdShopee"
                                        placeholder="Enter your Shopee shop ID (optional)" 
                                        name="shopIdShopee"
                                        value={modalFormData.shopIdShopee || ''}
                                        onChange={handleModalInputChange}
                                        disabled={completeResellerProfileMutation.isPending}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="shopIdTokopedia" className="text-sm font-medium">Shop ID at Tokopedia</label>
                                    <Input 
                                        id="shopIdTokopedia"
                                        placeholder="Enter your Tokopedia shop ID (optional)" 
                                        name="shopIdTokopedia"
                                        value={modalFormData.shopIdTokopedia || ''}
                                        onChange={handleModalInputChange}
                                        disabled={completeResellerProfileMutation.isPending}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</label>
                                    <Input 
                                        id="contactEmail"
                                        type="email"
                                        placeholder="Enter contact email (optional)" 
                                        name="contactEmail"
                                        value={modalFormData.contactEmail || ''}
                                        onChange={handleModalInputChange}
                                        disabled={completeResellerProfileMutation.isPending}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="contactPhone" className="text-sm font-medium">Contact Phone</label>
                                    <Input 
                                        id="contactPhone"
                                        type="tel"
                                        placeholder="Enter contact phone (optional)" 
                                        name="contactPhone"
                                        value={modalFormData.contactPhone || ''}
                                        onChange={handleModalInputChange}
                                        disabled={completeResellerProfileMutation.isPending}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="org-search" className="text-sm font-medium">Brand Organization</label>
                                    <div className="relative">
                                        <Input 
                                            id="org-search"
                                            placeholder="Search for brand organization..." 
                                            value={orgSearchInput}
                                            onChange={handleOrgSearchChange}
                                            required
                                            disabled={completeResellerProfileMutation.isPending}
                                        />
                                        
                                        {(isLoadingOrgs || (orgSearchInput.length >= 3 && (foundOrgs || orgSearchError))) && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                                {isLoadingOrgs ? (
                                                    <div className="px-4 py-2 text-sm text-gray-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>
                                                ) : orgSearchError ? (
                                                    <div className="px-4 py-2 text-sm text-red-600">Error: {orgSearchError.message}</div>
                                                ) : foundOrgs && foundOrgs.length > 0 ? (
                                                    foundOrgs.map((org: OrganizationPublic) => (
                                                        <div 
                                                            key={org.id.toText()}
                                                            className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => handleOrgSelectFromDropdown(org)}
                                                        >
                                                            {org.name} ({org.id.toText().substring(0, 5)}...)
                                                        </div>
                                                    ))
                                                ) : orgSearchInput.length >= 3 ? (
                                                     <div className="px-4 py-2 text-sm text-gray-500">No organizations found.</div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                    {modalFormData.selectedOrgName && (
                                        <p className="text-xs text-gray-600 mt-1">Selected Brand: {modalFormData.selectedOrgName}</p>
                                    )}
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button type="submit" disabled={!modalFormData.selectedOrgId || completeResellerProfileMutation.isPending}>
                                    {completeResellerProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Complete Profile
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : null }
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOrgSelectionOpen}
                onOpenChange={setIsOrgSelectionOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Organization</DialogTitle>
                        <DialogDescription>
                           You belong to multiple organizations. Select the one you want to work with in this session.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-500">
                            You belong to multiple organizations. Select one to access.
                        </p>
                        
                        <div className="space-y-2 max-h-60 overflow-auto">
                            {brandOwnerDetails?.organizations?.map((org) => (
                                <div
                                    key={org.id.toText()}
                                    onClick={() => handleOrgSelectSubmitWrapper(org.id)}
                                    className="flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mr-3 font-mono text-xs">
                                        {org.name.substring(0, 1).toUpperCase()}{org.id.toText().substring(0, 3)} 
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{org.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">ID: {org.id.toText()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOrgSelectionOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

import { logger } from '@/utils/logger';

export default LoginPage;