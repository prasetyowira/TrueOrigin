import { useEffect, useMemo, useState } from 'react';

import techImage from '../assets/tech.png';
import { useAuthContext } from '../contexts/useAuthContext';
import { AddProductLogo, BrandOwnerLogo, HeatmapLogo, ResellerLogo, UserLogo } from '../components/SidebarLogo';
import Sidebar from '../components/Sidebar';
import Filters from '../components/Filters';
import Table from '../components/Table';

const Dashboard = () => {
    const [activeMenu, setActiveMenu] = useState('Brand Owners Dashboard');
    const { profile } = useAuthContext();

    const username = useMemo(() => {
        if (!profile) {
            return 'Guest';
        }
        if (!profile.first_name) {
            return `(NO NAME)`
        }
        return `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`;
    }, [profile]);


    // if (!isAuthenticated) {
    //     navigate('/auth/login');
    //     return <></>
    // }

    const handleSidebarClick = (menu: typeof activeMenu) => {
        setActiveMenu(menu);
    }
    
    const menuItems = [
        { label: "Brand Owners Dashboard", icon: BrandOwnerLogo, active: true, onClickEvent: handleSidebarClick },
        { label: "Add Product", icon: AddProductLogo, active: false, onClickEvent: handleSidebarClick },
        { label: "Reseller Dashboard", icon: ResellerLogo, active: false, onClickEvent: handleSidebarClick },
        { label: "User Dashboard", icon: UserLogo, active: false, onClickEvent: handleSidebarClick },
        { label: "Analytics & Heatmap", icon: HeatmapLogo, active: false, onClickEvent: handleSidebarClick },
    ];

    const filters = [
        { label: "Select Date", options: [] },
        { label: "Select Channel", options: [] },
        { label: "Voucher Status", options: [] },
        { label: "Other Filters", options: [] },
    ];

    const products = [
        {
            name: "Wardah Beauty",
            description: "Wardah Matte Lip Cream",
            category: "Cosmetic",
            productId: "Product ID",
            publicKey: "733A02658BDC25B8440...",
        },
        // More products here...
    ];

    const handleApplyFilters = () => {
        console.log("Filters applied!");
    };

    const showContent = () => {
        switch (activeMenu) {
            case "Brand Owners Dashboard":
                return (
                    <>
                        <Filters filters={filters} onApply={handleApplyFilters} />
                        <hr className="my-10" />
                        <h2 className="text-2xl font-bold mb-4 font-lexend">Product Batch</h2>
                        <Table products={products} />
                    </>
                )
            case "Add Product":
                // Handle Add Product click
                return (<>under construction</>)
            case "Reseller Dashboard":
                // Handle Reseller Dashboard click
                return (<>under construction</>)
            case "User Dashboard":
                // Handle User Dashboard click
                return (<>under construction</>)
            case "Analytics & Heatmap":
                return (<>under construction</>)
            default:
                // Handle default case
                return (<>under construction</>)
        }
    }

    useEffect(() => {
    }, [activeMenu])


    return (
        <>
            <div className="bg-gray-100 font-sans flex">
                <Sidebar menuItems={menuItems} userAvatar={techImage} username={username} />
                <div className="flex-1 p-6">
                    <h2 className="text-lg w-fit font-bold mb-20 text-[#212EFF] border-b-4 border-b-[#212EFF] font-lexend">
                        Brand Owners Dashboard
                    </h2>
                    { showContent() }
                </div>
            </div>
        </>
    )
}


export default Dashboard;
