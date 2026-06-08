import { useEffect } from 'react';

const ParticlesBackground = () => {
    useEffect(() => {
        // Dynamically load particles.js script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
        script.async = true;
        script.onload = () => {
            if (window.particlesJS) {
                window.particlesJS('particles-js', {
                    particles: {
                        number: { value: 100, density: { enable: true, value_area: 800 } }, // menos puntos para que se vean como cajas
                        color: { value: ['#3b82f6', '#64748b', '#94a3b8'] }, // azul y grises
                        shape: { type: 'edge' }, // cuadrados
                        opacity: { value: 0.7, random: true },
                        size: { value: 6, random: true }, // más grandes, como cajas
                        line_linked: { enable: true, distance: 200, color: '#60a5fa', opacity: 0.35, width: 1 }, // azul border-blue-400
                        move: { enable: true, speed: 1.2, direction: 'none', random: false, straight: false, out_mode: 'out' }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: {
                            onhover: { enable: false, mode: 'repulse' },
                            onclick: { enable: false, mode: 'push' },
                            resize: false
                        },
                        modes: {
                            repulse: { distance: 100, duration: 0.4 },
                            push: { particles_nb: 4 }
                        }
                    },
                    retina_detect: true
                });
            }
        };
        document.body.appendChild(script);
        return () => {
            // Clean up
            const el = document.getElementById('particles-js');
            if (el) el.innerHTML = '';
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div id="particles-js" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)' // blanco-azulado muy suave
        }} />
    );
};

export default ParticlesBackground;
