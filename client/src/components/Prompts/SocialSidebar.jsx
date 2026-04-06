import React, { useState, useEffect } from 'react';
import { Youtube, Instagram, Facebook, ArrowRight, ShieldCheck } from '../Common/Icons';
import api from '../../api';

const PinterestIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.62 11.17-.11-.94-.21-2.39.04-3.41.22-.95 1.41-6.01 1.41-6.01s-.36-.72-.36-1.78c0-1.68.97-2.93 2.18-2.93 1.03 0 1.52.77 1.52 1.69 0 1.03-.66 2.58-1 4.01-.28 1.2.59 2.17 1.77 2.17 2.13 0 3.77-2.24 3.77-5.48 0-2.87-2.06-4.87-4.99-4.87-3.4 0-5.4 2.55-5.4 5.18 0 1.03.4 2.13.9 2.73.1.12.11.23.08.35-.1.37-.32 1.3-.36 1.46-.05.2-.18.25-.41.14-1.52-.71-2.47-2.94-2.47-4.72 0-3.85 2.79-7.39 8.05-7.39 4.23 0 7.51 3.01 7.51 7.04 0 4.2-2.65 7.58-6.32 7.58-1.23 0-2.39-.64-2.79-1.4l-.76 2.9c-.27 1.05-1.01 2.37-1.5 3.17C10.15 23.88 11.05 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
  </svg>
);

const SocialSidebar = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialSettings = async () => {
      try {
        const response = await api.get('/settings');
        const settings = response.data;

        const links = [
          {
            title: settings.youtube_title || 'YouTube Channel',
            icon: <Youtube size={24} />,
            url: settings.youtube_url || 'https://youtube.com/@yourchannel',
            description: 'Find secret PINs & AI tutorials',
            color: '#FF0000'
          },
          {
            title: settings.instagram_title || 'Instagram Page',
            icon: <Instagram size={24} />,
            url: settings.instagram_url || 'https://instagram.com/yourprofile',
            description: 'Daily AI art & design tips',
            color: '#E4405F'
          },
          {
            title: settings.pinterest_title || 'Pinterest Page',
            icon: <PinterestIcon size={24} />,
            url: settings.pinterest_url || 'https://pinterest.com/yourprofile',
            description: 'Inspire with AI collections',
            color: '#E60023'
          },
          {
            title: settings.facebook_title || 'Facebook Page',
            icon: <Facebook size={24} />,
            url: settings.facebook_url || 'https://facebook.com/yourpage',
            description: 'Join our AI community group',
            color: '#1877F2'
          }
        ];
        setSocialLinks(links);
      } catch (error) {
        console.error("Failed to load social settings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialSettings();
  }, []);

  if (loading) return null;

  return (
    <aside className="social-sidebar">
      <div className="sidebar-sticky-wrapper" style={{ paddingTop: '10px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '20px' }}>
          <div style={{
            flex: 1,
            height: '2px',
            background: 'linear-gradient(270deg, var(--accent-main), transparent)',
            opacity: 0.6,
            borderRadius: '2px'
          }} />
          <h3 className="sidebar-title" style={{
            position: 'relative',
            zIndex: 2,
            margin: 0,
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            whiteSpace: 'nowrap',
            textAlign: 'right'
          }}>Official Channels</h3>
        </div>

        <div className="social-cards-wrapper">
          {socialLinks.map((social) => (
            <a
              key={social.title}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-card-item"
            >
              <div className="social-card-icon-wrap" style={{ '--icon-color': social.color }}>
                {social.icon}
              </div>
              <div className="social-card-content">
                <div className="social-card-header">
                  <span className="social-card-name">{social.title}</span>
                </div>
                <p className="social-card-desc">{social.description}</p>
                <div className="social-card-action">
                  Follow Now <ArrowRight size={14} />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Security / Quality Badge */}
        <div className="sidebar-badge-card">
          <div className="badge-icon">
            <ShieldCheck size={28} color="var(--success)" />
          </div>
          <div>
            <h4>Verified Prompts</h4>
            <p>Every prompt is tested for quality and accuracy.</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SocialSidebar;
