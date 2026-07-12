// js/tsparticles-config.js
import { tsParticles } from "@tsparticles/slim";

export async function initParticles() {
    await tsParticles.load({
        id: "tsparticles",
        options: {
            background: {
                color: {
                    value: "transparent"
                }
            },
            fpsLimit: 60,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: "repulse"
                    },
                    onClick: {
                        enable: true,
                        mode: "push"
                    },
                    resize: {
                        enable: true
                    }
                },
                modes: {
                    repulse: {
                        distance: 100,
                        duration: 0.4
                    },
                    push: {
                        quantity: 4
                    }
                }
            },
            particles: {
                color: {
                    value: ["#ffffff", "#e0d4f7", "#c9b8f0", "#b8a3e8"]
                },
                links: {
                    color: {
                        value: "rgba(255,255,255,0.15)"
                    },
                    distance: 150,
                    enable: true,
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "bounce"
                    },
                    random: true,
                    speed: 0.8,
                    straight: false
                },
                number: {
                    density: {
                        enable: true,
                        area: 800
                    },
                    value: 80
                },
                opacity: {
                    value: {
                        min: 0.1,
                        max: 0.6
                    },
                    animation: {
                        enable: true,
                        speed: 1,
                        sync: false
                    }
                },
                shape: {
                    type: "circle"
                },
                size: {
                    value: {
                        min: 1,
                        max: 6
                    },
                    animation: {
                        enable: true,
                        speed: 2,
                        sync: false
                    }
                }
            },
            detectRetina: true
        }
    });
}
