import { useEffect, useMemo, useState } from 'react';

import techImage from '../assets/tech.png';
import { useAuthContext } from '../contexts/useAuthContext';
import { AddProductLogo, BrandOwnerLogo, HeatmapLogo, ResellerLogo, UserLogo } from '../components/SidebarLogo';
import Sidebar from '../components/Sidebar';
import Filters from '../components/Filters';
import Table from '../components/Table';
import { Product, ProductInput } from '../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { TrustOrigin_backend } from '../../../declarations/TrustOrigin_backend';


const Dashboard = () => {
    const [activeMenu, setActiveMenu] = useState('Brand Owners Dashboard');
    const { profile } = useAuthContext();
    const [productInput, setProductInput] = useState<Partial<ProductInput>>({
        name: '',
        description: '',
        category: '',
    });
    const [products, setProducts] = useState<Product[]>([]);
    const fetchProducts = async () => {
        if (!profile) {
            return;
        }
        const products = await TrustOrigin_backend.list_products(profile?.org_ids[0]);
        setProducts(products);
    };
    const addProduct = async () => {
        const sentiment = ['Positive', 'Neutral', 'Negative'];
        const randomElement = sentiment[Math.floor(Math.random() * sentiment.length)];
        await TrustOrigin_backend.create_product({
            name: productInput.name!,
            description: productInput.description!,
            category: productInput.category!,
            org_id: profile!.org_ids[0]!,
            metadata: [{ key: 'sentiment', value: randomElement }],
        });
        setActiveMenu('Brand Owners Dashboard')
        return fetchProducts()
    };

    const username = useMemo(() => {
        if (!profile) {
            return 'Guest';
        }
        if (!profile.first_name) {
            return `(NO NAME)`
        }
        return `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`;
    }, [profile]);

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
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4 font-lexend">Create Product</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            addProduct();
                        }}>
                            <label htmlFor="input-name">Name</label>
                            <input
                                id="input-name"
                                type="text"
                                value={productInput.name} onChange={(e) => setProductInput({
                                    ...productInput,
                                    name: e.target.value,
                                })}
                            />
                            <label htmlFor="input-description">Description</label>
                            <input
                                id="input-description"
                                type="text"
                                value={productInput.description} onChange={(e) => setProductInput({
                                    ...productInput,
                                    description: e.target.value,
                                })}
                            />
                            <label htmlFor="input-category">Category</label>
                            <input
                                id="input-category"
                                type="text"
                                value={productInput.category} onChange={(e) => setProductInput({
                                    ...productInput,
                                    category: e.target.value,
                                })}
                            />
                            <button type="submit">Submit</button>
                        </form>
                    </>
                )
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
        fetchProducts();
    }, [profile])


    return (
        <div className="bg-gray-100 font-sans flex">
            <Sidebar menuItems={menuItems} userAvatar={techImage} username={username} />
            <div className="flex-1 p-6">
                <h2 className="text-lg w-fit font-bold mb-20 text-[#212EFF] border-b-4 border-b-[#212EFF] font-lexend">
                    Brand Owners Dashboard
                </h2>
                { showContent() }
            </div>
        </div>
    )
}


export default Dashboard;
