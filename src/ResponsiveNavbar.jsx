import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, Link, Collapse, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Define your chapters here (use your actual IDs and labels)
const chapters = [
  { id: 'introduction', label: 'War or Genocide?' },
  { id: 'chapter1', label: 'Life' },
  { id: 'chapter2', label: 'Mortality' },
  { id: 'chapter3', label: 'Events' },
  { id: 'chapter4', label: 'Timeline' },
  { id: 'chapter5', label: 'Fatalities' },
  { id: 'chapter6', label: 'Map' },
];

export default function ResponsiveNavbar({ activeSection, onSectionClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => setMobileOpen((open) => !open);
  const handleLinkClick = (e, id) => {
    if (onSectionClick) onSectionClick(e, id);
    setMobileOpen(false);
  };

  return (
    <AppBar position="fixed" sx={{ top: 20, left: '50%', transform: 'translateX(-50%)', borderRadius: '32px', width: { xs: '98%', md: '90%' }, boxShadow: 3, background: 'color-mix(in srgb, var(--bg-secondary) 70%, transparent)', backdropFilter: 'blur(16px) saturate(180%)', zIndex: 1300 }}>
      <Toolbar sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', justifyContent: 'space-between', p: { xs: 1, sm: 2 } }}>
        {/* Desktop menu */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1, justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`#${chapter.id}`}
              onClick={(e) => handleLinkClick(e, chapter.id)}
              sx={{
                px: 2, py: 1, borderRadius: 2, fontWeight: 600, fontSize: '1rem', color: activeSection === chapter.id ? 'primary.main' : 'var(--text-navbar)', textDecoration: 'none', backgroundColor: activeSection === chapter.id ? 'var(--color-link-hover)' : 'transparent', transition: 'all 0.2s', '&:hover': { color: 'primary.main', backgroundColor: 'var(--color-link-hover)' },
              }}
            >
              {chapter.label}
            </Link>
          ))}
        </Box>
        {/* Mobile menu toggle */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', width: '100%' }}>
          <IconButton onClick={handleToggle} sx={{ color: 'var(--text-navbar)' }} aria-label="Open navigation menu">
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="body1" sx={{ ml: 1, fontWeight: 600, color: 'var(--text-navbar)' }}>
            {chapters.find((c) => c.id === activeSection)?.label || 'Section'}
          </Typography>
        </Box>
      </Toolbar>
      {/* Mobile collapsible menu */}
      <Collapse in={mobileOpen} timeout="auto" unmountOnExit sx={{ display: { sm: 'none' } }}>
        <Box sx={{ px: 2, pb: 2 }}>
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`#${chapter.id}`}
              onClick={(e) => handleLinkClick(e, chapter.id)}
              sx={{
                display: 'block', px: 2, py: 1, borderRadius: 2, fontWeight: 600, fontSize: '1rem', color: activeSection === chapter.id ? 'primary.main' : 'var(--text-navbar)', textDecoration: 'none', backgroundColor: activeSection === chapter.id ? 'var(--color-link-hover)' : 'transparent', transition: 'all 0.2s', '&:hover': { color: 'primary.main', backgroundColor: 'var(--color-link-hover)' }, mb: 1,
              }}
            >
              {chapter.label}
            </Link>
          ))}
        </Box>
      </Collapse>
    </AppBar>
  );
}
