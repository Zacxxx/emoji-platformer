import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, User, Settings, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmojiPlatformer from './EmojiPlatformer';

const MenuItem = ({ icon: Icon, text, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded"
    onClick={onClick}
  >
    <Icon className="mr-2" size={20} />
    <span>{text}</span>
  </motion.div>
);

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState('welcome');
  const [searchTerm, setSearchTerm] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { icon: User, text: 'Profile', onClick: () => setCurrentContent('profile') },
    { icon: Settings, text: 'Settings', onClick: () => setCurrentContent('settings') },
    { icon: LogOut, text: 'Logout', onClick: () => alert('Logout clicked') },
  ];

  const renderContent = () => {
    switch (currentContent) {
      case 'emojiPlatformer':
        return <EmojiPlatformer onBack={() => setCurrentContent('welcome')} />;
      case 'profile':
        return <div>Profile Content</div>;
      case 'settings':
        return <div>Settings Content</div>;
      default:
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to Bibou Games</h1>
            <p className="mb-4">Choose a game to play:</p>
            <Button onClick={() => setCurrentContent('emojiPlatformer')}>
              Emoji Platformer
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-green-100">
      {/* Top Menu Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.div>
        <div className="flex-grow mx-4">
          <Input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          onClick={toggleSidebar}
        >
          <User size={24} />
        </motion.div>
      </nav>

      {/* Menu Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute left-0 right-0 bg-white shadow-md z-10"
          >
            {menuItems.map((item, index) => (
              <MenuItem key={index} {...item} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="bg-white shadow-md p-4 w-64 absolute left-0 top-16 bottom-0 z-20"
            >
              <h2 className="text-xl font-bold mb-4">User Information</h2>
              <p>Name: John Doe</p>
              <p>Email: john@example.com</p>
              <Button onClick={toggleSidebar} className="mt-4">Close</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className={`flex-grow p-4 ${isSidebarOpen && windowWidth > 640 ? 'ml-64' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentContent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Menu */}
      {windowWidth <= 640 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-2 flex justify-around"
        >
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer"
              onClick={item.onClick}
            >
              <item.icon size={24} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;