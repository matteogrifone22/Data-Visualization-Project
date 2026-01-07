import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Link, IconButton, Fab } from '@mui/material';
import { DarkMode, LightMode, Visibility, VisibilityOff } from '@mui/icons-material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TerritoryMap from './components/TerritoryMap';
import LineChart from './components/LineChart';
import RidgeChart  from './components/RidgePlot';
import ViolinBoxPlot from './components/ViolinBoxPlot';
import EventsSankeyDiagram from './components/SankeyDiagram';
import SmallMultipleChart from './components/SmallMultiples';
import GeoChart from './components/GeoMap';

import { rgb } from 'd3';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [isMonochromacy, setIsMonochromacy] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [emailCopied, setEmailCopied] = useState(false);
  const [isMobileBlocked, setIsMobileBlocked] = useState(false);
  const [useShortLabels, setUseShortLabels] = useState(false);
  const navbarRef = useRef(null);
  const toolbarRef = useRef(null);
  const mobileBlockedRef = useRef(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleMonochromacy = () => {
    setIsMonochromacy(!isMonochromacy);
  };

  useLayoutEffect(() => {
    // Sync CSS variable theme classes on :root so var(--...) works
    const root = document.documentElement;

    // Clear all theme-related classes first to avoid overlaps
    root.classList.remove('monochromacy-dark-mode', 'monochromacy-light-mode', 'dark-theme', 'light-theme');

    if (isMonochromacy) {
      // Apply monochromacy theme based on isDark state
      if (isDark) {
        // Dark UI should use the black-on-white monochrome palette
        root.classList.add('monochromacy-light-mode');
      } else {
        // Light UI should use the white-on-black monochrome palette
        root.classList.add('monochromacy-dark-mode');
      }
    } else {
      // Apply regular theme
      if (isDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.add('light-theme');
      }
    }
  }, [isDark, isMonochromacy]);

  useEffect(() => {
    const WIDTH_ON = 830;
    const WIDTH_OFF = 870;

    const update = () => {
      const w = window.innerWidth || document.documentElement.clientWidth;
      const currentlyBlocked = mobileBlockedRef.current;
      const shouldBlock = currentlyBlocked ? w < WIDTH_OFF : w < WIDTH_ON;
      if (shouldBlock !== mobileBlockedRef.current) {
        mobileBlockedRef.current = shouldBlock;
        setIsMobileBlocked(shouldBlock);
      }
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const updateLabels = () => {
      const w = window.innerWidth || document.documentElement.clientWidth;
      setUseShortLabels(w < 1195);
    };

    updateLabels();
    window.addEventListener('resize', updateLabels);

    return () => {
      window.removeEventListener('resize', updateLabels);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Calculate scroll progress (0 to 1)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);

      // Determine active section based on which section is most visible
      const sections = ['introduction', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      let currentSection = sections[0];

      // Check from bottom to top which section we've scrolled past
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          currentSection = sections[i];
          break;
        }
      }

      // If at very top of page, always show first section
      if (window.scrollY < 100) {
        currentSection = sections[0];
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (event, sectionId) => {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;

    const navbarHeight = navbarRef.current?.getBoundingClientRect().height || 0;
    const extraGap = 16; // breathing room so content is not hidden under the navbar
    const offset = navbarHeight + extraGap;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
  };

  const handleEmailClick = () => {
    navigator.clipboard.writeText('mfmatteoferrari@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const bgColor = 'var(--bg-primary)';
  const textColor = 'var(--text-primary)';
  const navbarTextColor = 'var(--text-navbar)';
  const linkHoverColor = 'var(--color-link-hover)';
  const borderColor = 'var(--color-details)';
  const navbarShadow = 'var(--navbar-shadow)';
  const navbarBgColor = 'var(--bg-primary)';


  if (isMobileBlocked) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <Box sx={{ maxWidth: 520, border: '1px solid var(--color-details)', borderRadius: '12px', padding: '24px 20px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', backgroundColor: 'var(--bg-secondary)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: '10px' }}>
            Desktop Experience Required
          </Typography>
          <Typography sx={{ fontSize: '15px', lineHeight: 1.5 }}>
            This data visualization is optimized for larger screens. Please visit from a desktop or widen your window to explore the content.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      backgroundColor: bgColor,
      color: textColor,
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <AppBar
        position="fixed"
        ref={navbarRef}
        sx={{
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '95%', md: 'auto' },
          maxWidth: { xs: '95%', md: '90%' },
          borderRadius: '50px',
          backgroundColor: navbarBgColor,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: '2px solid var(--color-details)',
          zIndex: 1300,
          boxShadow: navbarShadow,
          padding: '0 8px',
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease'
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            rowGap: { xs: 0.75, md: 1 },
            columnGap: { xs: 0.6, md: 1.5 },
            padding: { xs: '8px 10px', md: '8px 24px' },
            justifyContent: 'center'
          }}
          ref={toolbarRef}
        >

          <Link
            href="#introduction"
            onClick={(e) => scrollToSection(e, 'introduction')}
            sx={{
              color: activeSection === 'introduction' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'introduction' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            War or Genocide?
          </Link>
          <Link
            href="#chapter1"
            onClick={(e) => scrollToSection(e, 'chapter1')}
            sx={{
              color: activeSection === 'chapter1' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter1' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Ch 1' : 'Chapter 1'}
          </Link>
          <Link
            href="#chapter2"
            onClick={(e) => scrollToSection(e, 'chapter2')}
            sx={{
              color: activeSection === 'chapter2' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter2' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Ch 2' : 'Chapter 2'}
          </Link>
          <Link
            href="#chapter3"
            onClick={(e) => scrollToSection(e, 'chapter3')}
            sx={{
              color: activeSection === 'chapter3' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter3' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Ch 3' : 'Chapter 3'}
          </Link>
          <Link
            href="#chapter4"
            onClick={(e) => scrollToSection(e, 'chapter4')}
            sx={{
              color: activeSection === 'chapter4' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter4' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Ch 4' : 'Chapter 4'}
          </Link>
          <Link
            href="#chapter5"
            onClick={(e) => scrollToSection(e, 'chapter5')}
            sx={{
              color: activeSection === 'chapter5' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter5' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Ch 5' : 'Chapter 5'}
          </Link>
          <Link
            href="#chapter6"
            onClick={(e) => scrollToSection(e, 'chapter6')}
            sx={{
              color: activeSection === 'chapter6' ? linkHoverColor : navbarTextColor,
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              fontFamily: 'var(--font-serif)',
              fontWeight: activeSection === 'chapter6' ? 700 : 600,
              '&:hover': { color: linkHoverColor, opacity: 1 }
            }}
          >
            {useShortLabels ? 'Ch 6' : 'Chapter 6'}
          </Link>
          <Box sx={{ display: 'flex', gap: { xs: 0.6, md: 1 }, flexShrink: 0 }}>
            <IconButton
              onClick={toggleTheme}
              disableRipple
              disableFocusRipple
              disableTouchRipple
              sx={{
                color: navbarTextColor,
                transition: 'transform 0.3s ease, color 0.3s ease',
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:before, &:after': { display: 'none' },
                '&:active': { backgroundColor: 'transparent !important' },
                '&:focus': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&:focusVisible': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&& .MuiTouchRipple-root': { display: 'none' },
                '&:hover': {
                  color: linkHoverColor,
                  transform: 'rotate(20deg)',
                  backgroundColor: 'transparent !important'
                }
              }}
            >
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>
            <IconButton
              onClick={toggleMonochromacy}
              disableRipple
              disableFocusRipple
              disableTouchRipple
              sx={{
                color: navbarTextColor,
                transition: 'transform 0.3s ease, color 0.3s ease',
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:before, &:after': { display: 'none' },
                '&:active': { backgroundColor: 'transparent !important' },
                '&:focus': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&:focusVisible': { backgroundColor: 'transparent !important', boxShadow: 'none !important', outline: 'none !important' },
                '&& .MuiTouchRipple-root': { display: 'none' },
                '&:hover': {
                  color: linkHoverColor,
                  transform: 'scale(1.15)',
                  backgroundColor: 'transparent !important'
                }
              }}
            >
              {isMonochromacy ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}>
        {/* Title Section */}
        <Box
          id="introduction"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            scrollMarginTop: '8vh',
            padding: '16vh 4vw 10vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))' }}>
            <Typography
              variant="h1"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              War or Genocide?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 3
              }}
            >
              This data visualization project examines the ongoing conflict between Israel and Palestine
              through a strictly data-driven approach. Rather than presenting opinions or predefined
              narratives, the analysis relies exclusively on quantitative data.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 4
              }}
            >
              The purpose is not to provide a definitive answer, but to leave the interpretation to the user.
              By exploring patterns, trends, and measurable evidence, each viewer is invited to reflect on
              whether the observed events align more closely with the concept of <i>war</i> or <i>genocide</i>.
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: textColor,
                fontWeight: 300,
                marginBottom: 2
              }}
            >
              To ensure clarity, the following definitions are provided by the{' '}
              <Link
                href="https://dictionary.cambridge.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: textColor,
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { color: linkHoverColor }
                }}
              >
                Cambridge Dictionary
              </Link>.
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontSize: '1.1rem', color: textColor, marginBottom: 1 }}
            >
              <b>War</b>: <i>armed fighting between two or more countries or groups.</i>
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontSize: '1.1rem', color: textColor }}
            >
              <b>Genocide</b>: <i>the crime of intentionally destroying part or all of a national, ethnic,
              racial, or religious group, by killing people or by other methods.</i>
            </Typography>

            {/* Territory Map */}
            <Box sx={{ marginTop: 6, marginBottom: 2 }}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{
                  color: textColor,
                  fontWeight: 700,
                  marginBottom: 3,
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                Geographic Context
              </Typography>
              <TerritoryMap isDark={isDark} isMonochromacy={isMonochromacy} />
            </Box>
          </Box>
        </Box>


        {/* Chapter 1 Section - Small Multiples */}
        <Box
          id="chapter1"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 10vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Life during the conflict
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This section shows the quality of life in both countries from 2000 to 2024. The charts below compare key indicators between Israel and Palestine, including GDP per capita, access to safe drinking water, sanitation services, and food insecurity levels. These metrics provide insight into the living conditions and development disparities between the two regions during this period.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <SmallMultipleChart isDark={isDark} />
          </Box>
        </Box>

        {/* Chapter 2 Section - Violin & Box Plot */}
        <Box
          id="chapter2"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Demographics and fatalities or mortality rate over time
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              Qua mostrerò l'andamento demografico di Palestina e Israele nel tempo (2000-2025) e lo confronterò con il tasso di mortalità.
              Per farlo userò il dataset World Population Prospects della UN.
              I grafici usati saranno due pyramid charts per mostrare la distribuzione della popolazione per età e sesso in due anni diversi (2000 e 2025), o un boxplot per mostrare la distribuzione della popolazione nel tempo.
              Aggiungerò la possibilità di scegliere tra dataset (popolazione totale, tasso di mortalità, morti totali) e la possibilità di scegliere l'anno di riferimento per i pyramid charts con un animazione tra gli anni selezionati.
              i due paesi saranno mostrati affiancati per facilitare il confronto.
              Lo scopo di questo capitolo è per mostrare le differenze tra i due popoli in termini di demografia e tasso di mortalità, per capire se ci sono elementi che possano far pensare a un genocidio.
              Numero Visualizzazioni: 1 pyramid chart (o boxplot) con scelta del dataset e dell'anno.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <ViolinBoxPlot isDark={isDark} />
          </Box>
        </Box>

        {/* Chapter 3 Section - Sankey Diagram */}
        <Box
          id="chapter3"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Types of events
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              Non sono sicuro di cosa mettere qui, vorrei mostrare i tipi di eventi che accadono nei due paesi e il numero di essi, ma non vorrei ripetere il primo capitolo.
              Un Alluvional o un grouped bar chart potrebbe andare bene per mostrare il numero di eventi per tipo (battaglia, violenza politica, ecc) per i due paesi.
              Potrebbe essere interessante una mappa, ma non penso di avere dati geografici sufficienti per farlo.
              Lo scopo di questa sezione è di mostrare le differenze dei tipi di eventi che accadono nei due paesi, per vedere se la violenza è "equamente" distribuita o se c'è un tipo di evento predominante in uno dei due paesi.
              Numero Visualizzazioni: 1 alluvional o grouped bar chart.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
              <EventsSankeyDiagram isDark={isDark} isMonochromacy={isMonochromacy} />
          </Box>
        </Box>

        {/* Chapter 4 Section - Ridge Plot */}
        <Box
          id="chapter4"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Weekly events distribution
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This ridge plot shows the distribution of events per week over time for Israel and Palestine. Select event types from the sidebar to filter the visualization and see how different types of events evolved throughout the conflict.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <RidgeChart isDark={isDark} />
          </Box>
        </Box>

        {/* Chapter 5 Section - Line Chart */}
        <Box
          id="chapter5"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Monthly fatalities over time
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0
              }}
            >
              This line chart tracks monthly fatalities in Israel and Palestine from 2023 to 2025. Hover over the chart to see detailed information for each month, and click on a country name or line to focus on that specific data.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            <LineChart isDark={isDark} />
          </Box>
        </Box>

        {/* Chapter 6 Section - Geochart */}
        <Box
          id="chapter6"
          sx={{
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollMarginTop: '8vh',
            padding: '2vh 4vw 12vh 4vw'
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 'min(95vw, var(--content-width))', marginBottom: 4 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: textColor,
                fontWeight: 700,
                marginBottom: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Geospatial overview
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
              }}
            >
              A geochart visualization showing the spatial distribution of food system and health care incidents across the Gaza Strip. Explore where and when these events occurred, with detailed information about each incident.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
              <GeoChart isDark={isDark} isMonochromacy={isMonochromacy} />
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          position: 'relative',
          backgroundColor: rgb(0, 0, 0, 0),
          opacity: 1,
          color: navbarTextColor,
          padding: '12vh 5vw 6vh 5vw',
          textAlign: 'center',
          transition: 'color 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.95rem', mb: 1, textAlign: 'center' }}>
          A.Y. 2025-2026 Data Visualization Project - Università di Genova
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 1, textAlign: 'center' }}>
          Created by Matteo Ferrari
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
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
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </Link>
          <Link
            href="#/datasets"
            rel="noopener noreferrer"
            sx={{
              color: navbarTextColor,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.3s ease',
              '&:hover': { color: linkHoverColor }
            }}
            aria-label="Datasets and Sources"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"/>
            </svg>
            <span style={{ marginLeft: 8 }}>Datasets</span>
          </Link>
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
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </Link>
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
              <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
            </svg>
          </Link>
          <Box
            onClick={handleEmailClick}
            sx={{
              color: navbarTextColor,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              '&:hover': { color: linkHoverColor }
            }}
            aria-label="Copy Email Address"
            title={emailCopied ? 'Email copied!' : 'Click to copy email'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            {emailCopied && (
              <Typography
                sx={{
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: bgColor,
                  color: linkHoverColor,
                  border: `1px solid ${linkHoverColor}`,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}
              >
                Email address copied!
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Scroll to Top Button */}
      <Fab
        onClick={scrollToTop}
        disableRipple
        sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          backgroundColor: linkHoverColor,
          color: 'var(--bg-primary)',
          opacity: showScrollTop ? 1 : 0,
          visibility: showScrollTop ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease, color 0.3s ease, transform 0.3s ease, background-color 0.3s ease',
          transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
          outline: 'none !important',
          border: 'none !important',
          '&:hover': {
            backgroundColor: 'var(--color-details)',
            transform: 'scale(1.1)',
            boxShadow: '0 8px 24px color-mix(in srgb, var(--color-details) 45%, transparent)'
          },
          '&:focus, &:focusVisible, &:active': {
            outline: 'none !important',
            boxShadow: 'none !important',
            border: 'none !important'
          },
          '& .MuiTouchRipple-root': { display: 'none' },
          zIndex: 1200
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Box>
  );
}
