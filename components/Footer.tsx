import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4 text-center relative z-10">
      <div className="max-w-4xl mx-auto">
        <p className="mb-4">&copy; {new Date().getFullYear()} PacMac Mobile LLC</p>
        <div className="flex justify-center space-x-6">
          <a href="https://www.reddit.com/u/PackieAI/s/WEewPkN7d" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
            Reddit
          </a>
          <a href="https://www.linkedin.com/in/mattjhagen?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
            LinkedIn
          </a>
          <a href="https://calendly.com/vibecode" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
            Calendly
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
