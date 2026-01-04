import { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, Box, Link, IconButton, Fab } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MyChart from './components/MyChart';
import { Chapter1LineChart, Chapter1RidgeChart } from './components/Chapter1Charts';
import Chapter2ViolinBoxPlot from './components/Chapter2Charts';
import EventsSankeyDiagram from './components/Chapter3Charts';
import SmallMultipleChart from './components/Chapter4Charts';
import GeoChart from './components/Chapter5Charts';

import { rgb } from 'd3';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [chapter1ChartType, setChapter1ChartType] = useState('line');
  const navbarRef = useRef(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    // Sync CSS variable theme classes on :root so var(--...) works
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Calculate scroll progress (0 to 1)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(progress);

      // Determine active section based on which section is most visible
      const sections = ['introduction', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5'];
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

  const bgColor = isDark ? '#25282A' : '#D9D9D6';
  const textColor = isDark ? '#D9D9D6' : '#25282A';
  const navbarTextColor = isDark ? '#D9D9D6' : '#25282A';
  const linkHoverColor = isDark ? '#F1C400' : '#F4633A';
  const borderColor = isDark ? '#F1C400' : '#F4633A';
  const navbarShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
  const navbarBgColor = isDark ? 'rgba(37, 40, 42, 0.85)' : 'rgba(217, 217, 214, 0.85)';


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
          border: '2px solid ' + borderColor,
          zIndex: 1300,
          boxShadow: navbarShadow,
          padding: '0 8px',
          transition: 'box-shadow 0.3s ease, background-color 0.3s ease'
        }}
      >
        <Toolbar sx={{ gap: { xs: 0.8, md: 2 }, padding: { xs: '8px 8px', md: '8px 24px' }, justifyContent: 'space-between' }}>

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
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              War or Genocide?
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Intro
            </Box>
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
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Chapter 1
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Ch 1
            </Box>
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
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Chapter 2
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Ch 2
            </Box>
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
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Chapter 3
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Ch 3
            </Box>
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
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Chapter 4
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Ch 4
            </Box>
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
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Chapter 5
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              Ch 5
            </Box>
          </Link>
          <IconButton
            onClick={toggleTheme}
            disableRipple
            disableFocusRipple
            disableTouchRipple
            sx={{
              color: navbarTextColor,
              ml: 1,
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
          </Box>
        </Box>


        {/* Chart 1 Section */}
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
                marginBottom: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              Events and fatalities over time
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: textColor,
                fontWeight: 300,
                marginBottom: 0,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              In questa sezione mostrerò gli eventi e le morti per Palestina e Israele dal 2000 al 2025.
              Il dataset usato sarà ACLED (agglomerated data-middle east).
              L'obiettivo è vedere se ci sono differenze significative tra i due paesi in termini di eventi e morti.
              Verrà usato probabilmente un line chart con due linee (una per paese) e punti dati evidenziati per le fatalities.
              Verrà usato un ridge plot per mostrare la distribuzione degli eventi nel tempo, con possibilità di filtrare per tipo di evento (battaglia, violenza politica, ecc) da capire se con uno small multiples o con un menù a tendina.
              Questa prima sezione con due visualizzazioni serve per dare un contesto storico al conflitto.
              Numero Visualizzazioni: 2 (line chart + ridge plot).
            </Typography>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%', display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4, marginBottom: 4 }}>
            <button
              onClick={() => setChapter1ChartType('line')}
              className={`selector-button ${chapter1ChartType === 'line' ? 'active' : ''}`}
            >
              Monthly Fatalities (Line Chart)
            </button>
            <button
              onClick={() => setChapter1ChartType('ridge')}
              className={`selector-button ${chapter1ChartType === 'ridge' ? 'active' : ''}`}
            >
              Events per Week (Ridge Plot)
            </button>
          </Box>
          <Box sx={{ width: '100%', minWidth: '100%' }}>
            {chapter1ChartType === 'line' && <Chapter1LineChart key="line-chart" isDark={isDark} />}
            {chapter1ChartType === 'ridge' && <Chapter1RidgeChart key="ridge-chart" isDark={isDark} />}
          </Box>
        </Box>

        {/* Chapter 2 Section */}
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
            <Chapter2ViolinBoxPlot isDark={isDark} />
          </Box>
        </Box>

        {/* Chapter 3 Section */}
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
            <EventsSankeyDiagram isDark={isDark} />
          </Box>
        </Box>

        {/* Chapter 4 Section */}
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

        {/* Chapter 5 Section */}
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
            <GeoChart isDark={isDark} />
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
              fontSize: '0.85rem',
              transition: 'color 0.3s ease',
              '&:hover': { color: linkHoverColor }
            }}
          >
            LinkedIn
          </Link>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.5 }}>
            •
          </Typography>
          <Link
            href="https://github.com/matteogrifone22"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: navbarTextColor,
              textDecoration: 'none',
              fontSize: '0.85rem',
              transition: 'color 0.3s ease',
              '&:hover': { color: linkHoverColor }
            }}
          >
            GitHub
          </Link>
        </Box>
      </Box>

      {/* Scroll to Top Button */}
      <Fab
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          backgroundColor: linkHoverColor,
          color: isDark ? '#25282A' : '#ffffff',
          opacity: showScrollTop ? 1 : 0,
          visibility: showScrollTop ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease, color 0.3s ease, transform 0.3s ease, background-color 0.3s ease',
          transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
          '&:hover': {
            backgroundColor: isDark ? '#F1C400' : '#F4633A',
            transform: 'scale(1.1)',
            boxShadow: isDark ? '0 8px 24px rgba(241, 196, 0, 0.4)' : '0 8px 24px rgba(244, 99, 58, 0.4)'
          },
          zIndex: 1200
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Box>
  );
}
