"use client";
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Youtube, Star } from '../Common/Icons';

const YouTubeModal = ({ isOpen, onClose, videoUrl }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('shorts-modal-open');
    } else {
      document.body.classList.remove('shorts-modal-open');
    }
    return () => {
      document.body.classList.remove('shorts-modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !videoUrl) return null;

  // Extract embed info from YouTube or Instagram
  const getEmbedInfo = (url) => {
    if (!url) return null;

    if (url.includes('instagram.com')) {
      const match = url.match(/(?:reel|reels)\/([A-Za-z0-9_-]+)/);
      if (match) {
        return {
          type: 'instagram',
          embedUrl: `https://www.instagram.com/reels/${match[1]}/embed/`
        };
      }
    }
    
    // Improved YouTube Pattern Detection
    const ytPatterns = [
      /(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/,
      /youtu\.be\/([A-Za-z0-9_-]+)/,
      /[?&]v=([A-Za-z0-9_-]+)/
    ];

    for (const pattern of ytPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&mute=1&playsinline=1&enablejsapi=1`
        };
      }
    }
    return null;
  };

  const info = getEmbedInfo(videoUrl);

  const modalContent = (
    <div className="full-screen-shorts-overlay" onClick={onClose}>
      <button 
        className="shorts-close-btn"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X size={28} />
      </button>

      <div 
        className="shorts-video-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {info ? (
          <iframe
            className="shorts-iframe"
            src={info.embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video Content"
          />
        ) : (
          <div className="shorts-error">
            <p>Could not load the video. <br/> URL: {videoUrl}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .full-screen-shorts-overlay {
          position: fixed;
          inset: 0;
          height: 100dvh;
          width: 100vw;
          z-index: 100000;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
        }

        .shorts-close-btn {
          position: absolute;
          top: 30px;
          right: 30px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 100001;
        }
        .shorts-close-btn:hover {
          background: rgba(229, 9, 20, 0.8);
          transform: rotate(90deg);
          border-color: transparent;
        }

        .shorts-video-container {
          position: relative;
          width: 100%;
          height: 100%;
          max-width: 480px; 
          max-height: calc(100vh - 40px);
          aspect-ratio: 9/16;
          background: #000;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 0 100px rgba(0,0,0,0.8);
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .shorts-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .shorts-error {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          text-align: center;
          color: rgba(255,255,255,0.6);
        }

        @media (max-width: 600px) {
          .shorts-video-container {
            width: calc(100vw - 32px);
            max-width: 420px;
            height: auto;
            aspect-ratio: 9/16;
            max-height: 85vh;
            border-radius: 28px;
            margin: 0;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6);
          }
          .shorts-close-btn {
            top: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default YouTubeModal;
