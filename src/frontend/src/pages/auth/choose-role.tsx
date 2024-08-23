import { Principal } from "@dfinity/principal";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/useAuthContext";
import { useEffect } from "react";

const RoleCard: React.FC<{ title: string; description: string; onClick: () => void; }> = ({ title, description, onClick }) => {
    return (
        <div className="bg-[#FFFFFF] rounded-[30px] flex flex-col justify-between">
            <div className="flex flex-col gap-2 pt-10 px-10">
                <p className="text-3xl font-lexend">{title}</p>
                <p>{description}</p>
            </div>
            <div>
                <button 
                    type="button" 
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                    onClick={() => onClick()}
                >Sign In</button>
            </div>
        </div>
    )
}

const ChooseRolePage = () => {
    const navigate = useNavigate();
    const { signinAsBrandOwner, signinAsReseller, profile } = useAuthContext();
    const onBrandOwnerClicked = () => {
        return signinAsBrandOwner({
            name: 'Test Brand',
            description: 'Test Brand',
            metadata: [], 
        });
    };
    const onResellerClicked = () => {
        return signinAsReseller({
            name: 'Test Brand',
            org_id: Principal.anonymous(),
            ecommerce_urls: [],
            metadata: [], 
        });
    };
    useEffect(() => {
        if (!profile) {
            return;
        }
        if (profile.user_role.length === 0) {
            return;
        }
        const role = profile.user_role[0];
        if ('BrandOwner' in role) {
            navigate('/dashboard')
        } else if ('Reseller' in role) {
            navigate('/resellers-dashboard')
        }
    }, [profile, navigate]);

    return (
        <>
            <h1>Choose Role</h1>
            <RoleCard 
                title="Brand Owner"
                description="Choose this to manage products"
                onClick={onBrandOwnerClicked}
            />
            <RoleCard 
                title="Reseller"
                description="Choose this if you are reseller of products"
                onClick={onResellerClicked}
            />
        </>
    )
}

export default ChooseRolePage;
