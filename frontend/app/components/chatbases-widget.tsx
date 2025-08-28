'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const ChatbaseBubble = () => {
  const chatbotId = process.env.NEXT_PUBLIC_CHATBASE_CHATBOT_ID || '3kqxJ8KtZYr6RQgktR8dQ';
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // ensure this runs only on the client
  }, []);

  if (!chatbotId) {
    console.warn(
      'Chatbase chatbot ID (NEXT_PUBLIC_CHATBASE_CHATBOT_ID) is not configured. Chat bubble will not load.'
    );
    return null;
  }

  if (!isClient) return null;

  const chatbaseScript = `
(function(){
  const id = "${chatbotId}";

  if(!window.chatbase || (typeof window.chatbase.getState === 'function' && window.chatbase("getState")!=="initialized") || typeof window.chatbase.getState !== 'function'){
    const existingQueue = (window.chatbase && window.chatbase.q) ? window.chatbase.q : [];
    
    window.chatbase = (...args) => {
      if(!window.chatbase.q) window.chatbase.q = [];
      window.chatbase.q.push(args);
    };
    window.chatbase.q = existingQueue;

    window.chatbase = new Proxy(window.chatbase, {
      get(target, prop) {
        if(prop === 'q') return target.q;
        return (...args) => target(prop, ...args);
      }
    });
  }

  const loadScript = () => {
    if(document.getElementById(id)) return;

    const script = document.createElement('script');
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.id = id;
    script.defer = true;
    document.body.appendChild(script);
  };

  if(document.readyState === 'complete'){
    loadScript();
  } else {
    window.addEventListener('load', loadScript, { once: true });
  }
})();
  `;

  return (
    <Script
      id="chatbase-loader-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: chatbaseScript }}
    />
  );
};

export default ChatbaseBubble;
