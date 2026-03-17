import React, { useState } from 'react';
import { MessageCircle, X, Mail } from 'lucide-react';

interface ContactBubbleProps {
  contacts: {
    zalo?: string;
    facebook?: string;
    gmail?: string;
  };
}

const ContactBubble: React.FC<ContactBubbleProps> = ({ contacts }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBubble = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Overlay khi mở - hiển thị trên tất cả thiết bị */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Contact Menu */}
      <div
        className={`fixed md:bottom-20 right-4 md:right-6 z-50 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}
        style={{ bottom: 'calc(74px + env(safe-area-inset-bottom))' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-3 space-y-2 min-w-[200px]">
          <div className="text-center text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">
            Liên hệ hỗ trợ
          </div>
          
          {contacts.zalo && (
            <a
              href={contacts.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.855 1.371 5.404 3.513 7.13l-.858 3.127c-.054.197.137.361.318.273l3.657-1.77c1.1.39 2.273.597 3.37.597 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm.84 12.31h-1.68v-1.68h1.68v1.68zm0-3.36h-1.68V6.69h1.68v4.26z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Zalo</span>
            </a>
          )}

          {contacts.facebook && (
            <a
              href={contacts.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Facebook</span>
            </a>
          )}

          {contacts.gmail && (
            <a
              href={`mailto:${contacts.gmail}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Gmail</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Bubble Button */}
      <button
        onClick={toggleBubble}
        className={`fixed md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 md:w-14 md:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-500 hover:bg-gray-600 rotate-90' 
            : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
        }`}
        style={{ bottom: 'calc(20px + env(safe-area-inset-bottom))' }}
        title="Liên hệ hỗ trợ"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
};

export default ContactBubble;
