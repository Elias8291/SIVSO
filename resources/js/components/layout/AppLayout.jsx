import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#F7F7F8] dark:bg-[#060607] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />
            <main className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex-1 px-8 py-10 xl:px-14 xl:py-12 w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
