import React, { useState, useEffect } from 'react';
import UnigeLogoBlack from './DatasetIcons/logo_orizzontale_BLACK.svg';
import UnigeLogoWhite from './DatasetIcons/logo_orizzontale.LIGHT.svg';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';

export default function Footer({ isDark, isMonochromacy }) {
  // Use CSS variables for colors and update on theme change
  const [colors, setColors] = useState({
    navbarTextColor: '#222',
    linkHoverColor: '#1976d2',
    bgColor: '#fff',
  });


  useEffect(() => {
    const getColors = () => {
      // Prefer body if it has the theme class, else fallback to documentElement
      const themeEl = document.body.className.match(/theme|mode/) ? document.body : document.documentElement;
      return {
        navbarTextColor: getComputedStyle(themeEl).getPropertyValue('--text-navbar')?.trim() || '#222',
        linkHoverColor: getComputedStyle(themeEl).getPropertyValue('--color-link-hover')?.trim() || '#1976d2',
        bgColor: getComputedStyle(themeEl).getPropertyValue('--bg-secondary')?.trim() || '#fff',
      };
    };
    setColors(getColors());

    // Listen for theme changes (if using a custom event or MutationObserver)
    const observer = new MutationObserver(() => setColors(getColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, [isDark, isMonochromacy]);

  const { navbarTextColor, linkHoverColor, bgColor } = colors;
 



  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        opacity: 1,
        color: navbarTextColor,
        padding: '12vh 5vw 6vh 5vw',
        textAlign: 'center',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
        transition: 'color 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      <Typography variant="body2" sx={{ fontSize: '0.95rem', mb: 1, textAlign: 'center' }}>
        A.Y. 2025-2026 Data Visualization Project - Università di Genova
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2 }}>
        <img
          src={isDark ? UnigeLogoWhite : UnigeLogoBlack}
          alt="Università di Genova Logo"
          style={{
            height: 48,
            width: 'auto',
            maxWidth: 320,
            filter: isDark ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))',
            transition: 'filter 0.3s',
            margin: '0 auto',
            display: 'block',
          }}
        />
      </Box>
      <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 1, textAlign: 'center' }}>
        Created by Matteo Ferrari
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Tooltip title="LinkedIn"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: bgColor,
                  color: navbarTextColor,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: `1px solid ${linkHoverColor}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
                }
              }
            }}
          >
            <Link
              href="https://www.linkedin.com/in/mfmatteoferrari/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: navbarTextColor,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.3s ease',
                '&:hover': { color: linkHoverColor }
              }}
              aria-label="LinkedIn Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
          </Tooltip>
          <Tooltip title="GitHub Profile"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: bgColor,
                  color: navbarTextColor,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: `1px solid ${linkHoverColor}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
                }
              }
            }}
          >
            <Link
              href="https://github.com/matteogrifone22"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: navbarTextColor,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.3s ease',
                '&:hover': { color: linkHoverColor }
              }}
              aria-label="GitHub Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Link>
          </Tooltip>
          <Tooltip title="GitHub Repository"
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: bgColor,
                  color: navbarTextColor,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: `1px solid ${linkHoverColor}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
                }
              }
            }}
          >
            <Link
              href="https://github.com/matteogrifone22/Data-Visualization-Project"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: navbarTextColor,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.3s ease',
                '&:hover': { color: linkHoverColor }
              }}
              aria-label="GitHub Repository"
            >
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
              </svg>
            </Link>
          </Tooltip>
        
      </Box>
    </Box>
  );
}