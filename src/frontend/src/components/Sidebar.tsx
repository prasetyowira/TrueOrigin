import logo from "../assets/true-origin.png"
type MenuItem = {
    label: string;
    icon: React.ComponentType<{ fillColor: string }>;
    active: boolean;
    onClickEvent: Function;
}

type SidebarProps = {
    menuItems: MenuItem[];
    userAvatar: string;
    username: string;
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems, userAvatar, username }) => {
    return (
        <aside className="w-64 bg-white h-screen shadow-md flex flex-col justify-between">
            <div>
                <div className="p-4 flex items-center justify-center">
                    <img src={logo} className="max-w-[180px]" />
                </div>
                <nav className="mt-8">
                    <ul className="p-5">
                        {menuItems.map((item, index) => (
                            <li
                                key={index}
                                className={`flex items-center p-2 ${item.active ? "text-[#2C42C0] bg-gray-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    } rounded-lg gap-2 mt-2 cursor-pointer`}
                                onClick={() => item.onClickEvent(item.label)}
                            >
                                <item.icon fillColor="currentColor" />
                                <span>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <div className="p-4 flex items-center">
                <img className="w-10 h-10 rounded-full" src={userAvatar} alt="User Avatar" />
                <div className="ml-2">
                    <p className="text-gray-800">{username}</p>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-800">
                        View profile
                    </a>
                </div>
                <button className="ml-auto text-gray-600 hover:text-gray-900">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H7a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar